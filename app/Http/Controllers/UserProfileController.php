<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\RatingSummary;
use App\Services\RatingVisibility;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserProfileController extends Controller
{
    public function show(User $user, Request $request, RatingSummary $summaries): Response
    {
        abort_unless($request->user()->isAdmin() || $request->user()->isVerified(), 403);
        $hasAgreement = \App\Models\Agreement::query()->where(fn ($query) => $query
            ->where(fn ($pair) => $pair->where('poster_id', $request->user()->id)->where('student_id', $user->id))
            ->orWhere(fn ($pair) => $pair->where('poster_id', $user->id)->where('student_id', $request->user()->id)))->exists();
        $ratings = app(RatingVisibility::class)->visibleQuery()->where('ratee_id', $user->id)->with(['task:id,title', 'rater:id,name,user_type,organization_name'])->latest()->limit(10)->get();
        return Inertia::render('users/show', [
            'profile' => [
                'id' => $user->id,
                'displayName' => $user->isOrganization() ? $user->organization_name : $user->name,
                'type' => config('taskmate.user_types.'.$user->user_type->value),
                'affiliation' => $user->isOrganization() ? $user->organization_name : $user->affiliation,
                'verificationStatus' => $user->verification_status->value,
                'memberSince' => $user->created_at?->toDateString(),
                'completedTasks' => $user->tasks()->where('status', 'completed')->count() + $user->studentAgreements()->whereHas('task', fn ($q) => $q->where('status', 'completed'))->count(),
                'ratingSummary' => $summaries->forUser($user),
            ],
            'ratings' => $ratings->map(fn ($rating) => [
                'id' => $rating->id,
                'comment' => $rating->comment,
                'overall' => $rating->overall_experience,
                'taskTitle' => $rating->task->title,
                'date' => $rating->created_at?->toDateString(),
                'raterName' => $rating->rater->isOrganization() ? $rating->rater->organization_name : $rating->rater->name,
            ])->values(),
            'notice' => 'Ratings are one person\'s view of one completed task. They are contextual information and do not guarantee a person\'s future behavior. Serious problems should be reported, not rated.',
            'problemReport' => ! $request->user()->isAdmin() && $request->user()->id !== $user->id ? ['action' => route('users.problem-reports.store', $user, false), 'types' => collect(config('taskmate.reports.types', []))->except($hasAgreement ? ['non_payment'] : ['non_payment', 'incomplete_work'])->map(fn ($settings, $value) => ['value' => $value, 'label' => $settings['label']])->values()] : null,
        ]);
    }
}
