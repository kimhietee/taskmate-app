<?php

namespace App\Http\Controllers;

use App\Enums\ApplicationStatus;
use App\Enums\TaskStatus;
use App\Http\Requests\StoreApplicationRequest;
use App\Models\Application;
use App\Models\Task;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Validation\ValidationException;
use App\Services\RatingWorkflow;
use App\Services\RatingSummary;
use App\Services\OffPlatformScanner;
use App\Services\TaskMateNotifications;
use App\Services\ConversationWorkflow;

class ApplicationController extends Controller
{
    public function store(StoreApplicationRequest $request, Task $task, OffPlatformScanner $scanner, TaskMateNotifications $alerts, ConversationWorkflow $conversations): RedirectResponse
    {
        Gate::authorize('create', [Application::class, $task]);

        DB::transaction(function () use ($request, $task, $scanner, $alerts, $conversations): void {
            $application = new Application;
            $application->task_id = $task->id;
            $application->applicant_id = $request->user()->id;
            $application->message = $request->validated('message');
            $application->proposed_amount = $request->validated('proposed_amount');
            $application->status = ApplicationStatus::Pending;
            $application->save();
            $conversations->createForApplication($application);
            $scanner->flag($application, $request->user(), 'message', $application->message);
            $alerts->send($task->poster()->firstOrFail(), 'application.new', route('tasks.show', $task->id, false), ['task_id' => $task->id, 'application_id' => $application->id], ['task_title' => $task->title], $request->user()->id);
        });

        return back()->with('status', 'Your application was submitted.');
    }

    public function mine(Request $request): Response
    {
        $applications = $request->user()->applications()
            ->with(['task.poster:id,name,user_type,organization_name', 'agreement', 'conversation'])
            ->latest()
            ->paginate(12)
            ->through(fn (Application $application) => [
                'id' => $application->id,
                'taskId' => $application->task->id,
                'taskTitle' => $application->task->title,
                'posterName' => $application->task->poster->isOrganization()
                    ? $application->task->poster->organization_name
                    : $application->task->poster->name,
                'budget' => $application->task->budget,
                'budgetToBeDiscussed' => $application->task->isBudgetToBeDiscussed(),
                'payTimingLabel' => $application->task->payTimingLabel(),
                'payTimingToBeDiscussed' => $application->task->isPayTimingToBeDiscussed(),
                'scheduleSummary' => $application->task->scheduleSummary(),
                'scheduleToBeDiscussed' => $application->task->isScheduleToBeDiscussed(),
                'status' => $application->status->value,
                'statusLabel' => $application->status->label(),
                'taskStatus' => $application->task->status->label(),
                'taskApproved' => $application->task->status === TaskStatus::Approved,
                'otherApplicantAccepted' => $application->status === ApplicationStatus::Pending
                    && $application->task->applications()->where('status', ApplicationStatus::Accepted->value)->exists(),
                'agreementId' => $application->agreement?->id,
                'agreementStatus' => $application->agreement?->status->value,
                'agreementStatusLabel' => $application->agreement?->status->label(),
                'paymentStatus' => $application->agreement?->paymentStatus()->value,
                'paymentStatusLabel' => $application->agreement?->paymentStatus()->label(),
                'appliedAt' => $application->created_at?->toDateTimeString(),
                'needsRating' => $application->task->status === TaskStatus::Completed && $application->agreement?->ratings()->where('rater_id', $request->user()->id)->doesntExist(),
                'conversationId' => $application->conversation?->id,
                'messageBlockedReason' => $application->conversation?->sendingBlockedReason($request->user()),
            ]);

        return Inertia::render('applications/index', [
            'applications' => $applications,
            'status' => $request->session()->get('status'),
        ]);
    }

    public function withdraw(Request $request, Application $application, TaskMateNotifications $alerts): RedirectResponse
    {
        Gate::authorize('withdraw', $application);
        $application->status = ApplicationStatus::Withdrawn;
        $application->responded_at = now();
        $application->save();
        $application->loadMissing('task.poster');
        $alerts->send($application->task->poster, 'application.withdrawn', route('tasks.show', $application->task_id, false), ['task_id' => $application->task_id, 'application_id' => $application->id], ['task_title' => $application->task->title], $request->user()->id);

        return back()->with('status', 'Your application was withdrawn.');
    }

    public function accept(Request $request, Task $task, Application $application, TaskMateNotifications $alerts): RedirectResponse
    {
        abort_unless($application->task_id === $task->id, 404);
        DB::transaction(function () use ($request, $task, $application, $alerts): void {
            $task = Task::query()->lockForUpdate()->findOrFail($task->id);
            $application->refresh();
            Gate::authorize('respond', $application);
            if ($task->status !== TaskStatus::Approved
                || $task->applications()->where('status', ApplicationStatus::Accepted->value)->exists()) {
                throw ValidationException::withMessages(['application' => 'This task already has an accepted application or is no longer available.']);
            }

            $application->status = ApplicationStatus::Accepted;
            $application->responded_at = now();
            $application->save();
            $task->status = TaskStatus::Assigned;
            $task->save();
            $alerts->send($application->applicant()->firstOrFail(), 'application.accepted', route('applications.mine', [], false), ['task_id' => $task->id, 'application_id' => $application->id], ['task_title' => $task->title], $request->user()->id);

        });

        return back()->with('status', 'The applicant was accepted.');
    }

    public function decline(Request $request, Task $task, Application $application, TaskMateNotifications $alerts): RedirectResponse
    {
        abort_unless($application->task_id === $task->id, 404);
        DB::transaction(function () use ($request, $task, $application, $alerts): void {
            $task = Task::query()->lockForUpdate()->findOrFail($task->id);
            $application->refresh();
            Gate::authorize('respond', $application);
            $application->status = ApplicationStatus::Declined;
            $application->responded_at = now();
            $application->save();
            $alerts->send($application->applicant()->firstOrFail(), 'application.declined', route('applications.mine', [], false), ['task_id' => $task->id, 'application_id' => $application->id], ['task_title' => $task->title], $request->user()->id);
        });

        return back()->with('status', 'The application was declined.');
    }
}
