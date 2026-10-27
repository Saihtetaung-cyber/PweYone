<?php

namespace App\Http\Controllers;

use App\Domain\Reports;
use App\Http\WorkspaceAccess;
use Illuminate\Http\Request;

final class ReportController extends Controller
{
    public function __invoke(Request $r, string $kind, Reports $reports, WorkspaceAccess $access)
    {
        $v = $r->validate(['from' => ['required', 'date_format:Y-m-d'], 'to' => ['required', 'date_format:Y-m-d', 'after_or_equal:from'], 'party_id' => ['nullable', 'integer'], 'warehouse_id' => ['nullable', 'integer'], 'owner' => ['nullable', 'in:owned,supplier,customer']]);
        $actor = $access->actor($r);
        $data = match ($kind) {
            'overview' => $reports->overview($actor, $v['from'], $v['to']),
            'profit' => $reports->profit($actor, $v['from'], $v['to']),'stock' => $reports->stock($actor, $v['from'], $v['to'], isset($v['warehouse_id']) ? (int) $v['warehouse_id'] : null, $v['owner'] ?? null),'statement' => $reports->statement($actor, (int) ($v['party_id'] ?? 0), $v['from'], $v['to']),default => abort(404)
        };

        return response()->json($data)->header('Cache-Control', 'no-store');
    }
}
