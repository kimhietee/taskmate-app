<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Task;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\UploadedFile;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PrivacyAuditTest extends TestCase
{
    use RefreshDatabase;

    public function test_every_registered_route_has_an_explicit_access_expectation(): void
    {
        $expected = require base_path('tests/Fixtures/web-route-access.php');
        $actors = ['guest', 'unverified', 'verified_student', 'verified_faculty_staff', 'verified_organization', 'admin', 'suspended', 'banned'];
        $actual = [];
        foreach (Route::getRoutes() as $route) {
            $key = $route->getName() ?: implode('|', $route->methods()).' '.$route->uri();
            $actual[$key] = array_values(array_filter($route->gatherMiddleware(), fn ($middleware) => $middleware !== 'web'));
        }
        ksort($actual); ksort($expected);
        $this->assertSame(array_keys($expected), array_keys($actual), 'Every route needs a reviewed entry in tests/Fixtures/web-route-access.php.');
        foreach ($actual as $key => $middleware) {
            $declared = $expected[$key]['middleware']; sort($middleware); sort($declared);
            $this->assertSame($declared, $middleware, "Review the access middleware for route {$key}.");
            $actorOutcomes = $expected[$key]['actors'];
            $this->assertSame($actors, array_keys($actorOutcomes), "List an expected outcome for every actor on {$key}.");
            $this->assertContainsOnly('string', array_values($actorOutcomes));
            $this->assertEmpty(array_diff(array_values($actorOutcomes), ['allowed', 'redirect', 'forbidden']), "Use an explicit outcome for every actor on {$key}.");
            if (in_array('admin', $middleware, true)) {
                $this->assertSame('allowed', $actorOutcomes['admin']);
                foreach (array_diff($actors, ['admin', 'guest', 'banned']) as $actor) $this->assertSame('forbidden', $actorOutcomes[$actor]);
            }
            if (in_array('can.apply', $middleware, true)) $this->assertSame('allowed', $actorOutcomes['verified_student']);
            if (in_array('can.post', $middleware, true)) {
                $this->assertSame('allowed', $actorOutcomes['verified_student']);
                $this->assertSame('allowed', $actorOutcomes['verified_faculty_staff']);
                $this->assertSame('allowed', $actorOutcomes['verified_organization']);
            }
        }
    }

    public function test_shared_page_props_do_not_expose_owner_email_or_private_identity_data(): void
    {
        $student = User::factory()->verified()->create(['email' => 'student.private@example.test', 'id_number' => 'FAKE-PRIVATE-1']);
        $this->actingAs($student)->get('/users/'.$student->id)->assertInertia(fn (Assert $page) => $page
            ->component('users/show')
            ->missing('auth.user.email')
            ->missing('auth.user.id_number')
            ->missing('auth.user.supporting_info')
            ->missing('profile.email')
            ->missing('profile.idNumber')
            ->missing('profile.supportingInfo'));
    }

    public function test_admin_user_index_does_not_include_email_but_detail_is_the_raw_identity_view(): void
    {
        $admin = User::factory()->verified()->create();
        $admin->is_admin = true; $admin->save();
        $subject = User::factory()->create(['email' => 'subject@example.test', 'id_number' => 'FAKE-ADMIN-VIEW']);
        $this->actingAs($admin)->get('/admin/users')->assertInertia(fn (Assert $page) => $page
            ->component('admin/users/index')->missing('users.data.0.email'));
        $this->actingAs($admin)->get('/admin/users/'.$subject->id)->assertInertia(fn (Assert $page) => $page
            ->component('admin/users/show')->where('user.email', 'subject@example.test')->where('user.idNumber', 'FAKE-ADMIN-VIEW'));
    }

    public function test_model_fillable_lists_do_not_include_protected_fields_or_unguarded_models(): void
    {
        $forbidden = ['is_admin', 'verification_status', 'institutional_email', 'institutional_email_verified_at', 'verification_method', 'status', 'outcome', 'priority', 'reviewed_by', 'reviewed_at', 'locked_at', 'content_hash', 'is_hidden', 'hidden_by', 'removed_by', 'issued_by', 'lifted_by', 'risk_level', 'risk_score', 'decision_source'];
        foreach (glob(app_path('Models/*.php')) as $file) {
            $class = 'App\\Models\\'.basename($file, '.php');
            if (! class_exists($class) || ! is_subclass_of($class, Model::class)) continue;
            $model = new $class();
            $this->assertFalse($model->getFillable() === [] && $model->getGuarded() === [], "{$class} is unguarded.");
            $this->assertEmpty(array_intersect($forbidden, $model->getFillable()), "{$class} mass-assigns protected fields.");
        }
    }

    public function test_insert_only_models_keep_update_and_delete_guards(): void
    {
        foreach (['AgreementVersion', 'AgreementConfirmation', 'AgreementMessage', 'PaymentEvent', 'ReportStatement', 'TaskScreening', 'AdminAction', 'RatingScore', 'ConversationMessage', 'ConversationEvent', 'ReportMessageSnapshot'] as $name) {
            $source = file_get_contents(app_path('Models/'.$name.'.php'));
            $this->assertStringContainsString('static::updating', $source, $name.' must reject app-level updates.');
            $this->assertStringContainsString('static::deleting', $source, $name.' must reject app-level deletes.');
        }
    }

    public function test_static_information_pages_are_public_and_application_pages_require_authentication(): void
    {
        foreach (['/how-it-works', '/task-guidelines', '/safety-and-limits', '/privacy'] as $path) $this->get($path)->assertOk();
        $this->get('/browse')->assertRedirect(route('login'));
    }

    public function test_registration_and_profile_forms_reject_file_uploads(): void
    {
        $this->from('/register')->post('/register', [
            'name' => 'Synthetic Upload Attempt', 'email' => 'upload@cmu.edu.ph', 'password' => 'password',
            'password_confirmation' => 'password', 'user_type' => 'student', 'id_number' => 'FAKE-UPLOAD-1',
            'affiliation' => 'Synthetic College', 'identity_document' => UploadedFile::fake()->create('fake-id.pdf', 2, 'application/pdf'),
        ])->assertSessionHasErrors('documents');

        $owner = User::factory()->verified()->create();
        $this->actingAs($owner)->from('/settings/profile')->patch('/settings/profile', [
            'name' => 'Synthetic Profile Owner', 'affiliation' => 'Synthetic College',
            'profile_photo' => UploadedFile::fake()->create('fake-photo.jpg', 2, 'image/jpeg'),
        ])->assertSessionHasErrors('profile');

        $unverifiedStudent = User::factory()->unverifiedStudent()->create();
        $this->actingAs($unverifiedStudent)->from(route('verification.student.show'))
            ->post(route('verification.student.manual-request'), [
                'id_number' => 'FAKE-STU-901',
                'affiliation' => 'College of Engineering',
                'student_id_photo' => UploadedFile::fake()->create('id.jpg', 2, 'image/jpeg'),
            ])->assertSessionHasErrors('documents');
    }

    public function test_student_task_page_discloses_work_details_without_poster_private_fields_or_risk_data(): void
    {
        $student = User::factory()->verified()->create();
        $task = Task::factory()->approved()->create();
        $this->actingAs($student)->get('/browse/'.$task->id)->assertInertia(fn (Assert $page) => $page
            ->component('browse/show')
            ->has('task.workMode')
            ->missing('poster.email')
            ->missing('poster.idNumber')
            ->missing('poster.supportingInfo')
            ->missing('poster.ratingSummary.dimensions')
            ->missing('task.riskLevel')
            ->missing('task.riskScore')
            ->missing('screeningHistory'));
    }

    public function test_other_non_admin_pages_keep_shared_identity_and_moderation_fields_private(): void
    {
        $student = User::factory()->verified()->create();
        $this->actingAs($student);
        $checks = [
            ['/browse', 'browse/index'],
            ['/my-applications', 'applications/index'],
            ['/my-reports', 'reports/index'],
            ['/my-sanctions', 'sanctions/index'],
            ['/notifications', 'notifications/index'],
            ['/messages', 'messages/index'],
            ['/settings/profile', 'settings/profile'],
            ['/settings/schedule', 'settings/schedule'],
        ];
        foreach ($checks as [$url, $component]) {
            $this->get($url)->assertInertia(fn (Assert $page) => $page
                ->component($component)
                ->missing('auth.user.email')
                ->missing('auth.user.institutional_email')
                ->missing('auth.user.id_number')
                ->missing('auth.user.supporting_info')
                ->missing('auth.user.verification_note')
                ->missing('risk_level')
                ->missing('risk_score')
                ->missing('adminNote')
                ->missing('internalNote'));
        }
    }

    public function test_conversation_props_are_private_and_contain_no_other_identity_fields(): void
    {
        $poster = User::factory()->verified()->facultyStaff()->create(['email' => 'poster.private@example.test', 'id_number' => 'FAKE-POSTER-ID']);
        $student = User::factory()->verified()->create(['email' => 'student.private@example.test', 'id_number' => 'FAKE-STUDENT-ID']);
        $task = Task::factory()->approved()->for($poster, 'poster')->create(['work_mode' => 'remote', 'workplace_name' => null, 'workplace_address' => null, 'workplace_setting' => null]);
        $application = \App\Models\Application::factory()->for($task)->for($student, 'applicant')->create();
        $conversation = new \App\Models\Conversation;
        $conversation->application_id = $application->id; $conversation->task_id = $task->id; $conversation->poster_id = $poster->id; $conversation->applicant_id = $student->id; $conversation->save();
        $message = new \App\Models\ConversationMessage;
        $message->conversation_id = $conversation->id; $message->sender_id = $poster->id; $message->body = 'Private synthetic message.'; $message->created_at = now(); $message->save();

        $this->actingAs($student)->get(route('messages.show', $conversation))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('messages/show')
            ->where('messages.0.body', 'Private synthetic message.')
            ->missing('auth.user.email')
            ->missing('auth.user.id_number')
            ->missing('conversation.otherPerson.email')
            ->missing('conversation.otherPerson.id_number')
            ->missing('messages.0.email')
            ->missing('messages.0.id_number'));
    }

    public function test_forbidden_error_uses_taskmate_error_page(): void
    {
        $this->actingAs(User::factory()->create())->get('/admin')->assertStatus(403)
            ->assertInertia(fn (Assert $page) => $page->component('errors/status')->where('status', 403));
    }

    public function test_demo_commands_refuse_non_local_environment_and_require_force(): void
    {
        $this->artisan('taskmate:purge-demo-data')->assertFailed();
        $this->artisan('taskmate:reset-demo')->assertFailed();
        $this->app['env'] = 'testing';
        $this->artisan('taskmate:purge-demo-data', ['--force' => true])->assertFailed();
        $this->artisan('taskmate:reset-demo', ['--force' => true])->assertFailed();
    }

    public function test_prototype_mode_is_shared_and_can_be_disabled(): void
    {
        config(['taskmate.prototype_mode' => true]);
        $this->get('/')->assertInertia(fn (Assert $page) => $page->where('prototypeMode', true));
        config(['taskmate.prototype_mode' => false]);
        $this->get('/')->assertInertia(fn (Assert $page) => $page->where('prototypeMode', false));
    }

    public function test_student_class_schedule_stays_private_to_owner_and_is_not_exposed_in_shared_or_other_views(): void
    {
        $student = User::factory()->verified()->create();
        $student->class_schedule = [
            ['day' => 'mon', 'start_time' => '08:00', 'end_time' => '11:00', 'label' => 'Private Class'],
        ];
        $student->save();

        $poster = User::factory()->verified()->facultyStaff()->create();
        $admin = User::factory()->verified()->create();
        $admin->is_admin = true;
        $admin->save();

        $task = Task::factory()->approved()->for($poster, 'poster')->create();
        \App\Models\Application::factory()->for($task)->for($student, 'applicant')->create();

        $this->actingAs($student)->get('/users/'.$student->id)->assertInertia(fn (Assert $page) => $page
            ->missing('auth.user.class_schedule')
            ->missing('auth.user.classSchedule')
            ->missing('profile.class_schedule')
            ->missing('profile.classSchedule'));

        $this->actingAs($poster)->get(route('tasks.show', $task))->assertInertia(fn (Assert $page) => $page
            ->missing('applicants.0.applicant.class_schedule')
            ->missing('applicants.0.applicant.classSchedule'));

        $this->actingAs($admin)->get(route('admin.users.show', $student))->assertInertia(fn (Assert $page) => $page
            ->missing('user.class_schedule')
            ->missing('user.classSchedule'));
    }
}
