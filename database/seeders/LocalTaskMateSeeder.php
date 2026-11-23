<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Task;
use App\Models\Application;
use App\Services\ConversationWorkflow;
use App\Enums\TaskStatus;
use App\Enums\ApplicationStatus;
use Illuminate\Database\Seeder;

class LocalTaskMateSeeder extends Seeder
{
    public function run(): void
    {
        $accounts = [
            ['Synthetic Project Admin', 'admin@example.test', 'faculty_staff', 'TaskMate Demo Office', 'FAKE-ADMIN-001', null, null, null, true, 'verified'],
            ['Synthetic Student One', 'student1@example.test', 'student', 'Demo College A', 'FAKE-STU-001', null, null, null, false, 'verified'],
            ['Synthetic Student Two', 'student2@example.test', 'student', 'Demo College B', 'FAKE-STU-002', null, null, null, false, 'verified'],
            ['Synthetic Pending Student', 'student.pending@example.test', 'student', 'Demo College C', 'FAKE-STU-003', null, null, null, false, 'pending'],
            ['Synthetic Faculty Staff', 'faculty@example.test', 'faculty_staff', 'Demo Office', 'FAKE-EMP-001', null, null, null, false, 'verified'],
            ['Synthetic Organization Representative', 'organization@example.test', 'organization', null, null, 'Example Demo Organization', 'Synthetic Representative', 'Synthetic organization created for local testing.', false, 'verified'],
            ['Synthetic Pending Organization Representative', 'organization.pending@example.test', 'organization', null, null, 'Example Pending Organization', 'Synthetic Representative', 'Synthetic organization awaiting local test verification.', false, 'pending'],
        ];

        foreach ($accounts as [$name, $email, $type, $affiliation, $idNumber, $organizationName, $position, $supportingInfo, $isAdmin, $status]) {
            $user = User::query()->firstOrNew(['email' => $email]);
            $user->name = $name;
            $user->user_type = $type;
            $user->affiliation = $affiliation;
            $user->id_number = $idNumber;
            $user->organization_name = $organizationName;
            $user->position = $position;
            $user->supporting_info = $supportingInfo;
            if (! $user->exists) $user->password = \Illuminate\Support\Facades\Hash::make('password');
            $user->email_verified_at ??= now();

            $user->is_admin = $isAdmin;
            $user->verification_status = $status;
            $user->save();
        }

        $faculty = User::query()->where('email', 'faculty@example.test')->firstOrFail();
        $organization = User::query()->where('email', 'organization@example.test')->firstOrFail();
        $studentOne = User::query()->where('email', 'student1@example.test')->firstOrFail();
        $studentTwo = User::query()->where('email', 'student2@example.test')->firstOrFail();
        if (empty($studentOne->class_schedule)) {
            $studentOne->class_schedule = [
                ['day' => 'mon', 'start_time' => '08:00', 'end_time' => '12:00', 'label' => 'Synthetic Morning Classes'],
                ['day' => 'wed', 'start_time' => '08:00', 'end_time' => '12:00', 'label' => 'Synthetic Morning Classes'],
                ['day' => 'fri', 'start_time' => '08:00', 'end_time' => '12:00', 'label' => 'Synthetic Morning Classes'],
                ['day' => 'tue', 'start_time' => '13:00', 'end_time' => '16:00', 'label' => 'Synthetic Afternoon Lab'],
                ['day' => 'thu', 'start_time' => '13:00', 'end_time' => '16:00', 'label' => 'Synthetic Afternoon Lab'],
            ];
            $studentOne->save();
        }
        $categories = array_keys(config('taskmate.categories', []));
        $modes = array_keys(config('taskmate.work_modes', []));
        $termsPresets = [
            1 => [750, false, 'upon_completion', 'Paid in cash after finishing.', ['sat'], '09:00', '12:00', 'Weekend morning shift.', false, true],
            2 => [null, true, 'to_be_discussed', 'Rate and pay timing will be agreed before starting.', null, null, null, 'Hours to be arranged around student availability.', true, true],
            3 => [1250, false, 'bi_weekly', 'Paid every other Saturday (bi-weekly, not monthly).', ['mon', 'wed', 'fri'], '09:00', '11:30', 'Fixed weekday morning shift.', false, false],
            4 => [1500, false, 'weekly', 'Paid every Saturday in cash.', ['tue', 'thu'], '14:00', '16:00', 'Shift can move to late afternoon if classes overlap.', false, true],
            6 => [null, true, 'to_be_discussed', null, null, null, null, null, true, null],
        ];

        for ($index = 1; $index <= 12; $index++) {
            $mode = $modes[($index - 1) % count($modes)];
            $poster = $index % 3 === 0 ? $organization : $faculty;
            $title = 'Synthetic approved demo task '.$index;
            $task = $poster->tasks()->where('title', $title)->first();
            if ($task && ! str_starts_with($task->description, 'Synthetic demonstration task for local testing only.')) continue;
            $task ??= $poster->tasks()->make(['title' => $title]);
            $task->poster()->associate($poster);
            $task->title = $title;
            $task->category = $categories[($index - 1) % count($categories)];
            $task->description = 'Synthetic demonstration task for local testing only. This task contains no real offer or location.';
            $task->required_activities = 'Complete a clearly described sample activity for this local demo.';
            $task->deliverables = 'Provide the synthetic sample deliverable described for this local test.';
            $task->estimated_duration_hours = ($index % 5) + 1;
            $task->skill_requirements = 'Synthetic general skills only.';
            $task->complexity = ['low', 'medium', 'high'][($index - 1) % 3];
            [$budget, $budgetTbd, $payTiming, $payTimingNote, $schedDays, $schedStart, $schedEnd, $schedNote, $schedTbd, $canChange] = $termsPresets[$index] ?? [
                500 + ($index * 250),
                false,
                ['upon_completion', 'daily', 'weekly', 'milestone'][($index - 1) % 4],
                null,
                $index % 2 === 0 ? ['sat', 'sun'] : ['tue', 'thu'],
                $index % 2 === 0 ? '10:00' : '17:00',
                $index % 2 === 0 ? '13:00' : '19:00',
                null,
                false,
                true,
            ];
            $task->budget = $budget;
            $task->budget_to_be_discussed = $budgetTbd;
            $task->pay_timing = $payTiming;
            $task->pay_timing_note = $payTimingNote;
            $task->schedule_days = $schedDays;
            $task->schedule_start_time = $schedStart;
            $task->schedule_end_time = $schedEnd;
            $task->schedule_note = $schedNote;
            $task->schedule_to_be_discussed = $schedTbd;
            $task->can_hours_change = $canChange;
            $task->work_mode = $mode;
            $task->workplace_name = $mode === 'remote' ? null : 'Synthetic Demo Worksite '.$index;
            $task->workplace_address = $mode === 'remote' ? null : 'Synthetic campus location '.$index;
            $task->physical_demand = ['none', 'light', 'moderate'][($index - 1) % 3];
            $task->academic_involvement = 'none';
            $task->hazard_exposure = false;
            $task->hazard_description = null;
            $task->private_meeting_required = false;
            $task->workplace_setting = $mode === 'remote' ? null : ['on_campus', 'off_campus_public'][($index - 1) % 2];
            $task->deadline = null;
            $task->status = TaskStatus::Approved;
            $task->guidelines_confirmed_at = now();
            $task->decision_source = 'admin';
            $task->risk_level = null;
            $task->risk_score = null;
            $task->screened_at = null;
            $task->reviewed_by = User::query()->where('email', 'admin@example.test')->value('id');
            $task->reviewed_at = now();
            $task->review_note = null;
            $task->save();

            if ($index <= 3) {
                $applicant = $index === 3 ? $studentTwo : $studentOne;
                $application = $task->applications()->firstOrNew(['applicant_id' => $applicant->id]);
                if ($application->exists && ! str_starts_with($application->message, 'Synthetic application message ')) continue;
                $application->task()->associate($task);
                $application->applicant()->associate($applicant);
                $application->message = 'Synthetic application message '.$index.' for local testing only.';
                $application->proposed_amount = 1000 + ($index * 100);
                $application->status = ApplicationStatus::Pending;
                $application->save();
                if (! $application->conversation()->exists()) app(ConversationWorkflow::class)->createForApplication($application);
            }
        }
    }
}
