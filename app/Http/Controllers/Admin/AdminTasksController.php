<?php

namespace App\Http\Controllers\Admin;

use App\Enums\TaskStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AdminTaskIndexRequest;
use App\Models\AdminAction;
use App\Models\Task;
use App\Enums\PaymentEventType;
use App\Enums\PaymentStatus;
use Inertia\Inertia;
use Inertia\Response;

class AdminTasksController extends Controller
{
    public function index(AdminTaskIndexRequest $request): Response
    {
        $filters = $request->validated();
        $tasks = Task::query()
            ->with('poster:id,name,user_type,verification_status')
            ->when($filters['search'] ?? null, fn ($query, string $search) => $query->where(fn ($query) => $query
                ->where('title', 'like', "%{$search}%")
                ->orWhereHas('poster', fn ($poster) => $poster->where('name', 'like', "%{$search}%"))))
            ->when($filters['status'] ?? null, fn ($query, string $status) => $query->where('status', $status))
            ->when($filters['work_mode'] ?? null, fn ($query, string $mode) => $query->where('work_mode', $mode))
            ->orderByRaw("CASE status WHEN 'pending_review' THEN 0 ELSE 1 END")
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Task $task) => [
                'id' => $task->id,
                'title' => $task->title,
                'posterName' => $task->poster->name,
                'posterType' => config('taskmate.user_types.'.$task->poster->user_type->value),
                'status' => $task->status->value,
                'statusLabel' => $task->status->label(),
                'workMode' => config('taskmate.work_modes.'.$task->work_mode, $task->work_mode),
                'submittedAt' => $task->created_at?->toDateTimeString(),
            ]);

        return Inertia::render('admin/tasks/index', [
            'tasks' => $tasks,
            'filters' => $filters,
            'statuses' => collect(TaskStatus::cases())->map(fn (TaskStatus $status) => ['value' => $status->value, 'label' => $status->label()])->values(),
            'workModes' => collect(config('taskmate.work_modes', []))->map(fn (string $label, string $value) => compact('value', 'label'))->values(),
        ]);
    }

    public function show(Task $task): Response
    {
        $task->load(['poster', 'contentFlags', 'adminActions.admin:id,name', 'applications.applicant:id,name', 'agreement.currentVersion', 'agreement.completion', 'agreement.paymentEvents.actor:id,name']);

        return Inertia::render('admin/tasks/show', [
            'task' => [
                'id' => $task->id,
                'title' => $task->title,
                'category' => config('taskmate.categories.'.$task->category, $task->category),
                'categoryKey' => $task->category,
                'workTypeLabel' => $task->workTypeLabel(),
                'description' => $task->description,
                'requiredActivities' => $task->required_activities,
                'deliverables' => $task->deliverables,
                'estimatedDurationHours' => $task->estimated_duration_hours,
                'skillRequirements' => $task->skill_requirements,
                'complexity' => config('taskmate.complexity_levels.'.$task->complexity, $task->complexity),
                'budget' => $task->budget,
                'budgetToBeDiscussed' => $task->isBudgetToBeDiscussed(),
                'payTimingLabel' => $task->payTimingLabel(),
                'payTimingToBeDiscussed' => $task->isPayTimingToBeDiscussed(),
                'payTimingNote' => $task->pay_timing_note,
                'scheduleSummary' => $task->scheduleSummary(),
                'scheduleNote' => $task->schedule_note,
                'scheduleToBeDiscussed' => $task->isScheduleToBeDiscussed(),
                'canHoursChange' => $task->can_hours_change,
                'workMode' => config('taskmate.work_modes.'.$task->work_mode, $task->work_mode),
                'workplaceName' => $task->workplace_name,
                'workplaceAddress' => $task->workplace_address,
                'deadline' => $task->deadline?->toDateString(),
                'status' => $task->status->value,
                'statusLabel' => $task->status->label(),
                'reviewNote' => $task->review_note,
                'submittedAt' => $task->created_at?->toDateTimeString(),
                'poster' => [
                    'id' => $task->poster->id,
                    'name' => $task->poster->name,
                    'type' => config('taskmate.user_types.'.$task->poster->user_type->value),
                    'verificationStatus' => $task->poster->verification_status->value,
                    'otherTasksCount' => $task->poster->tasks()->whereKeyNot($task->id)->count(),
                ],
            ],
            'adminActions' => $task->adminActions->sortByDesc('created_at')->map(fn (AdminAction $action) => [
                'id' => $action->id,
                'action' => $action->action,
                'adminName' => $action->admin?->name,
                'note' => $action->note,
                'createdAt' => $action->created_at?->toDateTimeString(),
            ])->values(),
            'applications' => $task->applications->map(fn ($application) => [
                'id' => $application->id,
                'applicantName' => $application->applicant->name,
                'status' => $application->status->label(),
                'appliedAt' => $application->created_at?->toDateTimeString(),
                'userId' => $application->applicant->id,
            ])->values(),
            'flags' => $task->contentFlags->map(fn ($flag) => [
                'id' => $flag->id,
                'category' => config('taskmate.offplatform.category_labels.'.$flag->category, $flag->category),
                'matched' => $flag->matched,
                'field' => $flag->field,
                'status' => $flag->status->value,
                'createdAt' => $flag->created_at?->toDateTimeString(),
            ])->values(),
            'agreement' => $task->agreement ? [
                'id' => $task->agreement->id,
                'status' => $task->agreement->status->value,
                'locked_at' => $task->agreement->locked_at?->toDateTimeString(),
            ] : null,
            'completionPayment' => $task->agreement ? $this->completionPayment($task->agreement) : null,
            'canReview' => $task->status === TaskStatus::PendingReview && $task->poster_id !== auth()->id(),
            'riskQuestions' => collect(config('taskmate.risk_questions', []))->mapWithKeys(fn (array $items, string $key) => [$key => $this->optionsFor($items)]),
        ]);
    }

    private function optionsFor(array $options): array
    {
        return collect($options)->map(fn (string $label, string $value) => compact('value', 'label'))->values()->all();
    }

    private function completionPayment(\App\Models\Agreement $agreement): array
    {
        $completion = $agreement->completion;
        $agreedAmount = (float) $agreement->currentVersion->final_amount;
        $events = $agreement->paymentEvents;
        $latest = $events->last();
        $paymentStatus = match ($latest?->event) {
            PaymentEventType::MarkedPaid => PaymentStatus::MarkedPaid,
            PaymentEventType::ConfirmedReceived => PaymentStatus::ConfirmedReceived,
            PaymentEventType::ReportedNotReceived => PaymentStatus::NotReceived,
            default => PaymentStatus::Unpaid,
        };

        return [
            'paymentStatus' => $paymentStatus->value,
            'paymentStatusLabel' => $paymentStatus->label(),
            'agreedAmount' => $agreement->currentVersion->final_amount,
            'settled' => $latest?->event === PaymentEventType::ConfirmedReceived && $latest->amount !== null && (float) $latest->amount === $agreedAmount,
            'completion' => $completion ? ['deliveredAt' => $completion->delivered_at?->toDateTimeString(), 'deliveredNote' => $completion->delivered_note, 'completedAt' => $completion->completed_at?->toDateTimeString(), 'completionNote' => $completion->completion_note] : null,
            'events' => $events->map(fn ($event) => [
                'id' => $event->id, 'event' => $event->event->value,
                'eventLabel' => match ($event->event) {
                    PaymentEventType::MarkedPaid => 'Poster marked payment as paid',
                    PaymentEventType::ConfirmedReceived => 'Student confirmed receipt',
                    PaymentEventType::ReportedNotReceived => 'Student reported not receiving payment',
                },
                'actorName' => $event->actor->name, 'amount' => $event->amount, 'paidOn' => $event->paid_on?->toDateString(),
                'method' => $event->method, 'note' => $event->note, 'createdAt' => $event->created_at?->toDateTimeString(),
                'amountMismatch' => $event->amount !== null && (float) $event->amount !== $agreedAmount,
            ])->values(),
            'activeReportId' => null, 'canMarkDelivered' => false, 'canRecordCompletion' => false,
            'canMarkPaid' => false, 'canRespondPayment' => false, 'canReportNonPayment' => false, 'paymentMethods' => [],
        ];
    }
}
