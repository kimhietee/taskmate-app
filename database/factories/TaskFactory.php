<?php

namespace Database\Factories;

use App\Enums\TaskStatus;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Task> */
class TaskFactory extends Factory
{
    protected $model = Task::class;

    public function definition(): array
    {
        return [
            'poster_id' => User::factory()->verified()->facultyStaff(),
            'title' => fake()->sentence(5),
            'category' => array_key_first(config('taskmate.categories')),
            'work_type' => 'one_time_gig',
            'description' => fake()->paragraph(),
            'required_activities' => fake()->paragraph(),
            'deliverables' => fake()->sentence(),
            'estimated_duration_hours' => fake()->randomFloat(1, 1, 40),
            'skill_requirements' => fake()->optional()->sentence(),
            'complexity' => 'medium',
            'budget' => fake()->randomFloat(2, 500, 10000),
            'budget_to_be_discussed' => false,
            'pay_timing' => 'upon_completion',
            'pay_timing_note' => null,
            'work_mode' => 'onsite',
            'workplace_name' => 'Synthetic Campus Office',
            'workplace_address' => 'Synthetic campus location',
            'physical_demand' => 'none',
            'academic_involvement' => 'none',
            'hazard_exposure' => false,
            'hazard_description' => null,
            'private_meeting_required' => false,
            'workplace_setting' => 'on_campus',
            'deadline' => fake()->optional()->dateTimeBetween('+2 days', '+2 months')?->format('Y-m-d'),
            'schedule_days' => ['sat'],
            'schedule_start_time' => '09:00',
            'schedule_end_time' => '12:00',
            'schedule_note' => null,
            'schedule_to_be_discussed' => false,
            'schedule_flexible' => false,
            'can_hours_change' => true,
            'status' => TaskStatus::PendingReview,
            'guidelines_confirmed_at' => now(),
        ];
    }

    public function termsToBeDiscussed(): static
    {
        return $this->state(fn () => [
            'budget' => null,
            'budget_to_be_discussed' => true,
            'pay_timing' => 'to_be_discussed',
            'pay_timing_note' => null,
            'schedule_days' => null,
            'schedule_start_time' => null,
            'schedule_end_time' => null,
            'schedule_to_be_discussed' => true,
            'can_hours_change' => true,
        ]);
    }

    public function approved(): static
    {
        return $this->state(fn () => ['status' => TaskStatus::Approved]);
    }

    public function assigned(): static
    {
        return $this->state(fn () => ['status' => TaskStatus::Assigned]);
    }
}
