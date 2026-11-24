<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\EmailVerificationCode;
use App\Models\User;
use App\Services\EmailVerificationCodeService;
use App\Services\StudentVerificationService;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class VerifyEmailCodeController extends Controller
{
    public function __invoke(
        Request $request,
        EmailVerificationCodeService $codes,
        StudentVerificationService $studentVerification,
    ): RedirectResponse {
        /** @var User $user */
        $user = $request->user();

        $dashboardUrl = $user->currentTeam
            ? route('dashboard', ['current_team' => $user->currentTeam->slug])
            : route('taskmate.dashboard');

        if ($user->hasVerifiedEmail()) {
            return redirect()->intended($dashboardUrl.'?verified=1');
        }

        $sanitizedCode = is_string($request->input('code'))
            ? (preg_replace('/\s+/', '', $request->input('code')) ?? '')
            : '';

        $request->merge(['code' => $sanitizedCode]);
        $validated = $request->validate([
            'code' => ['required', 'digits:6'],
        ], [
            'code.digits' => 'Enter the 6-digit verification code sent to your email.',
        ]);

        $codes->verify($user, EmailVerificationCode::PURPOSE_ACCOUNT_EMAIL, $validated['code'], $user->email);

        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        $autoVerified = $studentVerification->maybeAutoVerifyOnAccountEmailConfirmed($user->fresh());
        $user->refresh();

        $statusMessage = $autoVerified || $user->isVerified()
            ? 'Email confirmed! Your CMU student account is now verified and ready to use.'
            : ($user->isStudent()
                ? 'Email confirmed! You can browse approved tasks now and verify your CMU student status anytime from your dashboard.'
                : 'Email confirmed! Your account details are now in the administrator review queue.');

        return redirect()->intended($dashboardUrl.'?verified=1')->with('status', $statusMessage);
    }
}
