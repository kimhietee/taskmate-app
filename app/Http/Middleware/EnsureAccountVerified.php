<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAccountVerified
{
    public function handle(Request $request, Closure $next): Response
    {
        if (config('taskmate.require_verification', true) && ! $request->user()?->isVerified()) {
            $user = $request->user();
            $redirect = $user?->currentTeam
                ? to_route('dashboard', ['current_team' => $user->currentTeam->slug])
                : to_route('taskmate.dashboard');

            return $redirect->with('status', 'An administrator must verify your TaskMate account before you can use this feature.');
        }

        return $next($request);
    }
}
