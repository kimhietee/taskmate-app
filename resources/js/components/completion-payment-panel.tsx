import { useState } from 'react';
import { formatDateTime, formatAmount } from '@/lib/format';
import { Form, Link } from '@inertiajs/react';
import { TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import InputError from '@/components/input-error';
import { PaymentStatusBadge } from '@/components/payment-status-badge';
import agreements from '@/routes/agreements';
import reports from '@/routes/reports';
import { COMPLETION_PAYMENT_NOTICE } from '@/constants/notices';

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
    exceedsAgreed?: boolean;
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
    const [paidAmount, setPaidAmount] = useState(data.agreedAmount ?? '');
    const [receivedAmount, setReceivedAmount] = useState('');

    const agreedNumeric = Number(data.agreedAmount);
    const parsePositiveAmount = (raw: string) => {
        if (raw.trim() === '') return null;
        const n = Number(raw);
        return Number.isFinite(n) && n > 0 ? n : null;
    };

    const paidNumeric = parsePositiveAmount(paidAmount);
    const paidExceedsAgreed =
        paidNumeric !== null &&
        Number.isFinite(agreedNumeric) &&
        paidNumeric > agreedNumeric;

    const receivedNumeric = parsePositiveAmount(receivedAmount);
    const receivedExceedsAgreed =
        receivedNumeric !== null &&
        Number.isFinite(agreedNumeric) &&
        receivedNumeric > agreedNumeric;
    const receivedBelowAgreed =
        receivedNumeric !== null &&
        Number.isFinite(agreedNumeric) &&
        receivedNumeric < agreedNumeric;

    const isEventExceeds = (event: Event) =>
        event.exceedsAgreed ??
        (event.amount !== null &&
            Number.isFinite(agreedNumeric) &&
            Number(event.amount) > agreedNumeric);

    const hasAmountMismatch = data.events.some((event) => event.amountMismatch);
    const hasAmountExceeds = data.events.some(isEventExceeds);
    const latestEvent = data.events[data.events.length - 1] ?? null;
    const settledExceedsAgreed =
        data.settled && latestEvent !== null && isEventExceeds(latestEvent);

    return (
        <section
            id="completion-payment"
            className="space-y-5 rounded-xl border bg-card p-5 print:break-inside-avoid"
        >
            <div>
                <h2 className="text-lg font-semibold">
                    Completion and payment
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    {COMPLETION_PAYMENT_NOTICE}
                </p>
            </div>
            {data.completion && (
                <div className="grid gap-3 rounded-lg bg-muted/30 p-4 sm:grid-cols-2">
                    <div>
                        <h3 className="font-medium">Work delivered</h3>
                        <p className="text-sm">
                            {data.completion.deliveredAt
                                ? formatDateTime(data.completion.deliveredAt)
                                : 'Not marked'}
                        </p>
                        {data.completion.deliveredNote && (
                            <p className="mt-1 text-sm whitespace-pre-wrap">
                                {data.completion.deliveredNote}
                            </p>
                        )}
                    </div>
                    <div>
                        <h3 className="font-medium">Task completion</h3>
                        <p className="text-sm">
                            {data.completion.completedAt
                                ? formatDateTime(data.completion.completedAt)
                                : 'Not recorded'}
                        </p>
                        {data.completion.completionNote && (
                            <p className="mt-1 text-sm whitespace-pre-wrap">
                                {data.completion.completionNote}
                            </p>
                        )}
                    </div>
                </div>
            )}
            {!readOnly &&
                (data.canMarkDelivered || data.canRecordCompletion) && (
                    <div className="grid gap-4 md:grid-cols-2 print:hidden">
                        {data.canMarkDelivered && (
                            <Form
                                {...agreements.completion.delivered.form(
                                    agreementId,
                                )}
                                className="space-y-3 rounded-lg border p-4"
                            >
                                {({ errors, processing }) => (
                                    <>
                                        <h3 className="font-medium">
                                            Mark work as delivered
                                        </h3>
                                        <label
                                            htmlFor="delivered-note"
                                            className="sr-only"
                                        >
                                            Optional note for the poster
                                        </label>
                                        <Textarea
                                            id="delivered-note"
                                            name="note"
                                            maxLength={2000}
                                            placeholder="Optional note for the poster"
                                            aria-describedby={
                                                errors.note
                                                    ? 'delivered-note-error'
                                                    : undefined
                                            }
                                        />
                                        <InputError
                                            id="delivered-note-error"
                                            message={errors.note}
                                        />
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                        >
                                            Mark delivered
                                        </Button>
                                    </>
                                )}
                            </Form>
                        )}
                        {data.canRecordCompletion && (
                            <Form
                                {...agreements.completion.complete.form(
                                    agreementId,
                                )}
                                className="space-y-3 rounded-lg border p-4"
                            >
                                {({ errors, processing }) => (
                                    <>
                                        <h3 className="font-medium">
                                            Record task completion
                                        </h3>
                                        <label
                                            htmlFor="completion-note"
                                            className="sr-only"
                                        >
                                            Optional completion note
                                        </label>
                                        <Textarea
                                            id="completion-note"
                                            name="note"
                                            maxLength={2000}
                                            placeholder="Optional completion note"
                                            aria-describedby={
                                                errors.note
                                                    ? 'completion-note-error'
                                                    : undefined
                                            }
                                        />
                                        <InputError
                                            id="completion-note-error"
                                            message={errors.note}
                                        />
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                        >
                                            Record as completed
                                        </Button>
                                    </>
                                )}
                            </Form>
                        )}
                    </div>
                )}
            <div className="flex flex-wrap items-center gap-3">
                <h3 className="font-medium">Payment status</h3>
                <PaymentStatusBadge
                    status={data.paymentStatus}
                    label={data.paymentStatusLabel}
                />
                <span className="text-sm text-muted-foreground">
                    Agreed amount: ₱{formatAmount(data.agreedAmount)}
                </span>
                {data.settled && (
                    <span className="text-sm font-medium text-success-fg">
                        {settledExceedsAgreed
                            ? 'Payment confirmed received (exceeds the agreed amount).'
                            : 'The agreed amount was confirmed received.'}
                    </span>
                )}
            </div>
            {hasAmountMismatch && (
                <p
                    role="status"
                    className="flex items-start gap-2.5 rounded-lg border border-warning-border bg-warning-bg p-3 text-sm text-warning-fg"
                >
                    <TriangleAlert
                        className="mt-0.5 size-4 shrink-0"
                        aria-hidden="true"
                    />
                    <span>
                        {hasAmountExceeds
                            ? `A recorded payment amount exceeds the agreed amount of ₱${formatAmount(data.agreedAmount)}. The payment is accepted, and both parties can see the difference in the payment history.`
                            : `A recorded payment amount differs from the agreed amount of ₱${formatAmount(data.agreedAmount)}. Both parties can see the payment history.`}
                    </span>
                </p>
            )}
            {!readOnly && data.canMarkPaid && (
                <Form
                    {...agreements.payments.markPaid.form(agreementId)}
                    className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2 print:hidden"
                >
                    {({ errors, processing }) => (
                        <>
                            <h3 className="font-medium sm:col-span-2">
                                Record payment
                            </h3>
                            <div>
                                <label
                                    className="mb-1 block text-sm"
                                    htmlFor="paid-amount"
                                >
                                    Amount paid (₱)
                                </label>
                                <Input
                                    id="paid-amount"
                                    name="amount"
                                    type="number"
                                    min="1"
                                    max="1000000"
                                    step="0.01"
                                    value={paidAmount}
                                    onChange={(event) =>
                                        setPaidAmount(event.target.value)
                                    }
                                    required
                                />
                                <InputError message={errors.amount} />
                            </div>
                            <div>
                                <label
                                    className="mb-1 block text-sm"
                                    htmlFor="paid-on"
                                >
                                    Date paid
                                </label>
                                <Input
                                    id="paid-on"
                                    name="paid_on"
                                    type="date"
                                    max={new Date().toISOString().slice(0, 10)}
                                    defaultValue={new Date()
                                        .toISOString()
                                        .slice(0, 10)}
                                    required
                                />
                                <InputError message={errors.paid_on} />
                            </div>
                            <div>
                                <label
                                    className="mb-1 block text-sm"
                                    htmlFor="paid-method"
                                >
                                    Method
                                </label>
                                <Input
                                    id="paid-method"
                                    name="method"
                                    list="payment-method-suggestions"
                                    maxLength={100}
                                    placeholder="Enter the method used"
                                    required
                                />
                                <datalist id="payment-method-suggestions">
                                    {data.paymentMethods.map((method) => (
                                        <option
                                            key={method.value}
                                            value={method.label}
                                        />
                                    ))}
                                </datalist>
                                <InputError message={errors.method} />
                            </div>
                            <div>
                                <label
                                    className="mb-1 block text-sm"
                                    htmlFor="paid-note"
                                >
                                    Note or reference (optional)
                                </label>
                                <Input
                                    id="paid-note"
                                    name="note"
                                    maxLength={2000}
                                />
                                <InputError message={errors.note} />
                            </div>
                            {paidExceedsAgreed && paidNumeric !== null && (
                                <p
                                    role="status"
                                    className="flex items-start gap-2.5 rounded-lg border border-warning-border bg-warning-bg p-3 text-sm text-warning-fg sm:col-span-2"
                                >
                                    <TriangleAlert
                                        className="mt-0.5 size-4 shrink-0"
                                        aria-hidden="true"
                                    />
                                    <span>
                                        Exceeds agreed amount: ₱
                                        {formatAmount(paidNumeric)} is greater
                                        than the agreed amount of ₱
                                        {formatAmount(data.agreedAmount)}. You
                                        can still record this payment — both
                                        parties will see the difference.
                                    </span>
                                </p>
                            )}
                            <Button
                                className="sm:col-span-2 sm:w-fit"
                                type="submit"
                                disabled={processing}
                            >
                                Record payment
                            </Button>
                        </>
                    )}
                </Form>
            )}
            {!readOnly && data.canRespondPayment && (
                <div className="space-y-3 rounded-lg border p-4 print:hidden">
                    <h3 className="font-medium">
                        Did you receive the payment?
                    </h3>
                    <Form
                        {...agreements.payments.confirmReceived.form(
                            agreementId,
                        )}
                        onSuccess={() => setReceivedAmount('')}
                        className="space-y-3"
                    >
                        {({ errors, processing }) => (
                            <>
                                <div className="flex flex-wrap items-end gap-3">
                                    <div>
                                        <label
                                            className="mb-1 block text-sm"
                                            htmlFor="received-amount"
                                        >
                                            Amount received (optional)
                                        </label>
                                        <Input
                                            id="received-amount"
                                            name="amount"
                                            type="number"
                                            min="1"
                                            max="1000000"
                                            step="0.01"
                                            value={receivedAmount}
                                            onChange={(event) =>
                                                setReceivedAmount(
                                                    event.target.value,
                                                )
                                            }
                                            aria-describedby={
                                                errors.amount
                                                    ? 'received-amount-error'
                                                    : undefined
                                            }
                                        />
                                        <InputError
                                            id="received-amount-error"
                                            message={errors.amount}
                                        />
                                    </div>
                                    <Button type="submit" disabled={processing}>
                                        Confirm I received it
                                    </Button>
                                </div>
                                {receivedExceedsAgreed &&
                                    receivedNumeric !== null && (
                                        <p
                                            role="status"
                                            className="flex items-start gap-2.5 rounded-lg border border-warning-border bg-warning-bg p-3 text-sm text-warning-fg"
                                        >
                                            <TriangleAlert
                                                className="mt-0.5 size-4 shrink-0"
                                                aria-hidden="true"
                                            />
                                            <span>
                                                Exceeds agreed amount: ₱
                                                {formatAmount(receivedNumeric)}{' '}
                                                is greater than the agreed
                                                amount of ₱
                                                {formatAmount(
                                                    data.agreedAmount,
                                                )}
                                                . You can still accept and
                                                confirm this payment — both
                                                parties will be notified and see
                                                it in the payment history.
                                            </span>
                                        </p>
                                    )}
                                {receivedBelowAgreed &&
                                    receivedNumeric !== null && (
                                        <p
                                            role="status"
                                            className="flex items-start gap-2.5 rounded-lg border border-warning-border bg-warning-bg p-3 text-sm text-warning-fg"
                                        >
                                            <TriangleAlert
                                                className="mt-0.5 size-4 shrink-0"
                                                aria-hidden="true"
                                            />
                                            <span>
                                                Below agreed amount: ₱
                                                {formatAmount(receivedNumeric)}{' '}
                                                is less than the agreed amount
                                                of ₱
                                                {formatAmount(
                                                    data.agreedAmount,
                                                )}
                                                . You can still record it, and
                                                payment will stay unsettled
                                                until the full agreed amount is
                                                confirmed.
                                            </span>
                                        </p>
                                    )}
                            </>
                        )}
                    </Form>
                    <Form
                        {...agreements.payments.notReceived.form(agreementId)}
                    >
                        {({ processing }) => (
                            <Button
                                variant="outline"
                                type="submit"
                                disabled={processing}
                            >
                                I did not receive it
                            </Button>
                        )}
                    </Form>
                </div>
            )}
            {data.activeReportId && (
                <p className="text-sm">
                    A non-payment report is open:{' '}
                    <Link
                        className="underline"
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
                    className="space-y-3 rounded-lg border border-danger-border p-4 print:hidden"
                >
                    {({ errors, processing }) => (
                        <>
                            <h3 className="font-medium">Report non-payment</h3>
                            <p className="text-sm text-muted-foreground">
                                Tell us if payment is missing or if the amount
                                received differs from the agreed amount.
                            </p>
                            <label
                                htmlFor="non-payment-description"
                                className="sr-only"
                            >
                                Describe what happened
                            </label>
                            <Textarea
                                id="non-payment-description"
                                name="description"
                                maxLength={3000}
                                required
                                placeholder="Describe what happened."
                                aria-describedby={
                                    errors.description
                                        ? 'non-payment-description-error'
                                        : undefined
                                }
                            />
                            <InputError
                                id="non-payment-description-error"
                                message={errors.description}
                            />
                            <p className="text-sm text-warning-fg">
                                Do not upload government ID photos, selfies, or
                                other sensitive documents beyond what is needed.
                                Payment or chat screenshots may help.
                                Administrators will see uploaded evidence.
                            </p>
                            <label
                                htmlFor="non-payment-evidence"
                                className="sr-only"
                            >
                                Optional evidence files
                            </label>
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
                                message={
                                    errors.evidence ?? errors['evidence.0']
                                }
                            />
                            <Button
                                variant="destructive"
                                type="submit"
                                disabled={processing}
                            >
                                Submit non-payment report
                            </Button>
                        </>
                    )}
                </Form>
            )}
            <div className="space-y-3">
                <h3 className="font-medium">Payment timeline</h3>
                {data.events.length ? (
                    data.events.map((event) => (
                        <article
                            key={event.id}
                            className={`space-y-1 rounded-lg border p-3 text-sm ${event.amountMismatch ? 'border-warning-border bg-warning-bg/70' : ''}`}
                        >
                            <div className="flex flex-wrap justify-between gap-2">
                                <strong>{event.eventLabel}</strong>
                                <span>
                                    {event.createdAt
                                        ? formatDateTime(event.createdAt)
                                        : '—'}
                                </span>
                            </div>
                            <p>
                                {event.actorName}
                                {event.amount !== null
                                    ? ` · ₱${formatAmount(event.amount)}`
                                    : ''}
                                {event.paidOn ? ` · paid ${event.paidOn}` : ''}
                                {event.method ? ` · ${event.method}` : ''}
                            </p>
                            {event.amountMismatch && (
                                <p className="font-medium text-warning-fg">
                                    {isEventExceeds(event)
                                        ? `This amount exceeds the agreed amount of ₱${formatAmount(data.agreedAmount)}.`
                                        : 'This amount differs from the agreed amount.'}
                                </p>
                            )}
                            {event.note && (
                                <p className="whitespace-pre-wrap">
                                    {event.note}
                                </p>
                            )}
                        </article>
                    ))
                ) : (
                    <p className="rounded border p-3 text-sm text-muted-foreground">
                        No payment has been recorded.
                    </p>
                )}
            </div>
        </section>
    );
}
