<?php

namespace App\Providers;

/* @chisel-registration */
use App\Actions\Fortify\CreateNewUser;
/* @end-chisel-registration */
use App\Actions\Fortify\ResetUserPassword;
use App\Http\Responses\LoginResponse;
use App\Http\Responses\SuccessfulPasswordResetLinkRequestResponse;
/* @chisel-passkeys */
use App\Http\Responses\PasskeyLoginResponse;
/* @end-chisel-passkeys */
/* @chisel-registration */
use App\Http\Responses\RegisterResponse;
/* @end-chisel-registration */
/* @chisel-2fa */
use App\Http\Responses\TwoFactorLoginResponse;
/* @end-chisel-2fa */
/* @chisel-email-verification */
use App\Http\Responses\VerifyEmailResponse;
/* @end-chisel-email-verification */
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Laravel\Fortify\Contracts\SuccessfulPasswordResetLinkRequestResponse as SuccessfulPasswordResetLinkRequestResponseContract;
/* @chisel-registration */
use Laravel\Fortify\Contracts\RegisterResponse as RegisterResponseContract;
/* @end-chisel-registration */
/* @chisel-2fa */
use Laravel\Fortify\Contracts\TwoFactorLoginResponse as TwoFactorLoginResponseContract;
/* @end-chisel-2fa */
/* @chisel-email-verification */
use Laravel\Fortify\Contracts\VerifyEmailResponse as VerifyEmailResponseContract;
/* @end-chisel-email-verification */
use Laravel\Fortify\Features;
use Laravel\Fortify\Fortify;
use App\Models\EmailVerificationCode;
use App\Models\User;
use App\Services\EmailVerificationCodeService;
use App\Services\PasswordRequirementsService;
use App\Services\PrototypeMailboxService;
use App\Services\StudentVerificationService;
use Illuminate\Auth\Events\Verified;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Mail\Events\MessageSent;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Services\SanctionService;
use App\Models\TeamInvitation;
/* @chisel-passkeys */
use Laravel\Passkeys\Contracts\PasskeyLoginResponse as PasskeyLoginResponseContract;

/* @end-chisel-passkeys */

class FortifyServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(LoginResponseContract::class, LoginResponse::class);
        $this->app->bind(
            SuccessfulPasswordResetLinkRequestResponseContract::class,
            SuccessfulPasswordResetLinkRequestResponse::class,
        );
        /* @chisel-passkeys */
        $this->app->singleton(PasskeyLoginResponseContract::class, PasskeyLoginResponse::class);
        /* @end-chisel-passkeys */
        /* @chisel-registration */
        $this->app->singleton(RegisterResponseContract::class, RegisterResponse::class);
        /* @end-chisel-registration */
        /* @chisel-2fa */
        $this->app->singleton(TwoFactorLoginResponseContract::class, TwoFactorLoginResponse::class);
        /* @end-chisel-2fa */
        /* @chisel-email-verification */
        $this->app->singleton(VerifyEmailResponseContract::class, VerifyEmailResponse::class);
        /* @end-chisel-email-verification */
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Fortify::authenticateUsing(function (Request $request) {
            $user = User::query()->where(Fortify::username(), $request->input(Fortify::username()))->first();
            if (! $user || ! Hash::check((string) $request->input('password'), $user->password)) return null;
            if (app(SanctionService::class)->banned($user)) {
                throw ValidationException::withMessages(['email' => 'Your account is banned. '.config('taskmate.moderation.sanction_notice_contact')]);
            }
            return $user;
        });
        $this->configureActions();
        $this->configureViews();
        $this->configureRateLimiting();
        $this->configureEmailVerificationCodes();
    }

    private function configureEmailVerificationCodes(): void
    {
        VerifyEmail::toMailUsing(function (object $notifiable, string $url): MailMessage {
            $expiryMinutes = (int) config('taskmate.student_verification.code_expiry_minutes', 15);
            $code = $notifiable instanceof User
                ? app(EmailVerificationCodeService::class)->issue(
                    $notifiable,
                    EmailVerificationCode::PURPOSE_ACCOUNT_EMAIL,
                    $notifiable->getEmailForVerification(),
                )
                : null;

            $mail = (new MailMessage)
                ->subject('Confirm your TaskMate email address')
                ->line('Welcome to TaskMate! Confirm your email address to continue to your dashboard.');

            if ($code !== null) {
                $mail->line('Enter this 6-digit verification code on the email confirmation screen:')
                    ->line("Verification code: {$code}")
                    ->line("This code expires in {$expiryMinutes} minutes.")
                    ->line('Or click the button below if you are opening this email in the same browser:');
            }

            return $mail
                ->action('Verify Email Address', $url)
                ->line('If you did not create a TaskMate account, no further action is required.');
        });

        ResetPassword::toMailUsing(function (object $notifiable, string $token): MailMessage {
            $expiryMinutes = (int) config('taskmate.student_verification.code_expiry_minutes', 15);
            $email = method_exists($notifiable, 'getEmailForPasswordReset')
                ? (string) $notifiable->getEmailForPasswordReset()
                : (string) ($notifiable->email ?? '');
            $code = $notifiable instanceof User && $email !== ''
                ? app(EmailVerificationCodeService::class)->issue(
                    $notifiable,
                    EmailVerificationCode::PURPOSE_PASSWORD_RESET,
                    $email,
                )
                : null;
            $resetUrl = url(route('password.reset', [
                'token' => $token,
                'email' => $email,
            ], false));

            $mail = (new MailMessage)
                ->subject('Reset your TaskMate password')
                ->line('You are receiving this email because we received a password reset request for your TaskMate account.');

            if ($code !== null) {
                $mail->line('Enter this 6-digit password reset code on the Forgot password screen to verify your request:')
                    ->line("Password reset code: {$code}")
                    ->line("This code expires in {$expiryMinutes} minutes.")
                    ->line('Or click the button below if you are opening this email in the same browser:');
            }

            return $mail
                ->action('Reset Password', $resetUrl)
                ->line('If you did not request a password reset, no further action is required.');
        });

        Event::listen(Verified::class, function (Verified $event): void {
            if ($event->user instanceof User) {
                app(StudentVerificationService::class)->maybeAutoVerifyOnAccountEmailConfirmed($event->user);
            }
        });

        Event::listen(MessageSent::class, function (MessageSent $event): void {
            app(PrototypeMailboxService::class)->capture($event);
        });
    }

    /**
     * Configure Fortify actions.
     */
    private function configureActions(): void
    {
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);
        /* @chisel-registration */
        Fortify::createUsersUsing(CreateNewUser::class);
        /* @end-chisel-registration */
    }

    /**
     * Configure Fortify views.
     */
    private function configureViews(): void
    {
        Fortify::loginView(fn (Request $request) => Inertia::render('auth/login', [
            'canResetPassword' => Features::enabled(Features::resetPasswords()),
            'status' => $request->session()->get('status'),
            'teamInvitation' => $this->teamInvitation($request),
        ]));

        Fortify::resetPasswordView(function (Request $request) {
            $passwordRequirements = app(PasswordRequirementsService::class);

            return Inertia::render('auth/reset-password', [
                'email' => $request->email,
                'token' => $request->route('token'),
                'passwordRules' => $passwordRequirements->rulesString(),
                'passwordRequirements' => $passwordRequirements->forFrontend(),
            ]);
        });

        Fortify::requestPasswordResetLinkView(function (Request $request) {
            $expiryMinutes = max(1, (int) config('taskmate.student_verification.code_expiry_minutes', 15));
            $codes = app(EmailVerificationCodeService::class);
            $rawEmail = $request->session()->get('password_reset.email');
            $requestedAt = (int) $request->session()->get('password_reset.requested_at', 0);
            $isFresh = is_string($rawEmail)
                && trim($rawEmail) !== ''
                && $requestedAt > 0
                && (now()->timestamp - $requestedAt) <= ($expiryMinutes * 60);
            $requestedEmail = $isFresh ? Str::lower(trim($rawEmail)) : null;

            return Inertia::render('auth/forgot-password', [
                'status' => $request->session()->get('status'),
                'mailUsesLogDriver' => config('mail.default') === 'log',
                'prototypeMailboxEnabled' => app(PrototypeMailboxService::class)->isEnabled(),
                'requestedEmail' => $requestedEmail,
                'maskedEmail' => $requestedEmail !== null ? $codes->maskEmail($requestedEmail) : null,
                'codeExpiryMinutes' => $expiryMinutes,
            ]);
        });

        /* @chisel-email-verification */
        Fortify::verifyEmailView(function (Request $request) {
            /** @var User|null $user */
            $user = $request->user();
            $codes = app(EmailVerificationCodeService::class);

            return Inertia::render('auth/verify-email', [
                'status' => $request->session()->get('status'),
                'mailUsesLogDriver' => config('mail.default') === 'log',
                'prototypeMailboxEnabled' => app(PrototypeMailboxService::class)->isEnabled(),
                'maskedEmail' => $user ? $codes->maskEmail($user->email) : null,
                'codeExpiryMinutes' => (int) config('taskmate.student_verification.code_expiry_minutes', 15),
                'willAutoVerifyStudent' => $user !== null
                    && $user->isStudent()
                    && ! $user->isAdmin()
                    && $user->hasInstitutionalEmailDomain($user->email)
                    && $user->hasCompleteStudentCredentials()
                    && (bool) config('taskmate.student_verification.auto_verify_institutional_email', true),
                'unverifiedStudentsCanBrowse' => (bool) config('taskmate.student_verification.unverified_students_can_browse', true),
            ]);
        });
        /* @end-chisel-email-verification */

        /* @chisel-registration */
        Fortify::registerView(function (Request $request) {
            $passwordRequirements = app(PasswordRequirementsService::class);

            return Inertia::render('auth/register', [
                'teamInvitation' => $this->teamInvitation($request),
                'passwordRules' => $passwordRequirements->rulesString(),
                'passwordRequirements' => $passwordRequirements->forFrontend(),
                'institutionalEmailDomains' => config('taskmate.institutional_email_domains', []),
                'requireInstitutionalEmail' => (bool) config('taskmate.require_institutional_email', false),
                'autoVerifyInstitutionalStudent' => (bool) config('taskmate.student_verification.auto_verify_institutional_email', true),
                'unverifiedStudentsCanBrowse' => (bool) config('taskmate.student_verification.unverified_students_can_browse', true),
                'affiliationOptions' => config('taskmate.affiliations', ['student' => [], 'faculty_staff' => []]),
            ]);
        });
        /* @end-chisel-registration */

        /* @chisel-2fa */
        Fortify::twoFactorChallengeView(fn () => Inertia::render('auth/two-factor-challenge'));
        /* @end-chisel-2fa */

        /* @chisel-password-confirmation */
        Fortify::confirmPasswordView(fn () => Inertia::render('auth/confirm-password'));
        /* @end-chisel-password-confirmation */
    }

    /**
     * Configure rate limiting.
     */
    private function configureRateLimiting(): void
    {
        /* @chisel-2fa */
        RateLimiter::for('two-factor', function (Request $request) {
            return Limit::perMinute(5)->by($request->session()->get('login.id'));
        });
        /* @end-chisel-2fa */

        RateLimiter::for('login', function (Request $request) {
            $limit = config('taskmate.rate_limits.login');
            return Limit::perSecond($limit['max_attempts'], $limit['decay_seconds'])
                ->by(Str::transliterate(Str::lower($request->input(Fortify::username())).'|'.$request->ip()));
        });

        /* @chisel-passkeys */
        RateLimiter::for('passkeys', function (Request $request) {
            $credentialId = $request->input('credential.id');

            return Limit::perMinute(10)->by(
                ($credentialId ?: $request->session()->getId()).'|'.$request->ip(),
            );
        });
        /* @end-chisel-passkeys */
    }

    /** @return array{code: string, teamName: string}|null */
    private function teamInvitation(Request $request): ?array
    {
        $invitationCode = $request->query('invitation');

        if (! is_string($invitationCode)) {
            return null;
        }

        $invitation = TeamInvitation::query()
            ->with('team')
            ->where('code', $invitationCode)
            ->whereNull('accepted_at')
            ->where(fn ($query) => $query->whereNull('expires_at')->orWhere('expires_at', '>=', now()))
            ->first();

        return $invitation ? ['code' => $invitation->code, 'teamName' => $invitation->team->name] : null;
    }

}
