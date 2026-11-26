<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Laravel\Fortify\Contracts\SuccessfulPasswordResetLinkRequestResponse as SuccessfulPasswordResetLinkRequestResponseContract;
use Laravel\Fortify\Fortify;
use Symfony\Component\HttpFoundation\Response;

class SuccessfulPasswordResetLinkRequestResponse implements SuccessfulPasswordResetLinkRequestResponseContract
{
    public function __construct(
        protected string $status,
    ) {}

    public function toResponse($request): Response
    {
        $rawEmail = $request->input(Fortify::email());
        $normalizedEmail = is_string($rawEmail) ? Str::lower(trim($rawEmail)) : '';

        if ($normalizedEmail !== '' && $request->hasSession()) {
            $request->session()->put('password_reset.email', $normalizedEmail);
            $request->session()->put('password_reset.requested_at', now()->timestamp);
        }

        return $request->wantsJson()
            ? new JsonResponse(['message' => trans($this->status)], 200)
            : back()->with('status', trans($this->status));
    }
}
