<?php

namespace App\Models;

use App\Enums\TaskStatus;
use App\Enums\AgreementStatus;
use Database\Factories\TaskFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $poster_id
 * @property TaskStatus $status
 * @property Carbon|null $deadline
 * @property Carbon|null $guidelines_confirmed_at
 * @property Carbon|null $reviewed_at
 */
class Task extends Model
{
    /** @use HasFactory<TaskFactory> */
    use HasFactory;

    protected $fillable = [
        'title',
        'category',
        'work_type',
        'description',
        'required_activities',
        'deliverables',
        'estimated_duration_hours',
        'skill_requirements',
        'complexity',
        'budget',
        'budget_to_be_discussed',
        'pay_timing',
        'pay_timing_note',
        'work_mode',
        'workplace_name',
        'workplace_address',
        'deadline',
        'schedule_days',
        'schedule_start_time',
        'schedule_end_time',
        'schedule_note',
        'schedule_to_be_discussed',
        'schedule_flexible',
        'can_hours_change',
        'physical_demand',
        'academic_involvement',
        'hazard_exposure',
        'hazard_description',
        'private_meeting_required',
        'workplace_setting',
    ];

    protected function casts(): array
    {
        return [
            'status' => TaskStatus::class,
            'estimated_duration_hours' => 'decimal:1',
            'budget' => 'decimal:2',
            'budget_to_be_discussed' => 'boolean',
            'deadline' => 'date',
            'schedule_days' => 'array',
            'schedule_to_be_discussed' => 'boolean',
            'schedule_flexible' => 'boolean',
            'can_hours_change' => 'boolean',
            'hazard_exposure' => 'boolean',
            'private_meeting_required' => 'boolean',
            'guidelines_confirmed_at' => 'datetime',
            'reviewed_at' => 'datetime',
            'screened_at' => 'datetime',
            'removed_at' => 'datetime',
        ];
    }

    public function workTypeLabel(): string
    {
        $key = $this->work_type ?: 'one_time_gig';

        return config('taskmate.work_types.'.$key, $key);
    }

    public function isBudgetToBeDiscussed(): bool
    {
        return (bool) $this->budget_to_be_discussed || $this->budget === null;
    }

    public function isPayTimingToBeDiscussed(): bool
    {
        return ! $this->pay_timing || $this->pay_timing === 'to_be_discussed';
    }

    public function payTimingLabel(): string
    {
        if ($this->isPayTimingToBeDiscussed()) {
            return config('taskmate.pay_timings.to_be_discussed', 'To be discussed');
        }

        return config('taskmate.pay_timings.'.$this->pay_timing, $this->pay_timing);
    }

    public function isScheduleFlexible(): bool
    {
        return (bool) $this->schedule_flexible;
    }

    public function isScheduleToBeDiscussed(): bool
    {
        if ($this->isScheduleFlexible()) {
            return false;
        }

        return (bool) $this->schedule_to_be_discussed
            || empty($this->schedule_days)
            || ! $this->schedule_start_time
            || ! $this->schedule_end_time;
    }

    public function scheduleSummary(): ?string
    {
        if ($this->isScheduleFlexible()) {
            return 'Flexible / self-paced before deadline';
        }

        if ($this->isScheduleToBeDiscussed()) {
            return null;
        }

        $dayMap = config('taskmate.days_of_week', []);
        $orderedDays = array_values(array_intersect(array_keys($dayMap), (array) $this->schedule_days));
        if ($orderedDays === []) {
            return null;
        }

        $dayLabels = array_map(fn (string $day): string => $dayMap[$day] ?? $day, $orderedDays);

        return implode(', ', $dayLabels).' · '.$this->formatTimeLabel($this->schedule_start_time).'–'.$this->formatTimeLabel($this->schedule_end_time);
    }

    private function formatTimeLabel(string $time): string
    {
        $parsed = Carbon::createFromFormat('H:i', $time);

        return $parsed ? $parsed->format('g:i A') : $time;
    }

    public function poster(): BelongsTo
    {
        return $this->belongsTo(User::class, 'poster_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function removedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'removed_by');
    }

    public function screenings(): HasMany
    {
        return $this->hasMany(TaskScreening::class)->latest('id');
    }

    public function applications(): HasMany
    {
        return $this->hasMany(Application::class);
    }

    public function conversations(): HasMany
    {
        return $this->hasMany(Conversation::class);
    }

    public function agreement(): HasOne
    {
        return $this->hasOne(Agreement::class)->latestOfMany();
    }

    public function agreements(): HasMany
    {
        return $this->hasMany(Agreement::class);
    }

    public function hasActiveAgreement(): bool
    {
        return $this->agreements()->whereIn('status', [AgreementStatus::Negotiating->value, AgreementStatus::Agreed->value])->exists();
    }

    public function completion(): \Illuminate\Database\Eloquent\Relations\HasOneThrough
    {
        return $this->hasOneThrough(TaskCompletion::class, Agreement::class);
    }

    public function adminActions(): MorphMany
    {
        return $this->morphMany(AdminAction::class, 'subject');
    }

    public function ratings(): HasMany
    {
        return $this->hasMany(Rating::class);
    }

    public function contentFlags(): MorphMany
    {
        return $this->morphMany(ContentFlag::class, 'flaggable');
    }
}
