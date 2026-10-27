<?php

namespace App\Http\Controllers;

use App\Domain\Projection;
use App\Http\WorkspaceAccess;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

final class AuthController extends Controller
{
    public function form()
    {
        return view('auth.login');
    }

    public function login(Request $r)
    {
        $data = $r->validate(['email' => ['required', 'email'], 'password' => ['required', 'string']]);
        if (! Auth::attempt($data + ['active' => true])) {
            return back()->withErrors(['email' => 'Email or password is incorrect.'])->onlyInput('email');
        }
        $r->session()->regenerate();
        $r->session()->put(WorkspaceAccess::SESSION_KEY, 'staff');
        $r->session()->forget('url.intended');

        return redirect('/');
    }

    public function workspaceView(Request $request, Projection $projection, WorkspaceAccess $access): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->active && $user->role === 'owner', 403, 'ပိုင်ရှင်အကောင့်ဖြင့်သာ view ပြောင်းနိုင်ပါသည်။');
        $data = $request->validate(['view' => ['required', 'in:owner,staff']]);

        if ($data['view'] === 'owner') {
            $key = 'pweyon-owner-view:'.$user->id;
            if (RateLimiter::tooManyAttempts($key, 5)) {
                return response()->json(['message' => 'စကားဝှက် စမ်းသပ်မှုများနေပါသည်။ ခဏစောင့်ပြီး ပြန်ကြိုးစားပါ။'], 429)
                    ->header('Retry-After', (string) RateLimiter::availableIn($key));
            }
            $password = $request->validate(['password' => ['required', 'string', 'max:1024']])['password'];
            if (! Hash::check($password, $user->owner_view_password ?? $user->getAuthPassword())) {
                RateLimiter::hit($key, 60);
                throw ValidationException::withMessages(['password' => 'စကားဝှက် မမှန်ပါ။']);
            }
            RateLimiter::clear($key);
        }

        $request->session()->put(WorkspaceAccess::SESSION_KEY, $data['view']);

        return response()->json(['state' => $access->state($request, $projection), 'csrfToken' => $request->session()->token()])
            ->header('Cache-Control', 'no-store');
    }

    public function account(Request $request, WorkspaceAccess $access): JsonResponse
    {
        abort_unless($access->actor($request)->role === 'owner', 403);

        return response()->json(['email' => $request->user()->email])->header('Cache-Control', 'no-store');
    }

    public function updateAccount(Request $request, WorkspaceAccess $access): JsonResponse
    {
        abort_unless($access->actor($request)->role === 'owner', 403);
        $data = $request->validate([
            'email' => ['required', 'email', 'max:255', Rule::unique('users')->ignore($request->user()->id)],
            'password' => ['nullable', 'string', 'min:8', 'max:72'],
            'owner_view_password' => ['prohibited'],
        ]);
        DB::transaction(function () use ($request, $data): void {
            $user = User::query()->lockForUpdate()->findOrFail($request->user()->id);
            abort_unless($user->active && $user->role === 'owner', 403);
            $user->owner_view_password ??= $user->getAuthPassword();
            if ($user->email !== $data['email']) {
                $user->email = $data['email'];
                $user->email_verified_at = null;
            }
            if (! empty($data['password'])) {
                $user->password = $data['password'];
                $user->remember_token = Str::random(60);
            }
            $user->save();
        });

        return response()->json(['message' => 'အကောင့်အချက်အလက် ပြောင်းပြီးပါပြီ။'])->header('Cache-Control', 'no-store');
    }

    public function updateOwnerPassword(Request $request, WorkspaceAccess $access): JsonResponse
    {
        abort_unless($access->actor($request)->role === 'owner', 403);
        $data = $request->validate([
            'owner_view_password' => ['required', 'string', 'min:8', 'max:72'],
            'email' => ['prohibited'],
            'password' => ['prohibited'],
        ]);
        DB::transaction(function () use ($request, $data): void {
            $user = User::query()->lockForUpdate()->findOrFail($request->user()->id);
            abort_unless($user->active && $user->role === 'owner', 403);
            $user->owner_view_password = $data['owner_view_password'];
            $user->save();
        });

        return response()->json(['message' => 'ပိုင်ရှင်ဘက်ဝင်ရန် စကားဝှက် ပြောင်းပြီးပါပြီ။'])->header('Cache-Control', 'no-store');
    }

    public function logout(Request $r)
    {
        Auth::logout();
        $r->session()->invalidate();
        $r->session()->regenerateToken();

        return redirect('/login');
    }
}
