<?php

namespace Database\Seeders;

use App\Enums\ApplicationStatus;
use App\Enums\TaskStatus;
use App\Enums\VerificationStatus;
use App\Models\Application;
use App\Models\Task;
use App\Models\User;
use App\Models\Report;
use App\Models\UserSanction;
use App\Enums\SanctionType;
use App\Enums\ReportType;
use App\Enums\ReportStatus;
use App\Enums\ReportOutcome;
use App\Services\OffPlatformScanner;
use App\Services\ConversationWorkflow;
use App\Models\Agreement;
use App\Models\AgreementVersion;
use App\Models\AgreementConfirmation;
use App\Models\PaymentEvent;
use App\Models\TaskCompletion;
use App\Models\Rating;
use App\Enums\AgreementStatus;
use App\Enums\PaymentEventType;
use App\Enums\RatingDirection;
use App\Services\AgreementContentHasher;
use Illuminate\Database\Seeder;

class DemoScenarioSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment('local')) {
            return;
        }

        $this->call(LocalTaskMateSeeder::class);
        $admin = User::where('email', 'admin@example.test')->firstOrFail();
        $faculty = User::where('email', 'faculty@example.test')->firstOrFail();
        $student = User::where('email', 'student1@example.test')->firstOrFail();

        foreach ([
            ['Synthetic scenario: Pending review', TaskStatus::PendingReview],
            ['Synthetic scenario: Changes requested', TaskStatus::ChangesRequested],
            ['Synthetic scenario: Approved', TaskStatus::Approved],
            ['Synthetic scenario: Rejected', TaskStatus::Rejected],
            ['Synthetic scenario: Assigned', TaskStatus::Assigned],
            ['Synthetic scenario: In progress', TaskStatus::InProgress],
            ['Synthetic scenario: Completed', TaskStatus::Completed],
            ['Synthetic scenario: Removed', TaskStatus::Removed],
            ['Synthetic scenario: Cancelled', TaskStatus::Cancelled],
            ['Synthetic scenario: New manual review', TaskStatus::PendingReview],
            ['Synthetic scenario: Please message me on Telegram', TaskStatus::Approved],
        ] as [$title, $status]) {
            $task = $faculty->tasks()->where('title', $title)->first();
            if ($task && ! str_starts_with($task->description, 'Synthetic scenario record for local testing only.')) continue;
            $task ??= $faculty->tasks()->make(['title' => $title]);
            $task->poster()->associate($faculty);
            $task->title = $title;
            $task->category = array_key_first(config('taskmate.categories'));
            $task->work_type = 'one_time_gig';
            $task->description = 'Synthetic scenario record for local testing only.';
            $task->required_activities = 'Review the clearly synthetic scenario details.';
            $task->deliverables = 'A synthetic sample deliverable.';
            $task->estimated_duration_hours = 2;
            $task->skill_requirements = null;
            $task->complexity = 'low';
            $task->budget = 500;
            $task->budget_to_be_discussed = false;
            $task->pay_timing = 'upon_completion';
            $task->pay_timing_note = null;
            $task->schedule_days = ['sat'];
            $task->schedule_start_time = '10:00';
            $task->schedule_end_time = '12:00';
            $task->schedule_note = null;
            $task->schedule_to_be_discussed = false;
            $task->can_hours_change = true;
            $task->work_mode = 'remote';
            $task->workplace_name = null;
            $task->workplace_address = null;
            $task->physical_demand = 'none';
            $task->academic_involvement = 'none';
            $task->hazard_exposure = false;
            $task->hazard_description = null;
            $task->private_meeting_required = false;
            $task->workplace_setting = null;
            $task->status = $status;
            $task->guidelines_confirmed_at = now();
            $task->risk_level = null;
            $task->risk_score = null;
            $task->decision_source = null;
            $task->screened_at = null;
            $task->reviewed_by = in_array($status, [TaskStatus::Approved, TaskStatus::Rejected, TaskStatus::ChangesRequested], true) ? $admin->id : null;
            $task->reviewed_at = in_array($status, [TaskStatus::Approved, TaskStatus::Rejected, TaskStatus::ChangesRequested], true) ? now() : null;
            $task->poster()->associate($faculty);
            $task->status = $status;
            if ($status === TaskStatus::ChangesRequested) $task->review_note = 'Synthetic note requesting clearer details.';
            if ($status === TaskStatus::Rejected) $task->review_note = 'Synthetic rejected task scenario.';
            if (in_array($status, [TaskStatus::Approved, TaskStatus::Rejected, TaskStatus::ChangesRequested], true)) {
                $task->reviewed_by = $admin->id; $task->reviewed_at = now();
            }
            if ($status === TaskStatus::Removed) {
                $task->removed_by = $admin->id; $task->removed_at = now(); $task->removal_reason = 'Synthetic removal scenario.';
            }
            $task->save();

            if ($title === 'Synthetic scenario: Please message me on Telegram') {
                app(OffPlatformScanner::class)->flag($task, $faculty, 'description', 'Please message me on Telegram');
            }

            if ($status === TaskStatus::Assigned) {
                $application = $task->applications()->firstOrNew(['applicant_id' => $student->id]);
                if ($application->exists && ! str_starts_with($application->message, 'Synthetic application for local demo only.')) continue;
                $application->task()->associate($task); $application->applicant()->associate($student);
                $application->message = 'Synthetic application for local demo only.';
                $application->status = ApplicationStatus::Accepted; $application->responded_at = now(); $application->save();
                if (! $application->conversation()->exists()) app(ConversationWorkflow::class)->createForApplication($application);
                $agreement = $task->agreements()->firstOrNew(['application_id' => $application->id]);
                if (! $agreement->exists) {
                    $agreement->task()->associate($task); $agreement->application()->associate($application);
                    $agreement->poster()->associate($faculty); $agreement->student()->associate($student);
                    $agreement->status = AgreementStatus::Negotiating; $agreement->save();
                }
            }
        }

        $moreInfo = User::where('email', 'student.pending@example.test')->firstOrFail();
        $moreInfo->verification_status = VerificationStatus::MoreInfoRequested;
        $moreInfo->verification_note = 'Synthetic request for updated demo details.';
        $moreInfo->save();
        $rejected = User::firstOrCreate(['email' => 'student.rejected@example.test'], [
            'name' => 'Synthetic Rejected Student', 'user_type' => 'student', 'affiliation' => 'Demo College', 'id_number' => 'FAKE-STU-REJ',
            'password' => 'password', 'email_verified_at' => now(),
        ]);
        $rejected->verification_status = VerificationStatus::Rejected;
        $rejected->verification_note = 'Synthetic rejected account scenario.';
        $rejected->save();

        foreach ([
            ['warning', $student, SanctionType::Warning],
            ['suspension', $moreInfo, SanctionType::Suspension],
            ['ban', $rejected, SanctionType::Ban],
        ] as [$label, $user, $type]) {
            if (UserSanction::where('user_id', $user->id)->where('reason', 'Synthetic '.$label.' scenario.')->exists()) continue;
            $sanction = new UserSanction(); $sanction->user()->associate($user); $sanction->type = $type;
            $sanction->reason = 'Synthetic '.$label.' scenario.'; $sanction->internal_note = 'Synthetic local testing record.';
            $sanction->starts_at = now()->subDay(); $sanction->ends_at = $type === SanctionType::Suspension ? now()->addDays(7) : null;
            $sanction->issuer()->associate($admin); $sanction->save();
        }

        $reportTask = Task::query()->where('title', 'Synthetic scenario: Completed')->firstOrFail();
        foreach ([
            ['open', ReportStatus::Open, null],
            ['under-review', ReportStatus::UnderReview, null],
            ['escalated', ReportStatus::UnderReview, null],
            ['resolved', ReportStatus::Resolved, ReportOutcome::Inconclusive],
        ] as [$label, $status, $outcome]) {
            $existing = Report::query()->where('description', 'Synthetic '.$label.' report scenario.')->first();
            if ($existing) continue;
            $report = new Report(); $report->reporter()->associate($student); $report->reportedUser()->associate($faculty);
            $report->task()->associate($reportTask); $report->type = ReportType::Other; $report->description = 'Synthetic '.$label.' report scenario.';
            $report->status = $status; $report->outcome = $outcome; $report->priority = $label === 'escalated' ? 'high' : 'normal';
            if ($label === 'escalated') { $report->escalated_at = now(); $report->escalated_by = $admin->id; $report->escalation_note = 'Synthetic escalation marker.'; }
            if ($status === ReportStatus::Resolved) { $report->reviewed_by = $admin->id; $report->reviewed_at = now(); $report->admin_note = 'Synthetic resolution note.'; }
            $report->save();
        }

        foreach (['unpaid', 'marked-paid', 'received', 'not-received'] as $paymentCase) {
            $taskTitle = 'Synthetic scenario: Payment '.$paymentCase;
            $task = $faculty->tasks()->where('title', $taskTitle)->first();
            if ($task && ! str_starts_with($task->description, 'Synthetic payment-status scenario.')) continue;
            $task ??= $faculty->tasks()->make(['title' => $taskTitle]);
            $task->poster()->associate($faculty); $task->title = $taskTitle;
            $task->category = array_key_first(config('taskmate.categories')); $task->description = 'Synthetic payment-status scenario.';
            $task->required_activities = 'Synthetic activity.'; $task->deliverables = 'Synthetic deliverable.';
            $task->estimated_duration_hours = 1; $task->complexity = 'low'; $task->budget = 500; $task->work_mode = 'remote';
            $task->status = TaskStatus::InProgress; $task->guidelines_confirmed_at = now();
            $task->physical_demand = 'none'; $task->academic_involvement = 'none';
            $task->hazard_exposure = false; $task->private_meeting_required = false; $task->workplace_setting = null;
            $task->status = TaskStatus::InProgress; $task->save();
            $application = $task->applications()->firstOrNew(['applicant_id' => $student->id]);
            if ($application->exists && ! str_starts_with($application->message, 'Synthetic accepted application.')) continue;
            $application->task()->associate($task); $application->applicant()->associate($student);
            $application->message = 'Synthetic accepted application.';
            $application->status = ApplicationStatus::Accepted; $application->responded_at = now(); $application->save();
            if (! $application->conversation()->exists()) app(ConversationWorkflow::class)->createForApplication($application);
            $agreement = $task->agreements()->firstOrNew(['application_id' => $application->id]);
            if ($agreement->exists && ! $agreement->versions()->where('comment', 'Synthetic demo proposal.')->exists()) continue;
            if (! $agreement->exists) {
                $agreement->task()->associate($task); $agreement->application()->associate($application);
                $agreement->poster()->associate($faculty); $agreement->student()->associate($student);
                $agreement->status = AgreementStatus::Agreed; $agreement->locked_at = now(); $agreement->save();
            }
            if (! $agreement->current_version_id) {
                $version = new AgreementVersion(); $version->agreement()->associate($agreement); $version->version_number = 1;
                $version->proposed_by = $faculty->id; $version->deliverables = 'Synthetic agreed deliverable.';
                $version->terms = 'Synthetic agreement terms for local testing only.'; $version->final_amount = 500;
                $version->start_date = today()->subDay(); $version->due_date = today()->addDays(5);
                $version->work_mode = 'remote'; $version->payment_arrangement = 'Synthetic direct payment arrangement after completion.';
                $version->comment = 'Synthetic demo proposal.'; $version->created_at = now();
                $version->content_hash = app(AgreementContentHasher::class)->hash($version); $version->save();
                $agreement->current_version_id = $version->id; $agreement->status = AgreementStatus::Agreed; $agreement->locked_at = now(); $agreement->save();
                foreach ([$faculty, $student] as $party) { $confirmation = new AgreementConfirmation(); $confirmation->agreement_version_id = $version->id; $confirmation->user_id = $party->id; $confirmation->confirmed_at = now(); $confirmation->save(); }
            }
            if (($paymentCase === 'marked-paid' || $paymentCase === 'received' || $paymentCase === 'not-received') && ! $agreement->paymentEvents()->where('event', PaymentEventType::MarkedPaid)->exists()) {
                $event = new PaymentEvent(); $event->agreement_id = $agreement->id; $event->actor_id = $faculty->id;
                $event->event = PaymentEventType::MarkedPaid; $event->amount = 500; $event->paid_on = today(); $event->method = 'Synthetic demo'; $event->note = 'Synthetic local data.'; $event->created_at = now(); $event->save();
            }
            if (($paymentCase === 'received' || $paymentCase === 'not-received') && ! $agreement->paymentEvents()->whereIn('event', [PaymentEventType::ConfirmedReceived->value, PaymentEventType::ReportedNotReceived->value])->exists()) {
                $event = new PaymentEvent(); $event->agreement_id = $agreement->id; $event->actor_id = $student->id;
                $event->event = $paymentCase === 'received' ? PaymentEventType::ConfirmedReceived : PaymentEventType::ReportedNotReceived;
                $event->amount = $paymentCase === 'received' ? 500 : null; $event->note = 'Synthetic local payment response.'; $event->created_at = now(); $event->save();
            }
            if ($paymentCase === 'received') {
                $completion = $agreement->completion()->firstOrNew(); $completion->completed_at = now();
                $completion->completed_by = $faculty->id; $completion->completion_note = 'Synthetic completion record.'; $completion->save();
                $task->status = TaskStatus::Completed; $task->save();
                if (! Rating::where('agreement_id', $agreement->id)->exists()) {
                    $rating = new Rating(); $rating->agreement_id = $agreement->id; $rating->task_id = $task->id;
                    $rating->rater_id = $faculty->id; $rating->ratee_id = $student->id; $rating->direction = RatingDirection::PosterToStudent;
                    $rating->overall_experience = 5; $rating->comment = 'Synthetic local feedback.'; $rating->save();
                    foreach (array_keys(config('taskmate.ratings.dimensions.poster_to_student')) as $dimension) $rating->scores()->create(['dimension' => $dimension, 'score' => 5]);
                }
            } elseif ($paymentCase === 'unpaid') {
                $completion = $agreement->completion()->firstOrNew(); $completion->completed_at = now();
                $completion->completed_by = $faculty->id; $completion->completion_note = 'Synthetic completed task without a rating.'; $completion->save();
                $task->status = TaskStatus::Completed; $task->save();
            }
        }
    }
}
