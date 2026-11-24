<?php

namespace App\Services;

use App\Models\EmailVerificationCode;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class EmailVerificationCodeService
{
    public function issue(User $user, string $purpose, string $email): string
    {
        $normalizedEmail = Str::lower(trim($email));
        $expiryMinutes = max(1, (int) config('taskmate.student_verification.code_expiry_minutes', 15));

        EmailVerificationCode::query()
            ->where('user_id', $user->id)
            ->where('purpose', $purpose)
            ->whereNull('used_at')
            ->update(['used_at' => now()]);

        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        EmailVerificationCode::query()->create([
            'user_id' => $user->id,
            'purpose' => $purpose,
            'email' => $normalizedEmail,
            'code_hash' => Hash::make($code),
            'attempts' => 0,
            'expires_at' => now()->addMinutes($expiryMinutes),
            'used_at' => null,
            'created_at' => now(),
        ]);

        return $code;
    }

    public function verify(User $user, string $purpose, string $code, ?string $expectedEmail = null): EmailVerificationCode
    {
        $query = EmailVerificationCode::query()
            ->where('user_id', $user->id)
            ->where('purpose', $purpose)
            ->whereNull('used_at')
            ->latest('id');

        if ($expectedEmail !== null) {
            $query->where('email', Str::lower(trim($expectedEmail)));
        }

        $record = $query->first();

        if (! $record || $record->isExpired()) {
            throw ValidationException::withMessages([
                'code' => 'This verification code has expired or is no longer active. Request a new 6-digit code.',
            ]);
        }

        $maxAttempts = max(1, (int) config('taskmate.student_verification.code_max_attempts', 5));
        if ($record->attempts >= $maxAttempts) {
            $record->used_at = now();
            $record->save();

            throw ValidationException::withMessages([
                'code' => 'Too many incorrect attempts. Request a new 6-digit verification code.',
            ]);
        }

        if (! Hash::check(trim($code), $record->code_hash)) {
            $record->attempts = $record->attempts + 1;
            if ($record->attempts >= $maxAttempts) {
                $record->used_at = now();
            }
            $record->save();

            $remaining = max(0, $maxAttempts - $record->attempts);
            $message = $remaining > 0
                ? "That 6-digit code does not match. You have {$remaining} attempt".($remaining === 1 ? '' : 's').' left.'
                : 'Too many incorrect attempts. Request a new 6-digit verification code.';

            throw ValidationException::withMessages(['code' => $message]);
        }

        $record->used_at = now();
        $record->save();

        return $record;
    }

    public function latestActive(User $user, string $purpose): ?EmailVerificationCode
    {
        return EmailVerificationCode::query()
            ->where('user_id', $user->id)
            ->where('purpose', $purpose)
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->latest('id')
            ->first();
    }

    public function maskEmail(string $email): string
    {
        $normalized = trim($email);
        if (! str_contains($normalized, '@')) {
            return $normalized;
        }

        [$local, $domain] = explode('@', $normalized, 2);
        $visible = mb_substr($local, 0, min(2, mb_strlen($local)));

        return $visible.'***@'.$domain;
    }
}
