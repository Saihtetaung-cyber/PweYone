<?php

namespace App\Domain;

use App\Domain\Decimal as D;
use Illuminate\Support\Facades\DB;

final class ClosingSnapshot
{
    public function capture(object $day, array $closing): array
    {
        $date = $day->business_date;
        $documents = DB::table('documents')->where('status', '!=', 'reversed')->get();
        $today = $documents->where('business_date', $date);
        $entries = DB::table('cash_entries')->where('business_date', $date)->get();
        $payments = DB::table('payments')->where('business_date', $date)->get();
        $accounts = DB::table('cash_accounts')->get()->map(function ($a) use ($entries) {
            $rows = $entries->where('account_id', $a->id);
            $in = D::sum($rows->filter(fn ($e) => D::cmp($e->amount, '0') > 0)->pluck('amount'));
            $out = D::sub('0', D::sum($rows->filter(fn ($e) => D::cmp($e->amount, '0') < 0)->pluck('amount')));

            return ['id' => $a->code, 'name' => $a->name, 'type' => $a->type, 'opening' => D::sub(D::add($a->balance, $out), $in), 'balance' => $a->balance, 'moneyIn' => $in, 'moneyOut' => $out];
        })->all();
        $ownership = ['owned' => ['qty' => '0', 'packages' => '0', 'loose' => '0'], 'supplier' => ['qty' => '0', 'packages' => '0', 'loose' => '0'], 'customer' => ['qty' => '0', 'packages' => '0', 'loose' => '0']];
        $warehouses = [];
        $names = DB::table('warehouses')->pluck('name', 'id');
        $unknown = 0;
        foreach (DB::table('stock_lots')->get() as $lot) {
            if ($lot->quantity === null) {
                $unknown++;

                continue;
            }$ownership[$lot->owner]['qty'] = D::add($ownership[$lot->owner]['qty'], $lot->quantity);
            $form = $lot->stock_form === 'packaged' ? 'packages' : 'loose';
            $ownership[$lot->owner][$form] = D::add($ownership[$lot->owner][$form], $lot->quantity);
            $warehouses[$lot->warehouse_id] ??= ['warehouse' => $names[$lot->warehouse_id], 'owned' => '0', 'supplier' => '0', 'customer' => '0'];
            $warehouses[$lot->warehouse_id][$lot->owner] = D::add($warehouses[$lot->warehouse_id][$lot->owner], $lot->quantity);
        }
        $balance = fn (array $kinds) => D::sum($documents->whereIn('kind', $kinds)->map(fn ($d) => D::sub($d->net, $d->paid)));
        $advanceDocuments = $documents->whereIn('kind', ['advance', 'opening_advance']);
        $recoveredByDocument = DB::table('recoveries')->whereIn('source_document_id', $advanceDocuments->pluck('id'))
            ->selectRaw('source_document_id, SUM(amount) as total')->groupBy('source_document_id')->pluck('total', 'source_document_id');
        $advances = '0';
        foreach ($advanceDocuments as $document) {
            $advances = D::add($advances, D::sub($document->net, (string) $recoveredByDocument->get($document->id, '0')));
        }
        $receipts = $today->where('kind', 'receipt');
        $purchased = DB::table('document_lines')->join('documents', 'documents.id', '=', 'document_lines.document_id')->where('documents.kind', 'purchase')->pluck('source_line_id');
        $pending = DB::table('document_lines')->whereIn('document_id', $receipts->pluck('id'))->whereNotIn('id', $purchased)->count();
        $requests = $documents->where('kind', 'home_request')->pluck('id');
        $requestReceipts = $payments->whereIn('document_id', $requests);
        $funding = $today->where('kind', 'funding');
        $transfers = $today->where('kind', 'cash_transfer');
        $expenses = $today->whereIn('kind', ['expense', 'outlay']);

        return ['version' => 53, 'date' => $date, 'createdAt' => now()->toIso8601String(), 'opening' => ['checked' => (bool) $day->opening_checked, 'expected' => $day->opening_expected, 'actual' => $day->opening_actual, 'difference' => $day->opening_actual === null ? null : D::sub($day->opening_actual, $day->opening_expected), 'note' => $day->opening_note],
            'accounts' => $accounts, 'receipts' => ['count' => $receipts->count(), 'pending' => $pending],
            'purchases' => ['count' => $today->where('kind', 'purchase')->count(), 'gross' => D::sum($today->where('kind', 'purchase')->pluck('gross')), 'paidToday' => D::sum($payments->whereIn('document_id', $documents->where('kind', 'purchase')->pluck('id'))->pluck('amount'))],
            'sales' => ['count' => $today->where('kind', 'sale')->count(), 'total' => D::sum($today->where('kind', 'sale')->pluck('net')), 'gross' => D::sum($today->where('kind', 'sale')->pluck('gross'))],
            'expenses' => ['count' => $expenses->count(), 'operating' => D::sum($expenses->where('kind', 'expense')->pluck('net')), 'recoverable' => D::sum($expenses->where('kind', 'outlay')->pluck('net')), 'total' => D::sum($expenses->pluck('net'))],
            'funding' => ['external' => D::sum($funding->pluck('net')), 'externalCount' => $funding->count(), 'internal' => D::add(D::sum($transfers->pluck('net')), D::sum($requestReceipts->pluck('amount'))), 'transferCount' => $transfers->count() + $requestReceipts->count()],
            'debts' => ['payable' => $balance(['purchase', 'settlement', 'opening_payable']), 'traderPayable74' => $balance(['settlement']), 'traderPending74' => D::sum($documents->where('kind', 'settlement')->where('status', 'pending')->pluck('gross')), 'receivable' => $balance(['sale', 'opening_receivable']), 'advance' => $advances, 'openRequests' => $documents->where('kind', 'home_request')->filter(fn ($d) => D::cmp($d->net, $d->paid) > 0)->count()],
            'inventory' => ['ownership' => $ownership, 'warehouses' => array_values($warehouses), 'unknownLots' => $unknown], 'groundIssues' => DB::table('stock_checks')->where('status', 'pending')->count(),
            'cashBefore' => $closing['expectedBefore'], 'cashAfter' => $closing['expectedAfter'], 'actualBefore' => $closing['actualBefore'], 'actualAfter' => $closing['actualAfter'], 'difference' => $closing['difference'], 'notes' => $closing['note'], 'transfers' => []];
    }
}
