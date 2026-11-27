import { formatAmount, formatDate, formatHoursFlexibility } from '@/lib/format';
import { PAYMENT_BOUNDARY_NOTICE } from '@/constants/notices';
import { Form, Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TaskStatusBadge } from '@/components/task-status-badge';
import { ApplicationStatusBadge } from '@/components/application-status-badge';
import { VerificationStatusBadge } from '@/components/verification-status-badge';
import { PaymentStatusBadge } from '@/components/payment-status-badge';
import taskApplications from '@/routes/tasks/applications';
import agreements from '@/routes/agreements';
import { edit, mine, cancel } from '@/routes/tasks';
import { RatingSummary } from '@/components/rating-summary';
import { ProblemReportForm } from '@/components/problem-report-form';
import { ToBeDiscussedBadge } from '@/components/terms-status-badge';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

type Applicant = {
    id: number;
    applicant: {
        id: number;
        name: string;
        type: string;
        affiliation: string | null;
        verificationStatus:
            | 'pending'
            | 'verified'
            | 'rejected'
            | 'more_info_requested';
        profileUrl: string;
        ratingSummary: import('@/components/rating-summary').RatingSummaryData;
    };
    message: string;
    proposedAmount: string | null;
    status: string;
    statusLabel: string;
    appliedAt: string | null;
    conversationId: number | null;
    messageBlockedReason: string | null;
};
type Task = {
    id: number;
    title: string;
    category: string;
    workTypeLabel: string;
    budget: string | null;
    budgetToBeDiscussed: boolean;
    payTimingLabel: string;
    payTimingToBeDiscussed: boolean;
    payTimingNote: string | null;
    scheduleSummary: string | null;
    scheduleNote: string | null;
    scheduleFlexible: boolean;
    scheduleToBeDiscussed: boolean;
    canHoursChange: boolean | null;
    workMode: string;
    workModeValue: string;
    status: string;
    description: string;
    requiredActivities: string | null;
    deliverables: string | null;
    estimatedDurationHours: string | null;
    skillRequirements: string | null;
    workplaceName: string | null;
    workplaceAddress: string | null;
    deadline: string | null;
    reviewNote: string | null;
    removalReason?: string | null;
    createdAt: string | null;
    hasActiveApplications: boolean;
    applicantsCount: number;
};
type Props = {
    task: Task;
    statusLabel: string;
    canEdit: boolean;
    canCancel: boolean;
    canRespondApplications: boolean;
    status?: string | null;
    applicants: Applicant[];
    agreement: {
        id: number;
        status: string;
        statusLabel: string;
        paymentStatus: string;
        paymentStatusLabel: string;
        needsRating?: boolean;
    } | null;
    canProposeAgreement: boolean;
    problemReport?: {
        taskAction: string | null;
        types: { value: string; label: string }[];
        applicantActions: { applicationId: number; action: string }[];
        flaggedApplicants: number[];
        offPlatformWarning: boolean;
    };
};

export default function ShowTask({
    task,
    statusLabel,
    canEdit,
    canCancel,
    canRespondApplications,
    status,
    applicants,
    agreement,
    canProposeAgreement,
    problemReport,
}: Props) {
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const canReviewApplicants = canRespondApplications && ['approved', 'assigned'].includes(task.status);

    return (
        <>
            <Head title={task.title} />
            <main className="task-detail-page">
                {status && (
                    <div
                        role="status"
                        className="rounded-lg border px-4 py-3 text-sm"
                    >
                        {status}
                    </div>
                )}
                <header className="task-detail-hero">
                    <div>
                        <p className="task-detail-category">
                            {task.category} · {task.workTypeLabel}
                        </p>
                        <h1>
                            {task.title}
                        </h1>
                        <p className="task-detail-meta">
                            {task.estimatedDurationHours ? `Estimated duration · ${task.estimatedDurationHours} hours` : 'Duration not provided'}
                        </p>
                        <p className="task-detail-meta">
                            Posted {task.createdAt ? formatDate(task.createdAt) : 'recently'} · {task.applicantsCount} applicants
                        </p>
                    </div>
                    <div className="task-detail-hero-side">
                        <TaskStatusBadge status={task.status} label={statusLabel} />
                        <p>{task.workMode}</p>
                    </div>
                </header>
                <section className="task-detail-section task-detail-description">
                    <h2>Task details</h2>
                    <p className="whitespace-pre-wrap">{task.description}</p>
                    {task.requiredActivities && (
                        <div>
                            <h3 className="font-medium">Main activities</h3>
                            <p className="mt-1 text-sm whitespace-pre-wrap">
                                {task.requiredActivities}
                            </p>
                        </div>
                    )}
                    {task.deliverables && (
                        <div>
                            <h3 className="font-medium">
                                Expected result or deliverables
                            </h3>
                            <p className="mt-1 text-sm whitespace-pre-wrap">
                                {task.deliverables}
                            </p>
                        </div>
                    )}
                    {task.skillRequirements && (
                        <p className="text-sm">
                            Skills: {task.skillRequirements}
                        </p>
                    )}
                </section>
                <section className="task-detail-section task-detail-work">
                    <h2>Work details</h2>
                    <div className="task-detail-facts">
                        <p><span>Work mode</span><strong>{task.workMode}</strong></p>
                        <p><span>Estimated duration</span><strong>{task.estimatedDurationHours ? `${task.estimatedDurationHours} hours` : 'Not provided'}</strong></p>
                        <p><span>Work schedule</span><strong>{task.scheduleToBeDiscussed || !task.scheduleSummary ? <ToBeDiscussedBadge /> : task.scheduleSummary}</strong></p>
                        <p><span>Can hours change?</span><strong>{formatHoursFlexibility(task.canHoursChange)}</strong></p>
                        <p><span>Deadline</span><strong>{task.deadline ? formatDate(task.deadline) : 'No deadline'}</strong></p>
                    </div>
                    {task.scheduleFlexible && <p className="text-sm">The schedule is flexible.</p>}
                    {task.scheduleNote && <p className="text-sm whitespace-pre-wrap"><strong>Schedule note:</strong> {task.scheduleNote}</p>}
                    {task.workplaceName && <p>{task.workplaceName}</p>}
                    {task.workplaceAddress && <p>{task.workplaceAddress}</p>}
                    <p className="text-sm text-muted-foreground">
                        In-person work details are shown to students before they
                        apply. Workplace information should describe a place of
                        work, not a home address.
                    </p>
                </section>
                <section className="task-detail-section task-detail-pay">
                    <h2>Compensation</h2>
                    <div className="task-detail-facts">
                        <p><span>Budget</span><strong>{task.budgetToBeDiscussed || task.budget === null ? <ToBeDiscussedBadge /> : `₱${formatAmount(task.budget)}`}</strong></p>
                        <p><span>Pay timing</span><strong>{task.payTimingToBeDiscussed ? <ToBeDiscussedBadge /> : task.payTimingLabel}</strong></p>
                    </div>
                    {task.payTimingNote && <p className="text-sm whitespace-pre-wrap"><strong>Payment note:</strong> {task.payTimingNote}</p>}
                    <p className="text-sm text-muted-foreground">
                        {PAYMENT_BOUNDARY_NOTICE}
                    </p>
                </section>
                {task.reviewNote && (
                    <div className="task-detail-review-note">
                        Review note: {task.reviewNote}
                    </div>
                )}
                {task.removalReason && (
                    <div className="task-detail-removal-note">
                        This post was removed by an administrator. Reason:{' '}
                        {task.removalReason}
                    </div>
                )}
                {agreement && (
                    <section className="task-detail-agreement">
                        <div>
                            <h2 className="font-semibold">Agreement</h2>
                            <p className="text-sm">
                                Status: {agreement.statusLabel}
                            </p>
                            <div className="mt-2">
                                <PaymentStatusBadge
                                    status={agreement.paymentStatus}
                                    label={agreement.paymentStatusLabel}
                                />
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {agreement.needsRating && (
                                <Button variant="outline" asChild>
                                    <Link href={agreements.rate(agreement.id)}>
                                        Rate your experience
                                    </Link>
                                </Button>
                            )}
                            <Button asChild>
                                <Link href={agreements.show(agreement.id)}>
                                    {agreement.status === 'draft'
                                        ? 'Review and send agreement'
                                        : 'View agreement'}
                                </Link>
                            </Button>
                        </div>
                    </section>
                )}
                {canProposeAgreement && (
                    <Button asChild>
                        <Link href={agreements.create(task.id)}>
                            Prepare agreement
                        </Link>
                    </Button>
                )}
                {(applicants.length > 0 || canReviewApplicants) && (
                    <section className="task-detail-section task-detail-applicants">
                        <h2>
                            Applicants ({applicants.length})
                        </h2>
                        {applicants.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                                {task.status === 'approved' ? 'No applications yet. Students who apply will appear here.' : 'Applications will appear here once the task is approved.'}
                            </p>
                        )}
                        {applicants.map((application) => (
                            <article
                                key={application.id}
                                className="task-applicant-card"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <h3 className="font-medium">
                                            <Link
                                                className="underline"
                                                href={
                                                    application.applicant
                                                        .profileUrl
                                                }
                                            >
                                                {application.applicant.name}
                                            </Link>
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {application.applicant.type}
                                            {application.applicant.affiliation
                                                ? ` · ${application.applicant.affiliation}`
                                                : ''}
                                        </p>
                                        <RatingSummary
                                            summary={
                                                application.applicant
                                                    .ratingSummary
                                            }
                                        />
                                    </div>
                                    <VerificationStatusBadge
                                        status={
                                            application.applicant
                                                .verificationStatus
                                        }
                                    />
                                </div>
                                <p className="text-sm whitespace-pre-wrap">
                                    {application.message}
                                </p>
                                {problemReport?.flaggedApplicants.includes(
                                    application.id,
                                ) && (
                                    <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-100">
                                        This message contains a request to move
                                        outside TaskMate or skip its steps. Be
                                        careful, keep agreements and
                                        communications on record, and report
                                        anything that makes you uncomfortable.
                                    </div>
                                )}
                                {problemReport?.applicantActions.find(
                                    (item) =>
                                        item.applicationId === application.id,
                                ) && (
                                    <ProblemReportForm
                                        action={
                                            problemReport.applicantActions.find(
                                                (item) =>
                                                    item.applicationId ===
                                                    application.id,
                                            )!.action
                                        }
                                        types={problemReport.types}
                                        reportLabel="Report this applicant"
                                    />
                                )}
                                <p className="text-sm">
                                    Suggested amount:{' '}
                                    {application.proposedAmount
                                        ? `₱${formatAmount(application.proposedAmount)}`
                                        : 'No suggestion'}{' '}
                                    · Applied{' '}
                                    {application.appliedAt
                                        ? formatDate(application.appliedAt)
                                        : '—'}
                                </p>
                                <div className="flex flex-wrap items-center gap-2">
                                    <ApplicationStatusBadge
                                        status={application.status}
                                        label={application.statusLabel}
                                    />
                                    {application.conversationId && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            asChild
                                        >
                                            <Link
                                                href={`/messages/${application.conversationId}`}
                                            >
                                                {application.messageBlockedReason
                                                    ? 'View conversation'
                                                    : 'Message applicant'}
                                            </Link>
                                        </Button>
                                    )}
                                    {canRespondApplications &&
                                        application.status === 'pending' &&
                                        task.status === 'approved' && (
                                            <>
                                                <Form
                                                    {...taskApplications.accept.form(
                                                        {
                                                            task: task.id,
                                                            application:
                                                                application.id,
                                                        },
                                                    )}
                                                >
                                                    <Button
                                                        size="sm"
                                                        type="submit"
                                                    >
                                                        Accept
                                                    </Button>
                                                </Form>
                                                <Form
                                                    {...taskApplications.decline.form(
                                                        {
                                                            task: task.id,
                                                            application:
                                                                application.id,
                                                        },
                                                    )}
                                                >
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        type="submit"
                                                    >
                                                        Decline
                                                    </Button>
                                                </Form>
                                            </>
                                        )}
                                </div>
                                {application.messageBlockedReason && (
                                    <p className="text-xs text-muted-foreground">
                                        {application.messageBlockedReason}
                                    </p>
                                )}
                            </article>
                        ))}
                    </section>
                )}
                {problemReport?.taskAction && (
                    <ProblemReportForm
                        action={problemReport.taskAction}
                        types={problemReport.types}
                    />
                )}
                {problemReport?.offPlatformWarning && (
                    <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-100">
                        This message contains a request to move outside TaskMate
                        or skip its steps. Be careful, keep agreements and
                        communications on record, and report anything that makes
                        you uncomfortable.
                    </div>
                )}
                {task.hasActiveApplications && task.status !== 'assigned' && (
                    <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-100">
                        This task has active applicants. Cancel it and post a
                        new task to change its details.
                    </p>
                )}
                {task.status === 'assigned' && (
                    <p className="rounded-lg border p-4 text-sm">
                        This task has been assigned and cannot be edited.
                    </p>
                )}
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" asChild>
                        <Link href={mine()}>My tasks</Link>
                    </Button>
                    {canEdit &&
                        !task.hasActiveApplications &&
                        task.status !== 'assigned' && (
                            <Button asChild>
                                <Link href={edit(task.id)}>Edit task</Link>
                            </Button>
                        )}
                    {canCancel && (
                        <Button variant="outline" type="button" onClick={() => setCancelDialogOpen(true)}>Cancel task</Button>
                    )}
                </div>
                <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Cancel this task?</DialogTitle>
                            <DialogDescription>This task will be closed to new applications and removed from Browse Tasks.</DialogDescription>
                        </DialogHeader>
                        <Form {...cancel.form(task.id)} onSuccess={() => setCancelDialogOpen(false)}>
                            <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="outline">Keep task</Button></DialogClose>
                                <Button type="submit" variant="destructive">Cancel task</Button>
                            </DialogFooter>
                        </Form>
                    </DialogContent>
                </Dialog>
            </main>
        </>
    );
}
