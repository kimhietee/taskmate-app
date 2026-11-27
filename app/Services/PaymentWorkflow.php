<?php

namespace App\Services;

use App\Enums\AgreementStatus;
use App\Enums\PaymentEventType;
use App\Enums\TaskStatus;
use App\Models\Agreement;
use App\Models\PaymentEvent;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PaymentWorkflow
{
    public function __construct(private readonly TaskMateNotifications $alerts) {}

    public function markPaid(Agreement $agreement, User $poster, array $data): PaymentEvent
    {
        return DB::transaction(function () use ($agreement, $poster, $data): PaymentEvent {
            $agreement = Agreement::query()->lockForUpdate()->findOrFail($agreement->id);
            $this->assertLocked($agreement);
            if ($poster->id !== $agreement->poster_id) abort(403);
            $task = Task::query()->lockForUpdate()->findOrFail($agreement->task_id);
            if (! in_array($task->status, [TaskStatus::InProgress, TaskStatus::Completed], true)) {
                throw ValidationException::withMessages(['payment' => 'Payment can only be recorded after the agreement is locked.']);
            }
            $this->assertNotSettled($agreement);

            return $this->insert($agreement, $poster, PaymentEventType::MarkedPaid, $data['amount'], $data['paid_on'], $data['method'], $data['note'] ?? null);
        });
    }

    public function confirmReceived(Agreement $agreement, User $student, ?string $amount): PaymentEvent
    {
        return DB::transaction(function () use ($agreement, $student, $amount): PaymentEvent {
            $agreement = Agreement::query()->lockForUpdate()->findOrFail($agreement->id);
            $this->assertLocked($agreement);
            if ($student->id !== $agreement->student_id) abort(403);
            $this->assertLatestMarkedPaid($agreement);
            $this->assertNotSettled($agreement);

            return $this->insert($agreement, $student, PaymentEventType::ConfirmedReceived, $amount, null, null, null);
        });
    }

    public function reportNotReceived(Agreement $agreement, User $student): PaymentEvent
    {
        return DB::transaction(function () use ($agreement, $student): PaymentEvent {
            $agreement = Agreement::query()->lockForUpdate()->findOrFail($agreement->id);
            $this->assertLocked($agreement);
            if ($student->id !== $agreement->student_id) abort(403);
            $this->assertLatestMarkedPaid($agreement);
            $this->assertNotSettled($agreement);

            return $this->insert($agreement, $student, PaymentEventType::ReportedNotReceived, null, null, null, null);
        });
    }

    private function insert(Agreement $agreement, User $actor, PaymentEventType $event, ?string $amount, ?string $paidOn, ?string $method, ?string $note): PaymentEvent
    {
        $payment = new PaymentEvent;
        $payment->agreement_id = $agreement->id;
        $payment->actor_id = $actor->id;
        $payment->event = $event;
        $payment->amount = $amount;
        $payment->paid_on = $paidOn;
        $payment->method = $method;
        $payment->note = $note;
        $payment->created_at = now();
        $payment->save();
        $recipientId = $event === PaymentEventType::MarkedPaid ? $agreement->student_id : $agreement->poster_id;
        $recipient = User::query()->findOrFail($recipientId);
        $task = Task::query()->findOrFail($agreement->task_id);
        $agreement->loadMissing('currentVersion');
        $exceedsAgreed = $event === PaymentEventType::ConfirmedReceived
            && $amount !== null
            && $agreement->currentVersion !== null
            && (float) $amount > (float) $agreement->currentVersion->final_amount;
        $alertEvent = match ($event) {
            PaymentEventType::MarkedPaid => 'payment.marked',
            PaymentEventType::ConfirmedReceived => $exceedsAgreed ? 'payment.received_exceeds' : 'payment.received',
            PaymentEventType::ReportedNotReceived => 'payment.not_received',
        };
        $this->alerts->send($recipient, $alertEvent, route('agreements.show', $agreement->id, false), ['task_id' => $task->id, 'agreement_id' => $agreement->id], ['task_title' => $task->title], $actor->id);
        return $payment;
    }

    private function assertLocked(Agreement $agreement): void
    {
        if ($agreement->status !== AgreementStatus::Agreed || ! $agreement->locked_at) {
            throw ValidationException::withMessages(['payment' => 'Payment can only be recorded after the agreement is locked.']);
        }
    }

    private function assertLatestMarkedPaid(Agreement $agreement): void
    {
        if ($agreement->paymentEvents()->reorder()->latest('id')->first()?->event !== PaymentEventType::MarkedPaid) {
            throw ValidationException::withMessages(['payment' => 'The poster must mark payment before you can respond.']);
        }
    }

    private function assertNotSettled(Agreement $agreement): void
    {
        if ($agreement->paymentIsSettled()) {
            throw ValidationException::withMessages(['payment' => 'The agreed amount has been confirmed received. Payment status is settled.']);
        }
    }
}
