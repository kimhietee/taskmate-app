<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserType;
use App\Enums\VerificationStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AdminUsersIndexRequest;
use App\Models\AdminAction;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class AdminUsersController extends Controller
{
    public function index(AdminUsersIndexRequest $request): Response
    {
        $filters = $request->validated();
        $users = User::query()
            ->when($filters['search'] ?? null, fn ($query, string $search) => $query->where(fn ($query) => $query
                ->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")))
            ->when($filters['user_type'] ?? null, fn ($query, string $type) => $query->where('user_type', $type))
            ->when($filters['verification_status'] ?? null, fn ($query, string $status) => $query->where('verification_status', $status))
            ->orderByRaw("CASE verification_status WHEN 'pending' THEN 0 WHEN 'more_info_requested' THEN 1 WHEN 'rejected' THEN 2 WHEN 'unverified' THEN 3 ELSE 4 END")
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'userType' => $user->user_type->value,
                'userTypeLabel' => config('taskmate.user_types.'.$user->user_type->value),
                'verificationStatus' => $user->verification_status->value,
                'registeredAt' => $user->created_at?->toDateTimeString(),
            ]);

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'filters' => $filters,
            'userTypes' => collect(UserType::cases())->map(fn (UserType $type) => [
                'value' => $type->value,
                'label' => config('taskmate.user_types.'.$type->value),
            ])->values(),
            'verificationStatuses' => collect(VerificationStatus::cases())->map(fn (VerificationStatus $status) => [
                'value' => $status->value,
                'label' => str($status->value)->replace('_', ' ')->title()->toString(),
            ])->values(),
        ]);
    }

    public function show(User $user): Response
    {
        $user->load(['adminActions.admin:id,name', 'verifiedBy:id,name', 'ratingsReceived.task:id,title', 'ratingsReceived.rater:id,name', 'ratingsReceived.scores', 'ratingsGiven.task:id,title', 'ratingsGiven.ratee:id,name', 'ratingsGiven.scores', 'sanctions.issuer:id,name', 'sanctions.report']);

        return Inertia::render('admin/users/show', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'institutionalEmail' => $user->institutional_email,
                'institutionalEmailVerifiedAt' => $user->institutional_email_verified_at?->toDateTimeString(),
                'verificationMethod' => $user->verification_method,
                'userType' => $user->user_type->value,
                'userTypeLabel' => config('taskmate.user_types.'.$user->user_type->value),
                'verificationStatus' => $user->verification_status->value,
                'idNumber' => $user->id_number,
                'affiliation' => $user->affiliation,
                'organizationName' => $user->organization_name,
                'position' => $user->position,
                'supportingInfo' => $user->supporting_info,
                'verificationNote' => $user->verification_note,
                'registeredAt' => $user->created_at?->toDateTimeString(),
                'verifiedAt' => $user->verified_at?->toDateTimeString(),
                'verifiedBy' => $user->verifiedBy?->name,
                'isSelf' => auth()->id() === $user->id,
            ],
            'history' => $user->adminActions
                ->sortByDesc('created_at')
                ->map(fn (AdminAction $action) => [
                    'id' => $action->id,
                    'action' => $action->action,
                    'actorName' => $action->admin?->name,
                    'note' => $action->note,
                    'createdAt' => $action->created_at?->toDateTimeString(),
                ])->values(),
            'ratingsReceived' => $user->ratingsReceived->map(fn ($rating) => $this->ratingRecord($rating, $rating->rater->name))->values(),
            'ratingsGiven' => $user->ratingsGiven->map(fn ($rating) => $this->ratingRecord($rating, $rating->ratee->name))->values(),
            'sanctions' => $user->sanctions->sortByDesc('created_at')->map(fn ($sanction) => ['id' => $sanction->id, 'type' => $sanction->type->value, 'reason' => $sanction->reason, 'internalNote' => $sanction->internal_note, 'startsAt' => $sanction->starts_at?->toDateTimeString(), 'endsAt' => $sanction->ends_at?->toDateTimeString(), 'liftedAt' => $sanction->lifted_at?->toDateTimeString(), 'liftNote' => $sanction->lift_note, 'reportId' => $sanction->report_id])->values(),
            'postedTasks' => $user->tasks()->select(['id', 'title', 'status'])->latest()->get()->map(fn ($task) => ['id' => $task->id, 'title' => $task->title, 'status' => $task->status->label()])->values(),
        ]);
    }

    private function ratingRecord($rating, string $otherParty): array
    {
        return [
            'id' => $rating->id,
            'direction' => $rating->direction->value,
            'overall' => $rating->overall_experience,
            'comment' => $rating->comment,
            'taskTitle' => $rating->task->title,
            'otherParty' => $otherParty,
            'hidden' => $rating->is_hidden,
            'hiddenReason' => $rating->hidden_reason,
            'scores' => $rating->scores->map(fn ($score) => ['dimension' => $score->dimension, 'score' => $score->score])->values(),
            'date' => $rating->created_at?->toDateTimeString(),
        ];
    }
}
