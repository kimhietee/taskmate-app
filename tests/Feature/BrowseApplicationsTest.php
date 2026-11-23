<?php

namespace Tests\Feature;

use App\Enums\ApplicationStatus;
use App\Enums\TaskStatus;
use App\Enums\UserType;
use App\Enums\VerificationStatus;
use App\Models\Application;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class BrowseApplicationsTest extends TestCase
{
    use RefreshDatabase;

    private function student(array $state = []): User
    {
        return User::factory()->state(array_merge([
            'user_type' => UserType::Student,
            'verification_status' => VerificationStatus::Verified,
            'is_admin' => false,
            'email' => fake()->unique()->safeEmail(),
        ], $state))->create();
    }

    private function poster(): User
    {
        return User::factory()->facultyStaff()->verified()->create();
    }

    private function task(User $poster, array $attributes = []): Task
    {
        return Task::factory()->approved()->create(array_merge([
            'poster_id' => $poster->id,
            'title' => 'Synthetic tutoring task',
            'category' => 'tutoring_and_academic_support',
            'description' => 'Help prepare general learning materials.',
            'required_activities' => 'Prepare sample learning resources.',
            'deliverables' => 'A set of sample resources.',
            'budget' => 2000,
            'work_mode' => 'onsite',
            'workplace_name' => 'Synthetic Learning Center',
            'workplace_address' => 'Synthetic campus location',
            'workplace_setting' => 'on_campus',
            'physical_demand' => 'light',
            'academic_involvement' => 'supporting',
            'hazard_exposure' => true,
            'hazard_description' => 'Synthetic equipment handling.',
            'private_meeting_required' => false,
            'complexity' => 'medium',
            'deadline' => null,
            'risk_level' => 'low',
            'risk_score' => 0,
            'decision_source' => 'admin',
            'screened_at' => now(),
        ], $attributes));
    }

    private function applicationData(array $overrides = []): array
    {
        return array_merge([
            'message' => 'I am interested and have relevant experience.',
            'proposed_amount' => 1800,
            'work_details_confirmed' => '1',
            'poster_identity_checked' => '1',
            'no_upfront_fee_checked' => '1',
            'known_person_or_reviews_checked' => '0',
        ], $overrides);
    }

    public function test_only_verified_students_can_browse_and_apply(): void
    {
        $this->get(route('browse.index'))->assertRedirect(route('login'));
        $this->actingAs(User::factory()->create())->get(route('browse.index'))->assertRedirect();
        foreach ([
            User::factory()->facultyStaff()->verified()->create(),
            User::factory()->organization()->verified()->create(),
        ] as $user) {
            $this->assertTrue($user->isVerified(), $user->user_type->value.' '.$user->verification_status->value);
            $this->assertFalse($user->canApply(), $user->user_type->value.' '.$user->verification_status->value);
            $this->actingAs($user)->get(route('browse.index'))->assertForbidden();
        }
        $admin = $this->student();
        $admin->forceFill(['is_admin' => true])->save();
        $this->actingAs($admin)->get(route('browse.index'))->assertForbidden();
        $adminOwnedTask = $this->task($admin);
        $this->post(route('applications.store', $adminOwnedTask), $this->applicationData())->assertForbidden();
        $this->actingAs($this->student())->get(route('browse.index'))->assertOk();
    }

    public function test_listing_only_shows_approved_non_expired_tasks_and_search_filters_and_sorts(): void
    {
        Carbon::setTestNow('2026-11-13 10:00:00');
        config(['taskmate.browse.per_page' => 50]);
        $student = $this->student();
        $poster = $this->poster();
        $cheap = $this->task($poster, ['title' => 'Needle remote cheap', 'budget' => 1000, 'work_mode' => 'remote', 'workplace_name' => null, 'workplace_address' => null, 'workplace_setting' => null, 'complexity' => 'low']);
        $expensive = $this->task($poster, ['title' => 'Needle onsite expensive', 'budget' => 5000, 'work_mode' => 'onsite', 'complexity' => 'high', 'deadline' => '2026-11-13']);
        $cheap->created_at = now()->subDay();
        $cheap->save();
        $this->task($poster, ['status' => TaskStatus::PendingReview, 'title' => 'Hidden pending']);
        $this->task($poster, ['status' => TaskStatus::ChangesRequested, 'title' => 'Hidden changes']);
        $this->task($poster, ['status' => TaskStatus::Rejected, 'title' => 'Hidden rejected']);
        $this->task($poster, ['status' => TaskStatus::Cancelled, 'title' => 'Hidden cancelled']);
        $this->task($poster, ['status' => TaskStatus::Assigned, 'title' => 'Hidden assigned']);
        $this->task($poster, ['deadline' => '2026-11-12', 'title' => 'Expired hidden']);

        $this->actingAs($student)->get(route('browse.index', ['search' => 'Needle', 'sort' => 'budget_high']))
            ->assertOk()->assertInertia(fn ($page) => $page->component('browse/index')->has('tasks.data', 2)
                ->where('tasks.data.0.id', $expensive->id)
                ->where('tasks.data.0.descriptionPreview', 'Help prepare general learning materials.')
                ->where('tasks.data.0.workplaceName', 'Synthetic Learning Center')
                ->where('tasks.data.0.workplaceAddress', 'Synthetic campus location')
                ->where('tasks.data.0.deadline', '2026-11-13'));
        $this->get(route('browse.index', ['search' => 'learning']))->assertInertia(fn ($page) => $page->has('tasks.data', 2));
        $this->get(route('browse.index', ['category' => 'tutoring_and_academic_support']))->assertInertia(fn ($page) => $page->has('tasks.data', 2));
        $this->get(route('browse.index', ['work_mode' => 'remote']))->assertInertia(fn ($page) => $page->has('tasks.data', 1)->where('tasks.data.0.id', $cheap->id));
        $this->get(route('browse.index', ['complexity' => 'high']))->assertInertia(fn ($page) => $page->has('tasks.data', 1)->where('tasks.data.0.id', $expensive->id));
        $this->get(route('browse.index', ['min_budget' => 3000]))->assertInertia(fn ($page) => $page->has('tasks.data', 1));
        $this->get('/browse?max_budget=1500')->assertOk()->assertInertia(fn ($page) => $page->has('tasks.data', 1));
        $this->get(route('browse.index', ['sort' => 'budget_low']))->assertInertia(fn ($page) => $page->where('tasks.data.0.id', $cheap->id));
        $this->get('/browse?sort=newest')->assertInertia(fn ($page) => $page->where('tasks.data.0.id', $expensive->id));
        $this->get(route('browse.index', ['work_mode' => 'invalid']))->assertSessionHasErrors('work_mode');
        $this->get(route('browse.index', ['max_budget' => 100, 'min_budget' => 200]))->assertSessionHasErrors('max_budget');
        Carbon::setTestNow();
    }

    public function test_student_detail_discloses_work_conditions_but_not_risk_or_private_poster_data(): void
    {
        $student = $this->student();
        $poster = $this->poster();
        $poster->forceFill(['id_number' => 'SENSITIVE-ID', 'supporting_info' => 'SENSITIVE-SUPPORT'])->save();
        $task = $this->task($poster);

        $this->actingAs($student)->get(route('browse.show', $task))->assertOk()->assertInertia(fn ($page) => $page
            ->component('browse/show')
            ->where('task.workplaceName', 'Synthetic Learning Center')
            ->missing('task.physicalDemand')
            ->missing('task.academicInvolvement')
            ->missing('task.hazardExposure')
            ->missing('task.hazardDescription')
            ->missing('task.privateMeetingRequired')
            ->missing('task.workplaceSetting')
            ->missing('task.riskLevel')
            ->missing('task.riskScore')
            ->missing('task.decisionSource')
            ->missing('task.screenedAt')
            ->missing('task.reviewNote')
            ->missing('task.keywordHits')
            ->missing('poster.email')
            ->missing('poster.idNumber')
            ->missing('poster.supportingInfo')
            ->missing('poster.ratingSummary.dimensions'));
        foreach ([TaskStatus::PendingReview, TaskStatus::ChangesRequested, TaskStatus::Rejected, TaskStatus::Cancelled, TaskStatus::Assigned] as $state) {
            $this->get(route('browse.show', $this->task($poster, ['status' => $state])))->assertNotFound();
        }
        $this->get(route('tasks.show', $task))->assertForbidden();
    }

    public function test_apply_success_validation_deadline_ownership_duplicate_and_no_resubmission(): void
    {
        $student = $this->student();
        $poster = $this->poster();
        $task = $this->task($poster);
        $this->actingAs($poster)->post(route('applications.store', $task), $this->applicationData())->assertForbidden();
        $this->actingAs($student);
        $this->actingAs($student)->post(route('applications.store', $task), $this->applicationData())->assertRedirect();
        $application = Application::firstOrFail();
        $this->assertSame(ApplicationStatus::Pending, $application->status);
        $this->assertDatabaseHas('conversations', ['application_id' => $application->id, 'task_id' => $task->id, 'poster_id' => $poster->id, 'applicant_id' => $student->id]);
        $this->assertSame('1800.00', $application->proposed_amount);
        $this->post(route('applications.store', $task), $this->applicationData())->assertForbidden();

        $withdrawnTask = $this->task($poster, ['title' => 'Withdrawn application test']);
        $this->post(route('applications.store', $withdrawnTask), $this->applicationData())->assertRedirect();
        $withdrawn = Application::query()->where('task_id', $withdrawnTask->id)->firstOrFail();
        $this->post(route('applications.withdraw', $withdrawn), [])->assertRedirect();
        $this->assertSame(ApplicationStatus::Withdrawn, $withdrawn->fresh()->status);
        $this->assertSame(1, $poster->notifications()->where('data->event', 'application.withdrawn')->count());
        $this->assertSame(0, $student->notifications()->count());
        $this->post(route('applications.store', $withdrawnTask), $this->applicationData())->assertForbidden();

        $declinedTask = $this->task($poster, ['title' => 'Declined application test']);
        $this->post(route('applications.store', $declinedTask), $this->applicationData())->assertRedirect();
        $declined = Application::query()->where('task_id', $declinedTask->id)->firstOrFail();
        $this->actingAs($poster)->post(route('tasks.applications.decline', [$declinedTask, $declined]))->assertRedirect();
        $this->assertSame(ApplicationStatus::Declined, $declined->fresh()->status);
        $this->actingAs($student)->post(route('applications.store', $declinedTask), $this->applicationData())->assertForbidden();

        $this->actingAs($student)->post(route('applications.store', $this->task($poster, ['status' => TaskStatus::PendingReview])), $this->applicationData())->assertForbidden();
        $this->post(route('applications.store', $this->task($poster, ['deadline' => now()->subDay()])), $this->applicationData())->assertForbidden();
        $this->post(route('applications.store', $this->task($student, ['title' => 'Own task'])), $this->applicationData())->assertForbidden();
        $this->post(route('applications.store', $this->task($poster, ['title' => 'Missing message'])), $this->applicationData(['message' => '']))->assertSessionHasErrors('message');
        $this->post(route('applications.store', $this->task($poster, ['title' => 'Long message'])), $this->applicationData(['message' => str_repeat('x', 1001)]))->assertSessionHasErrors('message');
    }

    public function test_withdrawal_is_only_available_to_owner_while_pending_and_my_applications_are_private(): void
    {
        $student = $this->student();
        $otherStudent = $this->student();
        $poster = $this->poster();
        $task = $this->task($poster);
        $application = Application::factory()->create(['task_id' => $task->id, 'applicant_id' => $student->id]);

        $this->actingAs($otherStudent)->post(route('applications.withdraw', $application))->assertForbidden();
        $this->actingAs($student)->get(route('applications.mine'))->assertInertia(fn ($page) => $page->component('applications/index')->has('applications.data', 1)->where('applications.data.0.id', $application->id));
        $this->get(route('applications.task', $application))->assertOk()->assertInertia(fn ($page) => $page
            ->where('task.workplaceName', $task->workplace_name)
            ->missing('task.riskScore'));
        $application->status = ApplicationStatus::Accepted;
        $application->save();
        $this->post(route('applications.withdraw', $application))->assertForbidden();
    }

    public function test_poster_accept_keeps_other_applications_pending_until_lock_and_cannot_read_applicant_private_fields(): void
    {
        $poster = $this->poster();
        $student = $this->student();
        $other = $this->student();
        $nonPoster = $this->poster();
        $task = $this->task($poster);
        $first = Application::factory()->create(['task_id' => $task->id, 'applicant_id' => $student->id]);
        $second = Application::factory()->create(['task_id' => $task->id, 'applicant_id' => $other->id]);
        $student->forceFill(['email' => 'private-student@example.test', 'id_number' => 'PRIVATE-ID'])->save();

        $this->actingAs($nonPoster)->post(route('tasks.applications.accept', [$task, $first]))->assertForbidden();
        $this->actingAs($poster)->get(route('tasks.show', $task))->assertInertia(fn ($page) => $page
            ->where('applicants.0.applicant.name', $student->name)
            ->missing('applicants.0.applicant.email')
            ->missing('applicants.0.applicant.idNumber'));
        $this->post(route('tasks.applications.accept', [$task, $first]))->assertRedirect();
        $this->assertSame(ApplicationStatus::Accepted, $first->fresh()->status);
        $this->assertSame(ApplicationStatus::Pending, $second->fresh()->status);
        $this->assertNull($second->fresh()->responded_at);
        $this->assertSame(TaskStatus::Assigned, $task->fresh()->status);
        $this->actingAs($other)->get(route('applications.mine'))->assertInertia(fn ($page) => $page
            ->where('applications.data.0.otherApplicantAccepted', true));
        $this->post(route('tasks.applications.accept', [$task, $second]))->assertForbidden();
        $this->assertSame(ApplicationStatus::Pending, $second->fresh()->status);
        $this->get(route('tasks.edit', $task))->assertForbidden();
    }

    public function test_student_poster_cannot_apply_to_own_task_but_can_apply_to_another_task(): void
    {
        $studentPoster = $this->student();
        $ownTask = $this->task($studentPoster, ['title' => 'Synthetic task by student poster']);

        $this->actingAs($studentPoster)->get(route('browse.show', $ownTask))->assertInertia(fn ($page) => $page
            ->where('canApply', false));
        $this->post(route('applications.store', $ownTask), $this->applicationData())->assertForbidden();

        $otherPoster = $this->poster();
        $otherTask = $this->task($otherPoster, ['title' => 'Synthetic task for student applicant']);
        $this->post(route('applications.store', $otherTask), $this->applicationData())->assertRedirect();
        $this->assertDatabaseHas('applications', ['task_id' => $otherTask->id, 'applicant_id' => $studentPoster->id, 'status' => ApplicationStatus::Pending->value]);
    }

    public function test_poster_decline_is_restricted_and_task_cancel_updates_application_statuses(): void
    {
        $poster = $this->poster();
        $studentOne = $this->student();
        $studentTwo = $this->student();
        $task = $this->task($poster);
        $pending = Application::factory()->create(['task_id' => $task->id, 'applicant_id' => $studentOne->id]);
        $second = Application::factory()->create(['task_id' => $task->id, 'applicant_id' => $studentTwo->id]);
        $this->actingAs($studentOne)->post(route('tasks.applications.decline', [$task, $pending]))->assertForbidden();
        $this->actingAs($poster)->post(route('tasks.applications.decline', [$task, $pending]))->assertRedirect();
        $this->assertSame(ApplicationStatus::Declined, $pending->fresh()->status);

        $anotherTask = $this->task($poster, ['title' => 'Cancel task with applicants']);
        $pending = Application::factory()->create(['task_id' => $anotherTask->id, 'applicant_id' => $studentOne->id]);
        $this->post(route('tasks.applications.accept', [$anotherTask, $pending]))->assertRedirect();
        $accepted = $pending->fresh();
        $otherPending = Application::factory()->create(['task_id' => $anotherTask->id, 'applicant_id' => $studentTwo->id]);
        $this->post(route('tasks.cancel', $anotherTask))->assertRedirect();
        $this->assertSame(TaskStatus::Cancelled, $anotherTask->fresh()->status);
        $this->assertSame(ApplicationStatus::Cancelled, $accepted->fresh()->status);
        $this->assertSame(ApplicationStatus::Declined, $otherPending->fresh()->status);
    }

    public function test_task_edit_is_refused_for_pending_or_accepted_applications_and_assigned_tasks(): void
    {
        $poster = $this->poster();
        $applicant = $this->student();
        foreach ([ApplicationStatus::Pending, ApplicationStatus::Accepted] as $status) {
            $task = $this->task($poster, ['title' => 'Edit locked '.$status->value]);
            Application::factory()->create(['task_id' => $task->id, 'applicant_id' => $applicant->id, 'status' => $status]);
            $this->actingAs($poster)->get(route('tasks.edit', $task))->assertForbidden();
            $this->put(route('tasks.update', $task), [])->assertForbidden();
        }
        $assigned = $this->task($poster, ['status' => TaskStatus::Assigned]);
        $this->get(route('tasks.edit', $assigned))->assertForbidden();
    }

    public function test_admin_task_detail_has_read_only_applications_list(): void
    {
        $admin = User::factory()->facultyStaff()->verified()->create();
        $admin->forceFill(['is_admin' => true])->save();
        $poster = $this->poster();
        $student = $this->student();
        $task = $this->task($poster);
        $application = Application::factory()->create(['task_id' => $task->id, 'applicant_id' => $student->id]);

        $this->actingAs($admin)->get(route('admin.tasks.show', $task))->assertInertia(fn ($page) => $page
            ->where('applications.0.userId', $student->id)
            ->where('applications.0.applicantName', $student->name)
            ->missing('applications.0.email'));
    }

    public function test_application_requires_poster_identity_and_no_upfront_fee_checks_but_keeps_third_check_optional(): void
    {
        $student = $this->student();
        $poster = $this->poster();
        $task = $this->task($poster);

        $this->actingAs($student)->post(route('applications.store', $task), [
            'message' => 'Trying to skip checklist checks.',
            'work_details_confirmed' => '1',
        ])->assertSessionHasErrors(['poster_identity_checked', 'no_upfront_fee_checked']);

        $this->actingAs($student)->post(route('applications.store', $task), [
            'message' => 'Completed required checks without personal contact.',
            'work_details_confirmed' => '1',
            'poster_identity_checked' => '1',
            'no_upfront_fee_checked' => '1',
            'known_person_or_reviews_checked' => '0',
        ])->assertRedirect()->assertSessionHasNoErrors();

        $this->assertDatabaseHas('applications', ['task_id' => $task->id, 'applicant_id' => $student->id]);
    }

    public function test_verified_student_can_save_and_view_own_class_schedule_while_non_students_cannot(): void
    {
        $student = $this->student();
        $poster = $this->poster();
        $task = $this->task($poster, [
            'pay_timing' => 'bi_weekly',
            'schedule_days' => ['mon', 'wed'],
            'schedule_start_time' => '09:00',
            'schedule_end_time' => '11:00',
            'can_hours_change' => false,
        ]);

        $this->actingAs($poster)->put(route('class-schedule.update'), ['blocks' => []])->assertForbidden();

        $this->actingAs($student)->put(route('class-schedule.update'), [
            'blocks' => [
                ['day' => 'mon', 'start_time' => '12:00', 'end_time' => '10:00', 'label' => 'Invalid order'],
            ],
        ])->assertSessionHasErrors('blocks.0.end_time');

        $this->actingAs($student)->put(route('class-schedule.update'), [
            'blocks' => [
                ['day' => 'wed', 'start_time' => '08:00', 'end_time' => '11:00', 'label' => 'IT57 Lecture'],
                ['day' => 'mon', 'start_time' => '08:00', 'end_time' => '11:00', 'label' => 'IT57 Lecture'],
            ],
        ])->assertRedirect()->assertSessionHasNoErrors();

        $this->assertSame('mon', $student->fresh()->class_schedule[0]['day']);
        $this->assertSame('wed', $student->fresh()->class_schedule[1]['day']);

        $this->actingAs($student)->get(route('browse.show', $task))->assertOk()->assertInertia(fn ($page) => $page
            ->component('browse/show')
            ->where('task.payTimingLabel', 'Bi-weekly (every 2 weeks)')
            ->where('task.scheduleSummary', 'Mon, Wed · 9:00 AM–11:00 AM')
            ->where('task.canHoursChange', false)
            ->has('studentClassSchedule', 2)
            ->where('studentClassSchedule.0.day', 'mon'));
    }

    public function test_browse_sorting_places_stated_budgets_before_to_be_discussed_tasks(): void
    {
        $student = $this->student();
        $poster = $this->poster();
        $tbd = Task::factory()->approved()->termsToBeDiscussed()->create(['poster_id' => $poster->id, 'title' => 'SortTarget TBD']);
        $cheap = $this->task($poster, ['title' => 'SortTarget Cheap', 'budget' => 400]);
        $high = $this->task($poster, ['title' => 'SortTarget High', 'budget' => 2500]);

        $this->actingAs($student)->get(route('browse.index', ['search' => 'SortTarget', 'sort' => 'budget_low']))
            ->assertOk()->assertInertia(fn ($page) => $page
                ->where('tasks.data.0.id', $cheap->id)
                ->where('tasks.data.1.id', $high->id)
                ->where('tasks.data.2.id', $tbd->id)
                ->where('tasks.data.2.budgetToBeDiscussed', true));

        $this->actingAs($student)->get(route('browse.index', ['search' => 'SortTarget', 'sort' => 'budget_high']))
            ->assertOk()->assertInertia(fn ($page) => $page
                ->where('tasks.data.0.id', $high->id)
                ->where('tasks.data.1.id', $cheap->id)
                ->where('tasks.data.2.id', $tbd->id));
    }
}
