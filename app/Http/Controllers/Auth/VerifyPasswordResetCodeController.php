<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\EmailVerificationCode;
use App\Models\User;
use App\Services\EmailVerificationCodeService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class VerifyPasswordResetCodeController extends Controller
{
    public function __invoke(Request $request, EmailVerificationCodeService $codes): RedirectResponse
    {
        $rawEmail = $request->input('email');
        $rawCode = $request->input('code');

        $request->merge([
            'email' => is_string($rawEmail) ? Str::lower(trim($rawEmail)) : '',
            'code' => is_string($rawCode) ? (preg_replace('/\s+/', '', $rawCode) ?? '') : '',
        ]);

        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
            'code' => ['required', 'digits:6'],
        ], [
            'code.digits' => 'Enter the 6-digit password reset code sent to your email.',
        ]);

        $normalizedEmail = Str::lower(trim((string) $validated['email']));
        $user = User::query()->whereRaw('LOWER(email) = ?', [$normalizedEmail])->first();

        if (! $user instanceof User) {
            throw ValidationException::withMessages([
                'code' => 'This password reset code is invalid or has expired. Request a new 6-digit code.',
            ]);
        }

        $codes->verify($user, EmailVerificationCode::PURPOSE_PASSWORD_RESET, $validated['code'], $user->email);

        $token = Password::broker(config('fortify.passwords'))->createToken($user);

        if ($request->hasSession()) {
            $request->session()->forget(['password_reset.email', 'password_reset.requested_at']);
        }

        return redirect()->to(route('password.reset', [
            'token' => $token,
            'email' => $user->email,
        ], absolute: false));
    }
}
