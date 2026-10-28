<?php

namespace App\Http\Controllers;

use App\Domain\BusinessService;
use App\Domain\Projection;
use App\Http\WorkspaceAccess;
use Illuminate\Contracts\View\View;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class WorkspaceController extends Controller
{
    public function index(Request $request, Projection $projection, WorkspaceAccess $access): View
    {
        abort_unless($request->user()->active, 403);

        return view('workspace', ['bootstrap' => $access->state($request, $projection)]);
    }

    public function state(Request $request, Projection $projection, WorkspaceAccess $access): JsonResponse
    {
        abort_unless($request->user()->active, 403);

        return response()->json($access->state($request, $projection))->header('Cache-Control', 'no-store');
    }

    public function command(Request $request, BusinessService $service, Projection $projection, WorkspaceAccess $access): JsonResponse
    {
        $validated = $request->validate(['action' => ['required', 'string', 'max:60'], 'input' => ['present', 'array']]);
        $result = $service->execute($access->actor($request), $validated['action'], $validated['input'], (string) $request->header('Idempotency-Key'));

        return response()->json(['result' => $result, 'state' => $access->state($request, $projection)])->header('Cache-Control', 'no-store');
    }
}
