<?php

namespace App\Http\Controllers;

use App\Domain\Reports;
use App\Http\WorkspaceAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class ReportController extends Controller
{
    public function __invoke(Request $request, string $kind, Reports $reports, WorkspaceAccess $access): JsonResponse
    {
        $validated = $request->validate([
            'from' => ['required', 'date_format:Y-m-d'],
            'to' => ['required', 'date_format:Y-m-d', 'after_or_equal:from'],
            'party_id' => ['nullable', 'integer'],
            'warehouse_id' => ['nullable', 'integer'],
            'owner' => ['nullable', 'in:owned,supplier,customer'],
            'direction' => ['nullable', 'in:add,subtract'],
            'category' => ['nullable', 'string', 'max:450'],
            'q' => ['nullable', 'string', 'max:200'],
            'source_kind' => ['nullable', 'in:purchase,sale,settlement'],
        ]);
        $actor = $access->actor($request);
        $from = $validated['from'];
        $to = $validated['to'];
        $data = match ($kind) {
            'overview' => $reports->overview($actor, $from, $to),
            'profit' => $reports->profit($actor, $from, $to),
            'stock' => $reports->stock($actor, $from, $to, isset($validated['warehouse_id']) ? (int) $validated['warehouse_id'] : null, $validated['owner'] ?? null),
            'statement' => $reports->statement($actor, (int) ($validated['party_id'] ?? 0), $from, $to),
            'adjustments' => $reports->adjustments($actor, $from, $to, $validated),
            default => abort(404),
        };

        return response()->json($data)->header('Cache-Control', 'no-store');
    }
}
