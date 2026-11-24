<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCanBrowse
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        abort_unless($user !== null && ! $user->isAdmin() && $user->isStudent(), 403, 'Only students can browse tasks.');

        if (! $user->canBrowse()) {
            $redirect = $user->currentTeam
                ? to_route('dashboard', ['current_team' => $user->currentTeam->slug])
                : to_route('taskmate.dashboard');

            return $redirect->with('status', 'Verify your CMU student account before browsing tasks.');
        }

        return $next($request);
    }
}
