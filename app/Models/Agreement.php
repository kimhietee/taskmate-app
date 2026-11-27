<?php

namespace App\Models;

use App\Enums\AgreementStatus;
use App\Enums\PaymentEventType;
use App\Enums\PaymentStatus;
use Database\Factories\AgreementFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Agreement extends Model
{
    /** @use HasFactory<AgreementFactory> */
    use HasFactory;

    protected $fillable = ['cancellation_reason'];

    protected function casts(): array
    {
        return [
            'status' => AgreementStatus::class,
            'locked_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function task(): BelongsTo { return $this->belongsTo(Task::class); }
    public function application(): BelongsTo { return $this->belongsTo(Application::class); }
    public function poster(): BelongsTo { return $this->belongsTo(User::class, 'poster_id'); }
    public function student(): BelongsTo { return $this->belongsTo(User::class, 'student_id'); }
    public function currentVersion(): BelongsTo { return $this->belongsTo(AgreementVersion::class, 'current_version_id'); }
    public function versions(): HasMany { return $this->hasMany(AgreementVersion::class)->orderBy('version_number'); }
    public function confirmations(): HasManyThrough { return $this->hasManyThrough(AgreementConfirmation::class, AgreementVersion::class); }
    public function messages(): HasMany { return $this->hasMany(AgreementMessage::class)->orderBy('id'); }
    public function completion(): HasOne { return $this->hasOne(TaskCompletion::class); }
    public function paymentEvents(): HasMany { return $this->hasMany(PaymentEvent::class)->orderBy('id'); }
    public function reports(): HasMany { return $this->hasMany(Report::class); }
    public function ratings(): HasMany { return $this->hasMany(Rating::class); }

    public function paymentStatus(): PaymentStatus
    {
        $latest = $this->paymentEvents()->reorder()->latest('id')->first();

        return match ($latest?->event) {
            PaymentEventType::MarkedPaid => PaymentStatus::MarkedPaid,
            PaymentEventType::ConfirmedReceived => PaymentStatus::ConfirmedReceived,
            PaymentEventType::ReportedNotReceived => PaymentStatus::NotReceived,
            default => PaymentStatus::Unpaid,
        };
    }

    public function paymentIsSettled(): bool
    {
        $latest = $this->paymentEvents()->reorder()->latest('id')->first();
        return $latest?->event === PaymentEventType::ConfirmedReceived
            && $latest->amount !== null
            && (float) $latest->amount >= (float) $this->currentVersion->final_amount;
    }

    public function latestPaymentEvent(): ?PaymentEvent
    {
        return $this->paymentEvents()->reorder()->with('actor:id,name')->latest('id')->first();
    }
}
