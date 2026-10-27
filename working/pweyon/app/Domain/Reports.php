<?php

namespace App\Domain;

use App\Domain\Decimal as D;
use App\Domain\Records as R;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final class Reports
{
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
            $out = ['ownedRevenue' => '0', 'supplierGross' => '0', 'serviceRevenue' => '0', 'cogs' => '0', 'operatingExpenses' => '0', 'unclassified' => '0', 'fundingTotal' => '0', 'recoveriesExcluded' => '0', 'loanInterestExcluded' => '0', 'unknownCosts' => 0];
            foreach (DB::table('document_lines')->whereIn('document_id', $docs->where('kind', 'sale')->keys())->get() as $line) {
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
                    $supplier = (string) DB::table('document_lines')->where('document_id', $doc->id)->where('ownership', 'supplier')->sum('gross');
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
                    if ($doc->kind === 'settlement' || $doc->kind === 'sale') {
                        // V74: buyer-side charges and confirmed trader fees are distinct fee sides.
                        if ($item['direction'] === 'add' || $doc->kind === 'settlement') {
                            $out['serviceRevenue'] = D::add($out['serviceRevenue'], $amount);
                        } else {
                            $out['unclassified'] = D::add($out['unclassified'], $amount);
                        }
                    } elseif (($item['mode'] ?? '') === 'service_percent') {
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
        foreach (DB::table('documents')->where('party_id', $partyId)->where('status', '!=', 'reversed')->where('business_date', '<=', $to)->orderBy('business_date')->orderBy('id')->get() as $doc) {
            $amount = $doc->net;
            $payments = DB::table('payments')->where('document_id', $doc->id)->where('business_date', '<=', $to)->get();
            $paid = D::sum($payments->pluck('amount'));
            $remaining = D::sub($amount, $paid);
            if (in_array($doc->kind, ['sale', 'opening_receivable'], true)) {
                $receivable = D::add($receivable, $remaining);
            }
            if (in_array($doc->kind, ['purchase', 'settlement', 'opening_payable'], true)) {
                $payable = D::add($payable, $remaining);
            }
            if (in_array($doc->kind, ['advance', 'outlay', 'opening_advance'], true)) {
                $advances = D::add($advances, D::sub($amount, (string) DB::table('recoveries')->where('source_document_id', $doc->id)->where('business_date', '<=', $to)->sum('amount')));
            }
            if ($doc->business_date >= $from) {
                $events[] = ['kind' => $doc->kind, 'number' => $doc->number, 'date' => $doc->business_date, 'amount' => $amount, 'documentId' => $doc->id];
            }
        }

        return ['partyId' => $party->id, 'from' => $from, 'to' => $to, 'receivable' => D::money($receivable), 'payable' => D::money($payable), 'advances' => D::money($advances), 'events' => $events];
    }
}
