<?php

namespace App\Services;

use App\Enums\VerificationStatus;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class StudentVerificationService
{
    public function __construct(private TaskMateNotifications $alerts)
    {
        //
    }

    public function maybeAutoVerifyOnAccountEmailConfirmed(User $user): bool
    {
        if (! (bool) config('taskmate.student_verification.auto_verify_institutional_email', true)) {
            return false;
        }

        if ($user->isAdmin() || ! $user->isStudent() || $user->isVerified() || ! $user->hasVerifiedEmail()) {
            return false;
        }

        if (! $user->hasInstitutionalEmailDomain($user->email) || ! $user->hasCompleteStudentCredentials()) {
            return false;
        }

        $normalizedEmail = Str::lower(trim($user->email));
        $claimedByOther = User::query()
            ->where('id', '!=', $user->id)
            ->whereRaw('LOWER(institutional_email) = ?', [$normalizedEmail])
            ->exists();

        if ($claimedByOther) {
            return false;
        }

        DB::transaction(function () use ($user, $normalizedEmail): void {
            $user->institutional_email = $normalizedEmail;
            $user->institutional_email_verified_at = now();
            $user->verification_status = VerificationStatus::Verified;
            $user->verification_method = 'institutional_email';
            $user->verification_note = null;
            $user->verified_at = now();
            $user->verified_by = null;
            $user->save();

            $user->adminActions()->create([
                'admin_id' => $user->id,
                'action' => 'student_verified_via_institutional_email',
                'metadata' => [
                    'actor_type' => 'system',
                    'method' => 'institutional_email',
                ],
            ]);

            $this->alerts->send($user, 'account.approved', '/notifications', ['user_id' => $user->id], actorId: null);
        });

        return true;
    }

    public function completeInstitutionalEmailVerification(User $user, string $institutionalEmail): bool
    {
        $normalizedEmail = Str::lower(trim($institutionalEmail));

        $claimedByOther = User::query()
            ->where('id', '!=', $user->id)
            ->where(function ($query) use ($normalizedEmail) {
                $query->whereRaw('LOWER(institutional_email) = ?', [$normalizedEmail])
                    ->orWhere(function ($sub) use ($normalizedEmail) {
                        $sub->whereRaw('LOWER(email) = ?', [$normalizedEmail])
                            ->whereNotNull('email_verified_at');
                    });
            })
            ->exists();

        if ($claimedByOther) {
            throw ValidationException::withMessages([
                'institutional_email' => 'That CMU institutional email is already linked to another account.',
            ]);
        }

        if (! $user->hasCompleteStudentCredentials()) {
            throw ValidationException::withMessages([
                'id_number' => 'Enter both your Student ID number and college/program before verifying.',
            ]);
        }

        $autoVerify = (bool) config('taskmate.student_verification.auto_verify_institutional_email', true);

        DB::transaction(function () use ($user, $normalizedEmail, $autoVerify): void {
            $user->institutional_email = $normalizedEmail;
            $user->institutional_email_verified_at = now();
            $user->verification_method = 'institutional_email';
            $user->verification_note = null;

            if ($autoVerify) {
                $user->verification_status = VerificationStatus::Verified;
                $user->verified_at = now();
                $user->verified_by = null;
                $user->save();

                $user->adminActions()->create([
                    'admin_id' => $user->id,
                    'action' => 'student_verified_via_institutional_email',
                    'metadata' => [
                        'actor_type' => 'system',
                        'method' => 'institutional_email',
                    ],
                ]);

                $this->alerts->send($user, 'account.approved', '/notifications', ['user_id' => $user->id], actorId: null);
            } else {
                $user->verification_status = VerificationStatus::Pending;
                $user->verified_at = null;
                $user->verified_by = null;
                $user->save();

                $user->adminActions()->create([
                    'admin_id' => $user->id,
                    'action' => 'student_institutional_email_confirmed',
                    'metadata' => [
                        'actor_type' => 'user',
                        'method' => 'institutional_email',
                    ],
                ]);

                $this->alerts->admins('account.awaiting_review', route('admin.users.index', [], false), ['user_id' => $user->id], actorId: $user->id);
            }
        });

        return $autoVerify;
    }

    public function submitManualReviewRequest(User $user, string $idNumber, string $affiliation): void
    {
        DB::transaction(function () use ($user, $idNumber, $affiliation): void {
            $user->id_number = $idNumber;
            $user->affiliation = $affiliation;
            $user->verification_status = VerificationStatus::Pending;
            $user->verification_method = 'admin_review';
            $user->verification_note = null;
            $user->verified_at = null;
            $user->verified_by = null;
            $user->save();

            $user->adminActions()->create([
                'admin_id' => $user->id,
                'action' => 'student_verification_requested',
                'metadata' => [
                    'actor_type' => 'user',
                    'method' => 'admin_review',
                    'fields' => ['id_number', 'affiliation'],
                ],
            ]);

            $this->alerts->admins('account.awaiting_review', route('admin.users.index', [], false), ['user_id' => $user->id], actorId: $user->id);
        });
    }
}
