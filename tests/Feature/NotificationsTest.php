<?php

namespace Tests\Feature;

use App\Models\Task;
use App\Models\User;
use App\Models\UserSanction;
use App\Enums\SanctionType;
use App\Notifications\TaskMateAlert;
use App\Notifications\TaskMateAlertCatalog;
use App\Services\TaskMateNotifications;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class NotificationsTest extends TestCase
{
    use RefreshDatabase;

    private function student(): User
    {
        return User::factory()->verified()->create(['email' => fake()->unique()->numerify('student####@example.test')]);
    }

    private function poster(): User
    {
        return User::factory()->verified()->facultyStaff()->create(['email' => fake()->unique()->numerify('poster####@example.test')]);
    }

    public function test_registration_sends_separate_admin_alerts_without_notifying_the_actor(): void
    {
        $firstAdmin = $this->poster();
        $firstAdmin->forceFill(['is_admin' => true])->save();
        $secondAdmin = $this->poster();
        $secondAdmin->forceFill(['is_admin' => true])->save();

        $this->post(route('register.store'), [
            'name' => 'Synthetic New Account', 'email' => 'new-account@cmu.edu.ph',
            'user_type' => 'student', 'id_number' => 'FAKE-NTF-01', 'affiliation' => 'Synthetic College',
            'password' => 'password', 'password_confirmation' => 'password',
        ])->assertRedirect();

        $this->assertSame(1, $firstAdmin->notifications()->count());
        $this->assertSame(1, $secondAdmin->notifications()->count());
        $this->assertSame('account.awaiting_review', $firstAdmin->notifications()->first()->data['event']);
        $newUser = User::query()->where('email', 'new-account@cmu.edu.ph')->firstOrFail();
        $this->assertSame(0, $newUser->notifications()->count());
        $this->assertNotSame($firstAdmin->notifications()->first()->id, $secondAdmin->notifications()->first()->id);
    }

    public function test_new_application_and_acceptance_alert_only_the_intended_other_party(): void
    {
        $poster = $this->poster();
        $applicant = $this->student();
        $task = Task::factory()->approved()->for($poster, 'poster')->create(['work_mode' => 'remote', 'workplace_name' => null, 'workplace_address' => null, 'workplace_setting' => null]);

        $this->actingAs($applicant)->post(route('applications.store', $task), [
            'message' => 'Synthetic interest message.',
            'work_details_confirmed' => '1',
            'poster_identity_checked' => '1',
            'no_upfront_fee_checked' => '1',
        ])->assertRedirect();
        $this->assertSame('application.new', $poster->notifications()->firstOrFail()->data['event']);
        $this->assertSame(0, $applicant->notifications()->count());
        $application = $task->applications()->firstOrFail();

        $this->actingAs($poster)->post(route('tasks.applications.accept', [$task, $application]))->assertRedirect();
        $this->assertSame('application.accepted', $applicant->notifications()->firstOrFail()->data['event']);
        $this->assertSame(1, $poster->notifications()->count());
        $this->assertSame('/my-applications', $applicant->notifications()->first()->data['url']);
    }

    public function test_notification_page_and_summary_are_private_and_read_actions_are_owner_scoped(): void
    {
        $owner = $this->student();
        $other = $this->student();
        $alert = ['event' => 'application.accepted', 'title' => 'Application accepted', 'body' => 'Your application was accepted.', 'url' => '/my-applications', 'related_ids' => ['task_id' => 42]];
        $owner->notify(new TaskMateAlert($alert));
        $otherAlert = new TaskMateAlert([...$alert, 'body' => 'Private alert for another user.']);
        $other->notify($otherAlert);
        $otherNotificationId = $other->notifications()->firstOrFail()->id;

        $this->get(route('notifications.index'))->assertRedirect(route('login'));
        $this->actingAs($owner)->get(route('notifications.index'))->assertOk()->assertInertia(fn ($page) => $page
            ->component('notifications/index')->where('alerts.data.0.event', 'application.accepted')->missing('alerts.data.0.data'));
        $this->get(route('notifications.summary'))->assertOk()->assertJsonCount(1, 'latest')->assertJsonMissing(['body' => 'Private alert for another user.']);
        $this->get(route('notifications.open', $otherNotificationId))->assertNotFound();

        $ownId = $owner->notifications()->firstOrFail()->id;
        $this->post(route('notifications.read-all'))->assertRedirect();
        $this->assertNotNull($owner->notifications()->findOrFail($ownId)->read_at);
        $this->assertNull($other->notifications()->firstOrFail()->read_at);
    }

    public function test_summary_throttle_allows_tab_polling_and_returns_json_429_when_exceeded(): void
    {
        $user = $this->student();
        config(['taskmate.notifications.throttle_per_minute' => 120]);
        $this->actingAs($user);
        for ($i = 0; $i < 24; $i++) $this->getJson(route('notifications.summary'))->assertOk();

        config(['taskmate.notifications.throttle_per_minute' => 2]);
        $limitedUser = $this->student();
        $this->actingAs($limitedUser)->getJson(route('notifications.summary'))->assertOk();
        $this->getJson(route('notifications.summary'))->assertOk();
        $this->getJson(route('notifications.summary'))->assertStatus(429)->assertJsonStructure(['message'])->assertHeader('Retry-After');
    }

    public function test_after_commit_notifications_are_discarded_when_the_action_rolls_back(): void
    {
        $user = $this->student();
        try {
            DB::transaction(function () use ($user): void {
                app(TaskMateNotifications::class)->send($user, 'account.approved', '/notifications', ['user_id' => $user->id]);
                throw new \RuntimeException('Rollback notification test.');
            });
        } catch (\RuntimeException) {
            // Expected rollback for this test.
        }
        $this->assertSame(0, $user->notifications()->count());
    }

    public function test_notification_catalog_has_no_private_or_moderation_content(): void
    {
        $forbidden = ['email', 'id_number', 'supporting_info', 'risk_level', 'risk_score', 'screening', 'admin note', 'internal note', 'rating score', 'reporter identity', 'evidence content'];
        foreach (TaskMateAlertCatalog::all() as $event => $copy) {
            $text = strtolower($event.' '.$copy['title'].' '.$copy['body']);
            foreach ($forbidden as $term) $this->assertStringNotContainsString($term, $text, "Unsafe notification copy for {$event}.");
            $this->assertDoesNotMatchRegularExpression('/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i', $text, "Email-like data in {$event}.");
        }
    }

    public function test_prune_command_does_nothing_when_retention_is_null_and_deletes_expired_alerts_when_set(): void
    {
        $user = $this->student();
        $user->notify(new TaskMateAlert(['event' => 'account.approved', 'title' => 'Verified', 'body' => 'Status updated.', 'url' => '/notifications', 'related_ids' => []]));
        $user->notifications()->firstOrFail()->forceFill(['created_at' => now()->subDays(40)])->save();

        config(['taskmate.notifications.retention_days' => null]);
        $this->artisan('taskmate:prune-notifications')->assertSuccessful();
        $this->assertSame(1, $user->notifications()->count());
        config(['taskmate.notifications.retention_days' => 30]);
        $this->artisan('taskmate:prune-notifications')->assertSuccessful();
        $this->assertSame(0, $user->notifications()->count());
    }

    public function test_admin_notifications_are_independent_per_admin(): void
    {
        $first = $this->poster(); $first->forceFill(['is_admin' => true])->save();
        $second = $this->poster(); $second->forceFill(['is_admin' => true])->save();
        app(TaskMateNotifications::class)->admins('flag.new', '/admin/flags', ['flag_id' => 10]);
        $firstNotification = $first->notifications()->firstOrFail();
        $secondNotification = $second->notifications()->firstOrFail();
        $firstNotification->markAsRead();
        $this->assertNotNull($first->notifications()->first()->read_at);
        $this->assertNull($second->notifications()->first()->read_at);
    }

    public function test_suspended_users_can_still_read_and_mark_alerts(): void
    {
        $user = $this->student();
        $user->notify(new TaskMateAlert(['event' => 'account.approved', 'title' => 'Account verified', 'body' => 'Your account was verified.', 'url' => '/notifications', 'related_ids' => []]));
        UserSanction::factory()->create([
            'user_id' => $user->id,
            'type' => SanctionType::Suspension,
            'starts_at' => now()->subMinute(),
            'ends_at' => now()->addDay(),
        ]);

        $this->actingAs($user)->get(route('notifications.index'))->assertOk();
        $this->getJson(route('notifications.summary'))->assertOk()->assertJsonPath('unreadCount', 1);
        $this->post(route('notifications.read-all'))->assertRedirect();
        $this->assertNotNull($user->notifications()->firstOrFail()->fresh()->read_at);
    }
}
