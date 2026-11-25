import { Form, Link } from '@inertiajs/react';
import { TriangleAlert } from 'lucide-react';
import InputError from '@/components/input-error';
import { PaymentStatusBadge } from '@/components/payment-status-badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { COMPLETION_PAYMENT_NOTICE } from '@/constants/notices';
import { formatAmount, formatDateTime } from '@/lib/format';
import agreements from '@/routes/agreements';
import reports from '@/routes/reports';

type Event = {
    id: number;
    event: string;
    eventLabel: string;
    actorName: string;
    amount: string | null;
    paidOn: string | null;
    method: string | null;
    note: string | null;
    createdAt: string | null;
    amountMismatch: boolean;
};

type Completion = {
    deliveredAt: string | null;
    deliveredNote: string | null;
    completedAt: string | null;
    completionNote: string | null;
} | null;

export type CompletionPaymentData = {
    paymentStatus: string;
    paymentStatusLabel: string;
    agreedAmount: string;
    settled: boolean;
    completion: Completion;
    events: Event[];
    activeReportId: number | null;
    canMarkDelivered: boolean;
    canRecordCompletion: boolean;
    canMarkPaid: boolean;
    canRespondPayment: boolean;
    canReportNonPayment: boolean;
    paymentMethods: { value: string; label: string }[];
};

export function CompletionPaymentPanel({
    agreementId,
    data,
    readOnly = false,
}: {
    agreementId: number;
    data: CompletionPaymentData;
    readOnly?: boolean;
}) {
    const hasAmountMismatch = data.events.some((event) => event.amountMismatch);
    const today = new Date().toISOString().slice(0, 10);

    return (
        <section
            id="completion-payment"
            className="space-y-5 rounded-xl border border-border bg-card p-5 shadow-xs md:p-6 print:break-inside-avoid print:rounded-none print:border print:border-black/40 print:bg-white print:p-4 print:text-black print:shadow-none"
        >
            <div>
                <h2 className="text-lg font-semibold text-foreground print:text-black">Completion and payment</h2>
                <p className="mt-1 text-sm text-muted-foreground print:text-black">{COMPLETION_PAYMENT_NOTICE}</p>
            </div>

            {data.completion && (
                <dl className="grid gap-4 rounded-lg border border-border bg-muted/40 p-4 text-sm sm:grid-cols-2 print:rounded-none print:border-black/40 print:bg-white print:text-black">
                    <div className="space-y-1">
                        <dt className="text-xs font-semibold text-muted-foreground print:text-black">Work delivered</dt>
                        <dd className="tabular-nums font-medium text-foreground print:text-black">
                            {data.completion.deliveredAt ? formatDateTime(data.completion.deliveredAt) : 'Not marked'}
                        </dd>
                        {data.completion.deliveredNote && (
                            <dd className="whitespace-pre-wrap text-muted-foreground print:text-black">
                                {data.completion.deliveredNote}
                            </dd>
                        )}
                    </div>
                    <div className="space-y-1">
                        <dt className="text-xs font-semibold text-muted-foreground print:text-black">
                            Task completion
                        </dt>
                        <dd className="tabular-nums font-medium text-foreground print:text-black">
                            {data.completion.completedAt ? formatDateTime(data.completion.completedAt) : 'Not recorded'}
                        </dd>
                        {data.completion.completionNote && (
                            <dd className="whitespace-pre-wrap text-muted-foreground print:text-black">
                                {data.completion.completionNote}
                            </dd>
                        )}
                    </div>
                </dl>
            )}

            {!readOnly && (data.canMarkDelivered || data.canRecordCompletion) && (
                <div className="grid gap-4 md:grid-cols-2 print:hidden">
                    {data.canMarkDelivered && (
                        <Form
                            {...agreements.completion.delivered.form(agreementId)}
                            className="space-y-3 rounded-lg border border-border bg-muted/20 p-4"
                        >
                            {({ errors, processing }) => (
                                <>
                                    <h3 className="text-base font-semibold">Mark work as delivered</h3>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="delivered-note">Delivery note (optional)</Label>
                                        <Textarea
                                            id="delivered-note"
                                            name="note"
                                            maxLength={2000}
                                            placeholder="Optional note for the poster"
                                            aria-describedby={errors.note ? 'delivered-note-error' : undefined}
                                        />
                                        <InputError id="delivered-note-error" message={errors.note} />
                                    </div>
                                    <Button type="submit" disabled={processing}>
                                        {processing && <Spinner />}
                                        Mark delivered
                                    </Button>
                                </>
                            )}
                        </Form>
                    )}

                    {data.canRecordCompletion && (
                        <Form
                            {...agreements.completion.complete.form(agreementId)}
                            className="space-y-3 rounded-lg border border-border bg-muted/20 p-4"
                        >
                            {({ errors, processing }) => (
                                <>
                                    <h3 className="text-base font-semibold">Record task completion</h3>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="completion-note">Completion note (optional)</Label>
                                        <Textarea
                                            id="completion-note"
                                            name="note"
                                            maxLength={2000}
                                            placeholder="Optional completion note"
                                            aria-describedby={errors.note ? 'completion-note-error' : undefined}
                                        />
                                        <InputError id="completion-note-error" message={errors.note} />
                                    </div>
                                    <Button type="submit" disabled={processing}>
                                        {processing && <Spinner />}
                                        Record as completed
                                    </Button>
                                </>
                            )}
                        </Form>
                    )}
                </div>
            )}

            <div className="flex flex-wrap items-center gap-3 text-sm">
                <h3 className="text-base font-semibold text-foreground print:text-black">Payment status</h3>
                <PaymentStatusBadge status={data.paymentStatus} label={data.paymentStatusLabel} />
                <span className="tabular-nums text-muted-foreground print:text-black">
                    Agreed amount: ₱{formatAmount(data.agreedAmount)}
                </span>
                {data.settled && (
                    <span className="font-medium text-success-fg print:text-black">
                        The agreed amount was confirmed received.
                    </span>
                )}
            </div>

            {hasAmountMismatch && (
                <Alert variant="warning" className="print:border-black print:bg-white print:text-black">
                    <TriangleAlert aria-hidden="true" className="print:hidden" />
                    <AlertDescription className="tabular-nums print:text-black">
                        A recorded payment amount differs from the agreed amount of ₱{formatAmount(data.agreedAmount)}.
                        Both parties can see the payment history.
                    </AlertDescription>
                </Alert>
            )}

            {!readOnly && data.canMarkPaid && (
                <Form
                    {...agreements.payments.markPaid.form(agreementId)}
                    className="grid gap-4 rounded-lg border border-border bg-muted/20 p-4 sm:grid-cols-2 print:hidden"
                >
                    {({ errors, processing }) => (
                        <>
                            <h3 className="text-base font-semibold sm:col-span-2">Record payment</h3>
                            <div className="grid gap-1.5">
                                <Label htmlFor="paid-amount">Amount paid (₱)</Label>
                                <Input
                                    id="paid-amount"
                                    name="amount"
                                    type="number"
                                    min="1"
                                    max="1000000"
                                    step="0.01"
                                    className="tabular-nums"
                                    defaultValue={data.agreedAmount}
                                    required
                                    aria-describedby={errors.amount ? 'paid-amount-error' : undefined}
                                />
                                <InputError id="paid-amount-error" message={errors.amount} />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="paid-on">Date paid</Label>
                                <Input
                                    id="paid-on"
                                    name="paid_on"
                                    type="date"
                                    className="tabular-nums"
                                    max={today}
                                    defaultValue={today}
                                    required
                                    aria-describedby={errors.paid_on ? 'paid-on-error' : undefined}
                                />
                                <InputError id="paid-on-error" message={errors.paid_on} />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="paid-method">Method</Label>
                                <Input
                                    id="paid-method"
                                    name="method"
                                    list="payment-method-suggestions"
                                    maxLength={100}
                                    placeholder="Enter the method used"
                                    required
                                    aria-describedby={errors.method ? 'paid-method-error' : undefined}
                                />
                                <datalist id="payment-method-suggestions">
                                    {data.paymentMethods.map((method) => (
                                        <option key={method.value} value={method.label} />
                                    ))}
                                </datalist>
                                <InputError id="paid-method-error" message={errors.method} />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="paid-note">Note or reference (optional)</Label>
                                <Input
                                    id="paid-note"
                                    name="note"
                                    maxLength={2000}
                                    aria-describedby={errors.note ? 'paid-note-error' : undefined}
                                />
                                <InputError id="paid-note-error" message={errors.note} />
                            </div>
                            <div className="sm:col-span-2">
                                <Button type="submit" disabled={processing}>
                                    {processing && <Spinner />}
                                    Record payment
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            )}

            {!readOnly && data.canRespondPayment && (
                <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4 print:hidden">
                    <h3 className="text-base font-semibold">Did you receive the payment?</h3>
                    <div className="flex flex-wrap items-end gap-3">
                        <Form
                            {...agreements.payments.confirmReceived.form(agreementId)}
                            className="flex flex-wrap items-end gap-3"
                        >
                            {({ errors, processing }) => (
                                <>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="received-amount">Amount received (optional)</Label>
                                        <Input
                                            id="received-amount"
                                            name="amount"
                                            type="number"
                                            min="1"
                                            max="1000000"
                                            step="0.01"
                                            className="tabular-nums"
                                            aria-describedby={errors.amount ? 'received-amount-error' : undefined}
                                        />
                                        <InputError id="received-amount-error" message={errors.amount} />
                                    </div>
                                    <Button type="submit" disabled={processing}>
                                        {processing && <Spinner />}
                                        Confirm I received it
                                    </Button>
                                </>
                            )}
                        </Form>
                        <Form {...agreements.payments.notReceived.form(agreementId)}>
                            {({ processing }) => (
                                <Button variant="outline" type="submit" disabled={processing}>
                                    {processing && <Spinner />}
                                    I did not receive it
                                </Button>
                            )}
                        </Form>
                    </div>
                </div>
            )}

            {data.activeReportId && (
                <p className="text-sm text-foreground print:text-black">
                    A non-payment report is open:{' '}
                    <Link
                        className="focus-ring rounded-sm font-semibold text-brand underline-offset-4 hover:underline print:text-black"
                        href={reports.show(data.activeReportId)}
                    >
                        View report
                    </Link>
                </p>
            )}

            {!readOnly && data.canReportNonPayment && (
                <Form
                    {...agreements.reports.store.form(agreementId)}
                    encType="multipart/form-data"
                    className="space-y-4 rounded-lg border border-danger-border bg-danger-bg/30 p-4 print:hidden"
                >
                    {({ errors, processing }) => (
                        <>
                            <h3 className="text-base font-semibold text-danger-fg">Report non-payment</h3>
                            <div className="grid gap-1.5">
                                <Label htmlFor="non-payment-description">Describe what happened</Label>
                                <Textarea
                                    id="non-payment-description"
                                    name="description"
                                    maxLength={3000}
                                    required
                                    placeholder="Describe what happened."
                                    aria-describedby={
                                        errors.description ? 'non-payment-description-error' : undefined
                                    }
                                />
                                <InputError id="non-payment-description-error" message={errors.description} />
                            </div>
                            <Alert variant="warning">
                                <TriangleAlert aria-hidden="true" />
                                <AlertDescription>
                                    Do not upload government ID photos, selfies, or other sensitive documents beyond
                                    what is needed. Payment or chat screenshots may help. Administrators will see
                                    uploaded evidence.
                                </AlertDescription>
                            </Alert>
                            <div className="grid gap-1.5">
                                <Label htmlFor="non-payment-evidence">Evidence files (optional)</Label>
                                <Input
                                    id="non-payment-evidence"
                                    name="evidence[]"
                                    type="file"
                                    multiple
                                    accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                                    aria-describedby={
                                        errors.evidence || errors['evidence.0']
                                            ? 'non-payment-evidence-error'
                                            : undefined
                                    }
                                />
                                <InputError
                                    id="non-payment-evidence-error"
                                    message={errors.evidence ?? errors['evidence.0']}
                                />
                            </div>
                            <Button variant="destructive" type="submit" disabled={processing}>
                                {processing && <Spinner />}
                                Submit non-payment report
                            </Button>
                        </>
                    )}
                </Form>
            )}

            <div className="space-y-3">
                <h3 className="text-base font-semibold text-foreground print:text-black">Payment timeline</h3>
                {data.events.length ? (
                    <div className="space-y-2.5">
                        {data.events.map((event) => (
                            <article
                                key={event.id}
                                className={`space-y-1 rounded-lg border p-3.5 text-sm print:break-inside-avoid print:rounded-none print:bg-white print:text-black ${
                                    event.amountMismatch
                                        ? 'border-warning-border bg-warning-bg/70 text-warning-fg print:border-black'
                                        : 'border-border bg-muted/30 text-foreground print:border-black/40'
                                }`}
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <strong>{event.eventLabel}</strong>
                                    <span className="text-xs tabular-nums text-muted-foreground print:text-black">
                                        {event.createdAt ? formatDateTime(event.createdAt) : '—'}
                                    </span>
                                </div>
                                <p className="tabular-nums">
                                    {event.actorName}
                                    {event.amount !== null ? ` · ₱${formatAmount(event.amount)}` : ''}
                                    {event.paidOn ? ` · paid ${event.paidOn}` : ''}
                                    {event.method ? ` · ${event.method}` : ''}
                                </p>
                                {event.amountMismatch && (
                                    <p className="font-semibold text-warning-fg print:text-black">
                                        This amount differs from the agreed amount.
                                    </p>
                                )}
                                {event.note && <p className="whitespace-pre-wrap">{event.note}</p>}
                            </article>
                        ))}
                    </div>
                ) : (
                    <p className="rounded-lg border border-border bg-muted/30 p-3.5 text-sm text-muted-foreground print:border-black/40 print:bg-white print:text-black">
                        No payment has been recorded.
                    </p>
                )}
            </div>
        </section>
    );
}
