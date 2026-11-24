<?php

namespace App\Http\Middleware;

use App\Services\SanctionService;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $accountSuspended = $user !== null && app(SanctionService::class)->suspended($user) !== null;

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'user_type' => $user->user_type?->value,
                    'is_admin' => $user->is_admin,
                    'can_post_tasks' => ! $accountSuspended && $user->canPost(),
                    'can_apply_tasks' => ! $accountSuspended && $user->canApply(),
                    'can_browse_tasks' => ! $accountSuspended && $user->canBrowse(),
                    'can_request_student_verification' => ! $accountSuspended && $user->canRequestStudentVerification(),
                    'verification_status' => $user->verification_status?->value,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                ] : null,
            ],
            'flash' => [
                'status' => fn () => $request->session()->get('status'),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'currentTeam' => fn () => $user?->currentTeam ? $user->toUserTeam($user->currentTeam) : null,
            'prototypeMode' => (bool) config('taskmate.prototype_mode', true),
            'notificationPollSeconds' => (int) config('taskmate.notifications.poll_seconds', 10),
        ];
    }
}
