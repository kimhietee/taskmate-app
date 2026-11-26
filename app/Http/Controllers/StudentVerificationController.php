<?php

namespace App\Http\Controllers;

use App\Http\Requests\RequestManualStudentVerificationRequest;
use App\Http\Requests\SendStudentInstitutionalCodeRequest;
use App\Http\Requests\VerifyStudentInstitutionalCodeRequest;
use App\Models\EmailVerificationCode;
use App\Models\User;
use App\Notifications\StudentInstitutionalCodeNotification;
use App\Services\EmailVerificationCodeService;
use App\Services\PrototypeMailboxService;
use App\Services\StudentVerificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;
use Inertia\Response;

class StudentVerificationController extends Controller
{
    public function show(Request $request, EmailVerificationCodeService $codes): Response|RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        abort_unless($user->isStudent() && ! $user->isAdmin(), 403, 'Student verification is only available for student accounts.');

        if ($user->isVerified()) {
            return $this->dashboardRedirect($user)->with('status', 'Your CMU student status is already verified.');
        }

        $activeCode = $codes->latestActive($user, EmailVerificationCode::PURPOSE_STUDENT_INSTITUTIONAL_EMAIL);

        return Inertia::render('verification/student', [
            'verificationStatus' => $user->verification_status->value,
            'verificationNote' => $user->verification_note,
            'studentDetails' => [
                'idNumber' => $user->id_number,
                'affiliation' => $user->affiliation,
            ],
            'pendingInstitutionalCode' => $activeCode ? [
                'maskedEmail' => $codes->maskEmail($activeCode->email),
                'expiresAt' => $activeCode->expires_at?->toIso8601String(),
            ] : null,
            'institutionalEmailDomains' => config('taskmate.institutional_email_domains', []),
            'autoVerifyInstitutionalStudent' => (bool) config('taskmate.student_verification.auto_verify_institutional_email', true),
            'codeExpiryMinutes' => (int) config('taskmate.student_verification.code_expiry_minutes', 15),
            'affiliationOptions' => config('taskmate.affiliations.student', []),
            'mailUsesLogDriver' => config('mail.default') === 'log',
            'prototypeMailboxEnabled' => app(PrototypeMailboxService::class)->isEnabled(),
            'status' => $request->session()->get('status'),
        ]);
    }

    public function sendInstitutionalCode(
        SendStudentInstitutionalCodeRequest $request,
        EmailVerificationCodeService $codes,
    ): RedirectResponse {
        /** @var User $user */
        $user = $request->user();
        $validated = $request->validated();

        $user->id_number = $validated['id_number'];
        $user->affiliation = $validated['affiliation'];
        $user->save();

        $code = $codes->issue(
            $user,
            EmailVerificationCode::PURPOSE_STUDENT_INSTITUTIONAL_EMAIL,
            $validated['institutional_email'],
        );

        $expiryMinutes = (int) config('taskmate.student_verification.code_expiry_minutes', 15);
        Notification::route('mail', $validated['institutional_email'])
            ->notify(new StudentInstitutionalCodeNotification($code, $expiryMinutes));

        $masked = $codes->maskEmail($validated['institutional_email']);

        return to_route('verification.student.show')
            ->with('status', "We sent a 6-digit verification code to {$masked}. Enter it below to verify your CMU student status.");
    }

    public function verifyInstitutionalCode(
        VerifyStudentInstitutionalCodeRequest $request,
        EmailVerificationCodeService $codes,
        StudentVerificationService $studentVerification,
    ): RedirectResponse {
        /** @var User $user */
        $user = $request->user();

        $record = $codes->verify(
            $user,
            EmailVerificationCode::PURPOSE_STUDENT_INSTITUTIONAL_EMAIL,
            $request->validated('code'),
        );

        $autoVerified = $studentVerification->completeInstitutionalEmailVerification($user, $record->email);

        $message = $autoVerified
            ? 'You are now a verified CMU Student! Applying, messaging, and student features are unlocked.'
            : 'Your CMU institutional email was confirmed and your account is now awaiting administrator approval.';

        return $this->dashboardRedirect($user)->with('status', $message);
    }

    public function requestManualReview(
        RequestManualStudentVerificationRequest $request,
        StudentVerificationService $studentVerification,
    ): RedirectResponse {
        /** @var User $user */
        $user = $request->user();
        $validated = $request->validated();

        $studentVerification->submitManualReviewRequest(
            $user,
            $validated['id_number'],
            $validated['affiliation'],
        );

        return $this->dashboardRedirect($user)
            ->with('status', 'Your CMU student verification request was submitted for administrator review.');
    }

    private function dashboardRedirect(User $user): RedirectResponse
    {
        return $user->currentTeam
            ? to_route('dashboard', ['current_team' => $user->currentTeam->slug])
            : to_route('taskmate.dashboard');
    }
}
