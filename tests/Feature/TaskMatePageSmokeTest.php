<?php

namespace Tests\Feature;

use App\Enums\AgreementStatus;
use App\Enums\ApplicationStatus;
use App\Enums\ReportStatus;
use App\Enums\ReportType;
use App\Enums\TaskStatus;
use App\Models\Agreement;
use App\Models\AgreementVersion;
use App\Models\Application;
use App\Models\ContentFlag;
use App\Models\Conversation;
use App\Models\ConversationMessage;
use App\Models\Report;
use App\Models\Rating;
use App\Models\Task;
use App\Models\User;
use App\Services\AgreementContentHasher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskMatePageSmokeTest extends TestCase
{
    use RefreshDatabase;

    public function test_taskmate_get_pages_render_for_their_relevant_roles_without_server_errors(): void
    {
        $poster = User::factory()->verified()->facultyStaff()->create();
        $student = User::factory()->verified()->create();
        $admin = User::factory()->verified()->create();
        $admin->forceFill(['is_admin' => true])->save();

        $task = Task::factory()->for($poster, 'poster')->assigned()->create(['work_mode' => 'remote', 'workplace_name' => null, 'workplace_address' => null, 'workplace_setting' => null]);
        $application = Application::factory()->for($task)->for($student, 'applicant')->accepted()->create();
        $conversation = new Conversation;
        $conversation->application_id = $application->id;
        $conversation->task_id = $task->id;
        $conversation->poster_id = $poster->id;
        $conversation->applicant_id = $student->id;
        $conversation->save();
        $message = new ConversationMessage;
        $message->conversation_id = $conversation->id;
        $message->sender_id = $poster->id;
        $message->body = 'Synthetic smoke-test private message.';
        $message->created_at = now();
        $message->save();
        $agreement = Agreement::factory()->for($task)->for($application)->for($poster, 'poster')->for($student, 'student')->create([
            'status' => AgreementStatus::Negotiating,
        ]);
        $version = new AgreementVersion;
        $version->agreement_id = $agreement->id;
        $version->version_number = 1;
        $version->proposed_by = $poster->id;
        $version->deliverables = 'Synthetic deliverable.';
        $version->terms = 'Synthetic terms.';
        $version->final_amount = 500;
        $version->start_date = today()->addDay();
        $version->due_date = today()->addWeek();
        $version->work_mode = 'remote';
        $version->payment_arrangement = 'Direct payment after completion.';
        $version->created_at = now();
        $version->content_hash = app(AgreementContentHasher::class)->hash($version);
        $version->save();
        $agreement->current_version_id = $version->id;
        $agreement->save();
        $rating = Rating::factory()->for($agreement)->create();

        $report = Report::factory()->for($student, 'reporter')->for($poster, 'reportedUser')->for($task)->for($agreement)->create([
            'type' => ReportType::NonPayment,
            'description' => 'Synthetic smoke-test report.',
            'status' => ReportStatus::Open,
            'priority' => 'normal',
        ]);
        $flag = new ContentFlag;
        $flag->flaggable()->associate($task);
        $flag->source_user_id = $poster->id;
        $flag->category = 'bypass_agreement';
        $flag->matched = ['Skip the agreement'];
        $flag->field = 'description';
        $flag->save();
        $messageFlag = new ContentFlag;
        $messageFlag->flaggable()->associate($message);
        $messageFlag->source_user_id = $poster->id;
        $messageFlag->category = 'bypass_agreement';
        $messageFlag->matched = ['Skip the agreement'];
        $messageFlag->field = 'body';
        $messageFlag->save();
        $draft = Task::factory()->for($poster, 'poster')->create(['work_mode' => 'remote', 'workplace_name' => null, 'workplace_address' => null, 'workplace_setting' => null]);
        $reopenedTask = Task::factory()->approved()->for($poster, 'poster')->create(['work_mode' => 'remote', 'workplace_name' => null, 'workplace_address' => null, 'workplace_setting' => null]);
        $cancelledWorker = User::factory()->verified()->create();
        $cancelledApplication = Application::factory()->for($reopenedTask)->for($cancelledWorker, 'applicant')->create([
            'status' => ApplicationStatus::Cancelled,
            'responded_at' => now(),
        ]);
        $cancelledAgreement = Agreement::factory()->for($reopenedTask)->for($cancelledApplication)->for($poster, 'poster')->for($cancelledWorker, 'student')->create([
            'status' => AgreementStatus::Cancelled,
            'cancelled_at' => now(),
            'cancelled_by' => $poster->id,
            'cancellation_reason' => 'Synthetic smoke-test cancellation.',
        ]);

        $urls = [
            'home' => route('home'),
            'notifications.index' => route('notifications.index'),
            'notifications.summary' => route('notifications.summary'),
            'messages.index' => route('messages.index'),
            'messages.show' => route('messages.show', $conversation),
            'messages.updates' => route('messages.updates', $conversation),
            'static.how-it-works' => route('static.how-it-works'),
            'static.task-guidelines' => route('static.task-guidelines'),
            'static.safety' => route('static.safety'),
            'static.privacy' => route('static.privacy'),
            'login' => route('login'),
            'register' => route('register'),
            'password.request' => route('password.request'),
            'admin.dashboard' => route('admin.dashboard'),
            'admin.users.index' => route('admin.users.index'),
            'admin.users.show' => route('admin.users.show', $student),
            'admin.tasks.index' => route('admin.tasks.index'),
            'admin.tasks.show' => route('admin.tasks.show', $task),
            'admin.agreements.show' => route('admin.agreements.show', $agreement),
            'admin.flags.index' => route('admin.flags.index'),
            'admin.flags.show' => route('admin.flags.show', $flag),
            'admin.flags.message' => route('admin.flags.show', $messageFlag),
            'admin.reports.index' => route('admin.reports.index'),
            'admin.reports.show' => route('admin.reports.show', $report),
            'admin.ratings.index' => route('admin.ratings.index'),
            'admin.ratings.show' => route('admin.ratings.show', $rating),
            'agreements.show' => route('agreements.show', $agreement),
            'agreements.show.cancelled' => route('agreements.show', $cancelledAgreement),
            'agreements.rate' => route('agreements.rate', $agreement),
            'browse.index' => route('browse.index'),
            'browse.show' => route('browse.show', Task::factory()->approved()->create(['poster_id' => $poster->id, 'work_mode' => 'remote', 'workplace_name' => null, 'workplace_address' => null, 'workplace_setting' => null])),
            'applications.mine' => route('applications.mine'),
            'applications.task' => route('applications.task', $application),
            'reports.mine' => route('reports.mine'),
            'reports.show' => route('reports.show', $report),
            'sanctions.mine' => route('sanctions.mine'),
            'tasks.mine' => route('tasks.mine'),
            'tasks.create' => route('tasks.create'),
            'tasks.show' => route('tasks.show', $task),
            'tasks.show.reopened' => route('tasks.show', $reopenedTask),
            'tasks.edit' => route('tasks.edit', $draft),
            'agreements.create' => route('agreements.create', $task),
            'users.show' => route('users.show', $poster),
            'appearance.edit' => route('appearance.edit'),
            'profile.edit' => route('profile.edit'),
            'class-schedule.edit' => route('class-schedule.edit'),
            'security.edit' => route('security.edit'),
        ];

        foreach ($urls as $name => $url) {
            $actor = match (true) {
                str_starts_with($name, 'admin.') => $admin,
                in_array($name, ['browse.index', 'browse.show', 'applications.mine', 'applications.task', 'agreements.show', 'agreements.rate', 'reports.mine', 'reports.show', 'users.show', 'class-schedule.edit'], true) => $student,
                default => $poster,
            };
            if (in_array($name, ['home', 'static.how-it-works', 'static.task-guidelines', 'static.safety', 'static.privacy', 'login', 'register', 'password.request'], true)) {
                $response = $this->get($url);
            } else {
                $response = $this->actingAs($actor)->get($url);
            }

            $this->assertNotSame(500, $response->getStatusCode(), "{$name} returned HTTP 500.");
        }

        $student->forceFill(['verification_status' => 'more_info_requested'])->save();
        $this->actingAs($student)->get(route('verification.details.edit'))->assertOk();

        $unverifiedStudent = User::factory()->unverifiedStudent()->create();
        $this->actingAs($unverifiedStudent)->get(route('verification.student.show'))->assertOk();
    }
}
