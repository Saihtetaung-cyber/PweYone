<?php

namespace App\Domain;

use App\Domain\Decimal as D;
use App\Domain\Records as R;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/** All business writes share an InnoDB mutex before touching stock or cash.
 * This deliberately serializes a single PweYon workspace, including retries.
 * No caller can persist a browser state snapshot or a calculated document total.
 */
final class BusinessService
{
    private User $actor;

    private object $day;

    public function execute(User $actor, string $action, array $input, string $key): array
    {
        abort_unless($actor->active, 403);
        R::require(Str::isUuid($key), 'A UUID Idempotency-Key is required.');
        $ownerOnly = in_array($action, ['day.review', 'day.resolve', 'stock.check.approve', 'stock.check.reject', 'loan.create', 'cash.fund', 'cash.reverse', 'opening.approve', 'opening.reopen'], true)
            || (in_array($action, ['master.save', 'master.inactivate'], true) && in_array($input['kind'] ?? '', ['account', 'funding_category', 'loan_policy'], true))
            || ($action === 'request.create' && ($input['kind'] ?? 'home') === 'home');
        abort_unless(! $ownerOnly || $actor->role === 'owner', 403, 'Owner permission is required.');
        $hash = hash('sha256', json_encode([$action, $input], JSON_THROW_ON_ERROR));

        return DB::transaction(function () use ($actor, $action, $input, $key, $hash) {
            $mutex = DB::table('operation_locks')->where('name', 'workspace')->lockForUpdate()->first();
            R::require((bool) $mutex, 'Run pweyon:install before using the application.');
            $previous = DB::table('command_receipts')->where('actor_id', $actor->id)->where('request_key', $key)->first();
            if ($previous) {
                abort_unless(hash_equals($previous->intent_hash, $hash), 409, 'This request key was used for a different operation.');
                $result = json_decode($previous->result, true, 512, JSON_THROW_ON_ERROR);
                ksort($result);

                return $result;
            }
            $this->actor = $actor;
            $this->day = DB::table('business_days')->orderByDesc('business_date')->first();
            R::require((bool) $this->day, 'Business day is not initialized.');
            if (isset($input['payment_amount'])) {
                $requested = $this->amount($input, 'payment_amount');
                $splitTotal = '0';
                foreach ($input['payments'] ?? [] as $split) {
                    $splitTotal = D::add($splitTotal, $this->amount($split, 'amount'));
                }
                R::require(D::cmp($requested, $splitTotal) === 0, 'Payment splits must equal the entered payment amount.');
            }
            if (! in_array($action, ['opening.import', 'day.review', 'day.resolve', 'master.save', 'master.inactivate', 'opening.draft', 'opening.approve', 'day.open', 'day.next', 'stock.check.approve', 'stock.check.reject', 'prices.save', 'note.save', 'note.delete'], true)) {
                R::require($this->day->status === 'open', 'This business day is closed.');
                R::require((bool) $this->day->opening_checked, 'Complete the opening cash check first.');
            }
            $result = match ($action) {
                'master.save' => $this->master($input),
                'master.inactivate' => $this->inactivate($input),
                'day.open' => $this->openDay($input),
                'day.review' => app(OpeningCashReview::class)->decide($actor, $input, false),
                'day.resolve' => app(OpeningCashReview::class)->decide($actor, $input, true),
                'day.close' => $this->closeDay($input),
                'day.next' => $this->nextDay(),
                'receipt.create' => $this->receive($input),
                'receipt.weigh' => $this->weigh($input),
                'receipt.edit' => $this->editReceipt($input),
                'purchase.create' => $this->purchase($input),
                'sale.create' => $this->sell($input),
                'dispatch.create' => $this->dispatch($input),
                'payment.create' => $this->payment($input),
                'packaging.create' => $this->pack($input),
                'warehouse.transfer' => $this->transfer($input),
                'stock.adjust' => $this->adjust($input),
                'stock.check.submit' => $this->submitCheck($input),
                'stock.check.approve' => $this->decideCheck($input, true),
                'stock.check.reject' => $this->decideCheck($input, false),
                'advance.create' => $this->advance($input),
                'loan.create' => $this->loan($input),
                'loan.repay' => $this->repay($input),
                'expense.create' => $this->expense($input),
                'cash.fund' => $this->fund($input),
                'cash.reverse' => $this->reverse($input),
                'request.create' => $this->request($input),
                'request.receive' => $this->receiveRequest($input),
                'settlement.confirm' => $this->settle($input),
                'opening.draft' => $this->openingDraft($input),
                'opening.import' => $this->importOpening($input),
                'opening.approve' => $this->approveOpening($input),
                'opening.dispatch' => $this->openingDispatch($input),
                'opening.credit' => $this->openingCredit($input),
                'opening.reopen' => $this->reopenOpening($input),
                'prices.save' => $this->prices($input),
                'note.save' => $this->note($input),
                'note.delete' => $this->deleteNote($input),
                default => throw ValidationException::withMessages(['action' => 'Unsupported business operation.']),
            };
            ksort($result);
            R::insert('audit_logs', ['actor_id' => $actor->id, 'business_date' => $this->day->business_date, 'action' => $action, 'document_id' => $result['document_id'] ?? null, 'details' => ['request_key' => $key, 'result' => $result]]);
            R::insert('command_receipts', ['actor_id' => $actor->id, 'request_key' => $key, 'intent_hash' => $hash, 'result' => $result]);

            return $result;
        }, 5);
    }

    private function owner(): void
    {
        abort_unless($this->actor->role === 'owner', 403, 'Owner permission is required.');
    }

    private function amount(array $in, string $key, bool $positive = false, int $scale = 2): string
    {
        $v = D::value($in[$key] ?? '0', $scale);
        R::require(! $positive || D::cmp($v, '0') > 0, "$key must be greater than zero.", $key);

        return $v;
    }

    private function date(array $in, bool $allowClosed = false): string
    {
        $date = $in['date'] ?? $this->day->business_date;
        R::require(is_string($date) && preg_match('/^\d{4}-\d{2}-\d{2}$/D', $date) && CarbonImmutable::hasFormat($date, 'Y-m-d'), 'Invalid business date.');
        R::require(CarbonImmutable::createFromFormat('!Y-m-d', $date)->format('Y-m-d') === $date, 'Invalid business date.');
        R::require($date <= $this->day->business_date, 'Future business dates are not permitted.');
        R::require($allowClosed || ! DB::table('business_days')->where('business_date', $date)->where('status', 'closed')->exists(), 'This business date is closed.');

        return $date;
    }

    private function label(mixed $value, string $field = 'name'): string
    {
        R::require(is_string($value) && trim($value) !== '' && mb_strlen($value) <= 400 && ! preg_match('/[<>\x00-\x08]/u', $value), "Invalid $field.", $field);

        return trim($value);
    }

    private function active(string $table, mixed $id): object
    {
        $r = R::get($table, $id);
        R::require((bool) $r->active, 'This master record is inactive.');

        return $r;
    }

    private function account(mixed $id, bool $home = false): object
    {
        $a = $this->active('cash_accounts', $id);
        abort_unless($this->actor->role === 'owner' || $a->staff_can_view, 403, 'Account is not available.');
        R::require($home || $a->type !== 'home', 'Home money is separate from daily payment accounts.');

        return $a;
    }

    private function document(string $kind, array $in, array $values = []): object
    {
        $number = $this->label($values['number'] ?? $in['number'] ?? strtoupper($kind).'-'.Str::ulid(), 'number');
        R::require(mb_strlen($number) <= 255, 'Voucher number is too long.', 'number');
        R::require(! DB::table('documents')->where('number', $number)->exists(), 'ဤဘောက်ချာနံပါတ် ရှိပြီးဖြစ်ပါသည်။ မှတ်တမ်းအမှတ်အသစ် ပြောင်းထည့်ပါ။', 'number');
        $values['number'] = $number;

        return R::insert('documents', $values + ['kind' => $kind, 'number' => $number, 'status' => 'posted', 'business_date' => $this->date($in), 'party_id' => $in['party_id'] ?? null, 'note' => $in['note'] ?? '', 'created_by' => $this->actor->id]);
    }

    private function line(object $doc, array $values): object
    {
        return R::insert('document_lines', $values + ['document_id' => $doc->id]);
    }

    private function event(string $kind, object $lot, ?string $qty, ?string $bags, ?object $doc = null, ?object $to = null, array $details = []): object
    {
        return R::insert('stock_events', ['kind' => $kind, 'lot_id' => $lot->id, 'destination_lot_id' => $to?->id, 'document_id' => $doc?->id, 'business_date' => $doc?->business_date ?? $this->day->business_date, 'quantity' => $qty, 'bags' => $bags, 'details' => $details + ['owner' => $lot->owner, 'destinationOwner' => $to?->owner, 'warehouse' => $lot->warehouse_id, 'party' => $lot->party_id, 'receiptLine' => $lot->receipt_line_id], 'actor_id' => $this->actor->id]);
    }

    private function cash(object $doc, mixed $account, string $amount, string $title, ?int $reverses = null, bool $home = false, ?string $date = null): object
    {
        $a = $this->account($account, $home);
        $balance = D::add($a->balance, $amount);
        R::require(D::cmp($balance, '0') >= 0, 'Account balance is insufficient.');
        R::update('cash_accounts', $a->id, ['balance' => D::money($balance)]);

        return R::insert('cash_entries', ['account_id' => $a->id, 'document_id' => $doc->id, 'business_date' => $date ?? $this->day->business_date, 'amount' => D::money($amount), 'title' => $title, 'actor_id' => $this->actor->id, 'reverses_id' => $reverses]);
    }

    private function master(array $in): array
    {
        $kind = $in['kind'] ?? '';
        $data = $in['data'] ?? [];
        $id = $in['id'] ?? null;
        $table = match ($kind) {
            'product' => 'products','partner' => 'partners','account' => 'cash_accounts','warehouse' => 'warehouses','package' => 'package_types','adjustment', 'service_rate' => 'adjustment_rates','labor' => 'labor_rates','expense_reason' => 'expense_reasons','funding_category' => 'funding_categories','loan_policy' => 'loan_interest_policies',default => null
        };
        R::require((bool) $table, 'Invalid master type.');
        if (in_array($kind, ['account', 'funding_category', 'loan_policy'], true)) {
            $this->owner();
        }
        $old = $id ? R::get($table, $id) : null;
        $values = ['name' => $this->label($data['name'] ?? ''), 'active' => (bool) ($data['active'] ?? true)];
        switch ($kind) {
            case 'product':
                $grades = $data['grades'] ?? [];
                R::require(is_array($grades) && count($grades) > 0 && count($grades) < 50, 'At least one grade is required.');
                foreach ($grades as $grade) {
                    $this->label($grade, 'grade');
                }
                $values += ['standard_viss' => isset($data['standardViss']) ? $this->amount($data, 'standardViss', true, 8) : null, 'grades' => array_values(array_unique($grades))];
                break;
            case 'partner':
                R::require(in_array($data['kind'] ?? '', ['supplier', 'buyer'], true), 'Invalid partner kind.');
                $values += ['kind' => $data['kind'], 'locality' => $this->label($data['locality'] ?? '', 'locality'), 'phone' => mb_substr((string) ($data['phone'] ?? ''), 0, 100), 'details' => ['type' => $data['type'] ?? ($data['kind'] === 'buyer' ? 'buyer' : 'trader')]];
                R::require(! DB::table($table)->where('name', $values['name'])->where('locality', $values['locality'])->where('kind', $values['kind'])->when($id, fn ($q) => $q->where('id', '!=', $id))->exists(), 'This name and locality already exist.');
                break;
            case 'account':
                R::require(in_array($data['type'] ?? '', ['cash', 'bank', 'wallet', 'home'], true), 'Invalid account type.');
                if ($old) {
                    R::require($old->type === $data['type'], 'Account type cannot be changed.');
                    R::require($values['active'] || D::cmp($old->balance, '0') === 0, 'Transfer the balance before inactivating the account.');
                }
                $values += ['type' => $data['type'], 'staff_can_view' => (bool) ($data['staffCanView'] ?? false)];
                if (! $old) {
                    $balance = $this->amount($data, 'openingBalance');
                    $values += ['code' => 'ACC-'.Str::ulid(), 'opening_balance' => $balance, 'balance' => $balance];
                }break;
            case 'package':
                $p = $this->active('products', $data['product_id'] ?? null);
                $values += ['product_id' => $p->id, 'size' => $this->amount($data, 'size', true, 8)];
                break;
            case 'service_rate':
            case 'adjustment':
                R::require(in_array($data['kind'] ?? '', ['purchase', 'sale', 'both'], true), 'Invalid application.');
                if ($kind === 'service_rate') {
                    R::require(! $old || $old->calc_mode === 'service_percent', 'Select a service fee rate.');
                    $data['calcMode'] = 'service_percent';
                    $data['itemType'] = 'service';
                    $data['customType'] = '';
                } else {
                    R::require(! $old || $old->calc_mode !== 'service_percent', 'Use service fee settings.');
                    R::require(in_array($data['calcMode'] ?? '', ['manual', 'labor'], true), 'Use service fee settings for percentage rates.');
                    R::require($values['name'] !== 'ဝန်ဆောင်ခ' && ($data['itemType'] ?? '') !== 'service', 'Use service fee settings.');
                }
                $rate = $this->amount($data, 'rate', false, 8);
                if ($data['calcMode'] === 'service_percent') {
                    R::require(D::cmp($rate, '100') <= 0, 'Percentage exceeds 100.');
                }
                $values += ['kind' => $data['kind'], 'calc_mode' => $data['calcMode'], 'item_type' => $data['itemType'] ?? 'custom', 'rate' => $rate, 'details' => ['customType' => $data['customType'] ?? '']];
                break;
            case 'labor':
                R::require(in_array($data['kind'] ?? '', ['rate', 'mael', 'bag'], true), 'Invalid labor master kind.');
                $values += ['kind' => $data['kind'], 'rate' => $this->amount($data, 'rate', false, 8), 'details' => ['weight' => mb_substr((string) ($data['weight'] ?? R::details($old ?? (object) [])['weight'] ?? ''), 0, 255)]];
                break;
            case 'loan_policy':
                R::require(mb_strlen($values['name']) <= 255, 'Policy name is too long.');
                R::require(isset($data['monthlyRate']), 'Monthly interest rate is required.', 'monthlyRate');
                $monthlyRate = $this->amount($data, 'monthlyRate', false, 8);
                R::require(D::cmp($monthlyRate, '100') <= 0, 'Monthly interest rate must not exceed 100%.');
                $values += ['monthly_rate' => $monthlyRate];
                break;
            case 'funding_category':
                R::require(! $old || ! $old->locked || $old->code === ($data['code'] ?? '') && $old->type === ($data['type'] ?? ''), 'Built-in category code and classification are protected.');
                R::require(in_array($data['type'] ?? '', ['equity', 'liability', 'other'], true) || $old?->type === 'transfer', 'Invalid funding classification.');
                R::require($old?->type !== 'transfer' || $values['active'], 'Internal transfer category must stay active.');
                $values += ['code' => $this->label($data['code'] ?? ''), 'type' => $data['type']];
                break;
        }
        $r = $old ? R::update($table, $old->id, $values) : R::insert($table, $values);
        if ($kind === 'account' && isset($in['opening_draft_amount'])) {
            $opening = DB::table('documents')->where('kind', 'opening')->first();
            R::require($opening && $opening->status === 'draft', 'Save the initial opening draft first.');
            $draft = R::details($opening);
            $draft['accounts'][$r->code] = ['amount' => $this->amount($in, 'opening_draft_amount'), 'checked' => true];
            R::update('documents', $opening->id, ['details' => $draft]);
        }
        R::insert('audit_logs', ['actor_id' => $this->actor->id, 'business_date' => $this->day->business_date, 'action' => 'master.change', 'details' => ['type' => $kind, 'recordId' => (string) $r->id, 'before' => $old ? (array) $old : null, 'after' => (array) $r]]);

        return ['id' => $r->id, 'kind' => $kind];
    }

    private function inactivate(array $in): array
    {
        $kind = $in['kind'] ?? '';
        if (in_array($kind, ['account', 'funding_category', 'loan_policy'], true)) {
            $this->owner();
        }
        $table = match ($kind) {
            'product' => 'products','partner' => 'partners','account' => 'cash_accounts','warehouse' => 'warehouses','package' => 'package_types','adjustment', 'service_rate' => 'adjustment_rates','labor' => 'labor_rates','expense_reason' => 'expense_reasons','funding_category' => 'funding_categories','loan_policy' => 'loan_interest_policies',default => null
        };
        R::require((bool) $table, 'Invalid master type.');
        $r = R::get($table, $in['id'] ?? null);
        if (in_array($kind, ['adjustment', 'service_rate'], true)) {
            R::require(($r->calc_mode === 'service_percent') === ($kind === 'service_rate'), 'Use the matching rate settings.');
        }
        if ($kind === 'account') {
            R::require(D::cmp($r->balance, '0') === 0, 'Account has a balance.');
        }
        if ($kind === 'funding_category') {
            R::require(! $r->locked, 'This built-in category is protected.');
        }
        if ($kind === 'labor') {
            R::require($r->kind !== 'mael' || D::cmp($r->rate, '1') !== 0, 'The one-mael definition is fixed.');
        }
        if ($kind === 'warehouse') {
            R::require(! DB::table('stock_lots')->where('warehouse_id', $r->id)->where(fn ($q) => $q->whereNull('quantity')->orWhere('quantity', '>', 0))->exists(), 'Warehouse contains stock.');
        }
        R::update($table, $r->id, ['active' => false]);

        return ['id' => $r->id];
    }

    private function openDay(array $in): array
    {
        R::require($this->day->status === 'open' && ! $this->day->opening_checked, 'Opening check is already recorded.');
        R::require(isset($in['actual']) && $in['actual'] !== '', 'လက်တွေ့ရေတွက်ငွေကို ဖြည့်ပါ။');
        $actual = $this->amount($in, 'actual');
        $cash = DB::table('cash_accounts')->where('code', 'cash')->where('active', true)->value('balance') ?? '0';
        $difference = D::sub($actual, (string) $cash);
        $note = $in['note'] ?? '';
        R::require(is_string($note) && mb_strlen($note) <= 2000 && ! preg_match('/[<>\x00-\x08]/u', $note), 'မှတ်ချက်ကို မှန်ကန်စွာ ဖြည့်ပါ။');
        R::require(D::cmp($difference, '0') === 0 || trim($note) !== '', 'Explain the opening discrepancy.');
        R::update('business_days', $this->day->id, ['opening_expected' => $cash, 'opening_actual' => $actual, 'opening_note' => $note, 'opening_checked' => true, 'opening_review' => [
            'submittedAt' => now()->toIso8601String(), 'submittedBy' => ['id' => (string) $this->actor->id, 'name' => $this->actor->name], 'submittedRole' => $this->actor->role,
            'cashEntryWatermark' => DB::table('cash_entries')->max('id') ?? 0,
        ]]);

        return ['difference' => D::money($difference), 'status' => D::cmp($difference, '0') === 0 ? 'matched' : 'pending'];
    }

    private function receive(array $in): array
    {
        $party = $this->active('partners', $in['party_id'] ?? null);
        R::require($party->kind === 'supplier', 'Select a trader.');
        $wh = $this->active('warehouses', $in['warehouse_id'] ?? null);
        $rows = $in['lines'] ?? [];
        R::require(is_array($rows) && count($rows) > 0 && count($rows) <= 50, 'Receiving needs product lines.');
        R::require(count(array_unique(array_column($rows, 'product_id'))) === count($rows), 'Use one receiving line per product.');
        $counter = 1000000;
        foreach (DB::table('documents')->pluck('number') as $number) {
            if (preg_match('/-(\d{1,15})$/u', $number, $matches)) {
                $counter = max($counter, (int) $matches[1]);
            }
        }
        $in['number'] = 'အလ-'.($counter + 1);
        $doc = $this->document('receipt', $in, ['status' => 'await', 'vehicle' => mb_substr((string) ($in['vehicle'] ?? ''), 0, 100)]);
        $ids = [];
        foreach ($rows as $row) {
            $p = $this->active('products', $row['product_id'] ?? null);
            $grade = $row['grade'] ?? '';
            R::require(in_array($grade, json_decode($p->grades, true), true), 'Select an active product grade.');
            $bagType = $row['bag_type'] ?? 'raw';
            R::require(in_array($bagType, ['raw', 'finished', 'weight'], true), 'Invalid receiving unit.');
            $bags = $bagType === 'weight' ? null : $this->amount($row, 'bags', true, 8);
            if ($bags !== null) {
                R::require(D::cmp($bags, bcadd($bags, '0', 0)) === 0, 'Bag count must be a whole number.');
            }
            $size = $bagType === 'finished' ? $this->amount($row, 'package_viss', true, 8) : null;
            $qty = $bagType === 'finished' ? D::mul($bags, $size) : (isset($row['quantity']) && $row['quantity'] !== '' ? $this->amount($row, 'quantity', $bagType !== 'raw', 8) : null);
            R::require($bagType === 'raw' || $qty !== null, 'Weight is required.');
            $line = $this->line($doc, ['product_id' => $p->id, 'warehouse_id' => $wh->id, 'grade' => $grade, 'quantity' => $qty, 'bags' => $bags, 'ownership' => 'supplier', 'details' => ['bagType' => $bagType, 'packageViss' => $size]]);
            $lot = R::insert('stock_lots', ['receipt_line_id' => $line->id, 'product_id' => $p->id, 'warehouse_id' => $wh->id, 'party_id' => $party->id, 'owner' => 'supplier', 'grade' => $grade, 'batch' => $doc->number, 'quantity' => $qty, 'bags' => $bags, 'package_viss' => $size, 'stock_form' => $bagType === 'finished' ? 'packaged' : 'loose', 'entry_date' => $doc->business_date]);
            $this->event('receive', $lot, $qty, $bags, $doc);
            $ids[] = $line->id;
        }
        $advance = $this->amount($in, 'advance_amount');
        if (D::cmp($advance, '0') > 0) {
            $this->advance(['party_id' => $party->id, 'amount' => $advance, 'account_id' => $in['advance_account_id'] ?? null, 'source_document_id' => $doc->id]);
        }
        $carriage = $this->amount($in, 'carriage_amount');
        if (D::cmp($carriage, '0') > 0) {
            $this->expense(['party_id' => $party->id, 'amount' => $carriage, 'account_id' => $in['carriage_account_id'] ?? null, 'recoverable' => true, 'source_document_id' => $doc->id, 'reason' => 'တန်ဆာခ (ခေါက်ရှည်)']);
        }

        return ['document_id' => $doc->id, 'line_ids' => $ids];
    }

    private function weigh(array $in): array
    {
        $lot = R::get('stock_lots', $in['lot_id'] ?? null);
        R::require($lot->quantity === null, 'This lot already has a recorded weight.');
        $qty = $this->amount($in, 'quantity', true, 8);
        R::update('stock_lots', $lot->id, ['quantity' => $qty]);
        $this->event('weigh', $lot, $qty, $lot->bags, null, null, ['previousQuantity' => null]);
        $this->syncReceiptMeasuredWeight($lot->receipt_line_id);

        return ['lot_id' => $lot->id];
    }

    private function syncReceiptMeasuredWeight(?int $lineId): void
    {
        if (! $lineId || R::get('document_lines', $lineId)->quantity !== null) {
            return;
        }
        $siblings = DB::table('stock_lots')->where('receipt_line_id', $lineId);
        if ((clone $siblings)->whereNull('quantity')->exists()) {
            return;
        }
        $measured = '0';
        foreach (DB::table('stock_events')->whereIn('lot_id', (clone $siblings)->select('id'))->get() as $event) {
            $details = R::details($event);
            // An unweighed bag loss has no recoverable weight. Keep the original unknown.
            if ($details['unknownBagChange'] ?? false) {
                return;
            }
            if ($event->kind === 'weigh' || ($details['weighedUnknown'] ?? false)) {
                $measured = D::add($measured, $event->quantity ?? '0');
            }
        }
        R::update('document_lines', $lineId, ['quantity' => $measured]);
    }

    private function editReceipt(array $in): array
    {
        $doc = R::get('documents', $in['document_id'] ?? null);
        R::require($doc->kind === 'receipt', 'Not a receipt.');
        $old = DB::table('document_lines')->where('document_id', $doc->id)->get()->filter(fn ($l) => ! (R::details($l)['voided'] ?? false))->keyBy('id');
        $rows = $in['lines'] ?? null;
        $locked = DB::table('stock_lots')->whereIn('receipt_line_id', $old->keys())->whereIn('id', DB::table('stock_events')->whereIn('kind', ['pack', 'hold', 'purchase', 'dispatch', 'transfer'])->select('lot_id'))->exists();
        $header = ['vehicle' => mb_substr((string) ($in['vehicle'] ?? $doc->vehicle ?? ''), 0, 100), 'note' => (string) ($in['note'] ?? $doc->note ?? '')];
        if (isset($in['party_id'])) {
            $party = $this->active('partners', $in['party_id']);
            R::require($party->kind === 'supplier', 'Select a trader.');
            $header['party_id'] = $party->id;
        }
        if (isset($in['number'])) {
            R::require($in['number'] === $doc->number, 'ကုန်လက်ခံအမှတ်ကို system က သတ်မှတ်ထားသဖြင့် ပြင်၍မရပါ။', 'number');
            $header['number'] = $this->label($in['number'], 'number');
            R::require(mb_strlen($header['number']) <= 255, 'Voucher number is too long.', 'number');
            R::require(! DB::table('documents')->where('number', $header['number'])->where('id', '!=', $doc->id)->exists(), 'ဤဘောက်ချာနံပါတ် ရှိပြီးဖြစ်ပါသည်။ မှတ်တမ်းအမှတ်အသစ် ပြောင်းထည့်ပါ။', 'number');
        }
        if (isset($in['date'])) {
            // Receipt corrections may retain a closed historical date; new postings retain their date guard.
            $header['business_date'] = $this->date($in, allowClosed: true);
        }
        if ($locked) {
            foreach ($header as $key => $value) {
                R::require($value === $doc->$key, 'Receipt headers are locked by subsequent stock history.');
            }
        }
        R::update('documents', $doc->id, $header);
        $doc = R::get('documents', $doc->id);
        if ($rows !== null) {
            $productIds = array_map(fn ($r) => $r['product_id'] ?? $old[$r['id'] ?? 0]->product_id ?? null, $rows);
            R::require(count($rows) > 0 && count(array_unique($productIds)) === count($rows), 'Use at least one line and one line per product.');
            $seen = [];
            foreach ($rows as $row) {
                $line = ! empty($row['id']) ? R::get('document_lines', $row['id']) : null;
                R::require(! $line || $line->document_id === $doc->id && ! in_array($line->id, $seen, true), 'Invalid or duplicate source line.');
                if ($line) {
                    $seen[] = $line->id;
                }
                $p = $this->active('products', $row['product_id'] ?? $line?->product_id);
                $grade = $row['grade'] ?? $line?->grade;
                R::require(in_array($grade, json_decode($p->grades, true), true), 'Invalid grade.');
                $type = $row['bag_type'] ?? ($line ? R::details($line)['bagType'] ?? 'raw' : 'raw');
                R::require(in_array($type, ['raw', 'finished', 'weight'], true), 'Invalid bag type.');
                $bags = $type === 'weight' ? null : $this->amount($row, 'bags', true, 8);
                $size = $type === 'finished' ? $this->amount($row, 'package_viss', true, 8) : null;
                $qty = $type === 'finished' ? D::mul($bags, $size) : (isset($row['quantity']) && $row['quantity'] !== '' ? $this->amount($row, 'quantity', true, 8) : null);
                R::require($type === 'raw' || $qty !== null, 'Weight is required.');
                $wh = $this->active('warehouses', $in['warehouse_id'] ?? $line?->warehouse_id);
                $values = ['product_id' => $p->id, 'warehouse_id' => $wh->id, 'grade' => $grade, 'quantity' => $qty, 'bags' => $bags, 'ownership' => 'supplier', 'details' => ['bagType' => $type, 'packageViss' => $size]];
                if ($line) {
                    $same = $line->product_id === $p->id && $line->warehouse_id === $wh->id && $line->grade === $grade && $line->quantity === $qty && $line->bags === $bags && (R::details($line)['bagType'] ?? 'raw') === $type;
                    if ($same) {
                        continue;
                    }
                    $lots = DB::table('stock_lots')->where('receipt_line_id', $line->id)->get();
                    R::require($lots->count() === 1 && $lots[0]->owner === 'supplier' && ! DB::table('document_lines')->where('source_line_id', $line->id)->exists() && ! DB::table('stock_events')->where('lot_id', $lots[0]->id)->whereNotIn('kind', ['receive', 'weigh', 'receipt_correction'])->exists(), 'This line is locked by subsequent stock history.');
                    $lot = $lots[0];
                    R::update('document_lines', $line->id, $values);
                    R::update('stock_lots', $lot->id, ['product_id' => $p->id, 'warehouse_id' => $wh->id, 'party_id' => $doc->party_id, 'grade' => $grade, 'quantity' => $qty, 'bags' => $bags, 'package_viss' => $size, 'stock_form' => $type === 'finished' ? 'packaged' : 'loose', 'batch' => $doc->number, 'entry_date' => $doc->business_date]);
                    $this->event('receipt_correction', $lot, $qty === null ? null : D::sub($qty, $lot->quantity ?? '0'), null, $doc, null, ['beforeQuantity' => $lot->quantity, 'afterQuantity' => $qty, 'afterBags' => $bags]);
                } else {
                    $line = $this->line($doc, $values);
                    $seen[] = $line->id;
                    $lot = R::insert('stock_lots', ['receipt_line_id' => $line->id, 'product_id' => $p->id, 'warehouse_id' => $wh->id, 'party_id' => $doc->party_id, 'owner' => 'supplier', 'grade' => $grade, 'batch' => $doc->number, 'quantity' => $qty, 'bags' => $bags, 'package_viss' => $size, 'stock_form' => $type === 'finished' ? 'packaged' : 'loose', 'entry_date' => $doc->business_date]);
                    $this->event('receive', $lot, $qty, $bags, $doc);
                }
            }
            foreach ($old as $line) {
                if (! in_array($line->id, $seen, true)) {
                    $lot = DB::table('stock_lots')->where('receipt_line_id', $line->id)->first();
                    R::require($lot && $lot->owner === 'supplier' && ! DB::table('document_lines')->where('source_line_id', $line->id)->exists() && ! DB::table('stock_events')->where('lot_id', $lot->id)->whereNotIn('kind', ['receive', 'weigh', 'receipt_correction'])->exists(), 'A used receiving line cannot be removed.');
                    R::require(! DB::table('documents')->where('source_document_id', $doc->id)->whereIn('kind', ['advance', 'outlay'])->exists(), 'Money-linked receiving lines cannot be removed.');
                    R::update('document_lines', $line->id, ['details' => R::details($line) + ['voided' => true]]);
                    R::update('stock_lots', $lot->id, ['quantity' => '0', 'bags' => $lot->bags === null ? null : '0']);
                    $this->event('receipt_correction', $lot, $lot->quantity === null ? null : D::sub('0', $lot->quantity), null, $doc, null, ['voided' => true]);
                }
            }
        }
        $advance = $this->amount($in, 'advance_amount');
        if (D::cmp($advance, '0') > 0) {
            $this->advance(['party_id' => $doc->party_id, 'amount' => $advance, 'account_id' => $in['advance_account_id'] ?? null, 'source_document_id' => $doc->id]);
        }
        if (isset($in['carriage_amount'])) {
            $carriage = $this->amount($in, 'carriage_amount');
            $previous = DB::table('documents')->where('source_document_id', $doc->id)->where('kind', 'outlay')->where('status', '!=', 'reversed')->first();
            if ($previous) {
                $entry = DB::table('cash_entries')->where('document_id', $previous->id)->first();
                $account = $in['carriage_account_id'] ?? $entry?->account_id;
                $changed = D::cmp($carriage, $previous->net) !== 0 || (string) $account !== (string) $entry?->account_id;
                if ($changed) {
                    R::require(! $locked && ! DB::table('recoveries')->where('source_document_id', $previous->id)->exists(), 'A locked or recovered carriage outlay cannot be changed here.');
                    $this->cash($previous, $entry->account_id, $previous->net, 'တန်ဆာခ စိုက်ငွေ ပြင်ဆင် — ပြန်သွင်း');
                    if (D::cmp($carriage, '0') > 0) {
                        $this->cash($previous, $account, D::sub('0', $carriage), 'တန်ဆာခ စိုက်ငွေ ပြင်ဆင် — ထုတ်ပေး');
                    }R::update('documents', $previous->id, ['net' => $carriage, 'status' => D::cmp($carriage, '0') === 0 ? 'reversed' : 'posted']);
                }
            } elseif (D::cmp($carriage, '0') > 0) {
                R::require(! $locked, 'Receipt header is locked.');
                $this->expense(['party_id' => $doc->party_id, 'amount' => $carriage, 'account_id' => $in['carriage_account_id'] ?? null, 'recoverable' => true, 'source_document_id' => $doc->id, 'reason' => 'တန်ဆာခ (ခေါက်ရှည်)']);
            }
        }

        return ['document_id' => $doc->id];
    }

    private function price(array $row, object $product, string $qty, ?string $bags): array
    {
        $price = $this->amount($row, 'price', true, 8);
        $basis = $row['basis'] ?? 'viss';
        R::require(in_array($basis, ['viss', 'standard_bag', 'actual_bag'], true), 'Invalid pricing basis.');
        $units = $qty;
        if ($basis === 'standard_bag') {
            R::require($product->standard_viss !== null && D::cmp($product->standard_viss, '0') > 0, 'Set pricing-standard bag weight.');
            $units = D::div($qty, $product->standard_viss);
        }
        if ($basis === 'actual_bag') {
            $units = $this->amount($row, 'pricing_bags', true, 8);
        }

        $value = $basis === 'standard_bag' ? bcdiv(bcmul($qty, $price, 24), $product->standard_viss, 16) : bcmul($units, $price, 16);

        return [$price, $basis, D::money(D::kyat($value))];
    }

    private function charges(array $in, string $kind, string $gross, array $lines): array
    {
        $add = '0';
        $deduct = '0';
        $items = [];
        $seen = [];
        foreach ($in['adjustments'] ?? [] as $row) {
            $rule = $this->active('adjustment_rates', $row['rate_id'] ?? null);
            R::require(in_array($rule->kind, [$kind, 'both'], true), 'Adjustment does not apply to this document.');
            R::require(! in_array($rule->id, $seen, true), 'Duplicate adjustment type.');
            $seen[] = $rule->id;
            $direction = $row['direction'] ?? ($kind === 'purchase' ? 'subtract' : 'add');
            R::require(in_array($direction, ['add', 'subtract'], true), 'Invalid adjustment direction.');
            $amount = match ($rule->calc_mode) {
                'service_percent' => D::money(D::kyat(D::div(D::mul($gross, $rule->rate), '100'))),'labor' => $this->laborCharge($row),default => $this->amount($row, 'amount')
            };
            if ($rule->calc_mode !== 'manual') {
                $direction = $kind === 'purchase' ? 'subtract' : 'add';
            }
            if ($direction === 'add') {
                $add = D::add($add, $amount);
            } else {
                $deduct = D::add($deduct, $amount);
            }
            $items[] = ['rateId' => (string) $rule->id, 'label' => $rule->name, 'amount' => $amount, 'direction' => $direction, 'mode' => $rule->calc_mode, 'rate' => $rule->rate];
        }
        // Labor rows reference actual rate and mael masters, not client-computed totals.
        foreach ($in['labor'] ?? [] as $row) {
            $amount = $this->laborCharge($row);
            if ($kind === 'purchase') {
                $deduct = D::add($deduct, $amount);
            } else {
                $add = D::add($add, $amount);
            }$items[] = ['label' => 'လုပ်သားခ', 'amount' => $amount, 'direction' => $kind === 'purchase' ? 'subtract' : 'add', 'mode' => 'labor'];
        }

        return ['items' => $items, 'additionTotal' => D::money($add), 'deductionTotal' => D::money($deduct), 'net' => D::money(D::sub(D::add($gross, $add), $deduct))];
    }

    private function laborCharge(array $row): string
    {
        $rate = DB::table('labor_rates')->find($row['labor_rate_id'] ?? null);
        $mael = DB::table('labor_rates')->find($row['mael_id'] ?? null);
        R::require($rate && $mael, 'ရွေးထားသော မယ်နှုန်း သို့မဟုတ် မယ် မရှိတော့ပါ။ သတ်မှတ်ချက်တွင် ပြန်စစ်ပြီး ရွေးပါ။', 'labor');
        R::require($rate->active && $mael->active, 'ရွေးထားသော မယ်နှုန်း သို့မဟုတ် မယ် ပိတ်ထားပါသည်။ အသုံးပြုနေသော နှုန်းထားကို ရွေးပါ။', 'labor');
        R::require($rate->kind === 'rate' && $mael->kind === 'mael', 'Choose labor rate and mael masters.');
        $bags = $this->amount($row, 'bags', false, 8);

        return D::money(D::mul(D::mul($rate->rate, $mael->rate), $bags));
    }

    private function purchase(array $in): array
    {
        $rows = $in['lines'] ?? [];
        R::require(count($rows) > 0 && count($rows) <= 50, 'Choose receiving lines.');
        $prepared = [];
        $gross = '0';
        $party = null;
        $receipt = null;
        R::require(count(array_unique(array_column($rows, 'receipt_line_id'))) === count($rows), 'Duplicate receiving line.');
        foreach ($rows as $row) {
            $source = R::get('document_lines', $row['receipt_line_id'] ?? null);
            $rec = R::get('documents', $source->document_id);
            R::require($rec->kind === 'receipt' && ! DB::table('document_lines')->join('documents', 'documents.id', '=', 'document_lines.document_id')->where('documents.kind', 'purchase')->where('source_line_id', $source->id)->exists(), 'Receipt line is already purchased.');
            R::require($party === null || $party === $rec->party_id, 'Purchase lines must have the same trader.');
            $party = $rec->party_id;
            $receipt = $rec->id;
            $lots = DB::table('stock_lots')->where('receipt_line_id', $source->id)->where('owner', 'supplier')->where(fn ($q) => $q->whereNull('quantity')->orWhere('quantity', '>', 0))->get();
            R::require($lots->isNotEmpty() && $lots->every(fn ($l) => $l->quantity !== null), 'Record actual weights before purchasing.');
            $qty = D::sum($lots->pluck('quantity'));
            R::require(D::cmp($qty, '0') > 0, 'No eligible trader-owned quantity remains.');
            if (isset($row['quantity'])) {
                R::require(D::cmp(D::value($row['quantity']), $qty) === 0, 'Purchase the entire eligible residual quantity. Refresh stock.');
            }
            [$price,$basis,$g] = $this->price($row, R::get('products', $source->product_id), $qty, $source->bags);
            $prepared[] = compact('source', 'rec', 'lots', 'qty', 'price', 'basis', 'g', 'row');
            $gross = D::add($gross, $g);
        }
        $charges = $this->charges($in, 'purchase', $gross, $prepared);
        $doc = $this->document('purchase', array_merge($in, ['party_id' => $party]), ['source_document_id' => $receipt, 'gross' => $gross, 'net' => $charges['net'], 'details' => ['charges' => $charges]]);
        $recovered = $this->recover($doc, $in);
        $net = D::money(D::sub($charges['net'], $recovered));
        R::require(D::cmp($net, '0') >= 0, 'Deductions exceed purchase value.');
        R::update('documents', $doc->id, ['net' => $net]);
        $assigned = '0';
        $count = count($prepared);
        foreach ($prepared as $i => $x) {
            $lineNet = $i === $count - 1 ? D::sub($net, $assigned) : D::money(D::div(D::mul($net, $x['g']), $gross));
            $assigned = D::add($assigned, $lineNet);
            $line = $this->line($doc, ['source_line_id' => $x['source']->id, 'product_id' => $x['source']->product_id, 'warehouse_id' => $x['source']->warehouse_id, 'grade' => $x['source']->grade, 'quantity' => $x['qty'], 'bags' => $x['source']->bags, 'price' => $x['price'], 'price_basis' => $x['basis'], 'gross' => $x['g'], 'net' => $lineNet, 'ownership' => 'owned', 'details' => ['pricingBags' => $x['row']['pricing_bags'] ?? null, 'purchaseBagViss' => $x['row']['purchase_package_viss'] ?? null, 'purchaseBags' => $x['row']['purchase_bags'] ?? null, 'standardViss' => R::get('products', $x['source']->product_id)->standard_viss, 'originalQuantity' => $x['source']->quantity]]);
            foreach ($x['lots'] as $lot) {
                R::update('stock_lots', $lot->id, ['owner' => 'owned', 'unit_cost' => D::div($x['g'], $x['qty'])]);
                $this->event('purchase', $lot, $lot->quantity, $lot->bags, $doc, null, ['fromOwner' => 'supplier', 'toOwner' => 'owned']);
            }
        }
        $this->applyPayment(R::get('documents', $doc->id), $in['payments'] ?? [], null, $doc->business_date);

        return ['document_id' => $doc->id, 'net' => $net];
    }

    private function take(object $lot, string $qty, ?string $bags = null): void
    {
        R::require($lot->quantity !== null && D::cmp($qty, '0') > 0 && D::cmp($qty, $lot->quantity) <= 0, 'Stock is insufficient or weight is unknown.');
        $remaining = D::sub($lot->quantity, $qty);
        $bagAfter = $lot->bags;
        if ($bags !== null) {
            R::require($lot->bags !== null && D::cmp($bags, $lot->bags) <= 0, 'Bag count is insufficient.');
            $bagAfter = D::sub($lot->bags, $bags);
        } elseif ($lot->package_viss !== null && D::cmp($lot->package_viss, '0') > 0) {
            $bagAfter = D::div($remaining, $lot->package_viss);
        } elseif (D::cmp($remaining, '0') === 0) {
            $bagAfter = $lot->bags === null ? null : '0';
        } else {
            $bagAfter = null;
        } // Never invent a proportional count of raw bags.
        R::update('stock_lots', $lot->id, ['quantity' => $remaining, 'bags' => $bagAfter]);
    }

    private function cloneLot(object $lot, array $changes): object
    {
        $values = (array) $lot;
        unset($values['id'],$values['created_at'],$values['updated_at']);

        return R::insert('stock_lots', array_merge($values, ['parent_lot_id' => $lot->id], $changes));
    }

    private function sell(array $in): array
    {
        $buyer = $this->active('partners', $in['party_id'] ?? null);
        R::require($buyer->kind === 'buyer', 'Select a buyer.');
        $mode = $in['delivery'] ?? 'hold';
        R::require(in_array($mode, ['hold', 'direct'], true), 'Choose held or immediate dispatch.');
        $rows = $in['lines'] ?? [];
        R::require(count($rows) > 0 && count($rows) <= 50, 'Choose goods.');
        $prepared = [];
        $gross = '0';
        $used = [];
        foreach ($rows as $row) {
            $lot = R::get('stock_lots', $row['lot_id'] ?? null);
            R::require(in_array($lot->owner, ['owned', 'supplier'], true), 'Buyer-owned goods cannot be sold again.');
            $qty = $this->amount($row, 'quantity', true, 8);
            $used[$lot->id] = D::add($used[$lot->id] ?? '0', $qty);
            R::require($lot->quantity !== null && D::cmp($used[$lot->id], $lot->quantity) <= 0, 'Stock changed or is insufficient.');
            [$price,$basis,$g] = $this->price($row, R::get('products', $lot->product_id), $qty, $lot->bags);
            R::require($basis !== 'actual_bag', 'Sales use viss or the pricing-standard bag.');
            $prepared[] = compact('lot', 'qty', 'price', 'basis', 'g');
            $gross = D::add($gross, $g);
        }
        $charges = $this->charges($in, 'sale', $gross, $prepared);
        R::require(D::cmp($charges['net'], '0') >= 0, 'Sale deductions exceed sale value.');
        $doc = $this->document('sale', $in, ['gross' => $gross, 'net' => $charges['net'], 'details' => ['delivery' => $mode, 'charges' => $charges]]);
        $assigned = '0';
        $traders = [];
        foreach ($prepared as $i => $x) {
            $lot = R::get('stock_lots', $x['lot']->id);
            $buyerSize = isset($rows[$i]['buyer_package_viss']) ? $this->amount($rows[$i], 'buyer_package_viss', true, 8) : $lot->package_viss;
            $bags = $buyerSize && D::cmp($buyerSize, '0') > 0 ? D::div($x['qty'], $buyerSize) : null;
            $net = $i === count($prepared) - 1 ? D::sub($charges['net'], $assigned) : D::money(D::div(D::mul($charges['net'], $x['g']), $gross));
            $assigned = D::add($assigned, $net);
            $line = $this->line($doc, ['source_line_id' => $lot->receipt_line_id, 'product_id' => $lot->product_id, 'warehouse_id' => $lot->warehouse_id, 'quantity' => $x['qty'], 'bags' => $bags, 'grade' => $lot->grade, 'price' => $x['price'], 'price_basis' => $x['basis'], 'gross' => $x['g'], 'net' => $net, 'dispatched' => $mode === 'direct' ? $x['qty'] : '0', 'ownership' => $lot->owner, 'details' => ['sourceLot' => (string) $lot->id, 'sourceSupplierId' => (string) ($lot->party_id ?? ''), 'unitCost' => $lot->unit_cost, 'batch' => $lot->batch, 'packageViss' => $lot->package_viss]]);
            $sourceBags = $lot->package_viss && D::cmp($lot->package_viss, '0') > 0 ? D::div($x['qty'], $lot->package_viss) : null;
            R::update('document_lines', $line->id, ['details' => array_merge(R::details($line), ['packageViss' => $buyerSize])]);
            $this->take($lot, $x['qty'], $sourceBags);
            if ($mode === 'hold') {
                $to = $this->cloneLot($lot, ['owner' => 'customer', 'sale_line_id' => $line->id, 'party_id' => $buyer->id, 'quantity' => $x['qty'], 'bags' => $bags, 'package_viss' => $buyerSize]);
                $this->event('hold', $lot, $x['qty'], $bags, $doc, $to, ['saleLineId' => $line->id]);
            } else {
                $this->event('dispatch', $lot, $x['qty'], $bags, $doc, null, ['saleLineId' => $line->id, 'immediate' => true, 'vehicle' => $in['vehicle'] ?? '', 'collector' => $in['collector'] ?? '']);
            }
            if ($lot->owner === 'supplier') {
                $traders[$lot->party_id][] = [$line, $x['g']];
            }
        }
        foreach ($traders as $party => $items) {
            $total = D::sum(array_column($items, 1));
            $this->document('settlement', ['party_id' => $party], ['source_document_id' => $doc->id, 'status' => 'pending', 'gross' => $total, 'net' => $total, 'details' => ['saleIds' => array_map(fn ($x) => (string) $x[0]->id, $items)]]);
        }
        $this->applyPayment($doc, $in['payments'] ?? [], null, $doc->business_date);

        return ['document_id' => $doc->id, 'net' => $charges['net']];
    }

    private function dispatch(array $in): array
    {
        $lot = R::get('stock_lots', $in['lot_id'] ?? null);
        R::require($lot->owner === 'customer' && $lot->sale_line_id !== null, 'Choose buyer-owned stored stock.');
        $line = R::get('document_lines', $lot->sale_line_id);
        $sale = R::get('documents', $line->document_id);
        $qty = $this->amount($in, 'quantity', true, 8);
        R::require(D::cmp(D::add($line->dispatched, $qty), $line->quantity) <= 0, 'Dispatch exceeds remaining sale quantity.');
        $bags = $lot->package_viss && D::cmp($lot->package_viss, '0') > 0 ? D::div($qty, $lot->package_viss) : null;
        $this->take($lot, $qty, $bags);
        R::update('document_lines', $line->id, ['dispatched' => D::add($line->dispatched, $qty)]);
        $doc = $this->document('dispatch', $in, ['source_document_id' => $sale->id, 'party_id' => $sale->party_id, 'vehicle' => $in['vehicle'] ?? '']);
        $this->event('dispatch', $lot, $qty, $bags, $doc, null, ['saleLineId' => $line->id, 'collector' => $in['collector'] ?? '']);

        return ['document_id' => $doc->id];
    }

    private function applyPayment(object $doc, array $splits, ?object $request = null, ?string $date = null): string
    {
        R::require(in_array($doc->kind, ['purchase', 'sale', 'settlement', 'opening_payable', 'opening_receivable', 'opening_deposit'], true), 'This document does not accept payments.');
        R::require($doc->kind !== 'settlement' || $doc->status === 'confirmed', 'Confirm trader settlement charges first.');
        $total = '0';
        foreach ($splits as $split) {
            $total = D::add($total, $this->amount($split, 'amount', true));
        }
        R::require(D::cmp($total, D::sub($doc->net, $doc->paid)) <= 0, 'Payment exceeds the outstanding balance.');
        if ($request) {
            R::require(D::cmp($total, D::sub($request->net, $request->paid)) <= 0, 'Receipt exceeds the request remainder.');
        }
        $incoming = in_array($doc->kind, ['sale', 'opening_receivable'], true);
        foreach ($splits as $split) {
            $amount = $this->amount($split, 'amount', true);
            $entry = $this->cash($doc, $split['account_id'] ?? null, $incoming ? $amount : D::sub('0', $amount), $incoming ? 'အရောင်းငွေ လက်ခံ' : 'ကုန်ဖိုး ပေးချေ', null, false, $date);
            $payment = R::insert('payments', ['document_id' => $doc->id, 'account_id' => $entry->account_id, 'cash_entry_id' => $entry->id, 'source_document_id' => $request?->id, 'business_date' => $date ?? $this->day->business_date, 'amount' => $amount, 'actor_id' => $this->actor->id]);
            $remaining = $amount;
            foreach (DB::table('document_lines')->where('document_id', $doc->id)->orderBy('id')->get() as $line) {
                $n = D::min($remaining, D::sub($line->net, $line->paid));
                if (D::cmp($n, '0') > 0) {
                    R::update('document_lines', $line->id, ['paid' => D::add($line->paid, $n)]);
                    R::insert('payment_allocations', ['payment_id' => $payment->id, 'line_id' => $line->id, 'amount' => $n]);
                    $remaining = D::sub($remaining, $n);
                }
            }
        }
        R::update('documents', $doc->id, ['paid' => D::add($doc->paid, $total)]);
        if ($incoming && D::cmp($total, '0') > 0) {
            $left = $total;
            $requests = DB::table('documents')->where('kind', 'collection_request')->where('source_document_id', $doc->id)->whereColumn('paid', '<', 'net')->orderBy('id')->get();
            if ($request) {
                $requests = $requests->sortBy(fn ($r) => $r->id === $request->id ? 0 : 1);
            }
            foreach ($requests as $r) {
                $n = D::min($left, D::sub($r->net, $r->paid));
                $paid = D::add($r->paid, $n);
                R::update('documents', $r->id, ['paid' => $paid, 'status' => D::cmp($paid, $r->net) === 0 ? 'received' : 'partial']);
                $left = D::sub($left, $n);
                if (D::cmp($left, '0') <= 0) {
                    break;
                }
            }
        }

        return D::money($total);
    }

    private function payment(array $in): array
    {
        $doc = R::get('documents', $in['document_id'] ?? null);
        $request = isset($in['request_id']) ? R::get('documents', $in['request_id']) : null;
        if ($request) {
            R::require($request->kind === 'collection_request' && $request->source_document_id === $doc->id, 'Collection request does not match sale.');
        }
        $paid = $this->applyPayment($doc, $in['payments'] ?? [], $request, $this->date($in));

        return ['document_id' => $doc->id, 'amount' => $paid];
    }

    private function pack(array $in): array
    {
        $lot = R::get('stock_lots', $in['lot_id'] ?? null);
        R::require(in_array($lot->owner, ['owned', 'supplier'], true), 'Choose PweYon or trader-owned goods.');
        $type = $this->active('package_types', $in['package_type_id'] ?? null);
        R::require($type->product_id === $lot->product_id, 'Packaging must match product.');
        if ($lot->quantity === null) {
            $this->weigh(['lot_id' => $lot->id, 'quantity' => $in['measured_quantity'] ?? '']);
            $lot = R::get('stock_lots', $lot->id);
        }
        $count = $this->amount($in, 'bags', true, 8);
        R::require(D::cmp($count, bcadd($count, '0', 0)) === 0, 'Package count must be whole.');
        $q = D::mul($type->size, $count);
        $this->take($lot, $q);
        $made = $this->cloneLot($lot, ['quantity' => $q, 'bags' => $count, 'package_type_id' => $type->id, 'package_viss' => $type->size, 'stock_form' => 'packaged']);
        $doc = $this->document('packaging', $in);
        $receiptLine = $lot->receipt_line_id ? R::get('document_lines', $lot->receipt_line_id) : null;
        $receiptDoc = $receiptLine ? R::get('documents', $receiptLine->document_id) : null;
        $receiptDetails = $receiptLine ? R::details($receiptLine) : [];
        $party = $lot->party_id ? R::get('partners', $lot->party_id) : null;
        $trader = $receiptDoc?->party_id ? R::get('partners', $receiptDoc->party_id) : null;
        $this->event('pack', $lot, $q, $count, $doc, $made, [
            'packName' => $type->name, 'qtyBefore' => $lot->quantity, 'qtyAfter' => D::sub($lot->quantity, $q), 'sourceRawBags' => $lot->bags,
            'product' => R::get('products', $lot->product_id)->name, 'grade' => $lot->grade, 'role' => $this->actor->role === 'owner' ? 'owner' : 'staff',
            'ownerName' => $lot->owner === 'owned' ? 'ပွဲရုံပိုင်' : ($party?->name ?? ''), 'originalTraderName' => $trader?->name ?? '',
            'warehouseName' => R::get('warehouses', $lot->warehouse_id)->name, 'sourceBatch' => $lot->batch,
            'sourceReceiptNo' => $receiptDoc?->number ?? '', 'sourceBagType' => $receiptDetails['bagType'] ?? '',
            'originalRawBags' => ($receiptDetails['bagType'] ?? '') === 'raw' ? $receiptLine?->bags : null,
            'packedQty' => $q, 'bagCount' => $count, 'packageViss' => $type->size,
        ]);

        return ['document_id' => $doc->id, 'lot_id' => $made->id];
    }

    private function transfer(array $in): array
    {
        $lot = R::get('stock_lots', $in['lot_id'] ?? null);
        $wh = $this->active('warehouses', $in['warehouse_id'] ?? null);
        R::require($wh->id !== $lot->warehouse_id, 'Select a different warehouse.');
        $q = isset($in['quantity']) && $in['quantity'] !== '' ? $this->amount($in, 'quantity', true, 8) : null;
        $b = isset($in['bags']) && $in['bags'] !== '' ? $this->amount($in, 'bags', true, 8) : null;
        if ($lot->quantity === null) {
            R::require($b !== null && $lot->bags !== null && D::cmp($b, $lot->bags) <= 0, 'Unknown-weight transfer needs an actual bag count.');
            $q = null;
            R::update('stock_lots', $lot->id, ['bags' => D::sub($lot->bags, $b), 'quantity' => D::cmp($b, $lot->bags) === 0 ? '0' : null]);
        } else {
            if ($lot->package_viss && $b !== null) {
                $derived = D::mul($b, $lot->package_viss);
                R::require($q === null || D::cmp($q, $derived) === 0, 'Package weight and quantity disagree.');
                $q = $derived;
            }
            R::require($q !== null, 'Enter the actual transferred weight.');
            $this->take($lot, $q, $b);
        }
        $to = $this->cloneLot($lot, ['warehouse_id' => $wh->id, 'quantity' => $q, 'bags' => $b]);
        $doc = $this->document('transfer', $in);
        $this->event('transfer', $lot, $q, $b, $doc, $to, ['from' => $lot->warehouse_id, 'to' => $wh->id, 'qtyBefore' => $lot->quantity, 'bagsBefore' => $lot->bags]);

        return ['document_id' => $doc->id, 'lot_id' => $to->id];
    }

    private function adjust(array $in): array
    {
        $lot = R::get('stock_lots', $in['lot_id'] ?? null);
        $q = D::value($in['quantity'] ?? '0', 8, true);
        $b = isset($in['bags']) ? D::value($in['bags'], 8, true) : null;
        if (($in['unit'] ?? '') === 'bags' && $b !== null && $lot->package_viss !== null) {
            $q = D::mul($b, $lot->package_viss);
        }
        R::require($lot->quantity !== null || D::cmp($q, '0') === 0, 'Unknown weight cannot receive an invented quantity adjustment.');
        $new = $lot->quantity === null ? null : D::add($lot->quantity, $q);
        $newB = $b === null ? $lot->bags : ($lot->bags === null ? $b : D::add($lot->bags, $b));
        R::require(($new === null || D::cmp($new, '0') >= 0) && ($newB === null || D::cmp($newB, '0') >= 0), 'Adjustment would make stock negative.');
        $doc = $this->document('adjustment', $in, ['note' => $this->label($in['reason'] ?? '', 'reason')]);
        R::update('stock_lots', $lot->id, ['quantity' => $new, 'bags' => $newB]);
        $this->event('adjust', $lot, $lot->quantity === null ? null : $q, $b, $doc, null, ['unknownBagChange' => $lot->quantity === null && $b !== null && D::cmp($b, '0') !== 0]);

        return ['document_id' => $doc->id];
    }

    private function fingerprint(object $lot): string
    {
        return hash('sha256', json_encode([$lot->quantity, $lot->bags, $lot->owner, $lot->warehouse_id, $lot->updated_at]));
    }

    private function submitCheck(array $in): array
    {
        $lot = R::get('stock_lots', $in['lot_id'] ?? null);
        $q = isset($in['quantity']) && $in['quantity'] !== '' ? $this->amount($in, 'quantity', false, 8) : null;
        $b = isset($in['bags']) && $in['bags'] !== '' ? $this->amount($in, 'bags', false, 8) : null;
        if ($q === null && $b !== null && $lot->package_viss !== null) {
            $q = D::mul($b, $lot->package_viss);
        }
        R::require($q !== null || $b !== null, 'Record a measured weight or counted bags.');
        $matched = $q === $lot->quantity && $b === $lot->bags;
        R::require(! DB::table('stock_checks')->where('lot_id', $lot->id)->where('status', 'pending')->exists(), 'A stock check is already pending for this lot.');
        $r = R::insert('stock_checks', ['lot_id' => $lot->id, 'business_date' => $this->date($in), 'expected_quantity' => $lot->quantity, 'expected_bags' => $lot->bags, 'actual_quantity' => $q, 'actual_bags' => $b, 'status' => $matched ? 'matched' : 'pending', 'fingerprint' => $this->fingerprint($lot), 'reason' => $this->label($in['reason'] ?? 'ရေတွက်စစ်ဆေး', 'reason'), 'submitted_by' => $this->actor->id]);

        return ['id' => $r->id, 'status' => $r->status];
    }

    private function decideCheck(array $in, bool $approve): array
    {
        $this->owner();
        $r = R::get('stock_checks', $in['id'] ?? null);
        R::require($r->status === 'pending', 'Check has already been decided.');
        $lot = R::get('stock_lots', $r->lot_id);
        if ($approve) {
            R::require(hash_equals($r->fingerprint, $this->fingerprint($lot)), 'Stock changed since this check. Submit a new count.');
            $q = $r->actual_quantity ?? $lot->quantity;
            $b = $r->actual_bags ?? $lot->bags;
            R::update('stock_lots', $lot->id, ['quantity' => $q, 'bags' => $b]);
            $this->event('adjust', $lot, $r->actual_quantity === null ? null : ($lot->quantity === null ? $q : D::sub($q, $lot->quantity)), $r->actual_bags === null ? null : ($lot->bags === null ? $b : D::sub($b, $lot->bags)), null, null, ['stockCheckId' => $r->id, 'weighedUnknown' => $lot->quantity === null && $q !== null, 'unknownBagChange' => $lot->quantity === null && $q === null && $b !== $lot->bags]);
            $this->syncReceiptMeasuredWeight($lot->receipt_line_id);
        }
        $note = $approve ? ($in['note'] ?? '') : $this->label($in['note'] ?? '', 'rejection reason');
        R::update('stock_checks', $r->id, ['status' => $approve ? 'approved' : 'rejected', 'decided_by' => $this->actor->id, 'decided_at' => now(), 'decision_note' => $note]);

        return ['id' => $r->id];
    }

    private function advance(array $in): array
    {
        $party = $this->active('partners', $in['party_id'] ?? null);
        R::require($party->kind === 'supplier', 'Select a trader.');
        $amount = $this->amount($in, 'amount', true);
        $doc = $this->document('advance', $in, ['net' => $amount, 'source_document_id' => $in['source_document_id'] ?? null]);
        $this->cash($doc, $in['account_id'] ?? null, D::sub('0', $amount), 'အတိုးမဲ့ ကြိုသုံးငွေ');

        return ['document_id' => $doc->id];
    }

    private function loan(array $in): array
    {
        $this->owner();
        $party = $this->active('partners', $in['party_id'] ?? null);
        R::require($party->kind === 'supplier', 'Select a trader.');
        $amount = $this->amount($in, 'amount', true);
        if (! empty($in['policy_id'])) {
            $policy = $this->active('loan_interest_policies', $in['policy_id']);
        } else {
            R::require(isset($in['rate']), 'Choose an active loan interest policy.');
            $rate = $this->amount($in, 'rate', false, 8);
            $policy = DB::table('loan_interest_policies')->where('active', true)->where('monthly_rate', $rate)->first();
            R::require((bool) $policy, 'Choose an active loan interest policy.');
        }
        $rate = (string) $policy->monthly_rate;
        $doc = $this->document('loan', $in, ['net' => $amount, 'details' => ['rate' => $rate, 'policyId' => $policy->id, 'policyName' => $policy->name, 'openingInterest' => '0']]);
        $this->cash($doc, $in['account_id'] ?? null, D::sub('0', $amount), 'အတိုးပါ ကြိုထုတ်ငွေ', null, false, $doc->business_date);

        return ['document_id' => $doc->id];
    }

    private function loanInterest(object $loan, ?string $date = null): string
    {
        $rate = R::details($loan)['rate'] ?? '0';
        $principal = $loan->net;
        $last = $loan->business_date;
        $interest = R::details($loan)['openingInterest'] ?? '0';
        foreach (DB::table('payments')->where('document_id', $loan->id)->orderBy('business_date')->orderBy('id')->get() as $p) {
            $days = (string) (int) CarbonImmutable::parse($last)->diffInDays(CarbonImmutable::parse($p->business_date));
            $interest = D::add($interest, D::div(D::mul(D::mul($principal, $rate), $days), '3000'));
            $interest = D::sub($interest, $p->interest);
            $principal = D::sub($principal, $p->principal);
            $last = $p->business_date;
        }
        $days = (string) (int) CarbonImmutable::parse($last)->diffInDays(CarbonImmutable::parse($date ?? $this->day->business_date));

        return D::money(D::add($interest, D::div(D::mul(D::mul($principal, $rate), $days), '3000')));
    }

    private function repay(array $in, ?object $offset = null): array
    {
        $loan = R::get('documents', $in['document_id'] ?? null);
        R::require(in_array($loan->kind, ['loan', 'opening_loan'], true), 'Not a loan.');
        $date = $offset?->business_date ?? $this->date($in);
        $last = DB::table('payments')->where('document_id', $loan->id)->max('business_date') ?? $loan->business_date;
        R::require($date >= $last, 'Repayment cannot precede the last payment or loan date.');
        $principal = $this->amount($in, 'principal');
        $interest = $this->amount($in, 'interest');
        $total = D::add($principal, $interest);
        $already = (string) DB::table('payments')->where('document_id', $loan->id)->sum('principal');
        R::require(D::cmp($total, '0') > 0 && D::cmp($principal, D::sub($loan->net, $already)) <= 0 && D::cmp($interest, $this->loanInterest($loan, $date)) <= 0, 'Repayment exceeds outstanding principal or accrued interest.');
        $entry = $offset ? null : $this->cash($loan, $in['account_id'] ?? null, $total, 'ကြိုထုတ်ငွေ အရင်း / အတိုး ပြန်ဆပ်', null, false, $date);
        R::insert('payments', ['document_id' => $loan->id, 'account_id' => $entry?->account_id, 'cash_entry_id' => $entry?->id, 'source_document_id' => $offset?->id, 'business_date' => $date, 'mode' => $offset ? 'offset' : 'cash', 'amount' => $total, 'principal' => $principal, 'interest' => $interest, 'actor_id' => $this->actor->id]);

        return ['document_id' => $loan->id, 'amount' => D::money($total)];
    }

    private function recover(object $target, array $in): string
    {
        $sum = '0';
        $seen = [];
        foreach ($in['recoveries'] ?? [] as $r) {
            $source = R::get('documents', $r['document_id'] ?? null);
            R::require(in_array($source->kind, ['advance', 'outlay', 'opening_advance'], true) && $source->party_id === $target->party_id && ! in_array($source->id, $seen, true), 'Recovery must reference a matching trader balance once.');
            $seen[] = $source->id;
            $amount = $this->amount($r, 'amount', true);
            $used = (string) DB::table('recoveries')->where('source_document_id', $source->id)->sum('amount');
            R::require(D::cmp($amount, D::sub($source->net, $used)) <= 0, 'Recovery exceeds remaining balance.');
            R::insert('recoveries', ['source_document_id' => $source->id, 'target_document_id' => $target->id, 'kind' => $source->kind, 'amount' => $amount, 'business_date' => $target->business_date, 'actor_id' => $this->actor->id]);
            $sum = D::add($sum, $amount);
        }
        foreach ($in['loan_offsets'] ?? [] as $r) {
            $loan = R::get('documents', $r['document_id'] ?? null);
            R::require($loan->party_id === $target->party_id, 'Loan belongs to another trader.');
            $paid = $this->repay($r, $target);
            $sum = D::add($sum, $paid['amount']);
        }

        return $sum;
    }

    private function expense(array $in): array
    {
        $recoverable = (bool) ($in['recoverable'] ?? false);
        if ($recoverable) {
            $party = $this->active('partners', $in['party_id'] ?? null);
            R::require($party->kind === 'supplier', 'Recoverable outlay needs a trader.');
        }
        $reason = isset($in['reason_id']) ? $this->active('expense_reasons', $in['reason_id'])->name : $this->label($in['reason'] ?? '', 'expense reason');
        $amount = $this->amount($in, 'amount', true);
        $doc = $this->document($recoverable ? 'outlay' : 'expense', $in, ['net' => $amount, 'source_document_id' => $in['source_document_id'] ?? null, 'note' => $reason]);
        $this->cash($doc, $in['account_id'] ?? null, D::sub('0', $amount), $recoverable ? 'ယာယီ စိုက်ထုတ်' : 'ပွဲရုံခံ အသုံးစရိတ်');

        return ['document_id' => $doc->id];
    }

    private function fund(array $in): array
    {
        $this->owner();
        R::require(($in['confirmed'] ?? false) === true, 'Confirm actual receipt or transfer.');
        $amount = $this->amount($in, 'amount', true);
        $mode = $in['mode'] ?? 'external';
        R::require(in_array($mode, ['external', 'transfer'], true), 'Invalid funding mode.');
        $dst = $this->account($in['destination_id'] ?? null, true);
        $src = $mode === 'transfer' ? $this->account($in['source_id'] ?? null, true) : null;
        R::require(! $src || $src->id !== $dst->id, 'Source and destination must differ.');
        $reference = trim((string) ($in['reference'] ?? ''));
        if ($src?->type === 'home' && $dst->code === 'cash') {
            if (! empty($in['request_id'])) {
                return $this->receiveRequest(['document_id' => $in['request_id'], 'amount' => $amount, 'account_id' => $dst->id, 'confirmed' => true]);
            }
            if (DB::table('documents')->where('kind', 'home_request')->whereColumn('paid', '<', 'net')->exists()) {
                R::require(($in['independent'] ?? false) === true && $reference !== '', 'Select the request or acknowledge an independent transfer with a reference.');
            }
            if ($reference !== '') {
                R::require(! DB::table('documents')->where('kind', 'home_request')->where('number', $reference)->exists(), 'Link the request ID instead of duplicating its receipt.');
            }
        }
        if ($reference !== '') {
            R::require(! DB::table('documents')->whereIn('kind', ['funding', 'cash_transfer'])->where('details->reference', $reference)->exists(), 'Funding reference already exists.');
        }
        $category = isset($in['category_id']) ? $this->active('funding_categories', $in['category_id']) : DB::table('funding_categories')->where('code', $src ? '1901' : '3101')->where('active', true)->first();
        R::require($category && ($src ? $category->type === 'transfer' : $category->type !== 'transfer'), 'Select an active funding classification.');
        $doc = $this->document($src ? 'cash_transfer' : 'funding', $in, ['net' => $amount, 'funding_category_id' => $category->id, 'details' => ['source' => $src?->id, 'destination' => $dst->id, 'reference' => $reference, 'coaId' => $in['coa_id'] ?? ($src ? 'COA50-TRANSFER' : 'COA50-CAPITAL'), 'description' => $this->label($in['description'] ?? '', 'description')]]);
        if ($src) {
            $this->cash($doc, $src->id, D::sub('0', $amount), 'အတွင်းလွှဲ ထွက်', null, true);
        }$this->cash($doc, $dst->id, $amount, $src ? 'အတွင်းလွှဲ ဝင်' : 'ပြင်ပငွေဖြည့်', null, true);

        return ['document_id' => $doc->id];
    }

    private function reverse(array $in): array
    {
        $this->owner();
        $doc = R::get('documents', $in['document_id'] ?? null);
        R::require(in_array($doc->kind, ['funding', 'cash_transfer'], true) && $doc->status === 'posted', 'Only a posted funding or internal transfer can be reversed.');
        $reason = $this->label($in['reason'] ?? '', 'reversal reason');
        $rev = $this->document('reversal', $in, ['source_document_id' => $doc->id, 'note' => $reason]);
        foreach (DB::table('cash_entries')->where('document_id', $doc->id)->orderByDesc('amount')->get() as $entry) {
            $this->cash($rev, $entry->account_id, D::sub('0', $entry->amount), 'ငွေလွှဲ ပြန်လှန်', $entry->id, true);
        }
        R::update('documents', $doc->id, ['status' => 'reversed']);

        return ['document_id' => $rev->id];
    }

    private function request(array $in): array
    {
        $kind = $in['kind'] ?? 'home';
        $amount = $this->amount($in, 'amount', true);
        $source = null;
        if ($kind === 'home') {
            $this->owner();
        } else {
            R::require($kind === 'collection', 'Invalid request kind.');
            $source = R::get('documents', $in['document_id'] ?? null);
            R::require($source->kind === 'sale', 'Collection needs a sale.');
            $issued = (string) DB::table('documents')->where('kind', 'collection_request')->where('source_document_id', $source->id)->selectRaw('COALESCE(SUM(net-paid),0) AS balance')->value('balance');
            R::require(D::cmp($amount, D::sub(D::sub($source->net, $source->paid), $issued)) <= 0, 'Requested amount exceeds unrequested receivable.');
        }
        $doc = $this->document($kind === 'home' ? 'home_request' : 'collection_request', $in, ['status' => 'issued', 'net' => $amount, 'source_document_id' => $source?->id, 'party_id' => $source?->party_id, 'details' => ['collector' => $this->label($in['collector'] ?? '', 'collector'), 'reason' => $this->label($in['reason'] ?? 'ငွေတောင်းခံ', 'reason')]]);

        return ['document_id' => $doc->id];
    }

    private function receiveRequest(array $in): array
    {
        R::require(($in['confirmed'] ?? false) === true, 'Confirm actual receipt.');
        $r = R::get('documents', $in['document_id'] ?? null);
        $amount = $this->amount($in, 'amount', true);
        R::require(D::cmp($amount, D::sub($r->net, $r->paid)) <= 0, 'Receipt exceeds request balance.');
        if ($r->kind === 'collection_request') {
            $sale = R::get('documents', $r->source_document_id);
            $this->applyPayment($sale, [['account_id' => $in['account_id'] ?? null, 'amount' => $amount]], $r);

            return ['document_id' => $r->id];
        }
        R::require($r->kind === 'home_request', 'Not a money request.');
        $home = DB::table('cash_accounts')->where('type', 'home')->where('active', true)->first();
        $dst = $this->account($in['account_id'] ?? null);
        R::require((bool) $home, 'Home account is not set up.');
        // Receiving an owner-issued home request is an explicit clerk permission.
        // Neither the home balance nor the hidden ledger is returned to the clerk.
        R::require(D::cmp($amount, $home->balance) <= 0, 'The requested home transfer cannot be completed.');
        R::update('cash_accounts', $home->id, ['balance' => D::sub($home->balance, $amount)]);
        R::insert('cash_entries', ['account_id' => $home->id, 'document_id' => $r->id, 'business_date' => $this->day->business_date, 'amount' => D::sub('0', $amount), 'title' => 'အိမ်မှငွေယူ ထွက်', 'actor_id' => $this->actor->id]);
        $entry = $this->cash($r, $dst->id, $amount, 'အိမ်မှငွေ လက်ခံ');
        R::insert('payments', ['document_id' => $r->id, 'account_id' => $dst->id, 'cash_entry_id' => $entry->id, 'business_date' => $this->day->business_date, 'amount' => $amount, 'actor_id' => $this->actor->id]);
        $paid = D::add($r->paid, $amount);
        R::update('documents', $r->id, ['paid' => $paid, 'status' => D::cmp($paid, $r->net) === 0 ? 'received' : 'partial']);

        return ['document_id' => $r->id];
    }

    private function settle(array $in): array
    {
        $doc = R::get('documents', $in['document_id'] ?? null);
        R::require($doc->kind === 'settlement' && $doc->status === 'pending', 'Settlement is already confirmed.');
        $charges = $this->charges($in, 'purchase', $doc->gross, []);
        if (($in['service_mode'] ?? 'no') === 'yes') {
            $rate = $this->amount($in, 'service_rate', true, 8);
            $allowed = ['0.5', '1', '1.5', '2', '2.5', '3'];
            foreach (DB::table('adjustment_rates')->where('active', true)->whereIn('kind', ['purchase', 'both'])->where('calc_mode', 'service_percent')->pluck('rate') as $r) {
                $allowed[] = $r;
            }
            R::require(count(array_filter($allowed, fn ($r) => D::cmp($rate, $r) === 0)) > 0, 'Select an available trader commission rate.');
            $fee = D::money(D::kyat(D::div(D::mul($doc->gross, $rate), '100')));
            $charges['items'][] = ['label' => 'ပွဲခ', 'amount' => $fee, 'direction' => 'subtract', 'mode' => 'service_percent', 'rate' => $rate];
            $charges['deductionTotal'] = D::money(D::add($charges['deductionTotal'], $fee));
            $charges['net'] = D::money(D::sub($charges['net'], $fee));
        }
        $posting = clone $doc;
        $posting->business_date = $this->date($in);
        $recovery = $this->recover($posting, $in);
        $net = D::money(D::sub($charges['net'], $recovery));
        R::require(D::cmp($net, '0') >= 0, 'Settlement deductions exceed goods value.');
        R::update('documents', $doc->id, ['status' => 'confirmed', 'net' => $net, 'details' => array_merge(R::details($doc), ['charges' => $charges, 'confirmedDate' => $posting->business_date])]);
        $this->applyPayment(R::get('documents', $doc->id), $in['payments'] ?? [], null, $posting->business_date);

        return ['document_id' => $doc->id];
    }

    private function closeDay(array $in): array
    {
        R::require($this->day->status === 'open' && ($in['confirmed'] ?? false) === true, 'Confirm the actual closing cash count.');
        $actual = $this->amount($in, 'actual');
        $transfer = $this->amount($in, 'transfer');
        $cash = DB::table('cash_accounts')->where('type', 'cash')->where('active', true)->first();
        R::require((bool) $cash, 'Cash account is missing.');
        $difference = D::sub($actual, $cash->balance);
        R::require(D::cmp($difference, '0') === 0 || trim((string) ($in['note'] ?? '')) !== '', 'Explain the closing cash difference.');
        R::require(D::cmp($transfer, $actual) <= 0, 'Home transfer exceeds counted cash.');
        if (D::cmp($transfer, '0') > 0) {
            $home = DB::table('cash_accounts')->where('type', 'home')->where('active', true)->first();
            R::require((bool) $home, 'Home account is missing.');
            $doc = $this->document('day_transfer', $in, ['net' => $transfer]);
            $this->cash($doc, $cash->id, D::sub('0', $transfer), 'နေ့ပိတ် အိမ်ပို့ငွေ');
            $h = R::get('cash_accounts', $home->id);
            R::update('cash_accounts', $h->id, ['balance' => D::add($h->balance, $transfer)]);
            R::insert('cash_entries', ['account_id' => $h->id, 'document_id' => $doc->id, 'business_date' => $this->day->business_date, 'amount' => $transfer, 'title' => 'နေ့ပိတ် အိမ်ငွေ ဝင်', 'actor_id' => $this->actor->id]);
        }
        $closing = ['date' => $this->day->business_date, 'actualBefore' => $actual, 'expectedBefore' => $cash->balance, 'transfer' => $transfer, 'actualAfter' => D::sub($actual, $transfer), 'expectedAfter' => D::sub($cash->balance, $transfer), 'difference' => $difference, 'note' => $in['note'] ?? '', 'closedAt' => now()->toIso8601String(), 'closedBy' => $this->actor->id];
        $closing['summary53'] = app(ClosingSnapshot::class)->capture($this->day, $closing);
        R::update('business_days', $this->day->id, ['status' => 'closed', 'closing' => $closing]);

        return ['status' => 'closed'];
    }

    private function nextDay(): array
    {
        R::require($this->day->status === 'closed', 'Close the current day first.');
        $date = CarbonImmutable::parse($this->day->business_date)->addDay()->toDateString();
        $cash = (string) DB::table('cash_accounts')->where('type', 'cash')->where('active', true)->sum('balance');
        R::insert('business_days', ['business_date' => $date, 'opening_expected' => $cash]);

        return ['date' => $date];
    }

    private function importOpening(array $in): array
    {
        R::require(is_string($in['token'] ?? null), 'Excel ဖိုင်ကို အရင်စစ်ဆေးပါ။');
        $draft = app(OpeningImport::class)->apply($this->actor, $in['token'], $this->day->business_date);
        if ($this->actor->role !== 'owner') {
            // openingDraft restores protected accounts from the stored draft, never from clerk input.
            $visibleCodes = DB::table('cash_accounts')->where('staff_can_view', true)->pluck('code')->all();
            $draft['accounts'] = array_intersect_key($draft['accounts'], array_fill_keys($visibleCodes, true));
        }

        return $this->openingDraft(['draft' => $draft]);
    }

    private function openingDraft(array $in): array
    {
        $draft = $in['draft'] ?? [];
        R::require(is_array($draft), 'Invalid opening draft.');
        $existing = DB::table('documents')->where('kind', 'opening')->first();
        R::require(! $existing || $existing->status === 'draft', 'Opening is already approved.');
        if ($this->actor->role !== 'owner') {
            $old = $existing ? R::details($existing) : [];
            $accounts = $old['accounts'] ?? [];
            foreach ($draft['accounts'] ?? [] as $key => $a) {
                $account = DB::table('cash_accounts')->where('code', $key)->first();
                abort_unless($account && $account->staff_can_view, 403, 'Opening account is not visible to this user.');
                $accounts[$key] = $a;
            }
            $draft['accounts'] = $accounts;
            foreach (array_unique(array_merge(array_keys($old['parties'] ?? []), array_keys($draft['parties'] ?? []))) as $key) {
                $party = $draft['parties'][$key] ?? [];
                foreach (['loan', 'loanInterest', 'loanRate'] as $field) {
                    R::require(($party['values'][$field] ?? ($field === 'loanRate' ? '3' : '')) === ($old['parties'][$key]['values'][$field] ?? ($field === 'loanRate' ? '3' : '')), 'Only the owner may change opening loans.');
                }
            }
        }
        $r = $existing ? R::update('documents', $existing->id, ['details' => $draft]) : $this->document('opening', [], ['status' => 'draft', 'details' => $draft]);

        return ['document_id' => $r->id];
    }

    private function approveOpening(array $in): array
    {
        $this->owner();
        $doc = DB::table('documents')->where('kind', 'opening')->first();
        R::require($doc && $doc->status === 'draft', 'No editable opening exists.');
        $draft = R::details($doc);
        $start = $draft['startDate'] ?? $this->day->business_date;
        R::require(is_string($start) && CarbonImmutable::hasFormat($start, 'Y-m-d'), 'Invalid software start date.');
        if ($start !== $this->day->business_date) {
            R::require(! DB::table('cash_entries')->exists() && ! DB::table('stock_events')->exists() && ! DB::table('business_days')->where('status', 'closed')->exists(), 'Daily activity already exists; preserve the business start date.');
            $this->day = R::update('business_days', $this->day->id, ['business_date' => $start]);
        }
        R::require(! isset($draft['pendingStock']), 'Save or discard the pending stock line first.');
        R::require(($draft['own']['checked'] ?? false) && ($draft['groups']['supplier'] ?? false) && ($draft['groups']['buyer'] ?? false), 'Complete all opening review groups.');
        $prior = [];
        foreach (DB::table('cash_accounts')->get() as $a) {
            $x = $draft['accounts'][$a->code] ?? $draft['accounts'][(string) $a->id] ?? null;
            R::require($x && ($x['checked'] ?? false), 'Review every opening account.');
            $amount = D::value((string) ($x['amount'] ?? ''), 2);
            R::require(! DB::table('cash_entries')->where('account_id', $a->id)->exists(), 'Account has financial history; cannot overwrite opening.');
            $prior[$a->id] = ['opening' => $a->opening_balance, 'balance' => $a->balance];
            R::update('cash_accounts', $a->id, ['opening_balance' => $amount, 'balance' => $amount]);
        }
        $groups = [['kind' => 'owned', 'party' => null, 'rows' => $draft['own']['rows'] ?? []]];
        foreach ($draft['parties'] ?? [] as $partyId => $p) {
            if ($p === null) {
                continue;
            }
            R::require(is_array($p), 'Invalid opening party draft.');
            $answered = array_filter($p['answers'] ?? [], fn ($answer) => $answer !== null && $answer !== '');
            $amounts = array_filter($p['values'] ?? [], fn ($value, $field) => $field !== 'loanRate' && $value !== null && $value !== '' && (string) $value !== '0', ARRAY_FILTER_USE_BOTH);
            if (empty($p['rows']) && ! $answered && ! $amounts && ! ($p['checked'] ?? false)) {
                continue;
            }
            $party = $this->active('partners', $partyId);
            R::require($p['checked'] ?? false, 'Review each opening party.');
            $groups[] = ['kind' => $party->kind === 'buyer' ? 'customer' : 'supplier', 'party' => $party->id, 'rows' => $p['rows'] ?? []];
            foreach (['payable', 'receivable', 'advance', 'loan', 'deposit'] as $kind) {
                $value = (string) ($p['values'][$kind] ?? '');
                if ($value === '' || D::cmp(D::value($value, 2), '0') === 0) {
                    continue;
                }$amount = D::value($value, 2);
                $details = [];
                if ($kind === 'loan') {
                    R::require(isset($p['values']['loanRate']), 'Opening loan monthly rate is required.', 'loanRate');
                    $rate = D::value((string) ($p['values']['loanRate'] ?? '0'));
                    R::require(D::cmp($rate, '0') >= 0 && D::cmp($rate, '100') <= 0, 'Invalid opening loan monthly rate.');
                    $details = ['rate' => $rate, 'openingInterest' => D::value((string) ($p['values']['loanInterest'] ?? '0'), 2)];
                }
                $this->document('opening_'.$kind, ['party_id' => $party->id], ['net' => $amount, 'details' => $details, 'source_document_id' => $doc->id]);
            }
        }
        foreach ($groups as $g) {
            foreach ($g['rows'] as $row) {
                $p = $this->active('products', $row['productId'] ?? null);
                $w = $this->active('warehouses', $row['warehouse'] ?? null);
                R::require(in_array($row['grade'] ?? '', json_decode($p->grades, true), true), 'Invalid opening product grade.');
                $qty = D::value((string) ($row['qty'] ?? ''));
                R::require(D::cmp($qty, '0') > 0, 'Opening stock must be positive.');
                $bags = isset($row['bags']) && $row['bags'] !== '' ? D::value((string) $row['bags']) : null;
                $cost = '0';
                if ($g['kind'] === 'owned') {
                    if (! empty($row['originPartnerId'])) {
                        $origin = $this->active('partners', $row['originPartnerId']);
                        R::require($origin->kind === 'supplier', 'Choose the original supplier.');
                        $row['originName'] = $origin->name.($origin->locality ? ' ('.$origin->locality.')' : '');
                    }
                    $input = D::value((string) ($row['costInput'] ?? $row['cost'] ?? '0'));
                    $cost = ($row['costBasis'] ?? 'viss') === 'bag' ? D::div($input, D::value((string) ($row['costStandardViss'] ?? ''))) : $input;
                }
                $sourceLine = null;
                if ($g['kind'] === 'supplier') {
                    $receipt = $this->document('receipt', ['party_id' => $g['party']], ['status' => 'await', 'source_document_id' => $doc->id, 'note' => 'စတင်ကုန်လက်ကျန်']);
                    $sourceLine = $this->line($receipt, ['product_id' => $p->id, 'warehouse_id' => $w->id, 'grade' => $row['grade'] ?? '', 'quantity' => $qty, 'bags' => $bags, 'ownership' => 'supplier', 'details' => ['bagType' => 'weight', 'opening' => true]]);
                }
                $lot = R::insert('stock_lots', ['receipt_line_id' => $sourceLine?->id, 'product_id' => $p->id, 'warehouse_id' => $w->id, 'party_id' => $g['party'], 'owner' => $g['kind'], 'grade' => $row['grade'] ?? '', 'batch' => $this->label($row['batch'] ?? ''), 'quantity' => $qty, 'bags' => $bags, 'unit_cost' => $cost, 'entry_date' => $this->day->business_date]);
                $this->event('opening', $lot, $qty, $bags, $doc, null, ['openingRow' => $row]);
            }
        }
        R::update('documents', $doc->id, ['status' => 'approved', 'details' => array_merge($draft, ['posted' => ['accountsBefore' => $prior], 'approvedAt' => now()->toIso8601String()])]);

        return ['document_id' => $doc->id];
    }

    private function openingDispatch(array $in): array
    {
        $lot = R::get('stock_lots', $in['lot_id'] ?? null);
        R::require($lot->owner === 'customer' && $lot->sale_line_id === null && DB::table('stock_events')->where('lot_id', $lot->id)->where('kind', 'opening')->exists(), 'Choose buyer-owned opening stock.');
        $qty = $this->amount($in, 'quantity', true, 8);
        $this->take($lot, $qty);
        $doc = $this->document('dispatch', $in, ['party_id' => $lot->party_id]);
        $this->event('dispatch', $lot, $qty, null, $doc, null, ['opening' => true]);

        return ['document_id' => $doc->id];
    }

    private function openingCredit(array $in): array
    {
        $deposit = R::get('documents', $in['document_id'] ?? null);
        $line = R::get('document_lines', $in['sale_line_id'] ?? null);
        $sale = R::get('documents', $line->document_id);
        $amount = $this->amount($in, 'amount', true);
        R::require($deposit->kind === 'opening_deposit' && $sale->kind === 'sale' && $deposit->party_id === $sale->party_id && D::cmp($amount, D::sub($deposit->net, $deposit->paid)) <= 0 && D::cmp($amount, D::sub($line->net, $line->paid)) <= 0, 'Credit exceeds deposit or sale balance.');
        R::update('documents', $deposit->id, ['paid' => D::add($deposit->paid, $amount)]);
        R::update('documents', $sale->id, ['paid' => D::add($sale->paid, $amount)]);
        R::update('document_lines', $line->id, ['paid' => D::add($line->paid, $amount)]);
        R::insert('payments', ['document_id' => $deposit->id, 'source_document_id' => $sale->id, 'mode' => 'opening_credit69', 'business_date' => $this->day->business_date, 'amount' => $amount, 'actor_id' => $this->actor->id]);
        R::insert('payments', ['document_id' => $sale->id, 'line_id' => $line->id, 'source_document_id' => $deposit->id, 'mode' => 'opening_credit69', 'business_date' => $this->day->business_date, 'amount' => $amount, 'actor_id' => $this->actor->id]);

        return ['document_id' => $sale->id];
    }

    private function reopenOpening(array $in): array
    {
        $this->owner();
        $doc = DB::table('documents')->where('kind', 'opening')->first();
        R::require($doc && $doc->status === 'approved', 'Opening is not approved.');
        $reason = $this->label($in['reason'] ?? '', 'reopen reason');
        R::require(! DB::table('cash_entries')->exists() && ! DB::table('payments')->exists() && ! DB::table('recoveries')->exists() && ! DB::table('stock_events')->whereNotIn('kind', ['opening', 'opening_reversal'])->exists(), 'Opening has subsequent stock or money activity and cannot be reopened.');
        $x = R::details($doc);
        foreach ($x['posted']['accountsBefore'] ?? [] as $id => $a) {
            R::update('cash_accounts', (int) $id, ['opening_balance' => $a['opening'], 'balance' => $a['balance']]);
        }
        foreach (DB::table('stock_events')->where('document_id', $doc->id)->where('kind', 'opening')->get() as $event) {
            if (DB::table('stock_events')->where('kind', 'opening_reversal')->where('details->reversingEventId', $event->id)->exists()) {
                continue;
            }$lot = R::get('stock_lots', $event->lot_id);
            R::update('stock_lots', $lot->id, ['quantity' => '0', 'bags' => $lot->bags === null ? null : '0']);
            $this->event('opening_reversal', $lot, $event->quantity === null ? null : D::sub('0', $event->quantity), null, $doc, null, ['reason' => $reason, 'reversingEventId' => $event->id]);
        }
        DB::table('documents')->where('source_document_id', $doc->id)->update(['status' => 'reversed', 'updated_at' => now()]);
        unset($x['posted']);
        $x['revisions'][] = ['action' => 'reopened', 'reason' => $reason, 'at' => now()->toIso8601String()];
        R::update('documents', $doc->id, ['status' => 'draft', 'details' => $x]);

        return ['document_id' => $doc->id];
    }

    private function prices(array $in): array
    {
        foreach ($in['prices'] ?? [] as $row) {
            $p = $this->active('products', $row['product_id'] ?? null);
            R::require(in_array($row['grade'] ?? '', json_decode($p->grades, true), true), 'Invalid grade.');
            $price = $this->amount($row, 'price', true, 8);
            DB::table('daily_prices')->updateOrInsert(['product_id' => $p->id, 'grade' => $row['grade'], 'business_date' => $this->day->business_date], ['price' => $price, 'created_at' => now(), 'updated_at' => now()]);
        }

        return ['saved' => true];
    }

    private function note(array $in): array
    {
        $key = 'note:'.($in['id'] ?? Str::ulid());
        $value = ['title' => $this->label($in['title'] ?? ''), 'date' => $this->date($in), 'body' => mb_substr((string) ($in['body'] ?? ''), 0, 20000)];
        DB::table('business_settings')->updateOrInsert(['key' => $key], ['value' => json_encode($value), 'created_at' => now(), 'updated_at' => now()]);

        return ['id' => $key];
    }

    private function deleteNote(array $in): array
    {
        $key = (string) ($in['id'] ?? '');
        R::require(str_starts_with($key, 'note:'), 'Invalid note.');
        DB::table('business_settings')->where('key', $key)->delete();

        return ['id' => $key];
    }
}
