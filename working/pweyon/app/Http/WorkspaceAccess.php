<?php

namespace App\Http;

use App\Domain\Projection;
use App\Models\User;
use Illuminate\Http\Request;

class WorkspaceAccess
{
    public const SESSION_KEY = 'pweyon.workspace_view';

    public function actor(Request $request): User
    {
        $user = $request->user();
        abort_unless($user && $user->active, 403);

        if ($user->role === 'owner' && $request->session()->get(self::SESSION_KEY, 'owner') === 'staff') {
            $user = clone $user;
            $user->role = 'clerk';
        }

        return $user;
    }

    public function state(Request $request, Projection $projection): array
    {
        $state = $projection->forUser($this->actor($request));
        $state['actorRole'] = $request->user()->role === 'owner' ? 'owner' : 'staff';

        return $state;
    }
}
