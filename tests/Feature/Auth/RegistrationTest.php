<?php

namespace Tests\Feature\Auth;

use App\Enums\UserType;
use App\Enums\VerificationStatus;
use App\Enums\TeamRole;
use App\Models\Team;
use App\Models\TeamInvitation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\Rules\Password;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered(): void
    {
        $this->get(route('register'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('auth/register')
                ->where('institutionalEmailDomains.0', 'cmu.edu.ph')
                ->where('passwordRequirements.min', 8)
                ->where('passwordRules', 'minlength: 8;'));
    }

    public function test_registration_screen_exposes_strong_production_password_requirements(): void
    {
        $previousCallback = Password::$defaultCallback;
        Password::defaults(fn (): Password => Password::min(12)
            ->mixedCase()
            ->letters()
            ->numbers()
            ->symbols()
            ->uncompromised());

        try {
            $this->get(route('register'))
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page
                    ->component('auth/register')
                    ->where('passwordRequirements', [
                        'min' => 12,
                        'mixedCase' => true,
                        'letters' => true,
                        'numbers' => true,
                        'symbols' => true,
                        'uncompromised' => true,
                    ])
                    ->where('passwordRules', Password::default()->toPasswordRulesString()));
        } finally {
            Password::$defaultCallback = $previousCallback;
        }
    }

    public function test_registration_screen_includes_team_invitation_context(): void
    {
        $owner = User::factory()->create();
        $team = Team::factory()->create(['name' => 'Laravel Team']);
        $team->members()->attach($owner, ['role' => TeamRole::Owner->value]);

        $invitation = TeamInvitation::factory()->create([
            'team_id' => $team->id,
            'email' => 'invited@example.test',
            'invited_by' => $owner->id,
        ]);

        $this->get(route('register', ['invitation' => $invitation->code]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('auth/register')
                ->where('teamInvitation.code', $invitation->code)
                ->where('teamInvitation.teamName', 'Laravel Team'));
    }

    public function test_students_can_register_with_cmu_email_and_student_details(): void
    {
        $this->post(route('register.store'), $this->validStudent())->assertRedirect(route('dashboard'));

        $user = User::query()->where('email', 'student@cmu.edu.ph')->firstOrFail();
        $this->assertSame(UserType::Student, $user->user_type);
        $this->assertSame('FAKE-STU-101', $user->id_number);
        $this->assertSame('Synthetic College and Program', $user->affiliation);
        $this->assertSame(VerificationStatus::Pending, $user->verification_status);
        $this->assertFalse($user->is_admin);
    }

    public function test_faculty_staff_can_register_with_cmu_email_and_employee_details(): void
    {
        $this->post(route('register.store'), [
            ...$this->baseRegistration('faculty@cmu.edu.ph'),
            'user_type' => 'faculty_staff',
            'id_number' => 'FAKE-EMP-101',
            'affiliation' => 'Synthetic CMU Office',
        ])->assertRedirect(route('dashboard'));

        $this->assertDatabaseHas('users', [
            'email' => 'faculty@cmu.edu.ph',
            'user_type' => 'faculty_staff',
            'verification_status' => 'pending',
            'id_number' => 'FAKE-EMP-101',
        ]);
    }

    public function test_organization_representatives_can_register_with_required_organization_details(): void
    {
        $this->post(route('register.store'), [
            ...$this->baseRegistration('representative@example.test'),
            'user_type' => 'organization',
            'organization_name' => 'Synthetic Example Organization',
            'position' => 'Synthetic Coordinator',
            'supporting_info' => 'A synthetic organization used only for registration tests.',
        ])->assertRedirect(route('dashboard'));

        $this->assertDatabaseHas('users', [
            'email' => 'representative@example.test',
            'user_type' => 'organization',
            'organization_name' => 'Synthetic Example Organization',
            'position' => 'Synthetic Coordinator',
            'id_number' => null,
            'affiliation' => null,
            'verification_status' => 'pending',
        ]);
    }

    public function test_student_and_faculty_staff_emails_must_use_configured_institutional_domains(): void
    {
        config(['taskmate.require_institutional_email' => true]);

        foreach (['student', 'faculty_staff'] as $type) {
            $this->from(route('register'))->post(route('register.store'), [
                ...$this->baseRegistration("{$type}@outside.example.test"),
                'user_type' => $type,
                'id_number' => 'FAKE-ID-001',
                'affiliation' => 'Synthetic College or Office',
            ])->assertSessionHasErrors('email');
        }
    }

    public function test_registration_requires_fields_for_each_selected_account_type(): void
    {
        $this->from(route('register'))->post(route('register.store'), [
            ...$this->baseRegistration('missing-student@cmu.edu.ph'),
            'user_type' => 'student',
        ])->assertSessionHasErrors(['id_number', 'affiliation']);

        $this->from(route('register'))->post(route('register.store'), [
            ...$this->baseRegistration('missing-faculty@cmu.edu.ph'),
            'user_type' => 'faculty_staff',
        ])->assertSessionHasErrors(['id_number', 'affiliation']);

        $this->from(route('register'))->post(route('register.store'), [
            ...$this->baseRegistration('missing-organization@example.test'),
            'user_type' => 'organization',
        ])->assertSessionHasErrors(['organization_name', 'position', 'supporting_info']);

        $this->from(route('register'))->post(route('register.store'), [
            ...$this->baseRegistration('long-description@example.test'),
            'user_type' => 'organization',
            'organization_name' => 'Synthetic Organization',
            'position' => 'Synthetic Representative',
            'supporting_info' => str_repeat('x', 1001),
        ])->assertSessionHasErrors('supporting_info');

        $this->from(route('register'))->post(route('register.store'), [
            ...$this->baseRegistration('extra-id@example.test'),
            'user_type' => 'organization',
            'organization_name' => 'Synthetic Organization',
            'position' => 'Synthetic Representative',
            'supporting_info' => 'Synthetic details.',
            'id_number' => 'FAKE-UNNEEDED-ID',
        ])->assertSessionHasErrors('id_number');
    }

    public function test_admin_and_unknown_user_types_are_rejected(): void
    {
        foreach (['admin', 'unknown'] as $type) {
            $this->from(route('register'))->post(route('register.store'), [
                ...$this->baseRegistration("{$type}@example.test"),
                'user_type' => $type,
            ])->assertSessionHasErrors('user_type');
        }
    }

    public function test_registration_payload_cannot_set_admin_or_verification_status(): void
    {
        $this->post(route('register.store'), [
            ...$this->validStudent(),
            'is_admin' => true,
            'verification_status' => 'verified',
        ])->assertRedirect(route('dashboard'));

        $user = User::query()->where('email', 'student@cmu.edu.ph')->firstOrFail();
        $this->assertFalse($user->is_admin);
        $this->assertSame(VerificationStatus::Pending, $user->verification_status);
    }

    public function test_sensitive_account_status_fields_are_not_mass_assignable(): void
    {
        $user = User::factory()->create();
        $user->fill(['is_admin' => true, 'verification_status' => 'verified']);

        $this->assertFalse($user->is_admin);
        $this->assertSame(VerificationStatus::Pending, $user->verification_status);
        $this->assertNotContains('is_admin', $user->getFillable());
        $this->assertNotContains('verification_status', $user->getFillable());
    }

    public function test_account_shared_data_omits_admin_only_verification_note(): void
    {
        $user = User::factory()->create(['verification_note' => 'Sensitive synthetic admin note.']);

        $this->actingAs($user)->get(route('profile.edit'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('auth.user.id', $user->id)
                ->missing('auth.user.id_number')
                ->missing('auth.user.supporting_info')
                ->missing('auth.user.verification_note'));
    }

    public function test_make_admin_command_marks_an_existing_user_admin_and_verified(): void
    {
        $user = User::factory()->unverified()->create(['email' => 'candidate@example.test']);

        $this->artisan('taskmate:make-admin', ['email' => $user->email])
            ->expectsOutputToContain('is now a verified TaskMate administrator.')
            ->assertSuccessful();

        $this->assertTrue($user->fresh()->is_admin);
        $this->assertNotNull($user->fresh()->email_verified_at);
        $this->assertSame(VerificationStatus::Verified, $user->fresh()->verification_status);
        $this->assertNotNull($user->fresh()->verified_at);
    }

    public function test_make_admin_command_fails_clearly_when_user_is_missing(): void
    {
        $this->artisan('taskmate:make-admin', ['email' => 'missing@example.test'])
            ->expectsOutputToContain('No user found with that email address.')
            ->assertFailed();
    }

    public function test_registration_cleans_whitespace_rejects_junk_names_and_supports_configurable_email_restriction(): void
    {
        $this->from(route('register'))->post(route('register.store'), [
            ...$this->validStudent(),
            'name' => '123456',
            'email' => 'junk-name@cmu.edu.ph',
        ])->assertSessionHasErrors('name');

        $this->post(route('register.store'), [
            ...$this->validStudent(),
            'name' => '  Ma. Elena   Niño-Santos Jr.  ',
            'email' => '  clean-name@cmu.edu.ph  ',
            'affiliation' => '  College of Information Sciences and Computing — BSIT  ',
        ])->assertRedirect(route('dashboard'));

        $cleaned = User::query()->where('email', 'clean-name@cmu.edu.ph')->firstOrFail();
        $this->assertSame('Ma. Elena Niño-Santos Jr.', $cleaned->name);
        $this->assertSame('College of Information Sciences and Computing — BSIT', $cleaned->affiliation);

        auth()->logout();
        config(['taskmate.require_institutional_email' => false]);
        $this->post(route('register.store'), [
            ...$this->baseRegistration('open-student@example.test'),
            'user_type' => 'student',
            'id_number' => 'FAKE-OPEN-001',
            'affiliation' => 'College of Engineering',
        ])->assertRedirect(route('dashboard'));

        $openUser = User::query()->where('email', 'open-student@example.test')->firstOrFail();
        $this->assertSame(VerificationStatus::Pending, $openUser->verification_status);
    }

    public function test_unverified_users_without_a_team_redirect_safely_without_server_errors(): void
    {
        $pendingWithoutTeam = User::factory()->create([
            'user_type' => UserType::Student,
            'verification_status' => VerificationStatus::Pending,
        ]);
        $pendingWithoutTeam->forceFill(['current_team_id' => null])->save();
        $pendingWithoutTeam->teams()->detach();
        $pendingWithoutTeam->refresh();

        $this->actingAs($pendingWithoutTeam)->get(route('tasks.create'))
            ->assertRedirect(route('taskmate.dashboard'));

        config(['taskmate.student_verification.unverified_students_can_browse' => false]);
        $this->actingAs($pendingWithoutTeam)->get(route('browse.index'))
            ->assertRedirect(route('taskmate.dashboard'));

        $moreInfoWithoutTeam = User::factory()->create([
            'user_type' => UserType::Student,
            'verification_status' => VerificationStatus::MoreInfoRequested,
        ]);
        $moreInfoWithoutTeam->forceFill(['current_team_id' => null])->save();
        $moreInfoWithoutTeam->teams()->detach();
        $moreInfoWithoutTeam->refresh();

        $this->actingAs($moreInfoWithoutTeam)->put(route('verification.details.update'), [
            'id_number' => '  FAKE-STU-999  ',
            'affiliation' => '  College of Nursing  ',
        ])->assertRedirect(route('taskmate.dashboard'));

        $this->assertSame('FAKE-STU-999', $moreInfoWithoutTeam->fresh()->id_number);
        $this->assertSame('College of Nursing', $moreInfoWithoutTeam->fresh()->affiliation);
    }

    public function test_registration_accepts_first_name_optional_middle_initial_and_last_name_and_composes_full_name(): void
    {
        $this->post(route('register.store'), [
            'user_type' => 'student',
            'first_name' => '  Kim   Hie ',
            'middle_initial' => ' f ',
            'last_name' => '  Tee  ',
            'email' => 'structured.name@gmail.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertRedirect(route('dashboard'));

        $withMi = User::query()->where('email', 'structured.name@gmail.com')->firstOrFail();
        $this->assertSame('Kim Hie', $withMi->first_name);
        $this->assertSame('F.', $withMi->middle_initial);
        $this->assertSame('Tee', $withMi->last_name);
        $this->assertSame('Kim Hie F. Tee', $withMi->name);

        auth()->logout();

        $this->post(route('register.store'), [
            'user_type' => 'student',
            'first_name' => 'Ma. Elena',
            'middle_initial' => '',
            'last_name' => 'Niño-Santos Jr.',
            'email' => 'no.mi@gmail.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertRedirect(route('dashboard'));

        $withoutMi = User::query()->where('email', 'no.mi@gmail.com')->firstOrFail();
        $this->assertSame('Ma. Elena', $withoutMi->first_name);
        $this->assertNull($withoutMi->middle_initial);
        $this->assertSame('Niño-Santos Jr.', $withoutMi->last_name);
        $this->assertSame('Ma. Elena Niño-Santos Jr.', $withoutMi->name);

        auth()->logout();

        $this->from(route('register'))->post(route('register.store'), [
            'user_type' => 'student',
            'first_name' => '12345',
            'middle_initial' => '9',
            'last_name' => '',
            'email' => 'bad.structured@gmail.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertSessionHasErrors(['first_name', 'middle_initial', 'last_name']);
    }

    /** @return array<string, string> */
    private function validStudent(): array
    {
        return [
            ...$this->baseRegistration('student@cmu.edu.ph'),
            'user_type' => 'student',
            'id_number' => 'FAKE-STU-101',
            'affiliation' => 'Synthetic College and Program',
        ];
    }

    /** @return array<string, string> */
    private function baseRegistration(string $email): array
    {
        return [
            'name' => 'Synthetic Test Applicant',
            'email' => $email,
            'password' => 'password',
            'password_confirmation' => 'password',
        ];
    }
}
