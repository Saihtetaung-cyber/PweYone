<?php

namespace App\Domain;

use App\Domain\Decimal as D;
use App\Domain\Records as R;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final class Reports
{
    public function adjustments(User $actor, string $from, string $to, array $filters = []): array
    {
        abort_unless($actor->active, 403);

        return DB::transaction(function () use ($from, $to, $filters): array {
            $documents = DB::table('documents as d')->leftJoin('partners as p', 'p.id', '=', 'd.party_id')
                ->whereIn('d.kind', ['purchase', 'sale', 'settlement'])->where('d.status', '!=', 'reversed')
                ->where(fn ($query) => $query->where('d.kind', '!=', 'settlement')->orWhere('d.status', 'confirmed'))
                ->select('d.*', 'p.name as party_name', 'p.locality as party_locality')->orderByDesc('d.business_date')->orderByDesc('d.id')->get();
            $lines = DB::table('document_lines')->whereIn('document_id', $documents->pluck('id'))->orderBy('id')->get()->groupBy('document_id');
            $categories = ['labor' => 'လုပ်သားခ', 'service' => 'ဝန်ဆောင်ခ', 'other' => 'အခြားပေါင်းနုတ်ငွေ'];
            $rows = [];
            foreach ($documents as $document) {
                $details = R::details($document);
                $date = $document->kind === 'settlement' ? ($details['confirmedDate'] ?? $document->business_date) : $document->business_date;
                $party = trim(($document->party_name ?? '').($document->party_locality ? ' ('.$document->party_locality.')' : ''));
                $line = $lines->get($document->id)?->first();
                foreach ($details['charges']['items'] ?? [] as $index => $item) {
                    $amount = D::money((string) $item['amount']);
                    if (D::cmp($amount, '0') <= 0 || ! in_array($item['direction'] ?? '', ['add', 'subtract'], true)) {
                        continue;
                    }
                    $category = match ($item['mode'] ?? '') {
                        'labor' => 'labor', 'service_percent' => 'service', default => 'other',
                    };
                    $label = $item['label'] ?? $categories[$category];
                    $categoryKey = $category === 'other' ? 'other:'.$label : $category;
                    $categories[$categoryKey] = $category === 'other' ? $label : $categories[$category];
                    if ($date < $from || $date > $to
                        || ! empty($filters['source_kind']) && $filters['source_kind'] !== $document->kind
                        || ! empty($filters['direction']) && $filters['direction'] !== $item['direction']
                        || ! empty($filters['category']) && ! in_array($filters['category'], [$category, $categoryKey], true)
                        || trim($filters['q'] ?? '') !== '' && mb_stripos($party.' '.$document->number, trim($filters['q'])) === false) {
                        continue;
                    }
                    $rows[] = [
                        'id' => $document->id.'-'.$index, 'documentId' => (string) $document->id, 'voucher' => $document->number,
                        'date' => $date, 'recordedAt' => $document->created_at, 'party' => $party, 'kind' => $document->kind,
                        'direction' => $item['direction'], 'category' => $category, 'categoryKey' => $categoryKey, 'label' => $label,
                        'rate' => ($item['mode'] ?? '') === 'service_percent' ? (string) ($item['rate'] ?? '0') : null,
                        'amount' => $amount, 'signedAmount' => $item['direction'] === 'add' ? $amount : D::money(D::sub('0', $amount)),
                        'linkId' => $document->kind === 'settlement' ? (string) $document->id : ($document->kind === 'purchase' ? (isset($line->source_line_id) ? (string) $line->source_line_id : null) : (isset($line->id) ? (string) $line->id : null)),
                    ];
                }
            }
            usort($rows, fn ($a, $b) => strcmp($b['date'], $a['date']) ?: ((int) $b['documentId'] <=> (int) $a['documentId']));
            $additions = D::money(D::sum(array_column(array_filter($rows, fn ($row) => $row['direction'] === 'add'), 'amount')));
            $deductions = D::money(D::sum(array_column(array_filter($rows, fn ($row) => $row['direction'] === 'subtract'), 'amount')));

            return [
                'from' => $from, 'to' => $to, 'rows' => $rows, 'count' => count($rows),
                'categories' => collect($categories)->map(fn ($label, $id) => ['id' => $id, 'label' => $label])->values()->all(),
                'totals' => ['additions' => $additions, 'deductions' => $deductions, 'net' => D::money(D::sub($additions, $deductions))],
            ];
        });
    }

    public function overview(User $actor, string $from, string $to): array
    {
        abort_unless($actor->role === 'owner' && $actor->active, 403);

        return DB::transaction(function () use ($from, $to) {
            $docs = DB::table('documents')->whereBetween('business_date', [$from, $to])->where('status', '!=', 'reversed')->get();
            $lots = DB::table('stock_lots')->get();

            return ['from' => $from, 'to' => $to, 'purchaseGross' => D::money(D::sum($docs->where('kind', 'purchase')->pluck('gross'))), 'saleNet' => D::money(D::sum($docs->where('kind', 'sale')->pluck('net'))), 'expenses' => D::money(D::sum($docs->whereIn('kind', ['expense', 'outlay'])->pluck('net'))), 'currentLoose' => D::sum($lots->where('stock_form', 'loose')->pluck('quantity')->filter(fn ($q) => $q !== null)), 'currentPackaged' => D::sum($lots->where('stock_form', 'packaged')->pluck('quantity')->filter(fn ($q) => $q !== null)), 'currentTotal' => D::sum($lots->pluck('quantity')->filter(fn ($q) => $q !== null)), 'unknownLots' => $lots->whereNull('quantity')->count()];
        });
    }

    public function profit(User $actor, string $from, string $to): array
    {
        abort_unless($actor->role === 'owner' && $actor->active, 403);

        return DB::transaction(function () use ($from, $to) {
            $docs = DB::table('documents')->whereBetween('business_date', [$from, $to])->where('status', '!=', 'reversed')->get()->keyBy('id');
            $saleLines = DB::table('document_lines')->whereIn('document_id', $docs->where('kind', 'sale')->keys())->get();
            $supplierGross = $saleLines->where('ownership', 'supplier')->groupBy('document_id')
                ->map(fn ($lines) => D::sum($lines->pluck('gross')));
            $out = ['ownedRevenue' => '0', 'supplierGross' => '0', 'serviceRevenue' => '0', 'cogs' => '0', 'operatingExpenses' => '0', 'unclassified' => '0', 'fundingTotal' => '0', 'recoveriesExcluded' => '0', 'loanInterestExcluded' => '0', 'unknownCosts' => 0];
            foreach ($saleLines as $line) {
                if ($line->ownership === 'owned') {
                    $out['ownedRevenue'] = D::add($out['ownedRevenue'], $line->gross);
                    $cost = D::mul($line->quantity, R::details($line)['unitCost'] ?? '0');
                    $out['cogs'] = D::add($out['cogs'], $cost);
                    if (D::cmp($cost, '0') === 0) {
                        $out['unknownCosts']++;
                    }
                } else {
                    $out['supplierGross'] = D::add($out['supplierGross'], $line->gross);
                }
            }
            foreach ($docs as $doc) {
                if ($doc->kind === 'expense') {
                    $out['operatingExpenses'] = D::add($out['operatingExpenses'], $doc->net);
                }
                if ($doc->kind === 'funding') {
                    $out['fundingTotal'] = D::add($out['fundingTotal'], $doc->net);
                }
                if (! in_array($doc->kind, ['sale', 'purchase', 'settlement'], true) || $doc->kind === 'settlement' && $doc->status !== 'confirmed') {
                    continue;
                }
                $charges = R::details($doc)['charges'] ?? [];
                if ($doc->kind === 'sale') {
                    $supplier = $supplierGross->get($doc->id, '0');
                    $ratio = D::cmp($doc->gross, '0') > 0 ? D::div($supplier, $doc->gross) : '0';
                    $service = '0';
                    foreach ($charges['items'] ?? [] as $item) {
                        if (($item['mode'] ?? '') === 'service_percent') {
                            $service = D::add($service, $item['amount']);
                        }
                    }
                    $other = D::sub(D::sub($charges['additionTotal'] ?? '0', $charges['deductionTotal'] ?? '0'), $service);
                    if (D::cmp($other, '0') < 0) {
                        $other = '0';
                    }
                    $out['serviceRevenue'] = D::add($out['serviceRevenue'], D::add(D::kyat(D::mul($service, $ratio)), D::money(D::mul($other, $ratio))));
                    $out['unclassified'] = D::add($out['unclassified'], $charges['deductionTotal'] ?? '0');

                    continue;
                }
                foreach ($charges['items'] ?? [] as $item) {
                    $amount = $item['amount'];
                    if ($doc->kind === 'settlement' || ($item['mode'] ?? '') === 'service_percent') {
                        $out['serviceRevenue'] = D::add($out['serviceRevenue'], $amount);
                    } else {
                        $out['unclassified'] = D::add($out['unclassified'], $amount);
                    }
                }
            }
            $out['recoveriesExcluded'] = (string) DB::table('recoveries')->whereBetween('business_date', [$from, $to])->sum('amount');
            $out['loanInterestExcluded'] = (string) DB::table('payments')->whereBetween('business_date', [$from, $to])->sum('interest');
            $out['totalRevenue'] = D::add($out['ownedRevenue'], $out['serviceRevenue']);
            $out['grossProfit'] = D::sub($out['totalRevenue'], $out['cogs']);
            $out['netProfit'] = D::sub($out['grossProfit'], $out['operatingExpenses']);
            foreach ($out as $k => $v) {
                if (is_string($v)) {
                    $out[$k] = D::money($v);
                }
            }

            return $out + ['from' => $from, 'to' => $to, 'provisional' => true, 'classificationNotes' => ['Advance, outlay and principal recoveries do not create income.', 'Purchase labor/manual adjustments remain unclassified as in the source.', 'Loan interest is separately shown; source provisional P&L does not recognize it.']];
        });
    }

    public function stock(User $actor, string $from, string $to, ?int $warehouse = null, ?string $owner = null): array
    {
        abort_unless($actor->active, 403);

        return DB::transaction(function () use ($from, $to, $warehouse, $owner) {
            $lots = DB::table('stock_lots')->get()->keyBy('id');
            $groups = [];
            $history = [];
            $unknownLots = [];
            $openingUnknown = [];
            foreach (DB::table('stock_events')->where('business_date', '<=', $to)->orderBy('business_date')->orderBy('id')->get() as $e) {
                $l = $lots[$e->lot_id];
                $d = R::details($e);
                $destination = $e->destination_lot_id ? $lots[$e->destination_lot_id] : null;
                $delta = '0';
                $eventOwner = $d['owner'] ?? $l->owner;
                $destinationOwner = $d['destinationOwner'] ?? ($e->kind === 'hold' ? 'customer' : $eventOwner);
                $inScope = fn ($lot) => (! $warehouse || $lot->warehouse_id === $warehouse) && (! $owner || ($lot->id === $l->id ? $eventOwner : $destinationOwner) === $owner);
                $hasUnknown = function () use (&$unknownLots, $l, $warehouse, $owner) {
                    return count(array_filter($unknownLots, fn ($u) => $u['product'] === $l->product_id && (! $warehouse || $u['warehouse'] === $warehouse) && (! $owner || $u['owner'] === $owner))) > 0;
                };
                if ($e->business_date >= $from && ! array_key_exists($l->product_id, $openingUnknown)) {
                    $openingUnknown[$l->product_id] = $hasUnknown();
                }
                if (in_array($e->kind, ['receive', 'opening'], true) && $e->quantity === null) {
                    $unknownLots[$l->id] = ['product' => $l->product_id, 'warehouse' => $l->warehouse_id, 'owner' => $eventOwner, 'bags' => $e->bags];
                }
                if ($e->kind === 'transfer' && $e->quantity === null) {
                    if (isset($unknownLots[$l->id]) && $d['bagsBefore'] !== null && D::cmp($d['bagsBefore'], $e->bags) === 0) {
                        unset($unknownLots[$l->id]);
                    }
                    $unknownLots[$destination->id] = ['product' => $l->product_id, 'warehouse' => $destination->warehouse_id, 'owner' => $destinationOwner, 'bags' => $e->bags];
                }
                if ($e->kind === 'weigh' || ($d['weighedUnknown'] ?? false) || ($d['voided'] ?? false)) {
                    unset($unknownLots[$l->id]);
                }
                if ($e->kind === 'receipt_correction' && array_key_exists('afterQuantity', $d)) {
                    if ($d['afterQuantity'] === null) {
                        $unknownLots[$l->id] = ['product' => $l->product_id, 'warehouse' => $l->warehouse_id, 'owner' => $eventOwner, 'bags' => $d['afterBags']];
                    } else {
                        unset($unknownLots[$l->id]);
                    }
                }
                if (in_array($e->kind, ['receive', 'weigh', 'opening', 'receipt_correction', 'adjust', 'opening_reversal'], true) && $inScope($l)) {
                    $delta = $e->quantity;
                }
                if ($e->kind === 'dispatch' && $inScope($l)) {
                    $delta = $e->quantity === null ? null : D::sub('0', $e->quantity);
                }
                if ($e->kind === 'receipt_correction' && $inScope($l) && array_key_exists('afterQuantity', $d)) {
                    $delta = D::sub($d['afterQuantity'] ?? '0', $d['beforeQuantity'] ?? '0');
                }
                if (in_array($e->kind, ['transfer', 'pack', 'hold'], true)) {
                    $fromOwner = $d['fromOwner'] ?? $eventOwner;
                    $fromScope = (! $warehouse || $l->warehouse_id === $warehouse) && (! $owner || $fromOwner === $owner);
                    $toScope = $destination && $inScope($destination);
                    if ($fromScope && ! $toScope) {
                        $delta = $e->quantity === null ? null : D::sub('0', $e->quantity);
                    } elseif (! $fromScope && $toScope) {
                        $delta = $e->quantity;
                    }
                }
                if ($e->kind === 'purchase' && $owner && (! $warehouse || $l->warehouse_id === $warehouse)) {
                    if ($owner === 'owned') {
                        $delta = $e->quantity;
                    } elseif ($owner === 'supplier') {
                        $delta = $e->quantity === null ? null : D::sub('0', $e->quantity);
                    }
                }
                $g = $groups[$l->product_id] ?? ['product_id' => $l->product_id, 'opening' => '0', 'physicalIn' => '0', 'physicalOut' => '0', 'otherChange' => '0', 'closing' => '0', 'unknown' => false];
                if ($delta !== null) {
                    $g['closing'] = D::add($g['closing'], $delta);
                    if ($e->business_date < $from) {
                        $g['opening'] = D::add($g['opening'], $delta);
                    } elseif (in_array($e->kind, ['receive', 'opening'], true)) {
                        $g['physicalIn'] = D::add($g['physicalIn'], $delta);
                    } elseif ($e->kind === 'dispatch') {
                        $g['physicalOut'] = D::sub($g['physicalOut'], $delta);
                    } else {
                        $g['otherChange'] = D::add($g['otherChange'], $delta);
                    }
                }
                $g['unknown'] = $hasUnknown();
                $g['openingUnknown'] = $openingUnknown[$l->product_id] ?? $g['unknown'];
                $groups[$l->product_id] = $g;
                if ($e->business_date >= $from) {
                    $history[] = ['id' => $e->id, 'kind' => $e->kind, 'date' => $e->business_date, 'recordedAt' => $e->created_at, 'lotId' => $l->id, 'productId' => $l->product_id, 'quantity' => $e->quantity, 'bags' => $e->bags, 'delta' => $delta, 'balance' => $g['unknown'] ? null : $g['closing'], 'documentId' => $e->document_id];
                }
            }

            return ['from' => $from, 'to' => $to, 'groups' => array_values($groups), 'events' => $history];
        });
    }

    public function statement(User $actor, int $partyId, string $from, string $to): array
    {
        abort_unless($actor->active, 403);
        $party = R::get('partners', $partyId);
        $events = [];
        $receivable = '0';
        $payable = '0';
        $advances = '0';
        $documents = DB::table('documents')->where('party_id', $partyId)->where('status', '!=', 'reversed')->where('business_date', '<=', $to)->orderBy('business_date')->orderBy('id')->get();
        $paidByDocument = DB::table('payments')->whereIn('document_id', $documents->pluck('id'))->where('business_date', '<=', $to)
            ->selectRaw('document_id, SUM(amount) as total')->groupBy('document_id')->pluck('total', 'document_id');
        $recoveredByDocument = DB::table('recoveries')->whereIn('source_document_id', $documents->whereIn('kind', ['advance', 'outlay', 'opening_advance'])->pluck('id'))->where('business_date', '<=', $to)
            ->selectRaw('source_document_id, SUM(amount) as total')->groupBy('source_document_id')->pluck('total', 'source_document_id');
        foreach ($documents as $doc) {
            $amount = $doc->net;
            $paid = (string) $paidByDocument->get($doc->id, '0');
            $remaining = D::sub($amount, $paid);
            if (in_array($doc->kind, ['sale', 'opening_receivable'], true)) {
                $receivable = D::add($receivable, $remaining);
            }
            if (in_array($doc->kind, ['purchase', 'settlement', 'opening_payable'], true)) {
                $payable = D::add($payable, $remaining);
            }
            if (in_array($doc->kind, ['advance', 'outlay', 'opening_advance'], true)) {
                $advances = D::add($advances, D::sub($amount, (string) $recoveredByDocument->get($doc->id, '0')));
            }
            if ($doc->business_date >= $from) {
                $events[] = ['kind' => $doc->kind, 'number' => $doc->number, 'date' => $doc->business_date, 'amount' => $amount, 'documentId' => $doc->id];
            }
        }

        return ['partyId' => $party->id, 'from' => $from, 'to' => $to, 'receivable' => D::money($receivable), 'payable' => D::money($payable), 'advances' => D::money($advances), 'events' => $events];
    }
}
