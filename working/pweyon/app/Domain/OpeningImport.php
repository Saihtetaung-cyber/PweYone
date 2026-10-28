<?php

namespace App\Domain;

use App\Models\User;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/** Opening Excel import: validate everything before merging a draft; approval remains an independent owner action. */
final class OpeningImport
{
    public function context(User $actor): array
    {
        abort_unless($actor->active, 403);

        return [
            'accounts' => DB::table('cash_accounts')->where('active', true)->when($actor->role !== 'owner', fn ($q) => $q->where('staff_can_view', true))->orderBy('id')->get(),
            'products' => DB::table('products')->where('active', true)->orderBy('id')->get(),
            'partners' => DB::table('partners')->where('active', true)->orderBy('id')->get(),
            'warehouses' => DB::table('warehouses')->where('active', true)->orderBy('id')->get(),
            'policies' => DB::table('loan_interest_policies')->where('active', true)->orderBy('id')->get(),
        ];
    }

    public function lists(User $actor): array
    {
        $c = $this->context($actor);

        return [
            'A' => $c['accounts']->pluck('name')->all(),
            'B' => $c['partners']->map(fn ($p) => $this->partyLabel($p))->all(),
            'C' => $c['products']->pluck('name')->all(),
            'D' => $c['products']->flatMap(fn ($p) => json_decode($p->grades, true))->unique()->values()->all(),
            'E' => $c['warehouses']->pluck('name')->all(),
            'F' => ['ပွဲရုံပိုင်', 'ကုန်သည်ပိုင်', 'ဝယ်သူပိုင်'],
            'G' => $actor->role === 'owner' ? ['ကုန်သည်ကို ပေးရန်', 'ကြိုသုံးငွေ', 'ကြိုထုတ်ငွေအရင်း', 'ဝယ်သူထံမှ ရရန်', 'ဝယ်သူ ကြိုပေးထားငွေ'] : ['ကုန်သည်ကို ပေးရန်', 'ကြိုသုံးငွေ', 'ဝယ်သူထံမှ ရရန်', 'ဝယ်သူ ကြိုပေးထားငွေ'],
            'H' => ['ကုန်သည်', 'ဝယ်သူ'], 'I' => ['တစ်ပိဿာဈေး', 'တစ်စံအိတ်ဈေး'],
            'J' => $c['partners']->where('kind', 'supplier')->map(fn ($p) => $this->partyLabel($p))->values()->all(),
            'K' => $c['policies']->map(fn ($p) => (string) (float) $p->monthly_rate)->unique()->values()->all(),
        ];
    }

    private function partyLabel(object $party): string
    {
        return $party->name.($party->locality ? ' ('.$party->locality.')' : '');
    }

    private function normalize(string $value): string
    {
        return mb_strtolower(trim(preg_replace('/[\x{200B}-\x{200D}\x{FEFF}]/u', '', $value)));
    }

    private function match(Collection $rows, string $value, bool $party = false): object
    {
        $hits = $rows->filter(fn ($row) => $this->normalize($value) === $this->normalize($row->name) || ($party && $this->normalize($value) === $this->normalize($this->partyLabel($row))));
        Records::require($hits->count() === 1, '“'.$value.'” အမည် မတွေ့ပါ သို့မဟုတ် အမည်တူ ရှိပါသည်။ သတ်မှတ်ချက်တွင် ထည့်ပြီး နမူနာဖိုင်ကို ပြန် Download လုပ်ပါ။');

        return $hits->first();
    }

    private function number(string $value, int $scale = 2, bool $integer = false, bool $positive = false): string
    {
        $value = strtr($value, array_combine(preg_split('//u', '၀၁၂၃၄၅၆၇၈၉', -1, PREG_SPLIT_NO_EMPTY), range(0, 9)));
        if (str_contains($value, ',')) {
            Records::require((bool) preg_match('/^\d{1,3}(?:,\d{3})+(?:\.\d+)?$/D', $value), 'ငွေပမာဏ comma format မမှန်ကန်ပါ။');
            $value = str_replace(',', '', $value);
        }
        if (preg_match('/^(\d+)(?:\.(\d+))?[eE]([+-]?\d{1,2})$/D', $value, $parts)) {
            $digits = $parts[1].($parts[2] ?? '');
            $position = strlen($parts[1]) + (int) $parts[3];
            Records::require(abs((int) $parts[3]) <= 20, 'ပမာဏ ကြီးလွန်းပါသည်။');
            $value = $position <= 0 ? '0.'.str_repeat('0', -$position).$digits : ($position >= strlen($digits) ? $digits.str_repeat('0', $position - strlen($digits)) : substr($digits, 0, $position).'.'.substr($digits, $position));
        }
        // Excel numeric cells may carry harmless trailing zero precision.
        if (str_contains($value, '.')) {
            $value = rtrim(rtrim($value, '0'), '.');
        }
        $decimal = Decimal::value($value, $scale);
        Records::require(! $integer || Decimal::cmp($decimal, bcadd($decimal, '0', 0)) === 0, 'ကျပ်ငွေနှင့် အိတ်အရေအတွက်ကို ကိန်းပြည့်ဖြင့် ဖြည့်ပါ။');
        Records::require(! $positive || Decimal::cmp($decimal, '0') > 0, 'ပမာဏသည် သုညထက် ကြီးရပါမည်။');

        return $integer ? bcadd($decimal, '0', 0) : $decimal;
    }

    private function text(string $value, int $limit = 300): string
    {
        Records::require(mb_strlen($value) <= $limit && ! preg_match('/[<>\x00-\x08]/u', $value), 'စာသားတွင် မမှန်ကန်သော အက္ခရာ ရှိပါသည် သို့မဟုတ် ရှည်လွန်းပါသည်။');

        return $value;
    }

    private function fingerprint(User $actor, array $context): string
    {
        $draft = DB::table('documents')->where('kind', 'opening')->first();
        Records::require(! $draft || $draft->status === 'draft', 'စတင်လက်ကျန် အတည်ပြုပြီးဖြစ်၍ Import မလုပ်နိုင်ပါ။');
        Records::require(! $draft || ! isset(Records::details($draft)['pendingStock']), 'ဖြည့်နေသော ကုန်လိုင်းကို အရင်သိမ်းပါ သို့မဟုတ် ဖယ်ပါ။');

        return hash('sha256', json_encode([$actor->id, $actor->role, $draft?->id, $draft?->details, $context], JSON_THROW_ON_ERROR));
    }

    private function stockKey(array $row, string $kind, string $partyId, array $context): string
    {
        $productId = $row['productId'] ?? $context['products']->firstWhere('name', $row['product'] ?? '')?->id ?? $row['product'] ?? '';

        return 'stock:'.hash('sha256', json_encode([$kind, $partyId, (string) $productId, $row['grade'] ?? '', (string) ($row['warehouse'] ?? ''), $this->normalize($row['batch'] ?? '')], JSON_THROW_ON_ERROR));
    }

    public function preview(User $actor, string $path, string $filename): array
    {
        return DB::transaction(function () use ($actor, $path, $filename) {
            $context = $this->context($actor);
            $fingerprint = $this->fingerprint($actor, $context);
            $sheets = app(OpeningWorkbook::class)->read($path);
            Records::require(array_sum(array_map('count', $sheets)) <= 3000, 'တစ်ကြိမ်လျှင် စုစုပေါင်း အတန်း ၃,၀၀၀ အထိသာ Import လုပ်ပါ။');
            $data = ['accounts' => [], 'stock' => [], 'balances' => []];
            $seen = [];
            $document = DB::table('documents')->where('kind', 'opening')->first();
            $stored = $document ? Records::details($document) : [];
            foreach ($stored['own']['rows'] ?? [] as $row) {
                $seen[$this->stockKey($row, 'owned', '', $context)] = true;
            }
            foreach ($stored['parties'] ?? [] as $id => $party) {
                foreach ($party['rows'] ?? [] as $row) {
                    $kind = $context['partners']->firstWhere('id', $id)?->kind ?? $row['kind'] ?? 'supplier';
                    $seen[$this->stockKey($row, $kind, (string) $id, $context)] = true;
                }
            }
            $errors = [];
            foreach ($sheets as $sheet => $rows) {
                foreach ($rows as $row => $cells) {
                    try {
                        if ($sheet === 'ငွေလက်ကျန်') {
                            $account = $this->match($context['accounts'], $cells[0]);
                            Records::require(! isset($seen['account:'.$account->id]), 'ငွေသိမ်းရာတစ်ခုကို တစ်ကြောင်းသာ ဖြည့်ပါ။');
                            $seen['account:'.$account->id] = true;
                            $data['accounts'][] = ['code' => $account->code, 'name' => $account->name, 'amount' => $this->number($cells[1], integer: true), 'row' => $row];
                        } elseif ($sheet === 'ကုန်လက်ကျန်') {
                            $stock = $this->stock($cells, $row, $context);
                            $key = $this->stockKey($stock, $stock['kind'], $stock['partyId'], $context);
                            Records::require(! isset($seen[$key]), 'ပိုင်ရှင်၊ ကုန်၊ အဆင့်၊ ဂိုဒေါင်နှင့် အသုတ်တူ ကုန်လိုင်း ရှိပြီးဖြစ်ပါသည်။ ရှိပြီးသားလိုင်းကို ပြင်ပါ သို့မဟုတ် အသုတ်ခွဲပါ။');
                            $seen[$key] = true;
                            $data['stock'][] = $stock;
                        } else {
                            $balance = $this->balance($actor, $cells, $row, $context);
                            $key = 'balance:'.$balance['partyId'].':'.$balance['type'];
                            Records::require(! isset($seen[$key]), 'လူတစ်ဦး၏ ငွေကျန်အမျိုးအစားတစ်ခုကို တစ်ကြောင်းသာ ဖြည့်ပါ။');
                            $seen[$key] = true;
                            $data['balances'][] = $balance;
                        }
                    } catch (ValidationException $e) {
                        $errors[$sheet.' · အတန်း '.$row] = array_merge(...array_values($e->errors()));
                        if (count($errors) >= 100) {
                            throw ValidationException::withMessages($errors);
                        }
                    }
                }
            }
            if ($errors !== []) {
                throw ValidationException::withMessages($errors);
            }
            Records::require(array_sum(array_map('count', $data)) > 0, 'Excel ဖိုင်တွင် အကြောင်း ၆ မှစ၍ အချက်အလက် ဖြည့်ပါ။ အလွတ်နမူနာဖိုင် ဖြစ်နေပါသည်။');
            $payload = ['actor' => $actor->id, 'role' => $actor->role, 'expires' => now()->addMinutes(30)->timestamp, 'fingerprint' => $fingerprint, 'digest' => hash_file('sha256', $path), 'data' => $data, 'filename' => mb_substr(basename($filename), 0, 180)];

            return ['token' => Crypt::encryptString(json_encode($payload, JSON_THROW_ON_ERROR)), 'data' => $data, 'counts' => array_map('count', $data)];
        });
    }

    private function stock(array $cells, int $row, array $context): array
    {
        [$ownership, $ownerName, $productName, $grade, $warehouseName, $batch, $qty, $bags, $basisName, $cost, $standard, $origin, $note] = $cells;
        $kind = ['ပွဲရုံပိုင်' => 'owned', 'ကုန်သည်ပိုင်' => 'supplier', 'ဝယ်သူပိုင်' => 'buyer'][$ownership] ?? null;
        Records::require($kind !== null, 'ပိုင်ဆိုင်မှုကို ပွဲရုံပိုင် / ကုန်သည်ပိုင် / ဝယ်သူပိုင် ရွေးပါ။');
        $party = $kind === 'owned' ? null : $this->match($context['partners']->where('kind', $kind), $ownerName, true);
        Records::require($kind !== 'owned' || $ownerName === '' || $ownerName === 'ပွဲရုံပိုင်', 'ပွဲရုံပိုင်ကုန်တွင် ကုန်ပိုင်ရှင်ကို အလွတ်ထားပါ သို့မဟုတ် ပွဲရုံပိုင်ဟု ဖြည့်ပါ။');
        $product = $this->match($context['products'], $productName);
        Records::require(in_array($grade, json_decode($product->grades, true), true), '“'.$productName.'” အတွက် အဆင့် မမှန်ကန်ပါ။');
        $warehouse = $this->match($context['warehouses'], $warehouseName);
        $basis = 'viss';
        $price = '0';
        $perViss = '0';
        $standardViss = '';
        $originParty = null;
        if ($kind === 'owned') {
            $basis = ['တစ်ပိဿာဈေး' => 'viss', 'တစ်စံအိတ်ဈေး' => 'bag'][$basisName] ?? null;
            Records::require($basis !== null, 'ပွဲရုံပိုင်ကုန်အတွက် ဈေးတွက်ပုံကို ရွေးပါ။');
            $price = $this->number($cost, integer: true, positive: true);
            $standardViss = $standard !== '' ? $this->number($standard, positive: true) : '';
            Records::require($basis !== 'bag' || $standardViss !== '', 'တစ်စံအိတ်ဈေးအတွက် စံအိတ်ဝင်ပိဿာ ဖြည့်ပါ။');
            $perViss = $basis === 'bag' ? Decimal::div($price, $standardViss) : $price;
            $originParty = $origin !== '' ? $this->match($context['partners']->where('kind', 'supplier'), $origin, true) : null;
        } else {
            Records::require($basisName.$cost.$standard.$origin === '', 'သူများပိုင်ကုန်အတွက် ဝယ်ရင်းနှုန်းနှင့် မူရင်းကုန်သည် အကွက်များကို အလွတ်ထားပါ။');
        }

        return ['id' => (string) Str::uuid(), 'kind' => $kind, 'ownership' => $ownership, 'originName' => $originParty ? $this->partyLabel($originParty) : '', 'partyId' => $party ? (string) $party->id : '', 'partyName' => $party ? $this->partyLabel($party) : 'ပွဲရုံပိုင်', 'productId' => (string) $product->id, 'product' => $product->name, 'grade' => $grade, 'warehouse' => (string) $warehouse->id, 'warehouseName' => $warehouse->name, 'batch' => $this->text($batch !== '' ? $batch : 'စတင်-Excel-'.$row, 60), 'qty' => $this->number($qty, positive: true), 'bags' => $bags !== '' ? $this->number($bags, integer: true) : '', 'costBasis' => $basis, 'costProduct71' => (string) $product->id, 'costInput' => $price, 'costStandardViss' => $standardViss, 'cost' => $perViss, 'originPartnerId' => $originParty ? (string) $originParty->id : '', 'note' => $this->text($note), 'row' => $row];
    }

    private function balance(User $actor, array $cells, int $row, array $context): array
    {
        [$person, $name, $typeName, $amount, $rate, $interest] = $cells;
        $kind = ['ကုန်သည်' => 'supplier', 'ဝယ်သူ' => 'buyer'][$person] ?? null;
        Records::require($kind !== null, 'လူအမျိုးအစားကို ကုန်သည် / ဝယ်သူ ရွေးပါ။');
        $party = $this->match($context['partners']->where('kind', $kind), $name, true);
        $type = ['ကုန်သည်ကို ပေးရန်' => 'payable', 'ကြိုသုံးငွေ' => 'advance', 'ကြိုထုတ်ငွေအရင်း' => 'loan', 'ကြိုထုတ်ငွေ' => 'loan', 'ဝယ်သူထံမှ ရရန်' => 'receivable', 'ဝယ်သူ ကြိုပေးထားငွေ' => 'deposit'][$typeName] ?? null;
        Records::require(in_array($type, $kind === 'supplier' ? ['payable', 'advance', 'loan'] : ['receivable', 'deposit'], true), 'ဤလူအမျိုးအစားနှင့် ငွေကျန်အမျိုးအစား မကိုက်ညီပါ။');
        Records::require($type !== 'loan' || $actor->role === 'owner', 'ကြိုထုတ်ငွေကို ပိုင်ရှင်ဘက်မှသာ Import လုပ်နိုင်ပါသည်။');
        $loanRate = $type === 'loan' ? $this->number($rate, 8) : '';
        Records::require($type !== 'loan' || Decimal::cmp($loanRate, '100') <= 0, 'အတိုးနှုန်းသည် 0% မှ 100% အတွင်း ဖြစ်ရပါမည်။');
        Records::require($type === 'loan' || $rate.$interest === '', 'ကြိုထုတ်ငွေ မဟုတ်လျှင် အတိုးနှုန်းနှင့် အတိုးကျန်ကို အလွတ်ထားပါ။');

        return ['partyId' => (string) $party->id, 'partyName' => $this->partyLabel($party), 'kind' => $kind, 'type' => $type, 'typeName' => $typeName, 'amount' => $this->number($amount, integer: true, positive: true), 'loanRate' => $loanRate, 'loanInterest' => $type === 'loan' ? $this->number($interest, integer: true) : '', 'row' => $row];
    }

    /** Called only inside BusinessService's workspace mutex/transaction and idempotency receipt. */
    public function apply(User $actor, string $token, string $date): array
    {
        try {
            $payload = json_decode(Crypt::decryptString($token), true, 512, JSON_THROW_ON_ERROR);
        } catch (DecryptException|\JsonException) {
            throw ValidationException::withMessages(['file' => 'Import အချက်အလက် မမှန်ကန်ပါ။ Excel ဖိုင်ကို ပြန်စစ်ပါ။']);
        }
        abort_unless($payload['actor'] === $actor->id && $payload['role'] === $actor->role, 403);
        Records::require($payload['expires'] >= now()->timestamp, 'စစ်ဆေးထားသည်မှာ မိနစ် ၃၀ ကျော်သွားပါသည်။ Excel ဖိုင်ကို ပြန်စစ်ပါ။');
        Records::require(hash_equals($payload['fingerprint'], $this->fingerprint($actor, $this->context($actor))), 'မူကြမ်း သို့မဟုတ် သတ်မှတ်ချက် ပြောင်းလဲသွားပါသည်။ Excel ဖိုင်ကို ပြန်စစ်ပါ။');
        $doc = DB::table('documents')->where('kind', 'opening')->first();
        $draft = $doc ? Records::details($doc) : ['schema' => 1, 'status' => 'draft', 'startDate' => $date, 'accounts' => [], 'own' => ['stock' => null, 'rows' => [], 'checked' => false], 'parties' => [], 'groups' => ['supplier' => false, 'buyer' => false], 'balances' => [], 'dispatches' => [], 'revisions' => []];
        foreach ($draft['imports'] ?? [] as $import) {
            Records::require($import['digest'] !== $payload['digest'], 'ဤ Excel ဖိုင်ကို မူကြမ်းထဲ ထည့်ပြီးဖြစ်ပါသည်။ ထပ်ထည့်မထားပါ။');
        }
        foreach (DB::table('cash_accounts')->get() as $account) {
            $draft['accounts'][$account->code] ??= ['amount' => $account->opening_balance, 'checked' => false];
        }
        foreach ($payload['data']['accounts'] as $account) {
            $draft['accounts'][$account['code']] = ['amount' => $account['amount'], 'checked' => false];
        }
        foreach (array_merge($payload['data']['stock'], $payload['data']['balances']) as $row) {
            if ($row['kind'] !== 'owned') {
                $draft['parties'][$row['partyId']] ??= ['answers' => ['stock' => null], 'rows' => [], 'values' => ['payable' => '', 'advance' => '', 'loan' => '', 'loanInterest' => '', 'loanRate' => '3', 'receivable' => '', 'deposit' => ''], 'checked' => false];
                $draft['parties'][$row['partyId']]['checked'] = false;
                $draft['groups'][$row['kind']] = false;
            }
        }
        foreach ($payload['data']['stock'] as $row) {
            if ($row['kind'] === 'owned') {
                $draft['own']['rows'][] = $row;
                $draft['own']['stock'] = 'yes';
                $draft['own']['checked'] = false;
            } else {
                $draft['parties'][$row['partyId']]['rows'][] = $row;
                $draft['parties'][$row['partyId']]['answers']['stock'] = 'yes';
            }
        }
        foreach ($payload['data']['balances'] as $row) {
            $draft['parties'][$row['partyId']]['answers'][$row['type']] = 'yes';
            $draft['parties'][$row['partyId']]['values'][$row['type']] = $row['amount'];
            if ($row['type'] === 'loan') {
                $draft['parties'][$row['partyId']]['values']['loanRate'] = $row['loanRate'];
                $draft['parties'][$row['partyId']]['values']['loanInterest'] = $row['loanInterest'];
            }
        }
        $draft['imports'][] = ['digest' => $payload['digest'], 'filename' => $payload['filename'], 'at' => now()->toIso8601String(), 'actorId' => (string) $actor->id, 'counts' => array_map('count', $payload['data'])];
        $draft['status'] = 'draft';

        return $draft;
    }
}
