<?php

namespace App\Http\Requests;

use App\Models\Task;
use App\Enums\ApplicationStatus;
use App\Enums\TaskStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTaskRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if ($this->input('work_mode') === 'remote') {
            $this->merge(['workplace_name' => null, 'workplace_address' => null, 'workplace_setting' => null]);
        }
        if ($this->exists('hazard_exposure') && ! $this->boolean('hazard_exposure')) {
            $this->merge(['hazard_description' => null]);
        }
        if ($this->boolean('budget_to_be_discussed')) {
            $this->merge(['budget_to_be_discussed' => true, 'budget' => null]);
        } elseif ($this->exists('budget_to_be_discussed') || $this->filled('budget')) {
            $this->merge(['budget_to_be_discussed' => false]);
        }
        if ($this->boolean('schedule_flexible')) {
            $this->merge([
                'schedule_flexible' => true,
                'schedule_to_be_discussed' => false,
                'schedule_days' => null,
                'schedule_start_time' => null,
                'schedule_end_time' => null,
                'can_hours_change' => true,
            ]);
        } elseif ($this->boolean('schedule_to_be_discussed')) {
            $this->merge([
                'schedule_flexible' => false,
                'schedule_to_be_discussed' => true,
                'schedule_days' => null,
                'schedule_start_time' => null,
                'schedule_end_time' => null,
            ]);
        } elseif ($this->exists('schedule_flexible') || $this->exists('schedule_to_be_discussed') || $this->exists('schedule_days') || $this->exists('schedule_start_time') || $this->exists('schedule_end_time')) {
            $days = is_array($this->input('schedule_days'))
                ? array_values(array_unique(array_filter($this->input('schedule_days'), fn ($day) => is_string($day) && $day !== '')))
                : null;
            $this->merge([
                'schedule_flexible' => false,
                'schedule_to_be_discussed' => false,
                'schedule_days' => $days === [] ? null : $days,
            ]);
        }
        if ($this->exists('work_type') && $this->input('work_type') === '') {
            $this->merge(['work_type' => null]);
        }
        if ($this->exists('pay_timing') && $this->input('pay_timing') === '') {
            $this->merge(['pay_timing' => null]);
        }
        if ($this->exists('can_hours_change') && $this->input('can_hours_change') === '') {
            $this->merge(['can_hours_change' => null]);
        }
    }

    public function authorize(): bool
    {
        $task = $this->route('task');

        if ($task instanceof Task && $task->poster_id === $this->user()?->id
            && ($task->status === TaskStatus::Assigned
                || $task->applications()->whereIn('status', [ApplicationStatus::Pending->value, ApplicationStatus::Accepted->value])->exists())) {
            abort(403, 'This task has active applicants or is assigned. Cancel it and post a new task to change its details.');
        }

        return $task instanceof Task && ($this->user()?->can('update', $task) ?? false);
    }

    public function rules(): array
    {
        $task = $this->route('task');
        $allowedWorkModes = array_keys(config('taskmate.work_modes', []));
        if ($task instanceof Task && $task->work_mode === 'hybrid') {
            $allowedWorkModes[] = 'hybrid';
        }
        $requiresWorkplace = in_array($this->input('work_mode'), config('taskmate.work_modes_with_location', []), true);
        $budgetToBeDiscussed = $this->boolean('budget_to_be_discussed');
        $physicalDemand = config('taskmate.risk_questions.physical_demand', []);
        $academicInvolvement = config('taskmate.risk_questions.academic_involvement', []);
        $workplaceSettings = config('taskmate.risk_questions.workplace_setting', []);

        return [
            'title' => ['required', 'string', 'max:150'],
            'category' => ['required', 'string', Rule::in(array_keys(config('taskmate.categories', [])))],
            'work_type' => ['nullable', 'string', Rule::in(array_keys(config('taskmate.work_types', [])))],
            'description' => ['required', 'string', 'max:10000'],
            'required_activities' => ['nullable', 'string', 'max:10000'],
            'deliverables' => ['nullable', 'string', 'max:10000'],
            'estimated_duration_hours' => ['nullable', 'numeric', 'min:0.5', 'max:500'],
            'skill_requirements' => ['nullable', 'string', 'max:5000'],
            'complexity' => ['nullable', 'string', Rule::in(array_keys(config('taskmate.complexity_levels', [])))],
            'budget_to_be_discussed' => ['nullable', 'boolean'],
            'budget' => [$budgetToBeDiscussed ? 'nullable' : 'required', 'numeric', 'min:1', 'max:1000000'],
            'pay_timing' => ['nullable', 'string', Rule::in(array_keys(config('taskmate.pay_timings', [])))],
            'pay_timing_note' => ['nullable', 'string', 'max:255'],
            'work_mode' => ['required', 'string', Rule::in($allowedWorkModes)],
            'workplace_name' => [$requiresWorkplace ? 'required' : 'nullable', 'string', 'max:255'],
            'workplace_address' => [$requiresWorkplace ? 'required' : 'nullable', 'string', 'max:255'],
            'deadline' => ['nullable', 'date', 'after:today'],
            'schedule_to_be_discussed' => ['nullable', 'boolean'],
            'schedule_flexible' => ['nullable', 'boolean'],
            'schedule_days' => ['nullable', 'array'],
            'schedule_days.*' => ['string', Rule::in(array_keys(config('taskmate.days_of_week', [])))],
            'schedule_start_time' => ['nullable', 'date_format:H:i'],
            'schedule_end_time' => ['nullable', 'date_format:H:i', 'after:schedule_start_time'],
            'schedule_note' => ['nullable', 'string', 'max:255'],
            'can_hours_change' => ['nullable', 'boolean'],
            'guidelines_confirmed' => ['required', 'accepted'],
            'physical_demand' => ['nullable', 'string', Rule::in(array_keys($physicalDemand))],
            'academic_involvement' => ['nullable', 'string', Rule::in(array_keys($academicInvolvement))],
            'hazard_exposure' => ['nullable', 'boolean'],
            'hazard_description' => ['required_if:hazard_exposure,1,true', 'nullable', 'string', 'max:3000'],
            'private_meeting_required' => ['nullable', 'boolean'],
            'workplace_setting' => ['nullable', 'string', Rule::in(array_keys($workplaceSettings))],
        ];
    }

    public function after(): array
    {
        return [function ($validator): void {
            if ($this->boolean('schedule_to_be_discussed') || $this->boolean('schedule_flexible')) {
                return;
            }
            $hasDays = is_array($this->input('schedule_days')) && count($this->input('schedule_days')) > 0;
            $hasStart = $this->filled('schedule_start_time');
            $hasEnd = $this->filled('schedule_end_time');
            if (($hasDays || $hasStart || $hasEnd) && ! ($hasDays && $hasStart && $hasEnd)) {
                if (! $hasDays) {
                    $validator->errors()->add('schedule_days', 'Select at least one work day, or mark work hours as to be discussed.');
                }
                if (! $hasStart) {
                    $validator->errors()->add('schedule_start_time', 'Enter a start time, or mark work hours as to be discussed.');
                }
                if (! $hasEnd) {
                    $validator->errors()->add('schedule_end_time', 'Enter an end time, or mark work hours as to be discussed.');
                }
            }
        }];
    }

    public function messages(): array
    {
        return [
            'guidelines_confirmed.accepted' => 'You must confirm that this task follows the platform rules.',
            'schedule_end_time.after' => 'The end time must be later than the start time.',
        ];
    }
}
