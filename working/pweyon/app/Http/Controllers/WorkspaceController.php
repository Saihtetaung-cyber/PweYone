<?php

namespace App\Http\Controllers;

use App\Domain\BusinessService;
use App\Domain\Projection;
use App\Http\WorkspaceAccess;
use Illuminate\Http\Request;

final class WorkspaceController extends Controller
{
    public function index(Request $r, Projection $p, WorkspaceAccess $access)
    {
        abort_unless($r->user()->active, 403);

        return view('workspace', ['bootstrap' => $access->state($r, $p)]);
    }

    public function state(Request $r, Projection $p, WorkspaceAccess $access)
    {
        abort_unless($r->user()->active, 403);

        return response()->json($access->state($r, $p))->header('Cache-Control', 'no-store');
    }

    public function command(Request $r, BusinessService $s, Projection $p, WorkspaceAccess $access)
    {
        $v = $r->validate(['action' => ['required', 'string', 'max:60'], 'input' => ['present', 'array']]);
        $result = $s->execute($access->actor($r), $v['action'], $v['input'], (string) $r->header('Idempotency-Key'));

        return response()->json(['result' => $result, 'state' => $access->state($r, $p)])->header('Cache-Control', 'no-store');
    }
}
