import { formatDate, formatDateTime, formatAmount } from '@/lib/format';
import { Form, Link } from '@inertiajs/react';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import InputError from '@/components/input-error';
import { AgreementStatusBadge } from '@/components/agreement-status-badge';
import agreements from '@/routes/agreements';
import { CompletionPaymentPanel } from '@/components/completion-payment-panel';
import { StarRating } from '@/components/star-rating';
import { ratingNotice } from '@/components/rating-summary';

type Confirmation = { userId: number; userName: string; confirmedAt: string };
type Version = {
    id: number;
    versionNumber: number;
    proposerId: number;
    proposerName: string;
    deliverables: string;
    terms: string;
    finalAmount: string;
    startDate: string | null;
    dueDate: string;
    workMode: string;
    workplaceName: string | null;
    workplaceAddress: string | null;
    paymentArrangement: string;
    comment: string | null;
    createdAt: string | null;
    confirmations: Confirmation[];
};
type RatingItem = {
    overall: number;
    comment: string | null;
    scores: { dimension: string; label: string; score: number }[];
    raterName?: string;
};
type Agreement = {
    id: number;
    status: string;
    statusLabel: string;
    lockedAt: string | null;
    cancelledAt: string | null;
    cancelledBy: number | null;
    cancellationReason: string | null;
    recordReference: string | null;
    task: { id: number; title: string; budget: string; status: string };
    poster: { id: number; name: string };
    student: { id: number; name: string };
    currentVersion: Version | null;
    versions: Version[];
    messages: { id: number; userId: number; userName: string; body: string; createdAt: string | null }[];
};

function WorkTerms({ version }: { version: Version }) {
    return (
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div className="space-y-1">
                <dt className="text-xs font-semibold text-muted-foreground print:text-black">Deliverables</dt>
                <dd className="whitespace-pre-wrap text-foreground print:text-black">{version.deliverables}</dd>
            </div>
            <div className="space-y-1">
                <dt className="text-xs font-semibold text-muted-foreground print:text-black">Terms</dt>
                <dd className="whitespace-pre-wrap text-foreground print:text-black">{version.terms}</dd>
            </div>
            <div className="space-y-1">
                <dt className="text-xs font-semibold text-muted-foreground print:text-black">Final amount</dt>
                <dd className="text-xl font-semibold tabular-nums text-foreground print:text-black">
                    ₱{formatAmount(version.finalAmount)}
                </dd>
            </div>
            <div className="space-y-1">
                <dt className="text-xs font-semibold text-muted-foreground print:text-black">Dates</dt>
                <dd className="tabular-nums text-foreground print:text-black">
                    Start: {version.startDate ?? 'Not set'} · Due: {version.dueDate}
                </dd>
            </div>
            <div className="space-y-1">
                <dt className="text-xs font-semibold text-muted-foreground print:text-black">Work mode</dt>
                <dd className="text-foreground print:text-black">{version.workMode}</dd>
            </div>
            <div className="space-y-1">
                <dt className="text-xs font-semibold text-muted-foreground print:text-black">Workplace</dt>
                <dd className="text-foreground print:text-black">
                    {version.workplaceName ?? 'Not applicable'}
                    {version.workplaceAddress ? ` · ${version.workplaceAddress}` : ''}
                </dd>
            </div>
            <div className="space-y-1 sm:col-span-2">
                <dt className="text-xs font-semibold text-muted-foreground print:text-black">Payment arrangement</dt>
                <dd className="whitespace-pre-wrap text-foreground print:text-black">
                    {version.paymentArrangement}
                </dd>
            </div>
        </dl>
    );
}

export function AgreementDetails({
    agreement,
    completionPayment,
    ratings,
    viewerId,
    actionsAllowed = true,
    notice,
    termsMaxLength,
    readOnly = false,
}: {
    agreement: Agreement;
    completionPayment: import('@/components/completion-payment-panel').CompletionPaymentData;
    ratings?: {
        canRate: boolean;
        rateUrl: string;
        windowDate: string | null;
        own: RatingItem | null;
        other: RatingItem | null;
        waiting: boolean;
        visibility: string;
    } | null;
    viewerId?: number;
    actionsAllowed?: boolean;
    notice: string;
    termsMaxLength?: number;
    readOnly?: boolean;
}) {
    const current = agreement.currentVersion;
    const confirmedIds = new Set(current?.confirmations.map((item) => item.userId) ?? []);
    const viewerConfirmed = viewerId !== undefined && confirmedIds.has(viewerId);
    const responseGuidance =
        agreement.status !== 'negotiating' || readOnly
            ? null
            : !actionsAllowed
              ? 'Your account is paused from agreement actions. You can still review the terms.'
              : viewerConfirmed
                ? 'You confirmed this version. Work can begin only after the other person confirms the same version. Any new version needs both confirmations again.'
                : 'Review the work, amount, dates, and payment arrangement. Confirm only if you agree. Work can begin after both people confirm the same version.';

    return (
        <article
            className={`${readOnly ? '' : 'page '}space-y-6 print:max-w-none print:space-y-4 print:bg-white print:p-0 print:text-black`}
        >
            <header className="rounded-xl border border-border bg-card p-5 shadow-xs md:p-6 print:rounded-none print:border-0 print:border-b print:border-black print:bg-white print:p-0 print:pb-4 print:text-black print:shadow-none">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1.5">
                        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase print:text-black">
                            TASKMATE AGREEMENT RECORD
                        </p>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl print:text-black">
                            Agreement for {agreement.task.title}
                        </h1>
                        <p className="text-sm text-muted-foreground print:text-black">
                            Poster:{' '}
                            <Link
                                className="focus-ring rounded-sm font-medium text-brand underline-offset-4 hover:underline print:text-black"
                                href={`/users/${agreement.poster.id}`}
                            >
                                {agreement.poster.name}
                            </Link>{' '}
                            · Worker:{' '}
                            <Link
                                className="focus-ring rounded-sm font-medium text-brand underline-offset-4 hover:underline print:text-black"
                                href={`/users/${agreement.student.id}`}
                            >
                                {agreement.student.name}
                            </Link>
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 print:hidden">
                        <AgreementStatusBadge status={agreement.status} label={agreement.statusLabel} />
                        <Button variant="outline" size="sm" onClick={() => window.print()} className="print:hidden">
                            <Printer className="size-4" aria-hidden="true" />
                            Print or save as PDF
                        </Button>
                    </div>
                </div>
                <p className="mt-2 hidden text-xs font-semibold tracking-wide uppercase print:block print:text-black">
                    Status: {agreement.statusLabel}
                    {agreement.recordReference ? ` · Record reference: ${agreement.recordReference}` : ''}
                </p>
            </header>

            <p className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-foreground print:break-inside-avoid print:rounded-none print:border print:border-black/40 print:bg-white print:text-black">
                {notice}
            </p>

            {responseGuidance && (
                <section
                    className="rounded-xl border border-info-border bg-info-bg p-4 text-sm text-info-fg print:hidden"
                    aria-label="Agreement next step"
                >
                    <h2 className="font-semibold">What happens next</h2>
                    <p className="mt-1">{responseGuidance}</p>
                </section>
            )}

            {agreement.status === 'negotiating' && !readOnly && !actionsAllowed && (
                <p className="rounded-xl border border-warning-border bg-warning-bg p-4 text-sm text-warning-fg print:hidden">
                    Agreement actions are unavailable while your account is suspended. You can still review the current
                    terms.
                </p>
            )}

            {agreement.status === 'agreed' && (
                <section className="space-y-2 rounded-xl border border-success-border bg-success-bg p-5 text-success-fg print:break-inside-avoid print:rounded-none print:border print:border-black print:bg-white print:text-black">
                    <h2 className="font-semibold tabular-nums">
                        Agreement confirmed on {agreement.lockedAt ? formatDateTime(agreement.lockedAt) : '—'}
                    </h2>
                    <p className="text-sm">
                        <strong>Record reference:</strong>{' '}
                        <span className="font-mono break-all">{agreement.recordReference}</span>
                    </p>
                    <p className="text-sm">Both people confirmed these terms. The record is locked, and work may begin.</p>
                </section>
            )}

            {agreement.status === 'cancelled' && (
                <section className="space-y-2 rounded-xl border border-neutral-border bg-neutral-bg p-5 text-neutral-fg print:break-inside-avoid print:rounded-none print:border print:border-black print:bg-white print:text-black">
                    <h2 className="font-semibold">Agreement cancelled</h2>
                    <p className="text-sm">Reason: {agreement.cancellationReason}</p>
                    <p className="text-sm">The task is open again so the poster can choose another applicant.</p>
                    {!readOnly && (
                        <div className="pt-1 print:hidden">
                            {viewerId === agreement.poster.id ? (
                                <Button variant="outline" asChild>
                                    <Link href={`/tasks/${agreement.task.id}`}>View reopened task</Link>
                                </Button>
                            ) : (
                                <Button variant="outline" asChild>
                                    <Link href="/my-applications">View my applications</Link>
                                </Button>
                            )}
                        </div>
                    )}
                </section>
            )}

            {current && (
                <section className="space-y-5 rounded-xl border border-border bg-card p-5 shadow-xs md:p-6 print:break-inside-avoid print:rounded-none print:border print:border-black/40 print:bg-white print:p-4 print:text-black print:shadow-none">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div>
                            <h2 className="text-lg font-semibold text-foreground print:text-black">
                                Current proposal · Version {current.versionNumber}
                            </h2>
                            <p className="text-sm tabular-nums text-muted-foreground print:text-black">
                                Proposed by {current.proposerName} on{' '}
                                {current.createdAt ? formatDateTime(current.createdAt) : '—'}
                            </p>
                        </div>
                    </div>

                    {current.comment && (
                        <p className="rounded-lg border border-border bg-muted/30 p-3.5 text-sm text-foreground print:rounded-none print:border-black/40 print:bg-white print:text-black">
                            <strong>Proposer's note:</strong> {current.comment}
                        </p>
                    )}

                    <WorkTerms version={current} />

                    <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2 print:border-black/40">
                        {[agreement.poster, agreement.student].map((party) => {
                            const confirmation = current.confirmations.find((item) => item.userId === party.id);

                            return (
                                <div
                                    key={party.id}
                                    className={`rounded-lg border p-3.5 text-sm print:rounded-none print:bg-white print:text-black ${
                                        confirmation
                                            ? 'border-success-border bg-success-bg/60 text-success-fg print:border-black'
                                            : 'border-warning-border bg-warning-bg/60 text-warning-fg print:border-black/40'
                                    }`}
                                >
                                    <p className="font-semibold">{party.name}</p>
                                    <p className="mt-0.5 text-xs tabular-nums">
                                        {confirmation
                                            ? `✓ Confirmed ${formatDateTime(confirmation.confirmedAt)}`
                                            : 'Waiting for confirmation'}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {agreement.status === 'negotiating' && !readOnly && current && actionsAllowed && (
                <section className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-xs md:p-6 print:hidden">
                    <h2 className="text-lg font-semibold">Review and respond</h2>

                    {!viewerConfirmed ? (
                        <Form {...agreements.confirm.form(agreement.id)} className="flex flex-wrap items-center gap-3">
                            {({ errors, processing }) => (
                                <>
                                    <input type="hidden" name="version_id" value={current.id} />
                                    <Button type="submit" disabled={processing}>
                                        I agree to these terms
                                    </Button>
                                    <InputError message={errors.version_id} />
                                </>
                            )}
                        </Form>
                    ) : (
                        <p className="rounded-lg border border-success-border bg-success-bg px-3.5 py-2.5 text-sm text-success-fg">
                            Your confirmation is recorded for this version.
                        </p>
                    )}

                    <details className="rounded-lg border border-border bg-muted/20 p-4">
                        <summary className="focus-ring cursor-pointer rounded-sm text-sm font-semibold text-foreground">
                            Propose different terms
                        </summary>
                        <Form {...agreements.revise.form(agreement.id)} className="mt-4 space-y-4">
                            {({ errors, processing }) => (
                                <>
                                    <input type="hidden" name="version_id" value={current.id} />
                                    <div className="grid gap-1.5">
                                        <label
                                            htmlFor="revise-deliverables"
                                            className="block text-sm font-medium text-foreground"
                                        >
                                            Deliverables
                                        </label>
                                        <Textarea
                                            id="revise-deliverables"
                                            name="deliverables"
                                            required
                                            defaultValue={current.deliverables}
                                            aria-describedby={
                                                errors.deliverables ? 'revise-deliverables-error' : undefined
                                            }
                                        />
                                        <InputError id="revise-deliverables-error" message={errors.deliverables} />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <label htmlFor="revise-terms" className="block text-sm font-medium text-foreground">
                                            Terms
                                        </label>
                                        <Textarea
                                            id="revise-terms"
                                            name="terms"
                                            required
                                            maxLength={termsMaxLength}
                                            defaultValue={current.terms}
                                            aria-describedby={errors.terms ? 'revise-terms-error' : undefined}
                                        />
                                        <InputError id="revise-terms-error" message={errors.terms} />
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="grid gap-1.5 sm:col-span-2">
                                            <label
                                                htmlFor="revise-final-amount"
                                                className="block text-sm font-medium text-foreground"
                                            >
                                                Final amount (₱)
                                            </label>
                                            <Input
                                                id="revise-final-amount"
                                                name="final_amount"
                                                type="number"
                                                min="1"
                                                max="1000000"
                                                step="0.01"
                                                required
                                                className="tabular-nums"
                                                defaultValue={current.finalAmount}
                                                aria-describedby={
                                                    errors.final_amount ? 'revise-final-amount-error' : undefined
                                                }
                                            />
                                            <InputError id="revise-final-amount-error" message={errors.final_amount} />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <label
                                                htmlFor="revise-start-date"
                                                className="block text-sm font-medium text-foreground"
                                            >
                                                Start date (optional)
                                            </label>
                                            <Input
                                                id="revise-start-date"
                                                name="start_date"
                                                type="date"
                                                className="tabular-nums"
                                                defaultValue={current.startDate ?? ''}
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <label
                                                htmlFor="revise-due-date"
                                                className="block text-sm font-medium text-foreground"
                                            >
                                                Due date
                                            </label>
                                            <Input
                                                id="revise-due-date"
                                                name="due_date"
                                                type="date"
                                                required
                                                className="tabular-nums"
                                                defaultValue={current.dueDate}
                                                aria-describedby={errors.due_date ? 'revise-due-date-error' : undefined}
                                            />
                                            <InputError id="revise-due-date-error" message={errors.due_date} />
                                        </div>
                                    </div>
                                    <div className="grid gap-1.5">
                                        <label
                                            htmlFor="revise-payment-arrangement"
                                            className="block text-sm font-medium text-foreground"
                                        >
                                            Payment arrangement between you
                                        </label>
                                        <Textarea
                                            id="revise-payment-arrangement"
                                            name="payment_arrangement"
                                            required
                                            defaultValue={current.paymentArrangement}
                                            aria-describedby={
                                                errors.payment_arrangement
                                                    ? 'revise-payment-arrangement-error'
                                                    : undefined
                                            }
                                        />
                                        <InputError
                                            id="revise-payment-arrangement-error"
                                            message={errors.payment_arrangement}
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <label
                                            htmlFor="revise-comment"
                                            className="block text-sm font-medium text-foreground"
                                        >
                                            Note for the other person (optional)
                                        </label>
                                        <Textarea
                                            id="revise-comment"
                                            name="comment"
                                            maxLength={1000}
                                            aria-describedby={errors.comment ? 'revise-comment-error' : undefined}
                                        />
                                        <InputError id="revise-comment-error" message={errors.comment} />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Work mode and workplace stay as listed: {current.workMode}
                                        {current.workplaceName ? ` · ${current.workplaceName}` : ''}
                                        {current.workplaceAddress ? ` · ${current.workplaceAddress}` : ''}.
                                    </p>
                                    <Button type="submit" variant="outline" disabled={processing}>
                                        Send revised proposal
                                    </Button>
                                </>
                            )}
                        </Form>
                    </details>

                    <details className="rounded-lg border border-border bg-muted/20 p-4">
                        <summary className="focus-ring cursor-pointer rounded-sm text-sm font-semibold text-foreground">
                            Ask for a change
                        </summary>
                        <Form {...agreements.sendBack.form(agreement.id)} className="mt-4 space-y-3">
                            {({ errors, processing }) => (
                                <>
                                    <input type="hidden" name="version_id" value={current.id} />
                                    <div className="grid gap-1.5">
                                        <label
                                            htmlFor="send-back-body"
                                            className="block text-sm font-medium text-foreground"
                                        >
                                            Explain what should be changed
                                        </label>
                                        <Textarea
                                            id="send-back-body"
                                            name="body"
                                            required
                                            maxLength={1000}
                                            placeholder="Explain what should be changed."
                                            aria-describedby={errors.body ? 'send-back-body-error' : undefined}
                                        />
                                        <InputError id="send-back-body-error" message={errors.body} />
                                        <InputError message={errors.version_id} />
                                    </div>
                                    <Button variant="outline" type="submit" disabled={processing}>
                                        Send request
                                    </Button>
                                </>
                            )}
                        </Form>
                    </details>

                    <details className="rounded-lg border border-danger-border bg-danger-bg/30 p-4">
                        <summary className="focus-ring cursor-pointer rounded-sm text-sm font-semibold text-danger-fg">
                            Cancel and reopen the task
                        </summary>
                        <p className="mt-2 text-sm text-foreground">
                            The selected application will close. The poster can choose another applicant, or students can
                            apply again if the task is still open.
                        </p>
                        <Form
                            {...agreements.cancel.form(agreement.id)}
                            className="mt-4 space-y-3"
                            onSubmit={(event) => {
                                if (!window.confirm('Cancel this agreement and reopen the task?')) {
                                    event.preventDefault();
                                }
                            }}
                        >
                            {({ errors, processing }) => (
                                <>
                                    <div className="grid gap-1.5">
                                        <label
                                            htmlFor="cancel-reason"
                                            className="block text-sm font-medium text-foreground"
                                        >
                                            Reason for cancelling
                                        </label>
                                        <Textarea
                                            id="cancel-reason"
                                            name="reason"
                                            required
                                            maxLength={2000}
                                            placeholder="Reason for cancelling"
                                            aria-describedby={errors.reason ? 'cancel-reason-error' : undefined}
                                        />
                                        <InputError id="cancel-reason-error" message={errors.reason} />
                                    </div>
                                    <Button variant="destructive" type="submit" disabled={processing}>
                                        Cancel agreement
                                    </Button>
                                </>
                            )}
                        </Form>
                    </details>
                </section>
            )}

            {agreement.versions.length > 0 && (
                <section className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-xs md:p-6 print:rounded-none print:border print:border-black/40 print:bg-white print:p-4 print:text-black print:shadow-none">
                    <h2 className="text-lg font-semibold text-foreground print:text-black">Version history</h2>
                    <div className="space-y-4 border-l-2 border-border pl-4 print:border-black/40">
                        {agreement.versions.map((version) => (
                            <article
                                key={version.id}
                                className="space-y-3 border-b border-border pb-4 last:border-b-0 last:pb-0 print:break-inside-avoid print:border-black/30"
                            >
                                <h3 className="font-semibold tabular-nums text-foreground print:text-black">
                                    Version {version.versionNumber} · {version.proposerName} ·{' '}
                                    {version.createdAt ? formatDateTime(version.createdAt) : '—'}
                                </h3>
                                {version.comment && (
                                    <p className="text-sm text-foreground print:text-black">Note: {version.comment}</p>
                                )}
                                <WorkTerms version={version} />
                                <p className="text-xs tabular-nums text-muted-foreground print:text-black">
                                    Confirmations:{' '}
                                    {version.confirmations.length
                                        ? version.confirmations
                                              .map((item) => `${item.userName} (${formatDateTime(item.confirmedAt)})`)
                                              .join(' · ')
                                        : 'None'}
                                </p>
                            </article>
                        ))}
                    </div>
                </section>
            )}

            {ratings && (
                <section className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-xs md:p-6 print:break-inside-avoid print:rounded-none print:border print:border-black/40 print:bg-white print:p-4 print:text-black print:shadow-none">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground print:text-black">Ratings</h2>
                        <p className="mt-1 text-xs text-muted-foreground print:text-black">{ratingNotice}</p>
                    </div>
                    {ratings.own ? (
                        <article className="space-y-2 rounded-lg border border-border bg-muted/30 p-4 print:rounded-none print:border-black/40 print:bg-white print:text-black">
                            <p className="font-semibold">Your rating</p>
                            <StarRating score={ratings.own.overall} label="Your overall experience" />
                            {ratings.own.comment && <p className="whitespace-pre-wrap text-sm">{ratings.own.comment}</p>}
                            <div className="space-y-1 text-sm tabular-nums">
                                {ratings.own.scores.map((score) => (
                                    <p key={score.dimension}>
                                        {score.label}: {score.score} / 5
                                    </p>
                                ))}
                            </div>
                        </article>
                    ) : (
                        ratings.canRate && (
                            <div className="space-y-2 print:hidden">
                                <p className="text-sm text-foreground">Rate your experience with the other party.</p>
                                <Button variant="outline" asChild>
                                    <Link href={ratings.rateUrl}>Rate your experience</Link>
                                </Button>
                            </div>
                        )
                    )}

                    {ratings.other ? (
                        <article className="space-y-2 rounded-lg border border-border bg-muted/30 p-4 print:rounded-none print:border-black/40 print:bg-white print:text-black">
                            <p className="font-semibold">Rating from {ratings.other.raterName}</p>
                            <StarRating score={ratings.other.overall} label="Overall experience" />
                            {ratings.other.comment && (
                                <p className="whitespace-pre-wrap text-sm">{ratings.other.comment}</p>
                            )}
                            <div className="space-y-1 text-sm tabular-nums">
                                {ratings.other.scores.map((score) => (
                                    <p key={score.dimension}>
                                        {score.label}: {score.score} / 5
                                    </p>
                                ))}
                            </div>
                        </article>
                    ) : (
                        ratings.waiting && (
                            <p className="rounded-lg border border-border bg-muted/40 p-3.5 text-sm tabular-nums text-muted-foreground print:rounded-none print:border-black/40 print:bg-white print:text-black">
                                Waiting for the other party or until{' '}
                                {ratings.windowDate ? formatDate(ratings.windowDate) : 'the rating window closes'}.
                            </p>
                        )
                    )}
                </section>
            )}

            <CompletionPaymentPanel agreementId={agreement.id} data={completionPayment} readOnly={readOnly} />

            <section className="space-y-3 rounded-xl border border-border bg-card p-5 shadow-xs md:p-6 print:break-inside-avoid print:rounded-none print:border print:border-black/40 print:bg-white print:p-4 print:text-black print:shadow-none">
                <h2 className="text-lg font-semibold text-foreground print:text-black">Messages</h2>
                {agreement.messages.length ? (
                    <div className="divide-y divide-border print:divide-black/30">
                        {agreement.messages.map((message) => (
                            <article key={message.id} className="py-3 text-sm first:pt-0 last:pb-0">
                                <p className="font-semibold tabular-nums text-foreground print:text-black">
                                    {message.userName} · {message.createdAt ? formatDateTime(message.createdAt) : ''}
                                </p>
                                <p className="mt-1 whitespace-pre-wrap text-foreground print:text-black">
                                    {message.body}
                                </p>
                            </article>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground print:text-black">No comments have been sent back.</p>
                )}
            </section>

            <p className="text-xs text-muted-foreground print:text-black">
                Payments are arranged directly between the poster and worker. TaskMate does not process, hold,
                transfer, recover, or guarantee payment.
            </p>
        </article>
    );
}
