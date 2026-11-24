<?php

namespace Tests\Feature;

use App\Enums\UserType;
use App\Enums\VerificationStatus;
use App\Models\AdminAction;
use App\Models\EmailVerificationCode;
use App\Models\Task;
use App\Models\User;
use App\Notifications\StudentInstitutionalCodeNotification;
use App\Services\EmailVerificationCodeService;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StudentProgressiveVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_personal_email_student_can_register_without_id_details_confirm_6_digit_code_and_enter_dashboard_as_unverified(): void
    {
        Notification::fake();

        $this->post(route('register.store'), [
            'user_type' => 'student',
            'name' => 'Synthetic Personal Student',
            'email' => 'student.personal@gmail.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertRedirect(route('dashboard'));

        $user = User::query()->where('email', 'student.personal@gmail.com')->firstOrFail();
        $this->assertSame(UserType::Student, $user->user_type);
        $this->assertSame(VerificationStatus::Unverified, $user->verification_status);
        $this->assertNull($user->id_number);
        $this->assertNull($user->affiliation);
        $this->assertFalse($user->hasVerifiedEmail());

        Notification::assertSentTo($user, VerifyEmail::class);

        $code = app(EmailVerificationCodeService::class)->issue(
            $user,
            EmailVerificationCode::PURPOSE_ACCOUNT_EMAIL,
            $user->email,
        );

        $this->actingAs($user)
            ->post(route('verification.verify-code'), ['code' => '000000'])
            ->assertSessionHasErrors('code');

        $this->actingAs($user)
            ->post(route('verification.verify-code'), ['code' => $code])
            ->assertRedirect("/{$user->currentTeam->slug}/dashboard?verified=1");

        $user->refresh();
        $this->assertTrue($user->hasVerifiedEmail());
        $this->assertSame(VerificationStatus::Unverified, $user->verification_status);
        $this->assertTrue($user->canBrowse());
        $this->assertFalse($user->canApply());
        $this->assertFalse($user->canPost());

        $this->actingAs($user)->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard')
                ->where('auth.user.verification_status', 'unverified')
                ->where('auth.user.can_browse_tasks', true)
                ->where('auth.user.can_apply_tasks', false)
                ->where('auth.user.can_request_student_verification', true));
    }

    public function test_cmu_email_student_auto_verifies_after_confirming_6_digit_email_code_with_student_id_and_program(): void
    {
        $this->post(route('register.store'), [
            'user_type' => 'student',
            'name' => 'Synthetic CMU Student',
            'email' => 'student.auto@cmu.edu.ph',
            'id_number' => '2026-01928',
            'affiliation' => 'College of Information Sciences and Computing — BSIT',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertRedirect(route('dashboard'));

        $user = User::query()->where('email', 'student.auto@cmu.edu.ph')->firstOrFail();
        $this->assertSame(VerificationStatus::Pending, $user->verification_status);
        $this->assertFalse($user->isVerified());

        $code = app(EmailVerificationCodeService::class)->issue(
            $user,
            EmailVerificationCode::PURPOSE_ACCOUNT_EMAIL,
            $user->email,
        );

        $this->actingAs($user)
            ->post(route('verification.verify-code'), ['code' => $code])
            ->assertRedirect("/{$user->currentTeam->slug}/dashboard?verified=1");

        $user->refresh();
        $this->assertTrue($user->hasVerifiedEmail());
        $this->assertSame(VerificationStatus::Verified, $user->verification_status);
        $this->assertSame('student.auto@cmu.edu.ph', $user->institutional_email);
        $this->assertNotNull($user->institutional_email_verified_at);
        $this->assertSame('institutional_email', $user->verification_method);
        $this->assertSame('2026-01928', $user->id_number);
        $this->assertSame('College of Information Sciences and Computing — BSIT', $user->affiliation);
        $this->assertTrue($user->canApply());
        $this->assertDatabaseHas('admin_actions', [
            'action' => 'student_verified_via_institutional_email',
            'subject_type' => User::class,
            'subject_id' => $user->id,
        ]);
    }

    public function test_cmu_email_student_also_auto_verifies_via_signed_email_link_fallback(): void
    {
        $user = User::factory()->unverified()->create([
            'user_type' => UserType::Student,
            'email' => 'student.link@cmu.edu.ph',
            'id_number' => '2026-02001',
            'affiliation' => 'College of Engineering',
            'verification_status' => VerificationStatus::Pending,
        ]);

        $url = URL::temporarySignedRoute('verification.verify', now()->addMinutes(30), [
            'id' => $user->id,
            'hash' => sha1($user->email),
        ]);

        $this->actingAs($user)->get($url)->assertRedirect();

        $user->refresh();
        $this->assertTrue($user->hasVerifiedEmail());
        $this->assertSame(VerificationStatus::Verified, $user->verification_status);
        $this->assertSame('student.link@cmu.edu.ph', $user->institutional_email);
    }

    public function test_personal_email_student_can_auto_verify_from_dashboard_using_cmu_email_code_while_keeping_gmail_login(): void
    {
        Notification::fake();

        $student = User::factory()->unverifiedStudent()->create([
            'email' => 'my.personal@gmail.com',
        ]);

        $this->actingAs($student)
            ->from(route('verification.student.show'))
            ->post(route('verification.student.send-code'), [
                'id_number' => '2026-05555',
                'affiliation' => 'College of Information Sciences and Computing — BSIT',
                'institutional_email' => 'notcmu@gmail.com',
            ])->assertSessionHasErrors('institutional_email');

        $this->actingAs($student)
            ->post(route('verification.student.send-code'), [
                'id_number' => '  2026-05555  ',
                'affiliation' => '  College of Information Sciences and Computing — BSIT  ',
                'institutional_email' => 'student.verify@cmu.edu.ph',
            ])->assertRedirect(route('verification.student.show'));

        Notification::assertSentOnDemand(StudentInstitutionalCodeNotification::class);

        $student->refresh();
        $this->assertSame('2026-05555', $student->id_number);
        $this->assertSame('College of Information Sciences and Computing — BSIT', $student->affiliation);
        $this->assertSame(VerificationStatus::Unverified, $student->verification_status);

        $code = app(EmailVerificationCodeService::class)->issue(
            $student,
            EmailVerificationCode::PURPOSE_STUDENT_INSTITUTIONAL_EMAIL,
            'student.verify@cmu.edu.ph',
        );

        $this->actingAs($student)
            ->post(route('verification.student.verify-code'), ['code' => $code])
            ->assertRedirect(route('dashboard', ['current_team' => $student->currentTeam->slug]));

        $student->refresh();
        $this->assertSame('my.personal@gmail.com', $student->email);
        $this->assertSame('student.verify@cmu.edu.ph', $student->institutional_email);
        $this->assertNotNull($student->institutional_email_verified_at);
        $this->assertSame(VerificationStatus::Verified, $student->verification_status);
        $this->assertSame('institutional_email', $student->verification_method);
        $this->assertTrue($student->canApply());

        // Another student cannot reuse the same verified CMU institutional email.
        $other = User::factory()->unverifiedStudent()->create(['email' => 'other@gmail.com']);
        $this->actingAs($other)
            ->from(route('verification.student.show'))
            ->post(route('verification.student.send-code'), [
                'id_number' => '2026-09999',
                'affiliation' => 'College of Nursing',
                'institutional_email' => 'student.verify@cmu.edu.ph',
            ])->assertSessionHasErrors('institutional_email');
    }

    public function test_personal_email_student_can_request_manual_admin_review_and_admin_requires_student_credentials_to_approve(): void
    {
        $admin = User::factory()->verified()->facultyStaff()->create();
        $admin->is_admin = true;
        $admin->save();

        $student = User::factory()->unverifiedStudent()->create([
            'email' => 'manual.student@gmail.com',
        ]);

        // Admin cannot approve a student who has not submitted Student ID and college/program yet.
        $this->actingAs($admin)
            ->from(route('admin.users.show', $student))
            ->post(route('admin.users.verification', $student), ['decision' => 'verified'])
            ->assertSessionHasErrors('decision');
        $this->assertSame(VerificationStatus::Unverified, $student->fresh()->verification_status);

        // Student submits manual review request (text details only, no ID photo uploads).
        $this->actingAs($student)
            ->post(route('verification.student.manual-request'), [
                'id_number' => '  2026-07777  ',
                'affiliation' => '  College of Education  ',
            ])->assertRedirect(route('dashboard', ['current_team' => $student->currentTeam->slug]));

        $student->refresh();
        $this->assertSame(VerificationStatus::Pending, $student->verification_status);
        $this->assertSame('2026-07777', $student->id_number);
        $this->assertSame('College of Education', $student->affiliation);
        $this->assertSame('account.awaiting_review', $admin->notifications()->latest()->firstOrFail()->data['event']);

        // Admin approves after credentials are present.
        $this->actingAs($admin)
            ->post(route('admin.users.verification', $student), ['decision' => 'verified'])
            ->assertRedirect(route('admin.users.show', $student));

        $student->refresh();
        $this->assertSame(VerificationStatus::Verified, $student->verification_status);
        $this->assertSame('admin_review', $student->verification_method);
        $this->assertSame($admin->id, $student->verified_by);
    }

    public function test_non_students_cannot_access_student_verification_and_expired_or_exhausted_codes_are_rejected(): void
    {
        $faculty = User::factory()->facultyStaff()->create();
        $organization = User::factory()->organization()->create();
        $admin = User::factory()->verified()->create();
        $admin->is_admin = true;
        $admin->save();

        foreach ([$faculty, $organization, $admin] as $user) {
            $this->actingAs($user)->get(route('verification.student.show'))->assertForbidden();
        }

        // Expired code rejection and attempt lock.
        $unverified = User::factory()->unverified()->create(['email' => 'attempts@gmail.com']);
        $codes = app(EmailVerificationCodeService::class);
        $codes->issue($unverified, EmailVerificationCode::PURPOSE_ACCOUNT_EMAIL, $unverified->email);
        EmailVerificationCode::query()->where('user_id', $unverified->id)->update(['expires_at' => now()->subMinute()]);

        $this->actingAs($unverified)
            ->post(route('verification.verify-code'), ['code' => '123456'])
            ->assertSessionHasErrors('code');

        config(['taskmate.student_verification.code_max_attempts' => 2]);
        $validCode = $codes->issue($unverified, EmailVerificationCode::PURPOSE_ACCOUNT_EMAIL, $unverified->email);
        $wrongCode = $validCode === '111111' ? '222222' : '111111';

        $this->actingAs($unverified)->post(route('verification.verify-code'), ['code' => $wrongCode])->assertSessionHasErrors('code');
        $this->actingAs($unverified)->post(route('verification.verify-code'), ['code' => $wrongCode])->assertSessionHasErrors('code');
        // After max attempts, even the real code is invalidated.
        $this->actingAs($unverified)->post(route('verification.verify-code'), ['code' => $validCode])->assertSessionHasErrors('code');
        $this->assertFalse($unverified->fresh()->hasVerifiedEmail());
    }

    public function test_disabling_auto_verify_config_keeps_cmu_email_students_pending_for_admin_approval(): void
    {
        config(['taskmate.student_verification.auto_verify_institutional_email' => false]);

        $student = User::factory()->unverifiedStudent()->create([
            'email' => 'toggle@gmail.com',
            'id_number' => '2026-08888',
            'affiliation' => 'College of Agriculture',
        ]);

        $code = app(EmailVerificationCodeService::class)->issue(
            $student,
            EmailVerificationCode::PURPOSE_STUDENT_INSTITUTIONAL_EMAIL,
            'toggle.student@cmu.edu.ph',
        );

        $this->actingAs($student)
            ->post(route('verification.student.verify-code'), ['code' => $code])
            ->assertRedirect();

        $student->refresh();
        $this->assertSame(VerificationStatus::Pending, $student->verification_status);
        $this->assertSame('toggle.student@cmu.edu.ph', $student->institutional_email);
        $this->assertNotNull($student->institutional_email_verified_at);
        $this->assertTrue(AdminAction::query()->where('action', 'student_institutional_email_confirmed')->exists());
    }

    public function test_unverified_student_can_preview_browse_but_cannot_access_messages_or_task_creation(): void
    {
        $poster = User::factory()->verified()->facultyStaff()->create();
        $task = Task::factory()->approved()->for($poster, 'poster')->create([
            'work_mode' => 'remote',
            'workplace_name' => null,
            'workplace_address' => null,
            'workplace_setting' => null,
        ]);

        $student = User::factory()->unverifiedStudent()->create(['email' => 'preview@gmail.com']);

        $this->actingAs($student)->get(route('browse.index'))->assertOk();
        $this->actingAs($student)->get(route('browse.show', $task))->assertOk();
        $this->actingAs($student)->get(route('messages.index'))->assertRedirect();
        $this->actingAs($student)->get(route('tasks.create'))->assertRedirect();
        $this->actingAs($student)->get(route('applications.mine'))->assertRedirect();
    }
}
