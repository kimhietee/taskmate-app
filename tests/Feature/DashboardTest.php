<?php

namespace Tests\Feature;

use App\Enums\SanctionType;
use App\Enums\TeamRole;
use App\Models\Team;
use App\Models\TeamInvitation;
use App\Models\User;
use App\Models\UserSanction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $user = User::factory()->create();
        $team = $user->currentTeam;

        $response = $this->get(route('dashboard'));
        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_visit_the_dashboard()
    {
        $user = User::factory()->create();
        $team = $user->currentTeam;

        $response = $this
            ->actingAs($user)
            ->get(route('dashboard'));

        $response->assertOk();
    }

    public function test_dashboard_receives_the_current_users_account_identity_for_its_account_card(): void
    {
        $user = User::factory()->verified()->create([
            'email' => 'dashboard-owner@example.test',
            'id_number' => 'FAKE-STU-123',
        ]);

        $this->actingAs($user)->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard')
                ->where('accountIdentity.email', 'dashboard-owner@example.test')
                ->where('accountIdentity.idNumber', 'FAKE-STU-123')
                ->missing('accountIdentity.supportingInfo')
                ->missing('auth.user.id_number'),
            );
    }

    public function test_faculty_without_a_team_can_visit_the_canonical_dashboard_path(): void
    {
        $faculty = User::factory()->verified()->facultyStaff()->make([
            'email' => 'faculty-without-team@example.test',
        ]);
        $faculty->save();

        $this->assertNull($faculty->current_team_id);
        $this->assertNull($faculty->personalTeam());

        $this->actingAs($faculty)->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard')
                ->where('auth.user.can_post_tasks', true),
            );
    }

    public function test_verified_student_dashboard_advertises_available_student_and_poster_actions(): void
    {
        config(['taskmate.students_can_post' => true]);
        $user = User::factory()->verified()->create();

        $this->actingAs($user)->get(route('dashboard', $user->currentTeam->slug))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard')
                ->where('auth.user.can_apply_tasks', true)
                ->where('auth.user.can_post_tasks', true),
            );
    }

    public function test_suspended_student_dashboard_does_not_advertise_blocked_actions(): void
    {
        $user = User::factory()->verified()->create();
        UserSanction::factory()->create([
            'user_id' => $user->id,
            'type' => SanctionType::Suspension,
            'starts_at' => now()->subMinute(),
            'ends_at' => now()->addDay(),
        ]);

        $this->actingAs($user)->get(route('dashboard', $user->currentTeam->slug))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard')
                ->where('auth.user.can_apply_tasks', false)
                ->where('auth.user.can_post_tasks', false),
            );
    }

    public function test_dashboard_receives_student_posting_setting_for_accurate_verification_guidance(): void
    {
        $student = User::factory()->create(['user_type' => 'student']);

        config(['taskmate.students_can_post' => false]);
        $this->actingAs($student)->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard')
                ->where('studentsCanPost', false));

        config(['taskmate.students_can_post' => true]);
        $this->actingAs($student)->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('studentsCanPost', true));
    }

    public function test_dashboard_includes_pending_invitations_for_the_authenticated_user()
    {
        $owner = User::factory()->create(['name' => 'Taylor Otwell']);
        $invitedUser = User::factory()->create(['email' => 'invited@example.com']);
        $team = Team::factory()->create(['name' => 'Laravel Team']);

        $team->members()->attach($owner, ['role' => TeamRole::Owner->value]);

        $invitation = TeamInvitation::factory()->create([
            'team_id' => $team->id,
            'email' => 'invited@example.com',
            'invited_by' => $owner->id,
        ]);

        $response = $this
            ->actingAs($invitedUser)
            ->get(route('dashboard'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->has('pendingInvitations', 1)
            ->where('pendingInvitations.0.code', $invitation->code)
            ->where('pendingInvitations.0.inviterName', 'Taylor Otwell')
            ->where('pendingInvitations.0.team.name', 'Laravel Team')
            ->where('pendingInvitations.0.team.slug', $team->slug)
            ->missing('pendingInvitations.0.teamName'),
        );
    }

    public function test_dashboard_does_not_include_accepted_invitations()
    {
        $owner = User::factory()->create();
        $invitedUser = User::factory()->create(['email' => 'invited@example.com']);
        $team = Team::factory()->create();

        $team->members()->attach($owner, ['role' => TeamRole::Owner->value]);

        TeamInvitation::factory()->accepted()->create([
            'team_id' => $team->id,
            'email' => 'invited@example.com',
            'invited_by' => $owner->id,
        ]);

        $response = $this
            ->actingAs($invitedUser)
            ->get(route('dashboard'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->has('pendingInvitations', 0),
        );
    }

    public function test_dashboard_excludes_expired_invitations_without_deleting_them()
    {
        $owner = User::factory()->create();
        $invitedUser = User::factory()->create(['email' => 'invited@example.com']);
        $team = Team::factory()->create();

        $team->members()->attach($owner, ['role' => TeamRole::Owner->value]);

        $invitation = TeamInvitation::factory()->expired()->create([
            'team_id' => $team->id,
            'email' => 'invited@example.com',
            'invited_by' => $owner->id,
        ]);

        $response = $this
            ->actingAs($invitedUser)
            ->get(route('dashboard'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->has('pendingInvitations', 0),
        );

        $this->assertDatabaseHas('team_invitations', [
            'id' => $invitation->id,
        ]);
    }

    public function test_dashboard_does_not_include_or_delete_other_users_invitations()
    {
        $owner = User::factory()->create();
        $invitedUser = User::factory()->create(['email' => 'invited@example.com']);
        $team = Team::factory()->create();

        $team->members()->attach($owner, ['role' => TeamRole::Owner->value]);

        $invitation = TeamInvitation::factory()->expired()->create([
            'team_id' => $team->id,
            'email' => 'someone@example.com',
            'invited_by' => $owner->id,
        ]);

        $response = $this
            ->actingAs($invitedUser)
            ->get(route('dashboard'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->has('pendingInvitations', 0),
        );

        $this->assertDatabaseHas('team_invitations', [
            'id' => $invitation->id,
        ]);
    }
}
