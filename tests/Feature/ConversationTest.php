<?php

namespace Tests\Feature;

use App\Enums\ApplicationStatus;
use App\Enums\AgreementStatus;
use App\Enums\ReportStatus;
use App\Enums\TaskStatus;
use App\Models\Application;
use App\Models\Agreement;
use App\Models\ContentFlag;
use App\Models\Conversation;
use App\Models\ConversationEvent;
use App\Models\ConversationMessage;
use App\Models\Report;
use App\Models\Task;
use App\Models\User;
use App\Services\ConversationWorkflow;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ConversationTest extends TestCase
{
    use RefreshDatabase;

    public function test_only_the_two_task_roles_can_read_and_send_and_alerts_never_include_message_text(): void
    {
        [$poster, $applicant, $task, $application, $conversation] = $this->conversation();
        $outsider = User::factory()->verified()->create();
        $admin = User::factory()->verified()->create();
        $admin->forceFill(['is_admin' => true])->save();

        $this->actingAs($poster)->get(route('messages.show', $conversation))->assertOk();
        $this->actingAs($applicant)->get(route('messages.show', $conversation))->assertOk();
        auth()->logout();
        $this->get(route('messages.show', $conversation))->assertRedirect(route('login'));
        $this->actingAs($outsider)->get(route('messages.show', $conversation))->assertForbidden();
        $this->actingAs($admin)->get(route('messages.show', $conversation))->assertForbidden();
        $this->actingAs($applicant)->post(route('messages.send', $conversation), ['body' => 'Please message me on Telegram'])
            ->assertRedirect(route('messages.show', $conversation));
        $this->post(route('messages.send', $conversation), ['body' => 'Please message me on Telegram again'])
            ->assertRedirect(route('messages.show', $conversation));
        $this->assertDatabaseHas('conversation_messages', ['conversation_id' => $conversation->id, 'sender_id' => $applicant->id, 'body' => 'Please message me on Telegram']);
        $this->assertDatabaseHas('content_flags', ['flaggable_type' => (new ConversationMessage)->getMorphClass(), 'category' => 'move_chat_outside']);

        $this->actingAs($poster)->post(route('messages.send', $conversation), ['body' => 'Paid via GCash after completion'])
            ->assertRedirect(route('messages.show', $conversation));
        $this->assertDatabaseMissing('content_flags', ['flaggable_type' => (new ConversationMessage)->getMorphClass(), 'category' => 'external_payment']);
        $this->assertSame(1, $poster->notifications()->where('data->event', 'conversation.message')->count());
        $notification = $poster->notifications()->get()->first(fn ($item) => ($item->data['event'] ?? null) === 'conversation.message');
        $this->assertNotNull($notification);
        $notificationData = $notification->data;
        $this->assertSame('conversation.message', $notificationData['event']);
        $this->assertSame(2, $notificationData['count']);
        $this->assertSame(route('messages.show', $conversation, false), $notificationData['url']);
        $this->assertStringContainsString($applicant->name, $notificationData['body']);
        $this->assertStringContainsString($task->title, $notificationData['title']);
        $this->assertStringNotContainsString('Telegram', json_encode($notificationData));
        $this->assertStringNotContainsString('GCash', json_encode($notificationData));

        $summary = $this->actingAs($poster)->getJson(route('notifications.summary'))->assertOk()->assertJsonPath('unreadMessages', 1);
        $this->assertSame(1, $summary->json('unreadCount'));
        $this->get(route('messages.show', $conversation))->assertOk();
        $this->assertSame(0, app(ConversationWorkflow::class)->unreadCount($poster));
        $this->actingAs($outsider)->get(route('messages.updates', [$conversation, 'after_id' => 0]))->assertForbidden();
        $this->actingAs($applicant)->getJson(route('messages.updates', [$conversation, 'after_id' => 1]))
            ->assertOk()->assertJsonCount(2, 'messages')->assertJsonPath('messages.0.id', 2)->assertJsonPath('messages.1.id', 3);

        $this->actingAs($poster)->get(route('messages.show', $conversation))->assertInertia(fn (Assert $page) => $page
            ->component('messages/show')
            ->where('messages.0.flaggedForRecipient', true)
            ->where('messages.0.isMine', false)
            ->missing('conversation.otherPerson.email')
            ->missing('conversation.otherPerson.idNumber')
            ->missing('messages.0.email')
            ->missing('messages.0.idNumber'));
        $this->assertDatabaseHas('applications', ['id' => $application->id, 'task_id' => $task->id]);
    }

    public function test_message_validation_close_and_reopen_are_explicit_and_append_only(): void
    {
        [$poster, $applicant, , , $conversation] = $this->conversation();
        config(['taskmate.messages.max_length' => 20]);
        $this->actingAs($applicant)->from(route('messages.show', $conversation))->post(route('messages.send', $conversation), ['body' => " \t "])
            ->assertSessionHasErrors('body')->assertSessionMissing('_old_input.body');
        $this->post(route('messages.send', $conversation), ['body' => str_repeat('x', 21)])->assertSessionHasErrors('body');
        $this->post(route('messages.send', $conversation), ['body' => 'Useful short message'])->assertRedirect();

        config(['taskmate.messages.rate_limit_per_minute' => 1]);
        RateLimiter::clear('conversation-message:'.$applicant->id);
        $this->post(route('messages.send', $conversation), ['body' => 'First limited message'])->assertRedirect();
        $this->from(route('messages.show', $conversation))->post(route('messages.send', $conversation), ['body' => 'Second limited message'])
            ->assertSessionHasErrors('body');
        RateLimiter::clear('conversation-message:'.$applicant->id);

        $this->post(route('messages.close', $conversation))->assertRedirect();
        $conversation->refresh();
        $this->assertSame($applicant->id, $conversation->closed_by);
        $this->assertDatabaseHas('conversation_events', ['conversation_id' => $conversation->id, 'user_id' => $applicant->id, 'event' => 'closed']);
        $this->post(route('messages.send', $conversation), ['body' => 'blocked'])->assertForbidden();
        $this->actingAs($poster)->post(route('messages.reopen', $conversation))->assertForbidden();
        $this->actingAs($applicant)->post(route('messages.reopen', $conversation))->assertRedirect();
        $this->assertNull($conversation->fresh()->closed_at);
        $this->assertDatabaseHas('conversation_events', ['conversation_id' => $conversation->id, 'user_id' => $applicant->id, 'event' => 'reopened']);

        $this->actingAs($poster)->post(route('messages.close', $conversation))->assertRedirect();
        $this->actingAs($applicant)->post(route('messages.reopen', $conversation))->assertForbidden();
        $this->actingAs($poster)->post(route('messages.reopen', $conversation))->assertRedirect();

        $message = ConversationMessage::query()->firstOrFail();
        $this->expectException(\LogicException::class);
        $message->body = 'changed';
        $message->save();
    }

    public function test_read_only_reasons_follow_application_and_task_state_and_completed_reports(): void
    {
        [, $applicant, $task, $application, $conversation] = $this->conversation();
        $application->status = ApplicationStatus::Declined;
        $application->save();
        $this->assertStringContainsString('application was declined', $conversation->fresh()->sendingBlockedReason($applicant));

        foreach ([ApplicationStatus::Withdrawn, ApplicationStatus::Cancelled] as $status) {
            $application->status = $status;
            $application->save();
            $this->assertNotNull($conversation->fresh()->sendingBlockedReason($applicant));
        }

        $application->status = ApplicationStatus::Pending;
        $application->save();
        foreach ([TaskStatus::Cancelled, TaskStatus::Rejected, TaskStatus::Removed] as $status) {
            $task->status = $status;
            $task->save();
            $this->assertNotNull($conversation->fresh()->sendingBlockedReason($applicant));
        }

        $task->status = TaskStatus::Completed;
        $task->save();
        $this->assertStringContainsString('task is complete', $conversation->fresh()->sendingBlockedReason($applicant));
        $agreement = Agreement::factory()->for($task)->for($application)->for($task->poster, 'poster')->for($applicant, 'student')->create([
            'status' => AgreementStatus::Agreed,
            'locked_at' => now(),
        ]);
        Report::factory()->create([
            'reporter_id' => $applicant->id,
            'reported_user_id' => $task->poster_id,
            'task_id' => $task->id,
            'agreement_id' => $agreement->id,
            'status' => ReportStatus::Open,
        ]);
        $this->assertNull($conversation->fresh()->sendingBlockedReason($applicant));
        Report::query()->update(['status' => ReportStatus::Resolved]);
        $this->assertStringContainsString('task is complete', $conversation->fresh()->sendingBlockedReason($applicant));
    }

    public function test_suspended_participant_can_read_but_cannot_send_and_unverified_users_are_blocked(): void
    {
        [$poster, $applicant, , , $conversation] = $this->conversation();
        $suspension = \App\Models\UserSanction::factory()->for($applicant)->create([
            'type' => \App\Enums\SanctionType::Suspension,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addDay(),
        ]);
        $this->actingAs($applicant)->get(route('messages.show', $conversation))->assertOk();
        $this->post(route('messages.send', $conversation), ['body' => 'I can still read'])->assertForbidden();
        $suspension->forceFill(['lifted_at' => now(), 'lifted_by' => $poster->id, 'lift_note' => 'Synthetic test lift'])->save();
        $applicant->forceFill(['verification_status' => 'pending'])->save();
        $this->get(route('messages.show', $conversation))->assertRedirect(route('dashboard'));
    }

    public function test_reported_message_freezes_limited_context_and_admins_never_get_thread_access(): void
    {
        config(['taskmate.messages.report_context_messages' => 1]);
        [$poster, $applicant, , , $conversation] = $this->conversation();
        $ids = [];
        foreach (['Older message not shared', 'Context before', 'Reported content', 'Context after', 'Newer message not shared'] as $index => $body) {
            $message = new ConversationMessage;
            $message->conversation_id = $conversation->id;
            $message->sender_id = $index === 2 ? $poster->id : $applicant->id;
            $message->body = $body;
            $message->created_at = now()->addSeconds($index);
            $message->save();
            $ids[] = $message->id;
        }
        $this->actingAs($applicant)->post(route('messages.report', [$conversation, $ids[2]]), [
            'type' => 'harassment',
            'description' => 'Synthetic report description.',
        ])->assertRedirect();
        $report = Report::query()->firstOrFail();
        $this->assertDatabaseCount('report_message_snapshots', 3);
        $this->assertDatabaseHas('report_message_snapshots', ['report_id' => $report->id, 'message_id' => $ids[2], 'is_reported_message' => true]);
        $this->assertDatabaseMissing('report_message_snapshots', ['message_id' => $ids[0]]);
        $this->assertDatabaseMissing('report_message_snapshots', ['message_id' => $ids[4]]);
        $later = new ConversationMessage;
        $later->conversation_id = $conversation->id;
        $later->sender_id = $applicant->id;
        $later->body = 'A later message must stay outside the frozen report.';
        $later->created_at = now()->addMinute();
        $later->save();
        $this->assertDatabaseMissing('report_message_snapshots', ['message_id' => $later->id]);
        $this->assertDatabaseMissing('notifications', ['notifiable_id' => $poster->id, 'data->event' => 'report.filed']);

        $admin = User::factory()->verified()->create();
        $admin->forceFill(['is_admin' => true])->save();
        $this->actingAs($admin)->get(route('messages.index'))->assertForbidden();
        $this->get(route('messages.show', $conversation))->assertForbidden();
        $this->get(route('messages.updates', $conversation))->assertForbidden();
        $this->get(route('admin.reports.show', $report))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('report.messageSnapshots', fn ($snapshots) => count($snapshots) === 3)
            ->missing('report.agreement.messages'));

        $flag = new ContentFlag;
        $flag->flaggable()->associate($conversation->messages()->whereKey($ids[2])->firstOrFail());
        $flag->source_user_id = $poster->id;
        $flag->category = 'bypass_agreement';
        $flag->matched = ['Skip agreement'];
        $flag->field = 'body';
        $flag->save();
        $this->get(route('admin.flags.show', $flag))->assertInertia(fn (Assert $page) => $page
            ->where('flag.content', 'Reported content')
            ->missing('messages')
            ->missing('conversation'));
    }

    public function test_pending_applicant_remains_able_to_message_while_another_application_is_accepted(): void
    {
        [$poster, $firstApplicant, $task, , $firstConversation] = $this->conversation();
        $secondApplicant = User::factory()->verified()->create();
        $secondApplication = Application::factory()->for($task)->for($secondApplicant, 'applicant')->create(['status' => ApplicationStatus::Pending]);
        $secondConversation = app(ConversationWorkflow::class)->createForApplication($secondApplication);
        $firstApplication = $firstConversation->application;
        $firstApplication->status = ApplicationStatus::Accepted;
        $firstApplication->save();
        $task->status = TaskStatus::Assigned;
        $task->save();

        $this->actingAs($secondApplicant)->post(route('messages.send', $secondConversation), ['body' => 'Following up on my application'])->assertRedirect();
        $this->assertNull($secondConversation->fresh()->sendingBlockedReason($secondApplicant));
        $this->assertSame($poster->id, $secondConversation->poster_id);
        $this->assertNotSame($firstApplicant->id, $secondConversation->applicant_id);
    }

    public function test_a_student_can_be_poster_and_applicant_in_different_conversations(): void
    {
        $student = User::factory()->verified()->create();
        $otherApplicant = User::factory()->verified()->create();
        $otherPoster = User::factory()->verified()->facultyStaff()->create();
        $studentTask = Task::factory()->approved()->for($student, 'poster')->create([
            'work_mode' => 'remote', 'workplace_name' => null, 'workplace_address' => null, 'workplace_setting' => null,
        ]);
        $otherTask = Task::factory()->approved()->for($otherPoster, 'poster')->create([
            'work_mode' => 'remote', 'workplace_name' => null, 'workplace_address' => null, 'workplace_setting' => null,
        ]);
        $asPoster = Application::factory()->for($studentTask)->for($otherApplicant, 'applicant')->create();
        $asApplicant = Application::factory()->for($otherTask)->for($student, 'applicant')->create();
        $posterConversation = app(ConversationWorkflow::class)->createForApplication($asPoster);
        $applicantConversation = app(ConversationWorkflow::class)->createForApplication($asApplicant);

        $this->actingAs($student)->post(route('messages.send', $posterConversation), ['body' => 'Hello from the poster role'])->assertRedirect();
        $this->post(route('messages.send', $applicantConversation), ['body' => 'Hello from the applicant role'])->assertRedirect();
        $this->assertSame($student->id, $posterConversation->poster_id);
        $this->assertSame($student->id, $applicantConversation->applicant_id);
        $this->assertDatabaseCount('conversation_messages', 2);
    }

    /** @return array{User, User, Task, Application, Conversation} */
    private function conversation(): array
    {
        $poster = User::factory()->verified()->facultyStaff()->create();
        $applicant = User::factory()->verified()->create();
        $task = Task::factory()->approved()->for($poster, 'poster')->create([
            'work_mode' => 'remote', 'workplace_name' => null, 'workplace_address' => null, 'workplace_setting' => null,
        ]);
        $application = Application::factory()->for($task)->for($applicant, 'applicant')->create();
        $conversation = app(ConversationWorkflow::class)->createForApplication($application);
        return [$poster, $applicant, $task, $application, $conversation];
    }
}
