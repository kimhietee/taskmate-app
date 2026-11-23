<?php

namespace Tests\Feature;

use App\Enums\TaskStatus;
use App\Enums\UserType;
use App\Enums\VerificationStatus;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskPostingTest extends TestCase
{
    use RefreshDatabase;

    private function taskData(array $overrides = []): array
    {
        return array_merge([
            'title' => 'Help organize a campus workshop',
            'category' => 'event_support',
            'description' => 'Help prepare and organize a synthetic campus workshop.',
            'required_activities' => 'Arrange chairs and prepare sign-in sheets.',
            'deliverables' => 'A ready workshop room and completed sign-in sheets.',
            'estimated_duration_hours' => 4,
            'skill_requirements' => 'Organized and reliable.',
            'complexity' => 'low',
            'budget' => 1500,
            'work_mode' => 'onsite',
            'workplace_name' => 'Synthetic Student Center',
            'workplace_address' => 'Synthetic campus room 101',
            'physical_demand' => 'none',
            'academic_involvement' => 'none',
            'hazard_exposure' => '0',
            'private_meeting_required' => '0',
            'workplace_setting' => 'on_campus',
            'deadline' => now()->addWeek()->toDateString(),
            'guidelines_confirmed' => '1',
        ], $overrides);
    }

    private function verifiedPoster(UserType $type = UserType::FacultyStaff): User
    {
        return User::factory()->verified()->state(['user_type' => $type])->create();
    }

    public function test_verified_eligible_account_types_can_create_pending_review_tasks(): void
    {
        config(['taskmate.students_can_post' => true]);

        foreach ([UserType::FacultyStaff, UserType::Organization, UserType::Student] as $type) {
            $poster = $this->verifiedPoster($type);
            $this->actingAs($poster)->post(route('tasks.store'), $this->taskData())->assertRedirect();
            $task = $poster->tasks()->latest('id')->firstOrFail();
            $this->assertSame(TaskStatus::PendingReview, $task->status);
            $this->assertNotNull($task->guidelines_confirmed_at);
        }
    }

    public function test_unverified_admin_and_disallowed_student_cannot_create_tasks(): void
    {
        $unverified = User::factory()->create();
        $rejected = User::factory()->state(['verification_status' => VerificationStatus::Rejected])->create();
        $admin = $this->verifiedPoster(UserType::FacultyStaff);
        $admin->forceFill(['is_admin' => true])->save();
        config(['taskmate.students_can_post' => false]);
        $student = $this->verifiedPoster(UserType::Student);

        $this->actingAs($unverified)->post(route('tasks.store'), $this->taskData())->assertRedirect();
        $this->actingAs($rejected)->post(route('tasks.store'), $this->taskData())->assertRedirect();
        $this->actingAs($admin)->post(route('tasks.store'), $this->taskData())->assertForbidden();
        $this->actingAs($student)->post(route('tasks.store'), $this->taskData())->assertForbidden();
    }

    public function test_task_fields_and_guideline_confirmation_are_validated(): void
    {
        $poster = $this->verifiedPoster();
        $this->actingAs($poster)->post(route('tasks.store'), [])->assertSessionHasErrors([
            'title', 'category', 'description', 'budget', 'work_mode', 'guidelines_confirmed',
        ]);
        $this->assertDatabaseCount('tasks', 0);
    }

    public function test_minimal_task_submission_skips_optional_details_without_claiming_safety_answers(): void
    {
        $poster = $this->verifiedPoster();
        $this->actingAs($poster)->post(route('tasks.store'), [
            'title' => 'Synthetic campus event help',
            'category' => 'event_support',
            'description' => 'Help prepare the event space and leave the area ready for attendees.',
            'budget' => 1200,
            'work_mode' => 'remote',
            'guidelines_confirmed' => '1',
        ])->assertRedirect()->assertSessionHasNoErrors();

        $task = $poster->tasks()->latest('id')->firstOrFail();
        $this->assertSame(TaskStatus::PendingReview, $task->status);
        $this->assertNull($task->required_activities);
        $this->assertNull($task->deliverables);
        $this->assertNull($task->estimated_duration_hours);
        $this->assertNull($task->complexity);
        $this->assertNull($task->hazard_exposure);
        $this->assertNull($task->private_meeting_required);
        $this->assertSame(0, $task->screenings()->count());
        $this->assertNull($task->risk_level);
        $this->assertNull($task->risk_score);
    }

    public function test_simplified_edit_keeps_optional_details_already_saved_on_the_task(): void
    {
        $poster = $this->verifiedPoster();
        $task = Task::factory()->create([
            'poster_id' => $poster->id,
            'required_activities' => 'Previously saved activity details.',
            'deliverables' => 'Previously saved deliverables.',
            'estimated_duration_hours' => 3,
            'skill_requirements' => 'Previously saved skills.',
            'complexity' => 'medium',
            'hazard_exposure' => true,
            'hazard_description' => 'Previously saved hazard information.',
        ]);

        $this->actingAs($poster)->put(route('tasks.update', $task), [
            'title' => 'A simpler task edit',
            'category' => 'event_support',
            'description' => 'A clear description with the essential task information.',
            'budget' => 1500,
            'work_mode' => 'onsite',
            'workplace_name' => 'Synthetic Student Center',
            'workplace_address' => 'Synthetic campus room 101',
            'guidelines_confirmed' => '1',
        ])->assertRedirect()->assertSessionHasNoErrors();

        $task->refresh();
        $this->assertSame('Previously saved activity details.', $task->required_activities);
        $this->assertSame('Previously saved deliverables.', $task->deliverables);
        $this->assertSame('3.0', $task->estimated_duration_hours);
        $this->assertSame('Previously saved skills.', $task->skill_requirements);
        $this->assertSame('medium', $task->complexity);
        $this->assertTrue($task->hazard_exposure);
        $this->assertSame('Previously saved hazard information.', $task->hazard_description);
    }

    public function test_invalid_choices_limits_past_deadline_and_missing_workplace_are_rejected(): void
    {
        $poster = $this->verifiedPoster();
        $this->actingAs($poster)->post(route('tasks.store'), $this->taskData(['category' => 'invented']))->assertSessionHasErrors('category');
        $this->post(route('tasks.store'), $this->taskData(['work_mode' => 'teleport']))->assertSessionHasErrors('work_mode');
        $this->post(route('tasks.store'), $this->taskData(['workplace_name' => '', 'workplace_address' => '']))->assertSessionHasErrors(['workplace_name', 'workplace_address']);
        $this->post(route('tasks.store'), $this->taskData(['work_mode' => 'hybrid', 'workplace_name' => '', 'workplace_address' => '']))->assertSessionHasErrors(['workplace_name', 'workplace_address']);
        $this->post(route('tasks.store'), $this->taskData(['budget' => 0]))->assertSessionHasErrors('budget');
        $this->post(route('tasks.store'), $this->taskData(['budget' => 1000001]))->assertSessionHasErrors('budget');
        $this->post(route('tasks.store'), $this->taskData(['estimated_duration_hours' => 0.4]))->assertSessionHasErrors('estimated_duration_hours');
        $this->post(route('tasks.store'), $this->taskData(['estimated_duration_hours' => 501]))->assertSessionHasErrors('estimated_duration_hours');
        $this->post(route('tasks.store'), $this->taskData(['deadline' => now()->subDay()->toDateString()]))->assertSessionHasErrors('deadline');
        $this->post(route('tasks.store'), $this->taskData(['guidelines_confirmed' => '0']))->assertSessionHasErrors('guidelines_confirmed');
        $this->post(route('tasks.store'), $this->taskData(['complexity' => 'invented']))->assertSessionHasErrors('complexity');
        $this->post(route('tasks.store'), $this->taskData(['physical_demand' => 'invented']))->assertSessionHasErrors('physical_demand');
    }

    public function test_remote_task_discards_workplace_details_and_untrusted_status_fields(): void
    {
        $poster = $this->verifiedPoster();
        $this->actingAs($poster)->post(route('tasks.store'), $this->taskData([
            'work_mode' => 'remote',
            'workplace_name' => 'Private home',
            'workplace_address' => 'Should not be retained',
            'status' => 'approved',
            'reviewed_by' => $poster->id,
        ]))->assertRedirect();

        $task = Task::firstOrFail();
        $this->assertSame(TaskStatus::PendingReview, $task->status);
        $this->assertNull($task->workplace_name);
        $this->assertNull($task->workplace_address);
        $this->assertNull($task->reviewed_by);
    }

    public function test_poster_can_only_view_update_and_cancel_their_own_tasks(): void
    {
        $owner = $this->verifiedPoster();
        $other = $this->verifiedPoster();
        $task = Task::factory()->create(['poster_id' => $owner->id]);

        $this->actingAs($owner)->get(route('tasks.show', $task))->assertOk()->assertInertia(fn ($page) => $page->component('tasks/show')->has('task.title'));
        $this->actingAs($other)->get(route('tasks.show', $task))->assertForbidden();
        $this->actingAs($other)->get(route('tasks.edit', $task))->assertForbidden();
        $this->actingAs($owner)->put(route('tasks.update', $task), $this->taskData(['work_mode' => 'remote']))->assertRedirect();
        $this->actingAs($owner)->post(route('tasks.cancel', $task))->assertRedirect(route('tasks.mine'));
        $this->assertSame(TaskStatus::Cancelled, $task->fresh()->status);
        $this->actingAs($owner)->get(route('tasks.edit', $task))->assertForbidden();
    }

    public function test_task_detail_renders_cleanly_when_optional_details_were_not_provided(): void
    {
        $poster = $this->verifiedPoster();
        $task = Task::factory()->create([
            'poster_id' => $poster->id,
            'required_activities' => null,
            'deliverables' => null,
            'estimated_duration_hours' => null,
            'complexity' => null,
            'physical_demand' => null,
            'academic_involvement' => null,
            'hazard_exposure' => null,
            'hazard_description' => null,
            'private_meeting_required' => null,
            'workplace_setting' => null,
        ]);

        $this->actingAs($poster)->get(route('tasks.show', $task))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('tasks/show')
                ->where('task.requiredActivities', null)
                ->where('task.deliverables', null)
                ->where('task.estimatedDurationHours', null)
                ->missing('task.physicalDemand')
                ->missing('task.academicInvolvement')
                ->missing('task.hazardExposure')
                ->missing('task.hazardDescription')
                ->missing('task.privateMeetingRequired')
                ->missing('task.workplaceSetting'));
    }

    public function test_editing_approved_task_resubmits_and_clears_review_note(): void
    {
        $poster = $this->verifiedPoster();
        $task = Task::factory()->create([
            'poster_id' => $poster->id,
            'status' => TaskStatus::Approved,
            'review_note' => 'Previously approved note',
            'reviewed_by' => User::factory()->create()->id,
            'reviewed_at' => now(),
        ]);

        $this->actingAs($poster)->put(route('tasks.update', $task), $this->taskData(['work_mode' => 'remote']))->assertRedirect();
        $this->assertSame(TaskStatus::PendingReview, $task->fresh()->status);
        $this->assertNull($task->fresh()->review_note);
        $this->assertNull($task->fresh()->reviewed_by);
        $this->assertNull($task->fresh()->reviewed_at);
    }

    public function test_rejected_and_cancelled_tasks_cannot_be_edited_or_cancelled_again(): void
    {
        $poster = $this->verifiedPoster();
        foreach ([TaskStatus::Rejected, TaskStatus::Cancelled] as $status) {
            $task = Task::factory()->create(['poster_id' => $poster->id, 'status' => $status]);
            $this->actingAs($poster)->get(route('tasks.edit', $task))->assertForbidden();
            $this->actingAs($poster)->post(route('tasks.cancel', $task))->assertForbidden();
        }
    }

    public function test_my_tasks_contains_only_the_current_posters_tasks(): void
    {
        $poster = $this->verifiedPoster();
        $other = $this->verifiedPoster();
        Task::factory()->create(['poster_id' => $poster->id, 'title' => 'My synthetic task']);
        Task::factory()->create(['poster_id' => $other->id, 'title' => 'Other synthetic task']);

        $this->actingAs($poster)->get(route('tasks.mine'))->assertOk()->assertInertia(fn ($page) => $page
            ->component('tasks/mine')
            ->has('tasks.data', 1)
            ->where('tasks.data.0.title', 'My synthetic task'));
    }

    public function test_safety_answers_require_hazard_details_and_in_person_setting(): void
    {
        $poster = $this->verifiedPoster();
        $this->actingAs($poster)->post(route('tasks.store'), $this->taskData([
            'hazard_exposure' => '1',
            'hazard_description' => '',
        ]))->assertSessionHasErrors('hazard_description');
        $this->post(route('tasks.store'), $this->taskData(['workplace_setting' => '']))
            ->assertRedirect()->assertSessionHasNoErrors();
        $this->assertNull(Task::latest('id')->firstOrFail()->workplace_setting);

        $this->post(route('tasks.store'), $this->taskData([
            'work_mode' => 'remote',
            'workplace_name' => 'Ignore me',
            'workplace_address' => 'Ignore me',
            'workplace_setting' => 'off_campus_private_or_residential',
        ]))->assertRedirect();
        $this->assertNull(Task::latest('id')->firstOrFail()->workplace_setting);
    }

    public function test_poster_can_submit_upfront_schedule_pay_timing_and_to_be_discussed_terms(): void
    {
        $poster = $this->verifiedPoster();

        $this->actingAs($poster)->post(route('tasks.store'), [
            'title' => 'Synthetic flexible terms offer',
            'category' => 'other',
            'description' => 'Employer A style synthetic offer with negotiable pay and hours.',
            'budget_to_be_discussed' => '1',
            'budget' => '',
            'pay_timing' => 'to_be_discussed',
            'pay_timing_note' => 'Discussed after reviewing availability.',
            'schedule_to_be_discussed' => '1',
            'can_hours_change' => '1',
            'work_mode' => 'remote',
            'guidelines_confirmed' => '1',
        ])->assertRedirect()->assertSessionHasNoErrors();

        $tbdTask = $poster->tasks()->latest('id')->firstOrFail();
        $this->assertNull($tbdTask->budget);
        $this->assertTrue($tbdTask->budget_to_be_discussed);
        $this->assertTrue($tbdTask->isBudgetToBeDiscussed());
        $this->assertSame('to_be_discussed', $tbdTask->pay_timing);
        $this->assertTrue($tbdTask->isPayTimingToBeDiscussed());
        $this->assertTrue($tbdTask->schedule_to_be_discussed);
        $this->assertTrue($tbdTask->isScheduleToBeDiscussed());
        $this->assertTrue($tbdTask->can_hours_change);

        $this->actingAs($poster)->post(route('tasks.store'), [
            'title' => 'Synthetic structured weekend offer',
            'category' => 'event_support',
            'description' => 'Synthetic offer with explicit bi-weekly pay and fixed schedule.',
            'budget_to_be_discussed' => '0',
            'budget' => 900,
            'pay_timing' => 'bi_weekly',
            'pay_timing_note' => 'Paid every other Saturday.',
            'schedule_to_be_discussed' => '0',
            'schedule_days' => ['sat', 'sun'],
            'schedule_start_time' => '09:00',
            'schedule_end_time' => '12:00',
            'can_hours_change' => '0',
            'work_mode' => 'remote',
            'guidelines_confirmed' => '1',
        ])->assertRedirect()->assertSessionHasNoErrors();

        $structuredTask = $poster->tasks()->latest('id')->firstOrFail();
        $this->assertSame('900.00', $structuredTask->budget);
        $this->assertFalse($structuredTask->isBudgetToBeDiscussed());
        $this->assertSame('Bi-weekly (every 2 weeks)', $structuredTask->payTimingLabel());
        $this->assertSame(['sat', 'sun'], $structuredTask->schedule_days);
        $this->assertSame('Sat, Sun · 9:00 AM–12:00 PM', $structuredTask->scheduleSummary());
        $this->assertFalse($structuredTask->can_hours_change);
    }

    public function test_invalid_pay_timing_and_incomplete_or_reversed_schedule_are_rejected(): void
    {
        $poster = $this->verifiedPoster();

        $this->actingAs($poster)->post(route('tasks.store'), $this->taskData([
            'pay_timing' => 'every_decade',
        ]))->assertSessionHasErrors('pay_timing');

        $this->post(route('tasks.store'), $this->taskData([
            'schedule_to_be_discussed' => '0',
            'schedule_days' => ['mon'],
            'schedule_start_time' => '14:00',
            'schedule_end_time' => '',
        ]))->assertSessionHasErrors('schedule_end_time');

        $this->post(route('tasks.store'), $this->taskData([
            'schedule_to_be_discussed' => '0',
            'schedule_days' => ['mon'],
            'schedule_start_time' => '15:00',
            'schedule_end_time' => '13:00',
        ]))->assertSessionHasErrors('schedule_end_time');

        $this->post(route('tasks.store'), $this->taskData([
            'work_type' => 'invented_type',
        ]))->assertSessionHasErrors('work_type');
    }

    public function test_poster_can_submit_one_time_gig_with_flexible_self_paced_schedule(): void
    {
        $poster = $this->verifiedPoster();

        $this->actingAs($poster)->post(route('tasks.store'), [
            'title' => 'Synthetic poster design gig',
            'category' => 'design_and_creative',
            'work_type' => 'one_time_gig',
            'description' => 'Design three synthetic event posters before the deadline.',
            'budget' => 800,
            'budget_to_be_discussed' => '0',
            'pay_timing' => 'upon_completion',
            'schedule_flexible' => '1',
            'schedule_to_be_discussed' => '0',
            'work_mode' => 'remote',
            'guidelines_confirmed' => '1',
        ])->assertRedirect()->assertSessionHasNoErrors();

        $gig = $poster->tasks()->latest('id')->firstOrFail();
        $this->assertSame('one_time_gig', $gig->work_type);
        $this->assertSame('One-time gig / task', $gig->workTypeLabel());
        $this->assertTrue($gig->isScheduleFlexible());
        $this->assertFalse($gig->isScheduleToBeDiscussed());
        $this->assertSame('Flexible / self-paced before deadline', $gig->scheduleSummary());
    }
}
