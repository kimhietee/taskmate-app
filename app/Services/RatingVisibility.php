<?php

namespace App\Services;

use App\Models\Agreement;
use App\Models\Rating;
use Illuminate\Database\Eloquent\Builder;

class RatingVisibility
{
    public function visibleQuery(?int $viewerId = null): Builder
    {
        return Rating::query()->where(function (Builder $query) use ($viewerId): void {
            if ($viewerId !== null) {
                $query->where('rater_id', $viewerId)->orWhere(function (Builder $visible): void {
                    $visible->where('is_hidden', false);
                    $this->visibleToOthers($visible);
                });
            } else {
                $query->where('is_hidden', false);
                $this->visibleToOthers($query);
            }
        });
    }

    public function visibleToOthers(Builder $query): void
    {
        if (config('taskmate.ratings.visibility', 'immediate') === 'immediate') {
            return;
        }

        $windowDays = (int) config('taskmate.ratings.window_days', 30);
        $query->whereHas('agreement', function (Builder $agreement) use ($windowDays): void {
            $agreement->where(function (Builder $mature) use ($windowDays): void {
                $mature->whereHas('completion', fn (Builder $completion) => $completion->where('completed_at', '<=', now()->subDays($windowDays)))
                    ->orHas('ratings', '>=', 2);
            });
        });
    }

    public function bothSubmitted(Agreement $agreement): bool
    {
        return $agreement->ratings()->count() >= 2;
    }

    public function isVisibleToOthers(Rating $rating): bool
    {
        if ($rating->is_hidden) return false;
        if (config('taskmate.ratings.visibility', 'immediate') === 'immediate') return true;
        $agreement = $rating->agreement;
        $completedAt = $agreement->completion?->completed_at ?? $agreement->task?->completion?->completed_at;
        return $this->bothSubmitted($agreement)
            || ($completedAt !== null && $completedAt->copy()->addDays((int) config('taskmate.ratings.window_days', 30))->isPast());
    }

    public function windowClosed(Agreement $agreement): bool
    {
        $completedAt = $agreement->completion?->completed_at ?? $agreement->task?->completion?->completed_at;
        return $completedAt !== null && $completedAt->copy()->addDays((int) config('taskmate.ratings.window_days', 30))->isPast();
    }
}
