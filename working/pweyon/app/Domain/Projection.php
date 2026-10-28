<?php

namespace App\Domain;

use App\Domain\Decimal as D;
use App\Domain\Records as R;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/** Read model preserves the confirmed interface vocabulary; no write accepts this shape. */
final class Projection
{
    public function forUser(User $actor): array
    {
        return DB::transaction(fn () => $this->build($actor));
    }

    private function build(User $actor): array
    {
        $s = json_decode(file_get_contents(resource_path('data/interface-defaults.json')), true, 512, JSON_THROW_ON_ERROR);
        $day = DB::table('business_days')->orderByDesc('business_date')->first();
        $s['day'] = $day?->business_date ?? now()->toDateString();
        $s['role'] = $actor->role === 'owner' ? 'owner' : 'staff';
        $s['counter'] = 1000000;
        $s['loanInterestPolicies'] = DB::table('loan_interest_policies')->orderBy('id')->get()
            ->map(fn ($policy) => ['id' => (string) $policy->id, 'name' => $policy->name, 'monthlyRate' => $policy->monthly_rate, 'active' => (bool) $policy->active])->all();
        $s['cleanStart2'] = ['schema' => 1, 'serverManaged' => true];
        $s['closed'] = $day?->status === 'closed';
        $s['closing'] = $day?->closing ? json_decode($day->closing, true) : null;
        $reviews = app(OpeningCashReview::class);
        $s['opening'] = $day ? $reviews->describe($day) : ['checked' => false, 'expected' => '0', 'actual' => null, 'difference' => '0', 'note' => '', 'status' => 'unchecked'];
        $s['openingCashChecks'] = [];
        if ($actor->role === 'owner' || DB::table('cash_accounts')->where('code', 'cash')->where('staff_can_view', true)->exists()) {
            foreach (DB::table('business_days')->where('opening_checked', true)->when($actor->role !== 'owner', fn ($query) => $query->where('id', $day?->id))->orderByDesc('business_date')->get() as $checkedDay) {
                $check = $reviews->describe($checkedDay);
                if ($actor->role === 'owner' && in_array($check['status'], ['reviewed', 'invalid'], true)) {
                    $check['candidates'] = $reviews->candidates($checkedDay);
                    $check['legacyCandidates'] = $check['legacy'] ? $reviews->candidates($checkedDay, true) : [];
                }
                $s['openingCashChecks'][] = $check;
            }
        }
        $products = DB::table('products')->get()->keyBy('id');
        $parties = DB::table('partners')->get()->keyBy('id');
        $warehouses = DB::table('warehouses')->get()->keyBy('id');
        $accounts = DB::table('cash_accounts')->get()->keyBy('id');
        $visible = $accounts->filter(fn ($a) => $actor->role === 'owner' || $a->staff_can_view);
        if ($actor->role !== 'owner' && ! $visible->contains(fn ($account) => $account->code === 'cash')) {
            $s['opening'] = ['checked' => (bool) $day?->opening_checked, 'expected' => '0', 'actual' => null, 'difference' => '0', 'note' => '', 'status' => 'hidden'];
        }
        if (! $day?->opening_checked) {
            $cash = $visible->first(fn ($account) => $account->code === 'cash' && $account->active);
            $s['opening']['expected'] = $cash?->balance ?? '0';
            $s['opening']['difference'] = $day?->opening_actual !== null && $day !== null
                ? D::sub($day->opening_actual, $s['opening']['expected']) : '0';
        }
        $docs = DB::table('documents')->orderBy('id')->get()->keyBy('id');
        foreach ($docs as $document) {
            if (preg_match('/-(\d{1,15})$/u', $document->number, $matches)) {
                $s['counter'] = max($s['counter'], (int) $matches[1]);
            }
        }
        $s['nextReceiptNumber'] = 'အလ-'.($s['counter'] + 1);
        $lines = DB::table('document_lines')->orderBy('id')->get()->keyBy('id');
        $lots = DB::table('stock_lots')->get()->keyBy('id');
        $payments = DB::table('payments')->get();
        $events = DB::table('stock_events')->orderBy('id')->get();
        $recoveries = DB::table('recoveries')->get();
        $cashEntries = DB::table('cash_entries')->orderBy('id')->get();
        $cashEntriesByDocument = $cashEntries->groupBy('document_id');
        $recoveriesByTarget = $recoveries->groupBy('target_document_id');
        $offsetPaymentsBySource = $payments->where('mode', 'offset')->groupBy('source_document_id');
        $chargesByDocument = $docs->whereIn('kind', ['purchase', 'sale', 'settlement'])->map(
            fn ($doc) => $this->sourceCharges($doc, $recoveriesByTarget->get($doc->id, collect()), $offsetPaymentsBySource->get($doc->id, collect()))
        );
        $s['__ids'] = ['accounts' => $visible->mapWithKeys(fn ($a) => [$a->code => $a->id])->all()];
        $s['masters']['products'] = $products->map(fn ($p) => ['id' => (string) $p->id, 'name' => $p->name, 'standardViss' => $p->standard_viss, 'standardWeight' => $p->standard_viss, 'grades' => json_decode($p->grades, true), 'active' => (bool) $p->active, 'revision' => 1])->values()->all();
        $s['masters']['partners'] = $parties->map(fn ($p) => ['id' => (string) $p->id, 'name' => $p->name, 'locality' => $p->locality, 'phone' => $p->phone, 'kind' => $p->kind, 'type' => R::details($p)['type'] ?? ($p->kind === 'buyer' ? 'buyer' : 'trader'), 'active' => (bool) $p->active])->values()->all();
        $s['masters']['expenseReasons'] = DB::table('expense_reasons')->get()->map(fn ($r) => ['id' => (string) $r->id, 'name' => $r->name, 'active' => (bool) $r->active])->all();
        $categoryAliases = ['3101' => 'COA50-CAPITAL', '2101' => 'COA50-OWNERLOAN', '2102' => 'COA50-LOAN', '3901' => 'COA50-OTHER', '1901' => 'COA50-TRANSFER'];
        $categories = DB::table('funding_categories')->get();
        $s['coa50'] = $categories->map(fn ($r) => ['id' => $categoryAliases[$r->code] ?? (string) $r->id, 'code' => $r->code, 'name' => $r->name, 'type' => $r->type, 'active' => (bool) $r->active, 'locked' => (bool) $r->locked])->all();
        $s['__ids']['categories'] = $categories->mapWithKeys(fn ($r) => [$categoryAliases[$r->code] ?? (string) $r->id => $r->id])->all();
        $s['masters']['accounts'] = $visible->map(fn ($a) => ['id' => $a->code, 'name' => $a->name, 'type' => $a->type, 'active' => (bool) $a->active, 'staffCanView' => (bool) $a->staff_can_view, 'openingBalance' => $a->opening_balance])->values()->all();
        $s['bases'] = $visible->mapWithKeys(fn ($a) => [$a->code => $a->opening_balance])->all();
        $s['warehouses'] = $warehouses->map(fn ($w) => ['id' => (string) $w->id, 'name' => $w->name, 'active' => (bool) $w->active])->values()->all();
        $s['packTypes'] = DB::table('package_types')->get()->map(fn ($p) => ['id' => (string) $p->id, 'product' => $products[$p->product_id]->name, 'name' => $p->name, 'size' => $p->size, 'unit' => 'ပိဿာ', 'active' => (bool) $p->active])->all();
        $s['masters']['purchaseDeductionRates'] = DB::table('adjustment_rates')->get()->map(fn ($r) => ['id' => (string) $r->id, 'name' => $r->name, 'displayName' => $r->name, 'kind' => $r->calc_mode === 'labor' ? 'labor' : 'service', 'applyAt' => $r->kind, 'itemType' => $r->item_type, 'calcMode' => $r->calc_mode === 'labor' ? 'labor_auto' : $r->calc_mode, 'basis' => $r->calc_mode === 'service_percent' ? 'percent_total' : ($r->calc_mode === 'labor' ? 'labor_auto' : 'manual'), 'rate' => $r->rate, 'active' => (bool) $r->active] + R::details($r))->all();
        $labor = DB::table('labor_rates')->get();
        foreach (['rate' => 'laborRateMasters51', 'mael' => 'laborMaelMasters51', 'bag' => 'laborBagRates'] as $kind => $key) {
            $s[$key] = $labor->where('kind', $kind)->map(fn ($r) => ['id' => (string) $r->id, 'name' => $r->name, 'value' => $r->rate, 'rate' => $r->rate, 'active' => (bool) $r->active] + R::details($r))->values()->all();
        }
        $allocations = DB::table('payment_allocations')->get();
        $paymentRows = function (int $documentId, ?int $lineId = null) use ($payments, $visible, $accounts, $allocations): array {
            return $payments->where('document_id', $documentId)->map(function ($p) use ($visible, $accounts, $allocations, $lineId) {
                $amount = $lineId !== null ? ($allocations->first(fn ($a) => $a->payment_id === $p->id && $a->line_id === $lineId)?->amount ?? ($p->line_id === $lineId ? $p->amount : null)) : $p->amount;
                if ($amount === null) {
                    return null;
                }

                return ['id' => (string) $p->id.($lineId !== null ? '-'.$lineId : ''), 'date' => $p->business_date, 'amount' => $amount, 'principal' => $p->principal, 'interest' => $p->interest, 'mode' => $p->mode, 'account' => $p->account_id !== null && $visible->has($p->account_id) ? $accounts[$p->account_id]->code : null, 'ref' => (string) ($p->source_document_id ?? $p->document_id)];
            })->filter()->values()->all();
        };
        $purchases = $lines->filter(fn ($l) => ($docs[$l->document_id]->kind ?? '') === 'purchase')->keyBy('source_line_id');
        $s['receipts'] = [];
        $s['sales'] = [];
        foreach ($lines as $line) {
            $doc = $docs[$line->document_id] ?? null;
            if (! $doc || $doc->status === 'reversed' || (R::details($line)['voided'] ?? false)) {
                continue;
            }$party = $parties[$doc->party_id] ?? null;
            $extra = R::details($line);
            $details = R::details($doc);
            $name = $party ? $party->name.($party->locality ? ' ('.$party->locality.')' : '') : '';
            if ($doc->kind === 'receipt') {
                $buy = $purchases[$line->id] ?? null;
                $purchase = $buy ? $docs[$buy->document_id] : null;
                $sold = D::sum($lines->filter(fn ($l) => $l->source_line_id === $line->id && ($docs[$l->document_id]->kind ?? '') === 'sale')->pluck('quantity'));
                $r = ['id' => (string) $line->id, 'backendDocumentId' => $doc->id, 'purchaseDocumentId' => $purchase?->id, 'no' => $doc->number.' / '.$line->id, 'voucherNo' => $doc->number, 'date' => $doc->business_date, 'partnerId' => (string) $doc->party_id, 'name' => $name, 'type' => R::details($party)['type'] ?? 'trader', 'product' => $products[$line->product_id]->name, 'productId' => (string) $line->product_id, 'grade' => $line->grade, 'qty' => $buy?->quantity ?? $line->quantity ?? '0', 'weightKnown' => $line->quantity !== null, 'bags' => $line->bags ?? '0', 'actualBags' => $line->bags, 'rawBags' => ($extra['bagType'] ?? 'raw') === 'raw' ? $line->bags ?? '0' : '0', 'bagType' => $extra['bagType'] ?? 'raw', 'packageViss' => $extra['packageViss'] ?? '0', 'packageCount' => ($extra['bagType'] ?? '') === 'finished' ? $line->bags ?? '0' : '0', 'warehouse' => (string) $line->warehouse_id, 'status' => $buy ? 'purchased' : 'await', 'price' => $buy?->price, 'priceBasis' => $buy?->price_basis, 'net4' => $buy?->net, 'backendGross' => $buy?->gross, 'advance' => 0, 'wage' => 0, 'weigh' => 0, 'paid' => $buy?->paid ?? '0', 'payments' => $purchase ? $paymentRows($purchase->id, $buy->id) : [], 'note' => $doc->note ?? '', 'car' => $doc->vehicle ?? '', 'v4' => true];
                if ($buy) {
                    $r += ['purchaseDate' => $purchase->business_date, 'purchaseNo' => $purchase->number, 'purchaseBagViss47' => R::details($buy)['purchaseBagViss'] ?? null, 'standardBagViss47' => $products[$line->product_id]->standard_viss ?? '0', 'purchaseBagCount55' => R::details($buy)['purchaseBags'] ?? null, 'charges4' => $chargesByDocument[$purchase->id]];
                    if (D::cmp($sold, '0') > 0) {
                        $r['remainingPurchase2'] = ['schema' => 1, 'qty' => $buy->quantity, 'soldQty' => $sold, 'original' => ['qty' => $line->quantity, 'bags' => $line->bags, 'weightKnown' => $line->quantity !== null], 'sourceSaleIds' => $lines->filter(fn ($l) => $l->source_line_id === $line->id && $docs[$l->document_id]->kind === 'sale')->map(fn ($l) => (string) $l->id)->values()->all()];
                    }
                }
                if ($buy) {
                    $r['standardBagViss47'] = R::details($buy)['standardViss'] ?? $products[$line->product_id]->standard_viss ?? '0';
                }
                $outlay = $docs->first(fn ($d) => $d->kind === 'outlay' && $d->source_document_id === $doc->id && $d->status !== 'reversed');
                if ($outlay && $line->id === $lines->firstWhere('document_id', $doc->id)?->id) {
                    $entry = $cashEntriesByDocument->get($outlay->id)?->last();
                    $r['carriageAdvance'] = $outlay->net;
                    $r['carriageExpenseId'] = (string) $outlay->id;
                    $r['carriageAccount'] = $entry && $visible->has($entry->account_id) ? $accounts[$entry->account_id]->code : '';
                }
                if ($doc->source_document_id && ($docs[$doc->source_document_id]->kind ?? '') === 'opening') {
                    $r['opening69'] = 'server-opening';
                }
                $s['receipts'][] = $r;
            }
            if ($doc->kind === 'sale') {
                $dispatches = $events->filter(fn ($e) => $e->kind === 'dispatch' && (R::details($e)['saleLineId'] ?? null) === $line->id)->map(fn ($e) => ['id' => (string) $e->id, 'date' => $e->business_date, 'qty' => $e->quantity, 'bags' => $e->bags, 'warehouse' => (string) $lots[$e->lot_id]->warehouse_id, 'recordedAt' => $e->created_at, 'car' => R::details($e)['vehicle'] ?? '', 'collector' => R::details($e)['collector'] ?? ''])->values()->all();
                $source = $line->source_line_id ? $lines[$line->source_line_id] : null;
                $r = ['id' => (string) $line->id, 'backendDocumentId' => $doc->id, 'no' => $doc->number.' / '.$line->id, 'voucherNo' => $doc->number, 'date' => $doc->business_date, 'buyerId' => (string) $doc->party_id, 'name' => $name, 'product' => $products[$line->product_id]->name, 'grade' => $line->grade, 'qty' => $line->quantity, 'bags' => $line->bags ?? '0', 'packageCount' => $line->bags ?? '0', 'packageViss' => $extra['packageViss'] ?? '0', 'buyerBagViss46' => $extra['packageViss'] ?? '0', 'standardBagViss46' => $products[$line->product_id]->standard_viss ?? '0', 'price' => $line->price, 'priceBasis' => $line->price_basis, 'total' => $line->net, 'grossTotal' => $line->gross, 'cost' => D::mul($line->quantity, $extra['unitCost'] ?? '0'), 'paid' => $line->paid, 'payments' => $paymentRows($doc->id, $line->id), 'mode' => $details['delivery'] ?? 'hold', 'deliveredQty' => $line->dispatched, 'deliveredBags' => $line->bags && D::cmp($line->quantity, '0') > 0 ? D::div(D::mul($line->bags, $line->dispatched), $line->quantity) : '0', 'dispatches' => $dispatches, 'warehouse' => (string) $line->warehouse_id, 'batch' => $extra['batch'] ?? '', 'sourceLot' => $extra['sourceLot'] ?? '', 'sourceOwner' => $line->ownership, 'sourceSupplierId' => $line->ownership === 'supplier' ? ($extra['sourceSupplierId'] ?? '') : '', 'sourceSupplierName' => $parties[$extra['sourceSupplierId'] ?? '']->name ?? '', 'originPartnerId' => $extra['sourceSupplierId'] ?? '', 'sourceReceiptId' => $source ? (string) $source->id : '', 'sourceReceiptNo' => $source ? $docs[$source->document_id]->number : '', 'charges4' => $chargesByDocument[$doc->id], 'v4' => true];
                $s['sales'][] = $r;
            }
        }
        $s['lots'] = $lots->map(function ($l) use ($products, $parties, $lines, $docs) {
            $rec = $l->receipt_line_id ? $lines[$l->receipt_line_id] : null;
            $party = $parties[$l->party_id] ?? null;

            return ['id' => (string) $l->id, 'product' => $products[$l->product_id]->name, 'grade' => $l->grade, 'qty' => $l->quantity ?? '0', 'weightKnown' => $l->quantity !== null, 'bags' => $l->bags ?? '0', 'actualBags' => $l->bags, 'rawBags' => $l->stock_form === 'loose' ? $l->bags ?? '0' : '0', 'bagType' => $l->stock_form === 'packaged' ? 'finished' : 'raw', 'packageCount' => $l->stock_form === 'packaged' ? $l->bags ?? '0' : '0', 'packageViss' => $l->package_viss ?? '0', 'packType' => $l->package_type_id ? (string) $l->package_type_id : '', 'owner' => $l->owner, 'name' => $l->owner === 'owned' ? 'ပွဲရုံပိုင်' : ($party?->name ?? ''), 'partnerId' => $l->owner === 'supplier' ? (string) ($l->party_id ?? '') : '', 'buyerId' => $l->owner === 'customer' ? (string) ($l->party_id ?? '') : '', 'cost' => $l->unit_cost, 'receiptId' => $l->owner !== 'customer' && $l->receipt_line_id ? (string) $l->receipt_line_id : '', 'saleId' => $l->sale_line_id ? (string) $l->sale_line_id : '', 'warehouse' => (string) $l->warehouse_id, 'batch' => $l->batch, 'entryDate' => $l->entry_date, 'stockForm' => $l->stock_form, 'originPartnerId' => $rec ? (string) $docs[$rec->document_id]->party_id : '', 'originReceiptNo' => $rec ? $docs[$rec->document_id]->number : ''];
        })->values()->all();
        $openingEvents = $events->where('kind', 'opening')->keyBy('lot_id');
        foreach ($s['lots'] as &$lot) {
            $openingEvent = $openingEvents->get($lot['id']);
            $openingRow = $openingEvent ? (R::details($openingEvent)['openingRow'] ?? []) : [];
            if ($openingRow !== []) {
                $lot['note'] = $openingRow['note'] ?? '';
                if ($lot['owner'] === 'owned') {
                    $lot['originPartnerId'] = (string) ($openingRow['originPartnerId'] ?? '');
                    $lot['originSupplierName'] = $openingRow['originName'] ?? ($parties[$lot['originPartnerId']]->name ?? '');
                    $lot['openingCostBasis71'] = $openingRow['costBasis'] ?? 'viss';
                    $lot['openingCostPrice71'] = $openingRow['costInput'] ?? $openingRow['cost'] ?? '0';
                    $lot['openingStandardViss71'] = $openingRow['costStandardViss'] ?? '';
                }
            }
        }
        unset($lot);
        $s['transactions'] = $cashEntries->whereIn('account_id', $visible->keys())->values()->map(function ($e) use ($accounts, $docs, $parties) {
            $doc = $docs[$e->document_id];
            $title = $e->title;
            // Show the saved expense purpose for historical entries as well as new ones.
            if (in_array($doc->kind, ['expense', 'outlay'], true) && trim((string) $doc->note) !== '') {
                $title .= ' · '.$doc->note;
            }

            return ['id' => (string) $e->id, 'date' => $e->business_date, 'account' => $accounts[$e->account_id]->code, 'amount' => $e->amount, 'title' => $title, 'ref' => $doc->number, 'party' => $parties[$doc->party_id]->name ?? '', 'time' => date('H:i', strtotime($e->created_at))];
        })->all();
        $s['partnerAdvances'] = [];
        $s['supplierLoans38'] = [];
        $s['expenses'] = [];
        $s['requests'] = [];
        $s['collectionSlips'] = [];
        $s['cashIns50'] = [];
        $s['traderSettlements74'] = [];
        foreach ($docs as $doc) {
            if ($doc->status === 'reversed') {
                continue;
            }$x = R::details($doc);
            $party = $parties[$doc->party_id] ?? null;
            if (in_array($doc->kind, ['advance', 'opening_advance'], true)) {
                $s['partnerAdvances'][] = ['id' => (string) $doc->id, 'partnerId' => (string) $doc->party_id, 'date' => $doc->business_date, 'amount' => $doc->net, 'reason' => $doc->note, 'allocations' => $recoveries->where('source_document_id', $doc->id)->map(fn ($r) => ['receiptId' => (string) $r->target_document_id, 'amount' => $r->amount, 'date' => $r->business_date])->values()->all()];
            }
            if (in_array($doc->kind, ['loan', 'opening_loan'], true)) {
                $s['supplierLoans38'][] = ['id' => (string) $doc->id, 'partnerId' => (string) $doc->party_id, 'name' => $party?->name ?? '', 'date' => $doc->business_date, 'amount' => $doc->net, 'rate' => $x['rate'] ?? '0', 'openingInterest69' => $x['openingInterest'] ?? '0', 'note' => $doc->note, 'payments' => $paymentRows($doc->id)];
            }
            if (in_array($doc->kind, ['expense', 'outlay'], true)) {
                $entry = $cashEntriesByDocument->get($doc->id)?->first();
                if (! $entry || ! $visible->has($entry->account_id)) {
                    continue;
                }$s['expenses'][] = ['id' => (string) $doc->id, 'date' => $doc->business_date, 'amount' => $doc->net, 'reason' => $doc->note, 'title' => $doc->note, 'account' => $accounts[$entry->account_id]->code, 'partnerId' => (string) ($doc->party_id ?? ''), 'receiptId' => $lines->firstWhere('document_id', $doc->source_document_id)?->id, 'sourceDocumentId' => $doc->source_document_id !== null ? (string) $doc->source_document_id : null, 'recoverable' => $doc->kind === 'outlay', 'recovered' => D::cmp(D::sum($recoveries->where('source_document_id', $doc->id)->pluck('amount')), $doc->net) >= 0, 'settlementRecoveries74' => $recoveries->where('source_document_id', $doc->id)->map(fn ($r) => ['amount' => $r->amount])->values()->all(), 'paymentPending' => false];
            }
            if ($doc->kind === 'home_request') {
                $s['requests'][] = ['id' => (string) $doc->id, 'no' => $doc->number, 'date' => $doc->business_date, 'amount' => $doc->net, 'receivedAmount' => $doc->paid, 'status' => $doc->status === 'partial' ? 'issued' : $doc->status, 'collector' => $x['collector'] ?? '', 'reason' => $x['reason'] ?? '', 'receipts' => $paymentRows($doc->id)];
            }
            if ($doc->kind === 'collection_request') {
                $s['collectionSlips'][] = ['id' => (string) $doc->id, 'no' => $doc->number, 'date' => $doc->business_date, 'saleId' => (string) ($lines->firstWhere('document_id', $doc->source_document_id)?->id ?? ''), 'name' => $parties[$docs[$doc->source_document_id]->party_id]->name ?? '', 'amount' => $doc->net, 'received' => $doc->paid];
            }
            if (in_array($doc->kind, ['funding', 'cash_transfer'], true) && $actor->role === 'owner') {
                $s['cashIns50'][] = ['id' => (string) $doc->id, 'ref' => $doc->number, 'date' => $doc->business_date, 'type' => $doc->kind === 'funding' ? 'external' : 'transfer', 'source' => $accounts[$x['source'] ?? '']->code ?? null, 'destination' => $accounts[$x['destination'] ?? '']->code ?? null, 'amount' => $doc->net, 'coaId' => $x['coaId'] ?? 'COA50-CAPITAL', 'description' => $x['description'] ?? '', 'reference' => $x['reference'] ?? '', 'status' => $doc->status, 'createdAt' => $doc->created_at];
            }
            if ($doc->kind === 'settlement') {
                $charges = $chargesByDocument[$doc->id];
                $s['traderSettlements74'][] = ['id' => (string) $doc->id, 'no' => $doc->number, 'sourceKey' => json_encode([$docs[$doc->source_document_id]->number, (string) $doc->party_id], JSON_UNESCAPED_UNICODE), 'partnerId' => (string) $doc->party_id, 'saleVoucher' => $docs[$doc->source_document_id]->number, 'saleIds' => $x['saleIds'] ?? [], 'date' => $doc->business_date, 'gross' => $doc->gross, 'status' => $doc->status, 'confirmedDate' => $x['confirmedDate'] ?? $doc->business_date, 'charges' => ['mode' => 'yes', 'service' => $charges['serviceFee'], 'rate' => $charges['serviceRateValue'], 'labor' => $charges['labor'], 'others' => $charges['dynamicRows'], 'advance' => $charges['advance'], 'recoveries' => $charges['recoveryRows'] ?? [], 'loanPayments38' => $charges['loanPayments38'], 'loanTotal38' => $charges['loanTotal38']], 'payments' => array_map(fn ($p) => $p + ['no' => 'PAY-'.$p['id'], 'splits' => [['account' => $p['account'], 'amount' => $p['amount']]]], $paymentRows($doc->id)), 'changes' => [], 'serverNet' => $doc->net, 'serverPaid' => $doc->paid];
            }
            if ($doc->kind === 'opening') {
                $s['initialOpening69'] = $x;
                $s['initialOpening69']['status'] = $doc->status;
                $s['initialOpening69']['balances'] = [];
                foreach ($docs->filter(fn ($d) => in_array($d->kind, ['opening_payable', 'opening_receivable', 'opening_deposit'], true)) as $balance) {
                    $s['initialOpening69']['balances'][] = ['id' => (string) $balance->id, 'partnerId' => (string) $balance->party_id, 'type' => substr($balance->kind, 8), 'amount' => $balance->net, 'date' => $balance->business_date, 'payments' => $paymentRows($balance->id)];
                }
            }
        }
        $s['moves'] = [];
        $s['packagingTransactions'] = [];
        $s['transfers'] = [];
        $s['adjustments'] = [];
        $s['stockOpening'] = [];
        foreach ($events as $e) {
            $lot = $lots[$e->lot_id];
            $doc = $docs[$e->document_id] ?? null;
            $x = R::details($e);
            $p = $products[$lot->product_id];
            $base = ['id' => (string) $e->id, 'date' => $e->business_date, 'recordedAt' => $e->created_at, 'product' => $p->name, 'grade' => $lot->grade, 'qty' => $e->quantity ?? '0', 'bags' => $e->bags, 'batch' => $lot->batch, 'warehouse' => (string) $lot->warehouse_id, 'owner' => $lot->owner, 'sourceLot' => (string) $lot->id];
            if (in_array($e->kind, ['receive', 'dispatch', 'receipt_correction'], true)) {
                $s['moves'][] = $base + ['direction' => $e->kind === 'dispatch' ? 'out' : 'in', 'ref' => $doc?->number ?? '', 'kind' => $e->kind, 'weightKnown' => $e->quantity !== null];
            }
            if ($e->kind === 'pack') {
                $receiptId = $x['receiptLine'] ?? $lot->receipt_line_id;
                $receiptLine = $lines[$receiptId] ?? null;
                $receiptDoc = $receiptLine ? ($docs[$receiptLine->document_id] ?? null) : null;
                $receiptDetails = $receiptLine ? R::details($receiptLine) : [];
                $warehouseId = $x['warehouse'] ?? $lot->warehouse_id;
                $owner = $x['owner'] ?? '';
                $party = $parties[$x['party'] ?? ''] ?? null;
                $trader = $parties[$receiptDoc?->party_id ?? ''] ?? null;
                $bagType = $receiptDetails['bagType'] ?? '';
                $history = $x + [
                    'schema' => 1, 'product' => $p->name, 'grade' => $lot->grade,
                    'ownerName' => $owner === 'owned' ? 'ပွဲရုံပိုင်' : ($party?->name ?? ''),
                    'originalTraderName' => $trader?->name ?? '',
                    'outputLotId' => (string) $e->destination_lot_id, 'sourceLotId' => (string) $lot->id,
                    'warehouseId' => (string) $warehouseId, 'warehouseName' => $warehouses[$warehouseId]->name ?? '',
                    'sourceReceiptId' => (string) ($receiptId ?? ''), 'sourceReceiptNo' => $receiptDoc?->number ?? '',
                    'sourceBatch' => $lot->batch, 'sourceBagType' => $bagType,
                    'originalRawBags' => $bagType === 'raw' ? $receiptLine?->bags : null,
                    'packedQty' => $e->quantity, 'bagCount' => $e->bags,
                    'packageViss' => $lots[$e->destination_lot_id]->package_viss,
                    'recordedAt' => $e->created_at,
                ];
                $s['packagingTransactions'][] = array_replace($base, ['owner' => $owner, 'bagCount' => $e->bags, 'packageViss' => $history['packageViss'], 'type' => 'pack', 'packName' => $x['packName'] ?? '', 'sourceReceiptId' => (string) ($receiptId ?? ''), 'history2' => $history]);
            }
            if ($e->kind === 'transfer') {
                $s['transfers'][] = $base + ['from' => (string) $lot->warehouse_id, 'to' => (string) $lots[$e->destination_lot_id]->warehouse_id, 'weightKnown' => $e->quantity !== null, 'name' => $parties[$lot->party_id]->name ?? 'ပွဲရုံပိုင်', 'history2' => $x + ['schema' => 1, 'sourceLotId' => (string) $lot->id, 'destinationLotId' => (string) $e->destination_lot_id, 'recordedAt' => $e->created_at, 'qtyMoved' => $e->quantity, 'bagsMoved' => $e->bags]];
            }
            if ($e->kind === 'adjust') {
                $adjust = $base;
                $adjust['qty'] = ltrim((string) ($e->quantity ?? '0'), '-');
                $s['adjustments'][] = $adjust + ['direction' => D::cmp($e->quantity ?? '0', '0') < 0 ? 'out' : 'in', 'note' => $doc?->note ?? '', 'lotId' => (string) $lot->id, 'sourceReceiptId' => (string) ($lot->receipt_line_id ?? ''), 'receiptQtyIncluded2' => (bool) ($x['weighedUnknown'] ?? false), 'history2' => $x + ['schema' => 1, 'owner' => $x['owner'] ?? $lot->owner, 'qtyDelta' => $e->quantity, 'sourceReceiptId' => (string) ($lot->receipt_line_id ?? ''), 'recordedAt' => $e->created_at]];
            }
            if (in_array($e->kind, ['opening', 'opening_reversal'], true)) {
                $s['stockOpening'][] = ['key' => $p->name.'|'.$lot->grade, 'product' => $p->name, 'grade' => $lot->grade, 'qty' => $e->quantity, 'bags' => $e->bags, 'date' => $e->business_date];
            }
        }
        $s['groundHistory64'] = DB::table('stock_checks')->get()->map(function ($g) use ($lots, $products, $warehouses) {
            $l = $lots[$g->lot_id];

            return ['id' => (string) $g->id, 'groundSchema2' => 2, 'date' => $g->business_date, 'recordedAt' => $g->created_at, 'lotId' => (string) $g->lot_id, 'product' => $products[$l->product_id]->name, 'warehouse' => (string) $l->warehouse_id, 'warehouseName' => $warehouses[$l->warehouse_id]->name, 'owner' => $l->owner, 'batch' => $l->batch, 'qty' => $g->actual_quantity, 'expectedQty' => $g->expected_quantity, 'bags' => $g->actual_bags, 'expectedBags' => $g->expected_bags, 'difference' => $g->actual_quantity !== null && $g->expected_quantity !== null ? D::sub($g->actual_quantity, $g->expected_quantity) : null, 'status' => $g->status, 'note' => $g->reason, 'rejectionReason' => $g->decision_note, 'sourceSignature2' => $g->fingerprint];
        })->all();
        $s['masters']['changes'] = DB::table('audit_logs')->where('action', 'master.change')->orderByDesc('id')->limit(500)->get()->map(function ($r) {
            $x = json_decode($r->details, true);

            return ['id' => (string) $r->id, 'date' => $r->business_date, 'time' => $r->created_at] + $x;
        })->filter(fn ($r) => $actor->role === 'owner' || $r['type'] !== 'account')->values()->all();
        $s['activity'] = DB::table('audit_logs')->orderByDesc('id')->limit(100)->get()->map(fn ($a) => ['id' => (string) $a->id, 'date' => $a->business_date, 'text' => $a->action, 'time' => date('H:i', strtotime($a->created_at))])->all();
        $visibleCodes = $visible->pluck('code')->all();
        $maskClosing = function (?array $closing) use ($visibleCodes): ?array {
            if ($closing === null) {
                return null;
            }
            if (isset($closing['summary53']['accounts'])) {
                $closing['summary53']['accounts'] = array_values(array_filter($closing['summary53']['accounts'], fn ($a) => in_array($a['id'], $visibleCodes, true)));
            }
            if (! in_array('cash', $visibleCodes, true)) {
                foreach (['actualBefore', 'expectedBefore', 'transfer', 'actualAfter', 'expectedAfter', 'difference'] as $key) {
                    unset($closing[$key],$closing['summary53'][$key]);
                }unset($closing['summary53']['cashBefore'],$closing['summary53']['cashAfter'],$closing['summary53']['opening']);
            }

            return $closing;
        };
        $s['closing'] = $maskClosing($s['closing']);
        $s['days'] = DB::table('business_days')->where('status', 'closed')->get()->map(fn ($d) => ['date' => $d->business_date, 'closing' => $maskClosing(json_decode($d->closing, true))])->all();
        $s['prices'] = [];
        foreach (DB::table('daily_prices')->where('business_date', $s['day'])->get() as $p) {
            $s['prices'][$products[$p->product_id]->name.'|'.$p->grade] = $p->price;
        }
        $s['priceDate'] = $s['prices'] ? $s['day'] : null;
        $s['masters']['notes'] = DB::table('business_settings')->where('key', 'like', 'note:%')->get()->map(fn ($n) => ['id' => $n->key] + json_decode($n->value, true))->all();
        // Opening draft may contain hidden account amounts. Remove them at the server boundary.
        if (isset($s['initialOpening69']['accounts'])) {
            $s['initialOpening69']['accounts'] = array_intersect_key($s['initialOpening69']['accounts'], $visible->mapWithKeys(fn ($a) => [$a->code => true])->all());
        }
        if ($actor->role !== 'owner') {
            unset($s['initialOpening69']['posted']);
        }

        return $s;
    }

    private function sourceCharges(object $doc, Collection $recoveries, Collection $loanPayments): array
    {
        $charges = R::details($doc)['charges'] ?? [];
        $advance = D::sum($recoveries->whereIn('kind', ['advance', 'opening_advance'])->pluck('amount'));
        $outlay = $recoveries->where('kind', 'outlay');
        $loanTotal = D::sum($loanPayments->pluck('amount'));
        $items = $charges['items'] ?? [];
        $service = '0';
        $labor = '0';
        $rate = '0';
        $manual = [];
        foreach ($items as $i) {
            if (($i['mode'] ?? '') === 'service_percent') {
                $service = D::add($service, $i['amount']);
                $rate = $i['rate'];
            } elseif (($i['mode'] ?? '') === 'labor') {
                $labor = D::add($labor, $i['amount']);
            } else {
                $manual[] = $i + ['name' => $i['label']];
            }
        }

        return ['gross' => $doc->gross, 'serviceFee' => $service, 'serviceFeeTaken58' => D::cmp($service, '0') > 0, 'serviceRateValue' => $rate, 'labor' => $labor, 'truck' => '0', 'clean' => '0', 'plastic' => '0', 'sack' => '0', 'advance' => $advance, 'carriage' => D::sum($outlay->pluck('amount')), 'recoveryRows' => $outlay->map(fn ($r) => ['amount' => $r->amount, 'name' => 'ယခင်စိုက်ထုတ်ငွေ'])->values()->all(), 'loanTotal38' => $loanTotal, 'loanPayments38' => $loanPayments->map(fn ($p) => ['loanId' => (string) $p->document_id, 'principal' => $p->principal, 'interest' => $p->interest])->all(), 'dynamicRows' => $manual, 'total' => D::sub($charges['deductionTotal'] ?? '0', $charges['additionTotal'] ?? '0'), 'chargeTreatment67' => $doc->kind === 'sale' ? 'add' : 'subtract', 'purchaseAdjustments2' => ['schema' => 1, 'additionRows' => array_values(array_filter($items, fn ($i) => $i['direction'] === 'add')), 'additionTotal' => $charges['additionTotal'] ?? '0', 'deductionTotal' => $charges['deductionTotal'] ?? '0']];
    }
}
