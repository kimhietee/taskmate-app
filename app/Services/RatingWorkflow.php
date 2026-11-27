<?php

namespace App\Services;

use App\Enums\AgreementStatus;
use App\Enums\RatingDirection;
use App\Enums\TaskStatus;
use App\Models\Agreement;
use App\Models\Rating;
use App\Models\RatingScore;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class RatingWorkflow
{
    public function __construct(private readonly TaskMateNotifications $alerts) {}

    public function submit(Agreement $agreement, User $rater, array $data): Rating
    {
        return DB::transaction(function () use ($agreement, $rater, $data): Rating {
            $agreement = Agreement::query()->lockForUpdate()->findOrFail($agreement->id);
            Gate::authorize('rate', $agreement);
            $poster = $agreement->poster_id === $rater->id;
            $otherRatingExists = $agreement->ratings()->where('rater_id', '!=', $rater->id)->where('is_hidden', false)->exists();
            $direction = $poster ? RatingDirection::PosterToStudent : RatingDirection::StudentToPoster;
            $rating = new Rating;
            $rating->agreement_id = $agreement->id;
            $rating->task_id = $agreement->task_id;
            $rating->rater_id = $rater->id;
            $rating->ratee_id = $poster ? $agreement->student_id : $agreement->poster_id;
            $rating->direction = $direction;
            $rating->overall_experience = $data['overall_experience'];
            $rating->comment = $data['comment'] ?? null;
            $rating->save();
            foreach ($data['scores'] as $dimension => $score) {
                $rating->scores()->create(['dimension' => $dimension, 'score' => $score]);
            }
            $visibility = config('taskmate.ratings.visibility', 'immediate');
            if ($visibility === 'immediate') {
                $ratee = User::query()->findOrFail($rating->ratee_id);
                $task = $agreement->task()->firstOrFail();
                $this->alerts->send($ratee, 'rating.visible', route('agreements.show', $agreement->id, false), ['task_id' => $task->id, 'agreement_id' => $agreement->id], ['task_title' => $task->title], $rater->id);
            } elseif ($otherRatingExists) {
                $parties = User::query()->whereKey([$agreement->poster_id, $agreement->student_id])->get();
                $task = $agreement->task()->firstOrFail();
                $this->alerts->send($parties, 'rating.visible', route('agreements.show', $agreement->id, false), ['task_id' => $task->id, 'agreement_id' => $agreement->id], ['task_title' => $task->title], $rater->id);
            }
            return $rating;
        });
    }

    public function pendingFor(User $user): array
    {
        $visibility = app(RatingVisibility::class);
        return Agreement::query()->with(['task', 'completion', 'task.completion', 'currentVersion', 'paymentEvents'])
            ->where('status', AgreementStatus::Agreed->value)
            ->whereHas('task', fn ($q) => $q->where('status', TaskStatus::Completed->value))
            ->where(fn ($q) => $q->where('poster_id', $user->id)->orWhere('student_id', $user->id))
            ->whereDoesntHave('ratings', fn ($q) => $q->where('rater_id', $user->id))
            ->get()->filter(fn (Agreement $agreement) => ! $visibility->windowClosed($agreement))
            ->map(function (Agreement $agreement): array {
                $completedAt = $agreement->completion?->completed_at ?? $agreement->task?->completion?->completed_at;
                $daysLeft = $completedAt
                    ? max(0, now()->startOfDay()->diffInDays($completedAt->copy()->addDays((int) config('taskmate.ratings.window_days', 30))->startOfDay(), false))
                    : 0;

                return [
                    'id' => $agreement->id,
                    'taskTitle' => $agreement->task->title,
                    'daysLeft' => $daysLeft,
                ];
            })->values()->all();
    }
}
