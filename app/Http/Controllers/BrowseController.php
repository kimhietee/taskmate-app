<?php

namespace App\Http\Controllers;

use App\Enums\TaskStatus;
use App\Http\Requests\BrowseTasksRequest;
use App\Models\Task;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Services\RatingSummary;
use Illuminate\Support\Str;

class BrowseController extends Controller
{
    public function index(BrowseTasksRequest $request): Response
    {
        $filters = $request->validated();
        $tasks = Task::query()
            ->with('poster:id,name,user_type,verification_status,affiliation,organization_name,created_at')
            ->where('status', TaskStatus::Approved->value)
            ->whereDoesntHave('poster.sanctions', fn ($sanctions) => $sanctions->whereNull('lifted_at')->where('type', 'suspension')->where('starts_at', '<=', now())->where('ends_at', '>', now()))
            ->where(fn ($query) => $query->whereNull('deadline')->orWhereDate('deadline', '>=', today()))
            ->when($filters['search'] ?? null, function ($query, string $search) {
                $query->where(fn ($query) => $query
                    ->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('required_activities', 'like', "%{$search}%"));
            })
            ->when($filters['category'] ?? null, fn ($query, string $category) => $query->where('category', $category))
            ->when($filters['work_mode'] ?? null, fn ($query, string $mode) => $query->where('work_mode', $mode))
            ->when($filters['complexity'] ?? null, fn ($query, string $complexity) => $query->where('complexity', $complexity))
            ->when(isset($filters['min_budget']), fn ($query) => $query->whereNotNull('budget')->where('budget', '>=', $filters['min_budget']))
            ->when(isset($filters['max_budget']), fn ($query) => $query->whereNotNull('budget')->where('budget', '<=', $filters['max_budget']))
            ->when(($filters['sort'] ?? 'newest') === 'budget_high', fn ($query) => $query->orderByRaw('budget IS NULL ASC')->orderByDesc('budget'))
            ->when(($filters['sort'] ?? 'newest') === 'budget_low', fn ($query) => $query->orderByRaw('budget IS NULL ASC')->orderBy('budget'))
            ->when(($filters['sort'] ?? 'newest') === 'newest', fn ($query) => $query->latest())
            ->paginate((int) config('taskmate.browse.per_page', 12))
            ->withQueryString()
            ->through(fn (Task $task) => $this->listing($task, $request->user()->id));

        return Inertia::render('browse/index', [
            'tasks' => $tasks,
            'filters' => $filters,
            'options' => [
                'categories' => $this->options(config('taskmate.categories', [])),
                'workModes' => $this->options(config('taskmate.work_modes', [])),
                'sorts' => $this->options(config('taskmate.browse.sort_options', [])),
            ],
        ]);
    }

    public function show(Request $request, Task $task, RatingSummary $ratingSummaries): Response
    {
        abort_unless($task->status === TaskStatus::Approved, 404);
        abort_if($task->poster->sanctions()->whereNull('lifted_at')->where('type', 'suspension')->where('starts_at', '<=', now())->where('ends_at', '>', now())->exists(), 404);
        abort_if($task->deadline !== null && $task->deadline->toDateString() < today()->toDateString(), 404);
        $task->load('poster:id,name,user_type,verification_status,affiliation,organization_name,created_at');
        $application = $task->applications()->where('applicant_id', $request->user()->id)->first();
        $conversation = $application ? $application->conversation()->first() : null;

        return Inertia::render('browse/show', [
            'task' => $this->details($task),
            'poster' => [...$this->poster($task), 'profileUrl' => route('users.show', $task->poster), 'ratingSummary' => $ratingSummaries->forUser($task->poster)],
            'application' => $application ? [
                'status' => $application->status->value,
                'statusLabel' => $application->status->label(),
                'appliedAt' => $application->created_at?->toDateTimeString(),
            ] : null,
            'conversation' => $conversation ? ['id' => $conversation->id, 'sendBlockedReason' => $conversation->sendingBlockedReason($request->user())] : null,
            'canApply' => $application === null && $task->status === TaskStatus::Approved
                && ($task->deadline === null || $task->deadline->toDateString() >= today()->toDateString())
                && $task->poster_id !== $request->user()->id,
            'problemReport' => ['action' => route('tasks.problem-reports.store', $task), 'types' => $this->problemReportTypes()],
            'offPlatformWarning' => $task->contentFlags()->where('source_user_id', '!=', $request->user()->id)->where('status', 'open')->exists(),
            'status' => $request->session()->get('status'),
            'messageMaxLength' => (int) config('taskmate.applications.message_max_length', 1000),
            'studentClassSchedule' => $request->user()->class_schedule ?? [],
            'daysOfWeek' => $this->options(config('taskmate.days_of_week', [])),
            'maxClassBlocks' => (int) config('taskmate.class_schedule.max_blocks', 25),
        ]);
    }

    public function applicationTask(Request $request, \App\Models\Application $application, RatingSummary $ratingSummaries): Response
    {
        abort_unless($application->applicant_id === $request->user()->id, 404);
        $task = $application->task()->with('poster:id,name,user_type,verification_status,affiliation,organization_name,created_at')->firstOrFail();
        $conversation = $application->conversation()->first();
        abort_if($task->status === TaskStatus::Removed, 404);

        return Inertia::render('browse/show', [
            'task' => $this->details($task),
            'poster' => [...$this->poster($task), 'profileUrl' => route('users.show', $task->poster), 'ratingSummary' => $ratingSummaries->forUser($task->poster)],
            'application' => [
                'status' => $application->status->value,
                'statusLabel' => $application->status->label(),
                'appliedAt' => $application->created_at?->toDateTimeString(),
            ],
            'conversation' => $conversation ? ['id' => $conversation->id, 'sendBlockedReason' => $conversation->sendingBlockedReason($request->user())] : null,
            'limitedView' => $task->status !== TaskStatus::Approved,
            'currentTaskStatus' => $task->status->label(),
            'messageMaxLength' => (int) config('taskmate.applications.message_max_length', 1000),
            'studentClassSchedule' => $request->user()->class_schedule ?? [],
            'daysOfWeek' => $this->options(config('taskmate.days_of_week', [])),
            'maxClassBlocks' => (int) config('taskmate.class_schedule.max_blocks', 25),
        ]);
    }

    private function listing(Task $task, int $studentId): array
    {
        return [
            'id' => $task->id,
            'title' => $task->title,
            'descriptionPreview' => Str::limit(strip_tags($task->description), 180),
            'category' => config('taskmate.categories.'.$task->category, $task->category),
            'budget' => $task->budget,
            'budgetToBeDiscussed' => $task->isBudgetToBeDiscussed(),
            'payTimingLabel' => $task->payTimingLabel(),
            'payTimingToBeDiscussed' => $task->isPayTimingToBeDiscussed(),
            'scheduleSummary' => $task->scheduleSummary(),
            'scheduleToBeDiscussed' => $task->isScheduleToBeDiscussed(),
            'canHoursChange' => $task->can_hours_change,
            'workMode' => config('taskmate.work_modes.'.$task->work_mode, $task->work_mode),
            'deadline' => $task->deadline?->toDateString(),
            'workplaceName' => $task->workplace_name,
            'workplaceAddress' => $task->workplace_address,
            'posterName' => $task->poster->isOrganization() ? $task->poster->organization_name : $task->poster->name,
            'posterType' => config('taskmate.user_types.'.$task->poster->user_type->value),
            'posterVerificationStatus' => $task->poster->verification_status->value,
            'hasApplied' => $task->applications()->where('applicant_id', $studentId)->exists(),
        ];
    }

    private function details(Task $task): array
    {
        return [
            'id' => $task->id,
            'title' => $task->title,
            'category' => config('taskmate.categories.'.$task->category, $task->category),
            'description' => $task->description,
            'requiredActivities' => $task->required_activities,
            'deliverables' => $task->deliverables,
            'estimatedDurationHours' => $task->estimated_duration_hours,
            'skillRequirements' => $task->skill_requirements,
            'budget' => $task->budget,
            'budgetToBeDiscussed' => $task->isBudgetToBeDiscussed(),
            'payTiming' => $task->pay_timing,
            'payTimingLabel' => $task->payTimingLabel(),
            'payTimingToBeDiscussed' => $task->isPayTimingToBeDiscussed(),
            'payTimingNote' => $task->pay_timing_note,
            'scheduleDays' => $task->schedule_days ?? [],
            'scheduleStartTime' => $task->schedule_start_time,
            'scheduleEndTime' => $task->schedule_end_time,
            'scheduleNote' => $task->schedule_note,
            'scheduleToBeDiscussed' => $task->isScheduleToBeDiscussed(),
            'scheduleSummary' => $task->scheduleSummary(),
            'canHoursChange' => $task->can_hours_change,
            'workMode' => config('taskmate.work_modes.'.$task->work_mode, $task->work_mode),
            'workplaceName' => $task->workplace_name,
            'workplaceAddress' => $task->workplace_address,
            'deadline' => $task->deadline?->toDateString(),
        ];
    }

    private function poster(Task $task): array
    {
        $poster = $task->poster;

        return [
            'displayName' => $poster->isOrganization() ? $poster->organization_name : $poster->name,
            'accountType' => config('taskmate.user_types.'.$poster->user_type->value),
            'affiliation' => $poster->isOrganization() ? $poster->organization_name : $poster->affiliation,
            'verificationStatus' => $poster->verification_status->value,
            'memberSince' => $poster->created_at?->toDateString(),
        ];
    }

    private function options(array $values): array
    {
        return collect($values)->map(fn (string $label, string $value) => compact('value', 'label'))->values()->all();
    }

    private function problemReportTypes(): array
    {
        return collect(config('taskmate.reports.types', []))->except(['non_payment', 'incomplete_work'])->map(fn ($settings, $value) => ['value' => $value, 'label' => $settings['label']])->values()->all();
    }
}
