<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\SetTeamUrlDefaults;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Inertia\Inertia;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            \App\Http\Middleware\EnsureAccountActive::class,
            \App\Http\Middleware\EnforceTaskMateRateLimits::class,
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            SetTeamUrlDefaults::class,
        ]);

        $middleware->alias([
            'admin' => \App\Http\Middleware\EnsureAdmin::class,
            'account.verified' => \App\Http\Middleware\EnsureAccountVerified::class,
            'can.post' => \App\Http\Middleware\EnsureCanPost::class,
            'can.apply' => \App\Http\Middleware\EnsureCanApply::class,
            'can.browse' => \App\Http\Middleware\EnsureCanBrowse::class,
            'account.active' => \App\Http\Middleware\EnsureAccountActive::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->dontFlash(['body']);
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
        $exceptions->respond(function (\Symfony\Component\HttpFoundation\Response $response, \Throwable $exception) {
            $request = request();
            $status = $response->getStatusCode();
            if ($status >= 500 && app()->environment('local') && config('app.debug')) return $response;
            if ($request->expectsJson() || ! in_array($status, [403, 404, 419, 429, 500], true)) return $response;
            return Inertia::render('errors/status', ['status' => $status])->toResponse($request)->setStatusCode($status);
        });
})->create();
