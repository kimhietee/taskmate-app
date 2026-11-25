import { formatDateTime, formatAmount, formatHoursFlexibility } from '@/lib/format';
import { PAYMENT_BOUNDARY_NOTICE } from '@/constants/notices';
import { Form, Head, Link } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { TaskStatusBadge } from '@/components/task-status-badge';
import { VerificationStatusBadge } from '@/components/verification-status-badge';
import { SafetyNotice } from '@/components/safety-notice';
import { ToBeDiscussedBadge } from '@/components/terms-status-badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import InputError from '@/components/input-error';
import admin from '@/routes/admin';
import adminUsers from '@/routes/admin/users';
import { CompletionPaymentPanel, type CompletionPaymentData } from '@/components/completion-payment-panel';

type Task = {
    id: number;
    title: string;
    category: string;
    categoryKey: string;
    workTypeLabel?: string;
    description: string;
    requiredActivities: string | null;
    deliverables: string | null;
    estimatedDurationHours: string | null;
    skillRequirements: string | null;
    complexity: string | null;
    budget: string | null;
    budgetToBeDiscussed?: boolean;
    payTimingLabel?: string;
    payTimingToBeDiscussed?: boolean;
    payTimingNote?: string | null;
    scheduleSummary?: string | null;
    scheduleNote?: string | null;
    scheduleToBeDiscussed?: boolean;
    canHoursChange?: boolean | null;
    workMode: string;
    workplaceName: string | null;
    workplaceAddress: string | null;
    deadline: string | null;
    status: string;
    statusLabel: string;
    reviewNote: string | null;
    submittedAt: string | null;
    poster: {
        id: number;
        name: string;
        type: string;
        verificationStatus: 'pending' | 'verified' | 'rejected' | 'more_info_requested';
        otherTasksCount: number;
    };
};

type Action = {
    id: number;
    action: string;
    adminName: string | null;
    note: string | null;
    createdAt: string | null;
};

type AdminApplication = {
    id: number;
    applicantName: string;
    status: string;
    appliedAt: string | null;
    userId: number;
};

type ContentFlag = {
    id: number;
    category: string;
    matched: string[];
    field: string;
    status: string;
    createdAt: string | null;
};

type AgreementSummary = {
    id: number;
    status: string;
    locked_at: string | null;
};

type Props = {
    task: Task;
    adminActions?: Action[];
    applications?: AdminApplication[];
    flags?: ContentFlag[];
    agreement?: AgreementSummary | null;
    completionPayment?: CompletionPaymentData | null;
    canReview: boolean;
    status?: string | null;
};

function DecisionForm({
    taskId,
    decision,
    label,
    noteRequired,
    variant,
}: {
    taskId: number;
    decision: string;
    label: string;
    noteRequired: boolean;
    variant: 'default' | 'outline' | 'destructive';
}) {
    return (
        <Form
            {...admin.tasks.decision.form(taskId)}
            className="space-y-2.5 rounded-lg border border-border bg-muted/20 p-4"
        >
            {({ errors, processing }) => (
                <>
                    <input type="hidden" name="decision" value={decision} />
                    <label
                        className="block text-sm font-medium text-foreground"
                        htmlFor={`${decision}-note`}
                    >
                        Admin note {noteRequired ? '(required)' : '(optional)'}
                    </label>
                    <Textarea
                        id={`${decision}-note`}
                        name="note"
                        required={noteRequired}
                        placeholder={
                            decision === 'approve'
                                ? 'Optional note for the poster.'
                                : 'Explain the decision to the poster.'
                        }
                    />
                    <InputError message={errors.note} />
                    <Button type="submit" variant={variant} className="w-full" disabled={processing}>
                        {label}
                    </Button>
                </>
            )}
        </Form>
    );
}

export default function AdminTaskReview({
    task,
    adminActions = [],
    applications = [],
    flags = [],
    agreement = null,
    completionPayment = null,
    canReview,
    status,
}: Props) {
    return (
        <>
            <Head title={`Review: ${task.title}`} />
            <div className="space-y-6">
                {status && (
                    <div
                        role="status"
                        className="rounded-lg border border-success-border bg-success-bg px-4 py-3 text-sm text-success-fg"
                    >
                        {status}
                    </div>
                )}

                <header className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1.5">
                        <Link
                            href={admin.tasks.index()}
                            className="focus-ring inline-block rounded-sm text-sm font-medium text-brand underline-offset-4 hover:underline"
                        >
                            Back to task queue
                        </Link>
                        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{task.title}</h1>
                        <p className="text-sm tabular-nums text-muted-foreground">
                            Submitted {task.submittedAt ? formatDateTime(task.submittedAt) : '—'}
                        </p>
                    </div>
                    <TaskStatusBadge status={task.status} label={task.statusLabel} />
                </header>

                <SafetyNotice />

                <p className="rounded-xl border border-info-border bg-info-bg p-4 text-sm text-info-fg">
                    Every submitted task is reviewed by an administrator before it can be approved.
                </p>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
                    <div className="min-w-0 space-y-6">
                        <section className="space-y-5 rounded-xl border border-border bg-card p-5 shadow-xs">
                            <h2 className="text-lg font-semibold">Task details</h2>

                            <dl className="grid gap-4 text-sm sm:grid-cols-2">
                                <div className="space-y-1">
                                    <dt className="text-xs font-semibold text-muted-foreground">Category</dt>
                                    <dd className="text-foreground">
                                        {task.category}
                                        {task.workTypeLabel ? ` · ${task.workTypeLabel}` : ''}
                                    </dd>
                                </div>

                                <div className="space-y-1">
                                    <dt className="text-xs font-semibold text-muted-foreground">Pay amount</dt>
                                    <dd className="tabular-nums font-semibold text-foreground">
                                        {task.budgetToBeDiscussed || task.budget === null ? (
                                            <ToBeDiscussedBadge />
                                        ) : (
                                            `₱${formatAmount(task.budget)}`
                                        )}
                                    </dd>
                                </div>

                                <div className="space-y-1">
                                    <dt className="text-xs font-semibold text-muted-foreground">Pay timing</dt>
                                    <dd className="flex flex-wrap items-center gap-2 text-foreground">
                                        {task.payTimingToBeDiscussed ? (
                                            <ToBeDiscussedBadge />
                                        ) : (
                                            <span>{task.payTimingLabel ?? 'To be discussed'}</span>
                                        )}
                                        {task.payTimingNote && (
                                            <span className="text-xs text-muted-foreground">
                                                ({task.payTimingNote})
                                            </span>
                                        )}
                                    </dd>
                                </div>

                                <div className="space-y-1">
                                    <dt className="text-xs font-semibold text-muted-foreground">Work hours</dt>
                                    <dd className="text-foreground">
                                        {task.scheduleToBeDiscussed || !task.scheduleSummary ? (
                                            <ToBeDiscussedBadge />
                                        ) : (
                                            <span className="tabular-nums">{task.scheduleSummary}</span>
                                        )}
                                    </dd>
                                </div>

                                <div className="space-y-1">
                                    <dt className="text-xs font-semibold text-muted-foreground">Can hours change</dt>
                                    <dd className="text-foreground">{formatHoursFlexibility(task.canHoursChange)}</dd>
                                </div>

                                <div className="space-y-1">
                                    <dt className="text-xs font-semibold text-muted-foreground">
                                        Estimated duration &amp; complexity
                                    </dt>
                                    <dd className="tabular-nums text-foreground">
                                        {task.estimatedDurationHours
                                            ? `${task.estimatedDurationHours} hours`
                                            : 'Not provided'}{' '}
                                        · {task.complexity ?? 'Not provided'}
                                    </dd>
                                </div>

                                <div className="space-y-1 sm:col-span-2">
                                    <dt className="text-xs font-semibold text-muted-foreground">Description</dt>
                                    <dd className="whitespace-pre-wrap text-foreground">
                                        {task.description || '—'}
                                    </dd>
                                </div>

                                <div className="space-y-1 sm:col-span-2">
                                    <dt className="text-xs font-semibold text-muted-foreground">Main activities</dt>
                                    <dd className="whitespace-pre-wrap text-foreground">
                                        {task.requiredActivities || 'Not provided'}
                                    </dd>
                                </div>

                                <div className="space-y-1 sm:col-span-2">
                                    <dt className="text-xs font-semibold text-muted-foreground">
                                        Expected result or deliverables
                                    </dt>
                                    <dd className="whitespace-pre-wrap text-foreground">
                                        {task.deliverables || 'Not provided'}
                                    </dd>
                                </div>

                                <div className="space-y-1 sm:col-span-2">
                                    <dt className="text-xs font-semibold text-muted-foreground">Skills</dt>
                                    <dd className="whitespace-pre-wrap text-foreground">
                                        {task.skillRequirements || 'Not provided'}
                                    </dd>
                                </div>

                                {task.scheduleNote && (
                                    <div className="space-y-1 sm:col-span-2">
                                        <dt className="text-xs font-semibold text-muted-foreground">Schedule note</dt>
                                        <dd className="whitespace-pre-wrap text-foreground">{task.scheduleNote}</dd>
                                    </div>
                                )}
                            </dl>

                            <p className="rounded-lg border border-border bg-muted/40 p-3.5 text-xs text-muted-foreground">
                                {PAYMENT_BOUNDARY_NOTICE}
                            </p>

                            {task.reviewNote && (
                                <p className="rounded-lg border border-warning-border bg-warning-bg p-3.5 text-sm text-warning-fg">
                                    Current review note: {task.reviewNote}
                                </p>
                            )}
                        </section>

                        <section className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-xs">
                            <h2 className="text-lg font-semibold">Workplace details</h2>
                            <dl className="grid gap-4 text-sm sm:grid-cols-2">
                                <div className="space-y-1">
                                    <dt className="text-xs font-semibold text-muted-foreground">Work mode</dt>
                                    <dd className="text-foreground">{task.workMode}</dd>
                                </div>
                                <div className="space-y-1">
                                    <dt className="text-xs font-semibold text-muted-foreground">Workplace</dt>
                                    <dd className="text-foreground">{task.workplaceName ?? '—'}</dd>
                                </div>
                                <div className="space-y-1 sm:col-span-2">
                                    <dt className="text-xs font-semibold text-muted-foreground">Workplace address</dt>
                                    <dd className="text-foreground">{task.workplaceAddress ?? '—'}</dd>
                                </div>
                            </dl>
                            <p className="text-xs text-muted-foreground">
                                This is a stated place of work. TaskMate does not track locations or collect coordinates.
                            </p>
                        </section>

                        <section className="space-y-3 rounded-xl border border-border bg-card p-5 shadow-xs">
                            <h2 className="text-lg font-semibold">Off-platform content flags</h2>
                            {flags.length ? (
                                <div className="divide-y divide-border">
                                    {flags.map((flag) => (
                                        <article key={flag.id} className="space-y-1 py-3 text-sm first:pt-0 last:pb-0">
                                            <p className="font-semibold text-foreground">
                                                {flag.category} · {flag.status.replaceAll('_', ' ')}
                                            </p>
                                            <p className="text-muted-foreground">
                                                Field: {flag.field.replaceAll('_', ' ')}
                                            </p>
                                            {flag.matched.length > 0 && (
                                                <p className="text-foreground">
                                                    Matched indicators: {flag.matched.join(', ')}
                                                </p>
                                            )}
                                            {flag.createdAt && (
                                                <p className="text-xs tabular-nums text-muted-foreground">
                                                    Flagged {formatDateTime(flag.createdAt)}
                                                </p>
                                            )}
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    No off-platform content flags have been recorded.
                                </p>
                            )}
                        </section>

                        {agreement && (
                            <section className="space-y-3 rounded-xl border border-border bg-card p-5 shadow-xs">
                                <h2 className="text-lg font-semibold">Agreement</h2>
                                <div className="space-y-1 text-sm">
                                    <p className="capitalize text-foreground">
                                        Status: {agreement.status.replaceAll('_', ' ')}
                                    </p>
                                    {agreement.locked_at && (
                                        <p className="tabular-nums text-muted-foreground">
                                            Locked {formatDateTime(agreement.locked_at)}
                                        </p>
                                    )}
                                </div>
                                <Link
                                    className="focus-ring inline-block rounded-sm text-sm font-medium text-brand underline-offset-4 hover:underline"
                                    href={admin.agreements.show(agreement.id)}
                                >
                                    View agreement versions and confirmations
                                </Link>
                                {task.status === 'in_progress' && agreement.locked_at && (
                                    <Form
                                        action={`/admin/tasks/${task.id}/close`}
                                        method="post"
                                        className="space-y-3 border-t border-border pt-4"
                                    >
                                        {({ errors, processing }) => (
                                            <>
                                                <label
                                                    htmlFor="close-task-note"
                                                    className="block text-sm font-medium text-foreground"
                                                >
                                                    Close task as cancelled by administrator
                                                </label>
                                                <Textarea
                                                    id="close-task-note"
                                                    name="note"
                                                    required
                                                    minLength={5}
                                                    maxLength={3000}
                                                    className="min-h-24"
                                                    placeholder="Required reason. Agreement records will remain unchanged."
                                                />
                                                <InputError message={(errors as Record<string, string>).note} />
                                                <Button type="submit" variant="destructive" disabled={processing}>
                                                    Close task
                                                </Button>
                                            </>
                                        )}
                                    </Form>
                                )}
                            </section>
                        )}

                        {agreement && completionPayment && (
                            <CompletionPaymentPanel agreementId={agreement.id} data={completionPayment} readOnly />
                        )}

                        <section className="space-y-3 rounded-xl border border-border bg-card p-5 shadow-xs">
                            <h2 className="text-lg font-semibold">Applications</h2>
                            {applications.length ? (
                                <div className="divide-y divide-border">
                                    {applications.map((application) => (
                                        <div
                                            key={application.id}
                                            className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm first:pt-0 last:pb-0"
                                        >
                                            <Link
                                                className="focus-ring rounded-sm font-medium text-brand underline-offset-4 hover:underline"
                                                href={adminUsers.show(application.userId)}
                                            >
                                                {application.applicantName}
                                            </Link>
                                            <span className="capitalize text-foreground">{application.status}</span>
                                            <span className="tabular-nums text-muted-foreground">
                                                {application.appliedAt ? formatDateTime(application.appliedAt) : '—'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No applications have been submitted.</p>
                            )}
                        </section>

                        <section className="space-y-3 rounded-xl border border-border bg-card p-5 shadow-xs">
                            <h2 className="text-lg font-semibold">Admin action history</h2>
                            {adminActions.length ? (
                                <div className="divide-y divide-border">
                                    {adminActions.map((action) => (
                                        <div key={action.id} className="py-3 text-sm first:pt-0 last:pb-0">
                                            <p className="font-semibold capitalize tabular-nums text-foreground">
                                                {action.action.replaceAll('_', ' ')} · {action.adminName ?? 'Administrator'}{' '}
                                                · {action.createdAt ? formatDateTime(action.createdAt) : ''}
                                            </p>
                                            {action.note && (
                                                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                                                    {action.note}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    No admin decisions have been recorded for this task.
                                </p>
                            )}
                        </section>
                    </div>

                    <aside className="space-y-4 lg:sticky lg:top-[calc(var(--banner-h,0px)+1.5rem)]">
                        <section className="space-y-3 rounded-xl border border-border bg-card p-5 shadow-xs">
                            <h2 className="text-lg font-semibold">Poster</h2>
                            <div className="space-y-1.5">
                                <Link
                                    href={adminUsers.show(task.poster.id)}
                                    className="focus-ring inline-block rounded-sm font-semibold text-brand underline-offset-4 hover:underline"
                                >
                                    {task.poster.name}
                                </Link>
                                <p className="text-sm text-muted-foreground">{task.poster.type}</p>
                            </div>
                            <VerificationStatusBadge status={task.poster.verificationStatus} />
                            <p className="text-sm tabular-nums text-muted-foreground">
                                Other tasks: {task.poster.otherTasksCount}
                            </p>
                        </section>

                        {canReview ? (
                            <section className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-xs">
                                <h2 className="text-lg font-semibold">Review decision</h2>
                                <div className="space-y-3">
                                    <DecisionForm
                                        taskId={task.id}
                                        decision="approve"
                                        label="Approve task"
                                        noteRequired={false}
                                        variant="default"
                                    />
                                    <DecisionForm
                                        taskId={task.id}
                                        decision="request_changes"
                                        label="Request changes"
                                        noteRequired
                                        variant="outline"
                                    />
                                    <DecisionForm
                                        taskId={task.id}
                                        decision="reject"
                                        label="Reject task"
                                        noteRequired
                                        variant="destructive"
                                    />
                                </div>
                            </section>
                        ) : task.status === 'pending_review' ? (
                            <p className="rounded-xl border border-warning-border bg-warning-bg p-4 text-sm text-warning-fg">
                                You cannot review a task you posted yourself.
                            </p>
                        ) : null}
                    </aside>
                </div>
            </div>
        </>
    );
}

AdminTaskReview.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
