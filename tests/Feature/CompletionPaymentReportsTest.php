<?php

namespace Tests\Feature;

use App\Enums\AgreementStatus;
use App\Enums\ApplicationStatus;
use App\Enums\PaymentEventType;
use App\Enums\PaymentStatus;
use App\Enums\ReportOutcome;
use App\Enums\ReportStatus;
use App\Enums\TaskStatus;
use App\Models\Agreement;
use App\Models\AgreementConfirmation;
use App\Models\AgreementVersion;
use App\Models\Application;
use App\Models\PaymentEvent;
use App\Models\Report;
use App\Models\Task;
use App\Models\User;
use App\Services\AgreementContentHasher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use LogicException;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CompletionPaymentReportsTest extends TestCase
{
    use RefreshDatabase;

    private function lockedAgreement(array $options = []): array
    {
        $poster = User::factory()->verified()->facultyStaff()->create();
        $student = User::factory()->verified()->create();
        $outsider = User::factory()->verified()->create();
        $task = Task::factory()->assigned()->create(['poster_id' => $poster->id, 'deadline' => today()->addDays(20)]);
        $task->status = $options['task_status'] ?? TaskStatus::InProgress;
        $task->save();
        $application = new Application;
        $application->task_id = $task->id;
        $application->applicant_id = $student->id;
        $application->message = 'Synthetic accepted application';
        $application->status = ApplicationStatus::Accepted;
        $application->responded_at = now();
        $application->save();
        $agreement = new Agreement;
        $agreement->task_id = $task->id;
        $agreement->application_id = $application->id;
        $agreement->poster_id = $poster->id;
        $agreement->student_id = $student->id;
        $agreement->status = AgreementStatus::Agreed;
        $agreement->locked_at = now()->subDays(5);
        $agreement->save();
        $version = new AgreementVersion;
        $version->agreement_id = $agreement->id;
        $version->version_number = 1;
        $version->proposed_by = $poster->id;
        $version->deliverables = 'Synthetic final deliverables';
        $version->terms = 'Synthetic agreed terms';
        $version->final_amount = '1400.00';
        $version->start_date = today()->subDays(8)->toDateString();
        $version->due_date = $options['due_date'] ?? today()->subDays(5)->toDateString();
        $version->work_mode = $task->work_mode;
        $version->workplace_name = $task->workplace_name;
        $version->workplace_address = $task->workplace_address;
        $version->payment_arrangement = 'Synthetic direct payment after accepted work.';
        $version->created_at = now()->subDays(7);
        $version->content_hash = app(AgreementContentHasher::class)->hash([
            'deliverables' => $version->deliverables,
            'terms' => $version->terms,
            'final_amount' => '1400.00',
            'start_date' => today()->subDays(8)->toDateString(),
            'due_date' => $version->due_date,
            'work_mode' => $version->work_mode,
            'workplace_name' => $version->workplace_name,
            'workplace_address' => $version->workplace_address,
            'payment_arrangement' => $version->payment_arrangement,
        ]);
        $version->save();
        $agreement->current_version_id = $version->id;
        $agreement->save();
        foreach ([$poster, $student] as $party) {
            $confirmation = new AgreementConfirmation;
            $confirmation->agreement_version_id = $version->id;
            $confirmation->user_id = $party->id;
            $confirmation->confirmed_at = now()->subDays(5);
            $confirmation->save();
        }

        return compact('poster', 'student', 'outsider', 'task', 'application', 'agreement', 'version');
    }

    private function postPaid(array $pair, array $override = [])
    {
        return $this->actingAs($pair['poster'])->post(route('agreements.payments.mark-paid', $pair['agreement']), array_merge([
            'amount' => '1400.00', 'paid_on' => today()->toDateString(), 'method' => 'Cash', 'note' => 'Synthetic payment note',
        ], $override));
    }

    private function insertEvent(Agreement $agreement, User $actor, PaymentEventType $type, ?string $amount = null): PaymentEvent
    {
        $event = new PaymentEvent;
        $event->agreement_id = $agreement->id;
        $event->actor_id = $actor->id;
        $event->event = $type;
        $event->amount = $amount;
        $event->created_at = now();
        $event->save();
        return $event;
    }

    public function test_only_student_can_mark_delivery_once_and_only_poster_can_complete(): void
    {
        $pair = $this->lockedAgreement();
        $this->actingAs($pair['poster'])->post(route('agreements.completion.delivered', $pair['agreement']))->assertForbidden();
        $this->actingAs($pair['student'])->post(route('agreements.completion.delivered', $pair['agreement']), ['note' => 'Synthetic work delivered'])->assertRedirect();
        $this->assertDatabaseHas('task_completions', ['agreement_id' => $pair['agreement']->id, 'delivered_note' => 'Synthetic work delivered']);
        $this->assertSame('completion.delivered', $pair['poster']->notifications()->firstOrFail()->data['event']);
        $this->actingAs($pair['student'])->post(route('agreements.completion.delivered', $pair['agreement']))->assertInvalid('completion');
        $this->actingAs($pair['outsider'])->post(route('agreements.completion.complete', $pair['agreement']))->assertForbidden();
        $this->actingAs($pair['poster'])->post(route('agreements.completion.complete', $pair['agreement']), ['note' => 'Synthetic completion'])->assertRedirect();
        $this->assertSame(TaskStatus::Completed, $pair['task']->fresh()->status);
        $this->assertSame($pair['poster']->id, $pair['agreement']->completion->fresh()->completed_by);
        $this->assertDatabaseHas('notifications', ['notifiable_id' => $pair['student']->id, 'data->event' => 'completion.recorded']);
        $this->assertDatabaseHas('notifications', ['notifiable_id' => $pair['student']->id, 'data->event' => 'rating.waiting']);
        $this->assertDatabaseMissing('notifications', ['notifiable_id' => $pair['poster']->id, 'data->event' => 'rating.waiting']);
        $this->actingAs($pair['poster'])->post(route('agreements.completion.complete', $pair['agreement']))->assertInvalid('completion');
        $this->assertFalse($pair['poster']->can('update', $pair['task']->fresh()));
    }

    public function test_completion_requires_a_locked_agreement_and_in_progress_task(): void
    {
        $pair = $this->lockedAgreement(['task_status' => TaskStatus::Assigned]);
        $pair['agreement']->status = AgreementStatus::Negotiating;
        $pair['agreement']->locked_at = null;
        $pair['agreement']->save();
        $this->actingAs($pair['poster'])->post(route('agreements.completion.complete', $pair['agreement']))->assertForbidden();
    }

    public function test_payment_events_follow_order_and_settlement_is_immutable(): void
    {
        $pair = $this->lockedAgreement();
        $this->actingAs($pair['student'])->post(route('agreements.payments.confirm-received', $pair['agreement']))->assertInvalid('payment');
        $this->actingAs($pair['student'])->post(route('agreements.payments.not-received', $pair['agreement']))->assertInvalid('payment');
        $this->postPaid($pair, ['amount' => 0])->assertSessionHasErrors('amount');
        $this->postPaid($pair, ['paid_on' => today()->addDay()->toDateString()])->assertSessionHasErrors('paid_on');
        $this->postPaid($pair, ['method' => ''])->assertSessionHasErrors('method');

        $this->postPaid($pair, ['amount' => '1300.00'])->assertRedirect()->assertSessionHas('status');
        $first = PaymentEvent::query()->firstOrFail();
        $this->assertSame(PaymentStatus::MarkedPaid, $pair['agreement']->fresh()->paymentStatus());
        $this->assertSame('payment.marked', $pair['student']->notifications()->firstOrFail()->data['event']);
        $this->actingAs($pair['student'])->post(route('agreements.payments.confirm-received', $pair['agreement']), ['amount' => '1300.00'])->assertRedirect();
        $this->assertSame('payment.received', $pair['poster']->notifications()->firstOrFail()->data['event']);
        $this->assertSame(PaymentStatus::ConfirmedReceived, $pair['agreement']->fresh()->paymentStatus());
        $this->assertFalse($pair['agreement']->fresh()->paymentIsSettled());
        $this->postPaid($pair, ['amount' => '1400.00', 'note' => 'Correction recorded as a new event'])->assertRedirect();
        $this->actingAs($pair['student'])->post(route('agreements.payments.confirm-received', $pair['agreement']), ['amount' => '1400.00'])->assertRedirect();
        $this->assertSame(PaymentStatus::ConfirmedReceived, $pair['agreement']->fresh()->paymentStatus());
        $this->assertTrue($pair['agreement']->fresh()->paymentIsSettled());
        $this->postPaid($pair)->assertInvalid('payment');
        $this->actingAs($pair['student'])->post(route('agreements.payments.not-received', $pair['agreement']))->assertInvalid('payment');
        $this->assertSame(4, PaymentEvent::query()->count());
        $this->assertSame(2, $pair['student']->notifications()->where('data->event', 'payment.marked')->count());
        $this->assertSame(2, $pair['poster']->notifications()->where('data->event', 'payment.received')->count());
        $this->assertSame('1300.00', $first->fresh()->amount);
        $this->assertSame($pair['version']->content_hash, $pair['version']->fresh()->content_hash);
        $this->assertSame(2, $pair['agreement']->confirmations()->count());
        try {
            $first->note = 'Attempted edit';
            $first->save();
            $this->fail('Payment events must be insert-only.');
        } catch (LogicException) {
            $this->assertSame('Synthetic payment note', $first->fresh()->note);
        }
        try {
            $first->delete();
            $this->fail('Payment events must not be deletable.');
        } catch (LogicException) {
            $this->assertDatabaseHas('payment_events', ['id' => $first->id]);
        }
    }

    public function test_only_poster_can_mark_paid_after_lock(): void
    {
        $pair = $this->lockedAgreement();
        $this->actingAs($pair['student'])->post(route('agreements.payments.mark-paid', $pair['agreement']), ['amount' => 1400, 'paid_on' => today()->toDateString(), 'method' => 'Cash'])->assertForbidden();
        $pair['agreement']->status = AgreementStatus::Negotiating;
        $pair['agreement']->locked_at = null;
        $pair['agreement']->save();
        $this->postPaid($pair)->assertForbidden();
    }

    public function test_non_payment_report_requires_eligibility_and_records_one_event(): void
    {
        config(['taskmate.reports.non_payment_wait_days' => 3]);
        $pair = $this->lockedAgreement(['due_date' => today()->addDays(2)->toDateString()]);
        $url = route('agreements.reports.store', $pair['agreement']);
        $this->actingAs($pair['student'])->post($url, ['description' => 'No payment has arrived.'])->assertInvalid('report');
        $this->actingAs($pair['poster'])->post($url, ['description' => 'Poster cannot file as the worker'])->assertForbidden();
        $this->actingAs($pair['outsider'])->post($url, ['description' => 'Outsider'])->assertForbidden();

        $this->postPaid($pair)->assertRedirect();
        $this->actingAs($pair['student'])->post(route('agreements.payments.not-received', $pair['agreement']))->assertRedirect();
        $this->actingAs($pair['student'])->post($url, ['description' => 'I did not receive the recorded payment.'])->assertRedirect();
        $report = Report::query()->firstOrFail();
        $this->assertDatabaseHas('notifications', ['notifiable_id' => $pair['poster']->id, 'data->event' => 'payment.not_received']);
        $this->assertDatabaseHas('notifications', ['notifiable_id' => $pair['poster']->id, 'data->event' => 'report.filed']);
        $this->assertSame(ReportStatus::Open, $report->status);
        $this->assertDatabaseCount('payment_events', 2);
        $this->actingAs($pair['student'])->post($url, ['description' => 'Duplicate report'])->assertInvalid('report');
    }

    public function test_due_date_and_completion_wait_periods_allow_report_without_a_paid_mark(): void
    {
        $pair = $this->lockedAgreement(['due_date' => today()->subDays(3)->toDateString()]);
        $this->actingAs($pair['student'])->post(route('agreements.reports.store', $pair['agreement']), ['description' => 'The due date plus wait has passed.'])->assertRedirect();
        $this->assertDatabaseHas('payment_events', ['agreement_id' => $pair['agreement']->id, 'event' => PaymentEventType::ReportedNotReceived->value]);

        $second = $this->lockedAgreement(['due_date' => today()->addDays(10)->toDateString()]);
        $completion = new \App\Models\TaskCompletion;
        $completion->agreement_id = $second['agreement']->id;
        $completion->completed_at = now()->subDays(3);
        $completion->completed_by = $second['poster']->id;
        $completion->save();
        $this->actingAs($second['student'])->post(route('agreements.reports.store', $second['agreement']), ['description' => 'Completion wait has passed.'])->assertRedirect();
    }

    public function test_report_description_and_upload_types_sizes_and_file_count_are_validated(): void
    {
        Storage::fake('evidence');
        config(['taskmate.reports.non_payment_wait_days' => 0, 'taskmate.reports.evidence_max_files' => 1, 'taskmate.reports.evidence_max_kb' => 20]);
        $pair = $this->lockedAgreement(['due_date' => today()->subDay()->toDateString()]);
        $url = route('agreements.reports.store', $pair['agreement']);
        $this->actingAs($pair['student'])->post($url, ['description' => ''])->assertSessionHasErrors('description');
        $wrong = UploadedFile::fake()->createWithContent('synthetic.pdf', 'plain text is not a PDF');
        $this->actingAs($pair['student'])->post($url, ['description' => 'Evidence content check', 'evidence' => [$wrong]])->assertSessionHasErrors('evidence.0');

        $pdf1 = UploadedFile::fake()->createWithContent('synthetic-one.pdf', "%PDF-1.4\nSynthetic test evidence\n%%EOF");
        $pdf2 = UploadedFile::fake()->createWithContent('synthetic-two.pdf', "%PDF-1.4\nSynthetic second evidence\n%%EOF");
        $this->actingAs($pair['student'])->post($url, ['description' => 'Too many files', 'evidence' => [$pdf1, $pdf2]])->assertSessionHasErrors('evidence');
        $large = UploadedFile::fake()->createWithContent('large.pdf', "%PDF-1.4\n".str_repeat('x', 21 * 1024));
        $this->actingAs($pair['student'])->post($url, ['description' => 'Too large', 'evidence' => [$large]])->assertSessionHasErrors('evidence.0');
    }

    public function test_valid_evidence_is_private_randomly_named_and_download_is_authorized(): void
    {
        Storage::fake('evidence');
        config(['taskmate.reports.non_payment_wait_days' => 0]);
        $pair = $this->lockedAgreement(['due_date' => today()->subDay()->toDateString()]);
        $pdf = UploadedFile::fake()->createWithContent('synthetic-receipt.pdf', "%PDF-1.4\nSynthetic receipt\n%%EOF");
        $this->actingAs($pair['student'])->post(route('agreements.reports.store', $pair['agreement']), ['description' => 'Synthetic report with evidence.', 'evidence' => [$pdf]])->assertRedirect();
        $report = Report::query()->firstOrFail();
        $evidence = $report->evidence()->firstOrFail();
        $this->assertNotSame('synthetic-receipt.pdf', basename($evidence->stored_path));
        Storage::disk('evidence')->assertExists($evidence->stored_path);
        $this->assertFalse(config('filesystems.disks.evidence.serve'));
        $this->actingAs($pair['student'])->get(route('reports.evidence', [$report, $evidence]))->assertOk()->assertHeader('Content-Disposition');
        $this->actingAs($pair['poster'])->get(route('reports.evidence', [$report, $evidence]))->assertOk();
        $this->actingAs($pair['outsider'])->get(route('reports.evidence', [$report, $evidence]))->assertForbidden();
        $admin = User::factory()->verified()->create(['is_admin' => true]);
        $this->actingAs($admin)->get(route('reports.evidence', [$report, $evidence]))->assertOk();
    }

    public function test_report_is_private_and_respondent_can_add_statement(): void
    {
        $pair = $this->lockedAgreement(['due_date' => today()->subDays(3)->toDateString()]);
        $this->actingAs($pair['student'])->post(route('agreements.reports.store', $pair['agreement']), ['description' => 'Synthetic report'])->assertRedirect();
        $report = Report::query()->firstOrFail();
        $this->actingAs($pair['outsider'])->get(route('reports.show', $report))->assertForbidden();
        $this->actingAs($pair['student'])->get(route('reports.show', $report))->assertOk()->assertInertia(fn (Assert $page) => $page->component('reports/show')
            ->missing('report.reporter.email')->missing('report.reporter.id_number')
            ->missing('report.reportedUser.email')->missing('report.reportedUser.id_number'));
        $this->actingAs($pair['outsider'])->post(route('reports.reply', $report), ['body' => 'Outsider response'])->assertForbidden();
        $this->actingAs($pair['poster'])->post(route('reports.reply', $report), ['body' => 'Synthetic respondent reply'])->assertRedirect();
        $this->assertDatabaseHas('report_statements', ['report_id' => $report->id, 'user_id' => $pair['poster']->id, 'role' => 'respondent']);
        $this->assertDatabaseHas('notifications', ['notifiable_id' => $pair['student']->id, 'data->event' => 'report.reply']);
        $this->actingAs($pair['outsider'])->get(route('reports.mine'))->assertOk()->assertInertia(fn (Assert $page) => $page->has('reports.data', 0));
    }

    public function test_admin_report_decisions_are_logged_and_involved_admin_cannot_review(): void
    {
        $pair = $this->lockedAgreement(['due_date' => today()->subDays(3)->toDateString()]);
        $this->actingAs($pair['student'])->post(route('agreements.reports.store', $pair['agreement']), ['description' => 'Synthetic report'])->assertRedirect();
        $report = Report::query()->firstOrFail();
        $admin = User::factory()->verified()->create(['is_admin' => true]);
        $this->actingAs($admin)->get(route('admin.reports.index'))->assertOk()->assertInertia(fn (Assert $page) => $page->component('admin/reports/index')->has('reports.data', 1));
        $this->actingAs($admin)->get(route('admin.reports.show', $report))->assertOk()->assertInertia(fn (Assert $page) => $page->component('admin/reports/show')->has('report.agreement.recordReference'));
        $url = route('admin.reports.decision', $report);
        $this->actingAs($admin)->post($url, ['decision' => 'resolve', 'outcome' => 'supported'])->assertSessionHasErrors('note');
        $this->actingAs($admin)->post($url, ['decision' => 'start_review'])->assertRedirect();
        $this->assertDatabaseHas('notifications', ['notifiable_id' => $pair['student']->id, 'data->event' => 'report.under_review']);
        $this->assertSame(ReportStatus::UnderReview, $report->fresh()->status);
        $this->actingAs($admin)->post($url, ['decision' => 'resolve', 'outcome' => 'supported', 'note' => 'Synthetic review note'])->assertRedirect();
        $this->assertSame(ReportStatus::Resolved, $report->fresh()->status);
        $this->assertSame(ReportOutcome::Supported, $report->fresh()->outcome);
        $this->assertDatabaseHas('notifications', ['notifiable_id' => $pair['student']->id, 'data->event' => 'report.resolved']);
        $this->assertStringNotContainsString('Synthetic review note', implode(' ', $pair['student']->notifications()->get()->map(fn ($n) => $n->data['body'])->all()));
        $this->assertSame(2, $report->adminActions()->count());
        $this->actingAs($admin)->post($url, ['decision' => 'dismiss', 'note' => 'No further action'])->assertForbidden();

        $secondPair = $this->lockedAgreement(['due_date' => today()->subDays(3)->toDateString()]);
        $this->actingAs($secondPair['student'])->post(route('agreements.reports.store', $secondPair['agreement']), ['description' => 'Synthetic report for dismissal'])->assertRedirect();
        $secondReport = Report::query()->where('agreement_id', $secondPair['agreement']->id)->firstOrFail();
        $dismissUrl = route('admin.reports.decision', $secondReport);
        $this->actingAs($admin)->post($dismissUrl, ['decision' => 'dismiss'])->assertSessionHasErrors('note');
        $this->actingAs($admin)->post($dismissUrl, ['decision' => 'dismiss', 'note' => 'Synthetic dismissal note'])->assertRedirect();
        $this->assertSame(ReportStatus::Dismissed, $secondReport->fresh()->status);

        $involved = $pair['poster'];
        $involved->is_admin = true;
        $involved->save();
        $openReport = Report::factory()->create(['reporter_id' => $pair['outsider']->id, 'reported_user_id' => $involved->id, 'agreement_id' => null]);
        $this->actingAs($involved)->post(route('admin.reports.decision', $openReport), ['decision' => 'start_review'])->assertForbidden();
    }

    public function test_guest_admin_access_is_denied_and_non_open_reports_cannot_be_reviewed(): void
    {
        $pair = $this->lockedAgreement(['due_date' => today()->subDays(3)->toDateString()]);
        $this->actingAs($pair['student'])->post(route('agreements.reports.store', $pair['agreement']), ['description' => 'Synthetic report'])->assertRedirect();
        $report = Report::query()->firstOrFail();
        auth()->logout();
        $this->get(route('admin.reports.index'))->assertRedirect(route('login'));
        $this->actingAs(User::factory()->verified()->create())->get(route('admin.reports.show', $report))->assertForbidden();
        $report->status = ReportStatus::Dismissed;
        $report->save();
        $admin = User::factory()->verified()->create(['is_admin' => true]);
        $this->actingAs($admin)->post(route('admin.reports.decision', $report), ['decision' => 'start_review'])->assertForbidden();
    }

    public function test_admin_report_filters_and_queue_order_prioritize_open_reports(): void
    {
        $openPair = $this->lockedAgreement(['due_date' => today()->subDays(3)->toDateString()]);
        $this->actingAs($openPair['student'])->post(route('agreements.reports.store', $openPair['agreement']), ['description' => 'Open synthetic report'])->assertRedirect();
        $openReport = Report::query()->firstOrFail();
        $reviewPair = $this->lockedAgreement(['due_date' => today()->subDays(3)->toDateString()]);
        $this->actingAs($reviewPair['student'])->post(route('agreements.reports.store', $reviewPair['agreement']), ['description' => 'Review synthetic report'])->assertRedirect();
        $reviewReport = Report::query()->where('agreement_id', $reviewPair['agreement']->id)->firstOrFail();
        $admin = User::factory()->verified()->create(['is_admin' => true]);
        $this->actingAs($admin)->post(route('admin.reports.decision', $reviewReport), ['decision' => 'start_review'])->assertRedirect();

        $this->actingAs($admin)->get(route('admin.reports.index'))->assertOk()->assertInertia(fn (Assert $page) => $page->component('admin/reports/index')
            ->where('reports.data.0.id', $openReport->id)->where('reports.data.1.id', $reviewReport->id));
        $this->get(route('admin.reports.index', ['status' => 'under_review', 'type' => 'non_payment', 'search' => $reviewPair['student']->name]))
            ->assertOk()->assertInertia(fn (Assert $page) => $page->has('reports.data', 1)->where('reports.data.0.id', $reviewReport->id));
    }

    public function test_payment_received_greater_than_agreed_amount_is_accepted_settled_and_notifies_both_parties(): void
    {
        $pair = $this->lockedAgreement();

        $markPaidResponse = $this->postPaid($pair, ['amount' => '1500.00']);
        $markPaidResponse->assertRedirect()->assertSessionHas('status');
        $this->assertStringContainsString('exceeds the agreed amount', (string) session('status'));

        $confirmResponse = $this->actingAs($pair['student'])
            ->post(route('agreements.payments.confirm-received', $pair['agreement']), ['amount' => '1500.00']);
        $confirmResponse->assertRedirect()->assertSessionHas('status');
        $this->assertStringContainsString('exceeds the agreed amount', (string) session('status'));

        $agreement = $pair['agreement']->fresh();
        $this->assertSame(PaymentStatus::ConfirmedReceived, $agreement->paymentStatus());
        $this->assertTrue($agreement->paymentIsSettled());

        $posterAlert = $pair['poster']->notifications()->latest('created_at')->firstOrFail();
        $this->assertSame('payment.received_exceeds', $posterAlert->data['event']);
        $this->assertStringContainsString('exceeds the agreed amount', (string) $posterAlert->data['body']);

        $this->actingAs($pair['student'])
            ->get(route('agreements.show', $agreement))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('agreements/show')
                ->where('completionPayment.settled', true)
                ->where('completionPayment.canMarkPaid', false)
                ->where('completionPayment.canRespondPayment', false)
                ->where('completionPayment.events.1.exceedsAgreed', true)
                ->where('completionPayment.events.1.amountMismatch', true));

        $this->postPaid($pair, ['amount' => '1400.00'])->assertInvalid('payment');
    }
}
