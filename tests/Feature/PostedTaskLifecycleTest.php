<?php

namespace Tests\Feature;

use App\Enums\TaskStatus;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PostedTaskLifecycleTest extends TestCase
{
    use RefreshDatabase;

    public function test_one_listing_from_submission_to_payment_receipt_and_ratings(): void
    {
        $poster = User::factory()->facultyStaff()->verified()->create();
        $admin = User::factory()->facultyStaff()->verified()->create();
        $admin->forceFill(['is_admin' => true])->save();
        $student = User::factory()->verified()->create();

        $this->actingAs($poster)->post(route('tasks.store'), [
            'title' => 'Synthetic event poster', 'category' => 'event_support',
            'description' => 'Design a sample poster for a campus event.',
            'budget' => 600, 'work_mode' => 'remote', 'guidelines_confirmed' => true,
        ])->assertRedirect()->assertSessionHasNoErrors();
        $task = $poster->tasks()->sole();
        $this->assertSame(TaskStatus::PendingReview, $task->status);
        $this->actingAs($admin)->post(route('admin.tasks.decision', $task), ['decision' => 'approve'])
            ->assertRedirect()->assertSessionHasNoErrors();
        $this->assertSame(TaskStatus::Approved, $task->fresh()->status);

        $this->actingAs($student)->put(route('class-schedule.update'), ['blocks' => [
            ['day' => 'mon', 'start_time' => '08:00', 'end_time' => '12:00'],
        ]])->assertRedirect()->assertSessionHasNoErrors();
        $this->actingAs($student->fresh())->get(route('browse.show', $task))->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('canApply', true)
                ->where('studentClassSchedule.0.day', 'mon')->where('studentClassSchedule.0.end_time', '12:00'));
        $this->post(route('applications.store', $task), [
            'message' => 'I can design this event poster.', 'work_details_confirmed' => true,
            'poster_identity_checked' => true, 'no_upfront_fee_checked' => true,
        ])->assertRedirect()->assertSessionHasNoErrors();
        $application = $task->applications()->sole();
        $this->actingAs($poster)->post(route('tasks.applications.accept', [$task, $application]))
            ->assertRedirect()->assertSessionHasNoErrors();
        $this->post(route('agreements.store', $task), [
            'deliverables' => 'One event poster', 'terms' => 'Deliver the final poster as a PDF.',
            'final_amount' => 600, 'due_date' => today()->addDays(5)->toDateString(),
            'payment_arrangement' => 'Pay directly after delivery.',
        ])->assertRedirect()->assertSessionHasNoErrors();
        $agreement = $task->agreement()->firstOrFail();
        $this->actingAs($student)->post(route('agreements.confirm', $agreement), ['version_id' => $agreement->current_version_id])
            ->assertRedirect()->assertSessionHasNoErrors();
        $this->assertSame(TaskStatus::InProgress, $task->fresh()->status);
        $this->post(route('agreements.completion.delivered', $agreement), ['note' => 'PDF delivered.'])
            ->assertRedirect()->assertSessionHasNoErrors();
        $this->actingAs($poster)->post(route('agreements.completion.complete', $agreement), ['note' => 'Poster accepted.'])
            ->assertRedirect()->assertSessionHasNoErrors();
        $this->assertSame(TaskStatus::Completed, $task->fresh()->status);
        $this->post(route('agreements.payments.mark-paid', $agreement), [
            'amount' => 600, 'paid_on' => today()->toDateString(), 'method' => 'Cash',
        ])->assertRedirect()->assertSessionHasNoErrors();
        $this->actingAs($student)->post(route('agreements.payments.confirm-received', $agreement), ['amount' => 600])
            ->assertRedirect()->assertSessionHasNoErrors();
        $this->assertTrue($agreement->fresh()->paymentIsSettled());
        foreach ([[$student, 'student_to_poster'], [$poster, 'poster_to_student']] as [$rater, $direction]) {
            $this->actingAs($rater)->post(route('agreements.rate.store', $agreement), [
                'overall_experience' => 5,
                'scores' => array_fill_keys(array_keys(config("taskmate.ratings.dimensions.{$direction}")), 5),
            ])->assertRedirect()->assertSessionHasNoErrors();
        }
        $this->assertSame(2, $agreement->ratings()->count());
    }
}
