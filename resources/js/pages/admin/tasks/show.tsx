import { formatDateTime } from '@/lib/format';
import { PAYMENT_BOUNDARY_NOTICE } from '@/constants/notices';
import { Form, Head, Link } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { TaskStatusBadge } from '@/components/task-status-badge';
import { VerificationStatusBadge } from '@/components/verification-status-badge';
import { SafetyNotice } from '@/components/safety-notice';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import InputError from '@/components/input-error';
import admin from '@/routes/admin';
import adminUsers from '@/routes/admin/users';
import {
    CompletionPaymentPanel,
    type CompletionPaymentData,
} from '@/components/completion-payment-panel';

type Task = {
    id: number;
    title: string;
    category: string;
    categoryKey: string;
    description: string;
    budget: string | null;
    budgetDisplay: string;
    workMode: string;
    workplaceName: string | null;
    workplaceAddress: string | null;
    estimatedDurationDays: number | null;
    estimatedDurationLabel: string | null;
    status: string;
    statusLabel: string;
    reviewNote: string | null;
    submittedAt: string | null;
    poster: {
        id: number;
        name: string;
        type: string;
        verificationStatus:
            | 'pending'
            | 'verified'
            | 'rejected'
            | 'more_info_requested';
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
}: {
    taskId: number;
    decision: string;
    label: string;
}) {
    return (
        <Form
            {...admin.tasks.decision.form(taskId)}
            className={`admin-decision-card admin-decision-card--${decision} space-y-2 rounded-lg border p-4`}
        >
            {({ errors, processing }) => (
                <>
                    <input type="hidden" name="decision" value={decision} />
                    {decision !== 'approve' && (
                        <>
                            <label
                                className="block text-sm font-medium"
                                htmlFor={`${decision}-note`}
                            >
                                Admin note (required)
                            </label>
                            <Textarea
                                id={`${decision}-note`}
                                name="note"
                                required
                                placeholder="Explain the decision to the poster."
                            />
                            <InputError message={errors.note} />
                        </>
                    )}
                    {decision === 'approve' && (
                        <p className="admin-decision-caption">
                            Approve this task so it can appear in the student
                            listings.
                        </p>
                    )}
                    <Button
                        type="submit"
                        disabled={processing}
                        className="admin-decision-button"
                    >
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
            <div
                className="admin-page admin-task-detail space-y-4"
                data-tone="tasks"
            >
                {status && (
                    <div
                        role="status"
                        className="rounded-lg border px-4 py-3 text-sm"
                    >
                        {status}
                    </div>
                )}
                <div className="admin-page-heading flex-wrap">
                    <div>
                        <Link
                            href={admin.tasks.index()}
                            className="admin-back-link -ml-2"
                        >
                            Back to task queue
                        </Link>
                        <h1>{task.title}</h1>
                        <p className="admin-page-description">
                            Submitted{' '}
                            {task.submittedAt
                                ? formatDateTime(task.submittedAt)
                                : '—'}
                        </p>
                    </div>
                    <TaskStatusBadge
                        status={task.status}
                        label={task.statusLabel}
                    />
                </div>
                <SafetyNotice />
                <p className="admin-notice">
                    Every submitted task is reviewed by an administrator before
                    it can be approved.
                </p>
                <section className="grid min-w-0 gap-4 lg:grid-cols-3">
                    <div className="admin-detail-card space-y-4 lg:col-span-2">
                        <h2 className="text-lg font-semibold">Task details</h2>
                        <p>
                            <strong>Category:</strong> {task.category}
                        </p>
                        <p>
                            <strong>Description:</strong>{' '}
                            <span className="whitespace-pre-wrap">
                                {task.description || '—'}
                            </span>
                        </p>
                        <p>
                            <strong>Budget:</strong> {task.budgetDisplay}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {PAYMENT_BOUNDARY_NOTICE}
                        </p>
                        {task.reviewNote && (
                            <p className="rounded border p-3 text-sm">
                                Current review note: {task.reviewNote}
                            </p>
                        )}
                    </div>
                    <aside className="admin-detail-card space-y-3">
                        <h2 className="text-lg font-semibold">Poster</h2>
                        <p>{task.poster.name}</p>
                        <p>{task.poster.type}</p>
                        <VerificationStatusBadge
                            status={task.poster.verificationStatus}
                        />
                        <p className="text-sm">
                            Other tasks: {task.poster.otherTasksCount}
                        </p>
                    </aside>
                </section>
                <section className="admin-detail-card space-y-3">
                    <h2 className="text-lg font-semibold">Work details</h2>
                    <p>
                        <strong>Work mode:</strong> {task.workMode}
                    </p>
                    <p>
                        <strong>Estimated duration:</strong>{' '}
                        {task.estimatedDurationLabel ?? 'Not provided'}
                    </p>
                    {task.workplaceName && (
                        <p>
                            <strong>Workplace:</strong> {task.workplaceName}
                        </p>
                    )}
                    {task.workplaceAddress && (
                        <p>
                            <strong>Location details:</strong>{' '}
                            {task.workplaceAddress}
                        </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                        This is a stated place of work. TaskMate does not track
                        locations or collect coordinates.
                    </p>
                </section>
                <section className="admin-detail-card space-y-3">
                    <h2 className="text-lg font-semibold">
                        Off-platform content flags
                    </h2>
                    {flags.length ? (
                        flags.map((flag) => (
                            <article
                                key={flag.id}
                                className="border-t pt-3 text-sm"
                            >
                                <p className="font-medium">
                                    {flag.category} ·{' '}
                                    {flag.status.replaceAll('_', ' ')}
                                </p>
                                <p>Field: {flag.field.replaceAll('_', ' ')}</p>
                                {flag.matched.length > 0 && (
                                    <p>
                                        Matched indicators:{' '}
                                        {flag.matched.join(', ')}
                                    </p>
                                )}
                                {flag.createdAt && (
                                    <p className="text-muted-foreground">
                                        Flagged {formatDateTime(flag.createdAt)}
                                    </p>
                                )}
                            </article>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            No off-platform content flags have been recorded.
                        </p>
                    )}
                </section>
                {agreement && (
                    <section className="admin-detail-card space-y-2">
                        <h2 className="text-lg font-semibold">Agreement</h2>
                        <p>Status: {agreement.status.replaceAll('_', ' ')}</p>
                        {agreement.locked_at && (
                            <p>Locked {formatDateTime(agreement.locked_at)}</p>
                        )}
                        <Link
                            className="text-sm underline"
                            href={admin.agreements.show(agreement.id)}
                        >
                            View agreement versions and confirmations
                        </Link>
                        {task.status === 'in_progress' &&
                            agreement.locked_at && (
                                <Form
                                    action={`/admin/tasks/${task.id}/close`}
                                    method="post"
                                    className="mt-4 space-y-2 border-t pt-4"
                                >
                                    {({ processing }) => (
                                        <>
                                            <label className="block text-sm">
                                                Close task as cancelled by
                                                administrator
                                                <textarea
                                                    name="note"
                                                    required
                                                    minLength={5}
                                                    maxLength={3000}
                                                    className="mt-1 min-h-24 w-full rounded border bg-background p-3"
                                                    placeholder="Required reason. Agreement records will remain unchanged."
                                                />
                                            </label>
                                            <Button
                                                type="submit"
                                                disabled={processing}
                                            >
                                                Close task
                                            </Button>
                                        </>
                                    )}
                                </Form>
                            )}
                    </section>
                )}
                {agreement && completionPayment && (
                    <CompletionPaymentPanel
                        agreementId={agreement.id}
                        data={completionPayment}
                        readOnly
                    />
                )}
                <section className="admin-detail-card space-y-3">
                    <h2 className="text-lg font-semibold">Applications</h2>
                    {applications.length ? (
                        applications.map((application) => (
                            <div
                                key={application.id}
                                className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-sm"
                            >
                                <Link
                                    className="underline underline-offset-4"
                                    href={adminUsers.show(application.userId)}
                                >
                                    {application.applicantName}
                                </Link>
                                <span>{application.status}</span>
                                <span>
                                    {application.appliedAt
                                        ? formatDateTime(application.appliedAt)
                                        : '—'}
                                </span>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            No applications have been submitted.
                        </p>
                    )}
                </section>
                <section className="admin-detail-card space-y-3">
                    <h2 className="text-lg font-semibold">
                        Admin action history
                    </h2>
                    {adminActions.length ? (
                        adminActions.map((action) => (
                            <div
                                key={action.id}
                                className="border-t pt-3 text-sm"
                            >
                                <p className="font-medium">
                                    {action.action.replaceAll('_', ' ')} ·{' '}
                                    {action.adminName ?? 'Administrator'} ·{' '}
                                    {action.createdAt
                                        ? formatDateTime(action.createdAt)
                                        : ''}
                                </p>
                                {action.note && (
                                    <p className="mt-1 whitespace-pre-wrap">
                                        {action.note}
                                    </p>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            No admin decisions have been recorded for this task.
                        </p>
                    )}
                </section>
                {canReview ? (
                    <section className="admin-detail-card space-y-4">
                        <h2 className="text-lg font-semibold">
                            Review decision
                        </h2>
                        <div className="grid gap-3 md:grid-cols-3">
                            <DecisionForm
                                taskId={task.id}
                                decision="approve"
                                label="Approve task"
                            />
                            <DecisionForm
                                taskId={task.id}
                                decision="reject"
                                label="Reject task"
                            />
                            <DecisionForm
                                taskId={task.id}
                                decision="request_changes"
                                label="Request changes"
                            />
                        </div>
                    </section>
                ) : task.status === 'pending_review' ? (
                    <p className="rounded-lg border p-4 text-sm">
                        You cannot review a task you posted yourself.
                    </p>
                ) : null}
            </div>
        </>
    );
}

AdminTaskReview.layout = (page: React.ReactNode) => (
    <AdminLayout>{page}</AdminLayout>
);
