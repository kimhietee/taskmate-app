import { Form, Head, Link } from '@inertiajs/react';
import {
    Banknote,
    BriefcaseBusiness,
    CalendarDays,
    ClipboardList,
    Info,
    ShieldAlert,
    TriangleAlert,
    UsersRound,
} from 'lucide-react';
import { useState } from 'react';
import { ApplicationStatusBadge } from '@/components/application-status-badge';
import { PaymentStatusBadge } from '@/components/payment-status-badge';
import { ProblemReportForm } from '@/components/problem-report-form';
import { RatingSummary } from '@/components/rating-summary';
import { TaskStatusBadge } from '@/components/task-status-badge';
import { ToBeDiscussedBadge } from '@/components/terms-status-badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { VerificationStatusBadge } from '@/components/verification-status-badge';
import { PAYMENT_BOUNDARY_NOTICE } from '@/constants/notices';
import AppLayout from '@/layouts/app-layout';
import { formatAmount, formatDate, formatHoursFlexibility } from '@/lib/format';
import agreements from '@/routes/agreements';
import { cancel, edit, mine } from '@/routes/tasks';
import taskApplications from '@/routes/tasks/applications';

type Applicant = {
    id: number;
    applicant: {
        id: number;
        name: string;
        type: string;
        affiliation: string | null;
        verificationStatus: 'pending' | 'verified' | 'rejected' | 'more_info_requested';
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
    workTypeLabel?: string;
    budget: string | null;
    budgetToBeDiscussed?: boolean;
    payTimingLabel?: string;
    payTimingToBeDiscussed?: boolean;
    payTimingNote?: string | null;
    scheduleSummary?: string | null;
    scheduleNote?: string | null;
    scheduleFlexible?: boolean;
    scheduleToBeDiscussed?: boolean;
    canHoursChange?: boolean | null;
    workMode: string;
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

    const canEditNow = canEdit && !task.hasActiveApplications && task.status !== 'assigned';
    const hasPendingDecisions =
        canRespondApplications &&
        task.status === 'approved' &&
        applicants.some((app) => app.status === 'pending');

    // Enforce single primary CTA rule across the rail and applicant actions
    const promoteProposeAgreement = canProposeAgreement;
    const promoteViewAgreement = !promoteProposeAgreement && Boolean(agreement);
    const promoteEditTask = !promoteProposeAgreement && !promoteViewAgreement && !hasPendingDecisions && canEditNow;
    const brandCardClass =
        'overflow-hidden rounded-2xl border-[#D8E5D9] bg-white text-[#183324] shadow-sm dark:border-[#32473A] dark:bg-[#17251C] dark:text-[#EDF4EC]';
    const detailTileClass =
        'rounded-xl border border-[#E5ECE5] bg-[#F5F8F2] p-3.5 dark:border-[#2D4235] dark:bg-[#101B15]';

    return (
        <>
            <Head title={task.title} />
            <div className="page space-y-6 text-[#183324] dark:text-[#EDF4EC]">
                {status && (
                    <div
                        role="status"
                        className="rounded-lg border border-info-border bg-info-bg px-4 py-3 text-sm text-info-fg"
                    >
                        {status}
                    </div>
                )}

                <div className="relative overflow-hidden rounded-2xl border border-[#D8E5D9] bg-gradient-to-br from-white via-[#F5F8F2] to-[#FEF3C7]/50 p-5 shadow-sm dark:border-[#32473A] dark:from-[#17251C] dark:via-[#17251C] dark:to-[#20382B] sm:p-6">
                    <div
                        aria-hidden="true"
                        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#065F46] via-[#0C7A55] to-[#FCD34D]"
                    />
                    <Link
                        href={mine()}
                        className="focus-ring inline-flex items-center gap-1 rounded-sm text-sm font-semibold text-[#065F46] underline-offset-4 hover:underline dark:text-[#FCD34D]"
                    >
                        ← Back to My tasks
                    </Link>
                    <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#065F46] text-[#FCD34D] shadow-sm dark:bg-[#064E3B]">
                                <BriefcaseBusiness aria-hidden="true" className="size-5" />
                            </span>
                            <div className="min-w-0">
                                <p className="text-xs font-semibold tracking-[0.08em] text-[#065F46] uppercase dark:text-[#FCD34D]">
                                    {task.category}
                                    {task.workTypeLabel ? ` · ${task.workTypeLabel}` : ''}
                                </p>
                                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#183324] md:text-3xl dark:text-[#EDF4EC]">
                                    {task.title}
                                </h1>
                            </div>
                        </div>
                        <TaskStatusBadge status={task.status} label={statusLabel} />
                    </div>
                </div>

                {task.removalReason && (
                    <Alert variant="destructive">
                        <ShieldAlert aria-hidden="true" />
                        <AlertTitle>Removed by administrator</AlertTitle>
                        <AlertDescription className="whitespace-pre-wrap">
                            This post was removed by an administrator. Reason: {task.removalReason}
                        </AlertDescription>
                    </Alert>
                )}

                {task.reviewNote && (
                    <Alert variant="warning">
                        <TriangleAlert aria-hidden="true" />
                        <AlertTitle>Review note</AlertTitle>
                        <AlertDescription className="whitespace-pre-wrap">{task.reviewNote}</AlertDescription>
                    </Alert>
                )}

                {problemReport?.offPlatformWarning && (
                    <Alert variant="warning">
                        <TriangleAlert aria-hidden="true" />
                        <AlertTitle>Keep communications and agreements on TaskMate</AlertTitle>
                        <AlertDescription>
                            This message contains a request to move outside TaskMate or skip its steps. Be careful, keep
                            agreements and communications on record, and report anything that makes you uncomfortable.
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
                    {/* Left column: Task details, Schedule & Workplace, Compensation, Applicants */}
                    <div className="space-y-6">
                        <Card className={brandCardClass}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-[#183324] dark:text-[#EDF4EC]">
                                    <ClipboardList aria-hidden="true" className="size-5 text-[#065F46] dark:text-[#FCD34D]" />
                                    Task details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground">
                                    {task.description}
                                </p>
                                {task.requiredActivities && (
                                    <div className="border-t border-border pt-3">
                                        <h3 className="font-semibold text-foreground">Main activities</h3>
                                        <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                                            {task.requiredActivities}
                                        </p>
                                    </div>
                                )}
                                {task.deliverables && (
                                    <div className="border-t border-border pt-3">
                                        <h3 className="font-semibold text-foreground">
                                            Expected result or deliverables
                                        </h3>
                                        <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                                            {task.deliverables}
                                        </p>
                                    </div>
                                )}
                                {(task.estimatedDurationHours || task.skillRequirements) && (
                                    <div className="grid gap-3 border-t border-border pt-3 sm:grid-cols-2">
                                        {task.estimatedDurationHours && (
                                            <p className="tabular-nums text-foreground">
                                                <span className="text-muted-foreground">Estimated duration:</span>{' '}
                                                {task.estimatedDurationHours} hours
                                            </p>
                                        )}
                                        {task.skillRequirements && (
                                            <p className="text-foreground">
                                                <span className="text-muted-foreground">Skills:</span>{' '}
                                                {task.skillRequirements}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className={brandCardClass}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-[#183324] dark:text-[#EDF4EC]">
                                    <CalendarDays aria-hidden="true" className="size-5 text-[#065F46] dark:text-[#FCD34D]" />
                                    Schedule and work setup
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <dl className="grid gap-4 sm:grid-cols-2">
                                    <div className={detailTileClass}>
                                        <dt className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                                            Work hours
                                        </dt>
                                        <dd className="mt-1 tabular-nums text-foreground">
                                            {task.scheduleToBeDiscussed || !task.scheduleSummary ? (
                                                <ToBeDiscussedBadge />
                                            ) : (
                                                <span className="font-semibold">{task.scheduleSummary}</span>
                                            )}
                                        </dd>
                                    </div>
                                    <div className={detailTileClass}>
                                        <dt className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                                            Can hours change
                                        </dt>
                                        <dd className="mt-1 font-semibold text-foreground">
                                            {formatHoursFlexibility(task.canHoursChange)}
                                        </dd>
                                    </div>
                                    <div className={detailTileClass}>
                                        <dt className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                                            Work mode
                                        </dt>
                                        <dd className="mt-1 font-semibold text-foreground">{task.workMode}</dd>
                                    </div>
                                    <div className={detailTileClass}>
                                        <dt className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                                            Deadline
                                        </dt>
                                        <dd className="mt-1 font-semibold tabular-nums text-foreground">
                                            {task.deadline ? formatDate(task.deadline) : 'No deadline listed'}
                                        </dd>
                                    </div>
                                </dl>

                                {task.scheduleNote && (
                                    <p className="text-sm text-muted-foreground">
                                        <strong className="text-foreground">Schedule note:</strong> {task.scheduleNote}
                                    </p>
                                )}

                                {(task.workplaceName || task.workplaceAddress) && (
                                    <div className="rounded-xl border border-[#D8E5D9] bg-[#F5F8F2] p-3.5 dark:border-[#32473A] dark:bg-[#101B15]">
                                        <p className="text-sm text-foreground">
                                            <strong>Workplace:</strong>{' '}
                                            {[task.workplaceName, task.workplaceAddress].filter(Boolean).join(' · ')}
                                        </p>
                                    </div>
                                )}

                                <p className="text-xs text-muted-foreground">
                                    In-person work details are shown to students before they apply. Workplace
                                    information should describe a place of work, not a home address.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className={brandCardClass}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-[#183324] dark:text-[#EDF4EC]">
                                    <Banknote aria-hidden="true" className="size-5 text-[#065F46] dark:text-[#FCD34D]" />
                                    Compensation
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 rounded-xl border border-[#D8E5D9] bg-[#F5F8F2] p-4 sm:grid-cols-2 dark:border-[#32473A] dark:bg-[#101B15]">
                                    <div>
                                        <p className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                                            Pay amount
                                        </p>
                                        <div className="mt-1">
                                            {task.budgetToBeDiscussed || task.budget === null ? (
                                                <ToBeDiscussedBadge />
                                            ) : (
                                                <p className="text-xl font-semibold tabular-nums text-foreground">
                                                    ₱{formatAmount(task.budget)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                                            When paid (pay timing)
                                        </p>
                                        <div className="mt-1">
                                            {task.payTimingToBeDiscussed ? (
                                                <ToBeDiscussedBadge />
                                            ) : (
                                                <p className="text-base font-semibold text-foreground">
                                                    {task.payTimingLabel ?? 'To be discussed'}
                                                </p>
                                            )}
                                        </div>
                                        {task.payTimingNote && (
                                            <p className="mt-1 text-xs text-muted-foreground">{task.payTimingNote}</p>
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">{PAYMENT_BOUNDARY_NOTICE}</p>
                            </CardContent>
                        </Card>

                        {/* Applicants section — always visible */}
                        <Card className={brandCardClass}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-[#183324] dark:text-[#EDF4EC]">
                                    <UsersRound aria-hidden="true" className="size-5 text-[#065F46] dark:text-[#FCD34D]" />
                                    Applicants ({applicants.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {applicants.length === 0 ? (
                                    <p className="rounded-lg border border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                                        {['approved', 'assigned', 'in_progress', 'completed'].includes(task.status)
                                            ? 'No applicants yet.'
                                            : 'Applicants will appear here once this task is approved.'}
                                    </p>
                                ) : (
                                    <div className="space-y-4">
                                        {applicants.map((application) => {
                                            const reportAction = problemReport?.applicantActions.find(
                                                (item) => item.applicationId === application.id,
                                            )?.action;

                                            return (
                                                <article
                                                    key={application.id}
                                                    className="space-y-3 rounded-xl border border-[#D8E5D9] bg-[#F5F8F2]/70 p-4 dark:border-[#32473A] dark:bg-[#101B15]/70"
                                                >
                                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                                        <div className="space-y-1">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <h3 className="text-base font-semibold text-foreground">
                                                                    <Link
                                                                        className="focus-ring rounded-sm text-brand underline-offset-4 hover:underline"
                                                                        href={application.applicant.profileUrl}
                                                                    >
                                                                        {application.applicant.name}
                                                                    </Link>
                                                                </h3>
                                                                <VerificationStatusBadge
                                                                    status={application.applicant.verificationStatus}
                                                                />
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">
                                                                {application.applicant.type}
                                                                {application.applicant.affiliation
                                                                    ? ` · ${application.applicant.affiliation}`
                                                                    : ''}
                                                            </p>
                                                        </div>
                                                        <ApplicationStatusBadge
                                                            status={application.status}
                                                            label={application.statusLabel}
                                                        />
                                                    </div>

                                                    <RatingSummary summary={application.applicant.ratingSummary} />

                                                    <div className="rounded-lg border border-border bg-card p-3.5 text-sm">
                                                        <p className="whitespace-pre-wrap text-foreground">
                                                            {application.message}
                                                        </p>
                                                        <p className="mt-2 border-t border-border pt-2 text-xs tabular-nums text-muted-foreground">
                                                            Suggested amount:{' '}
                                                            <strong className="text-foreground">
                                                                {application.proposedAmount
                                                                    ? `₱${formatAmount(application.proposedAmount)}`
                                                                    : 'No suggestion'}
                                                            </strong>{' '}
                                                            · Applied{' '}
                                                            {application.appliedAt
                                                                ? formatDate(application.appliedAt)
                                                                : '—'}
                                                        </p>
                                                    </div>

                                                    {problemReport?.flaggedApplicants.includes(application.id) && (
                                                        <Alert variant="warning">
                                                            <TriangleAlert aria-hidden="true" />
                                                            <AlertTitle>Off-platform request detected</AlertTitle>
                                                            <AlertDescription>
                                                                This message contains a request to move outside TaskMate
                                                                or skip its steps. Be careful, keep agreements and
                                                                communications on record, and report anything that makes
                                                                you uncomfortable.
                                                            </AlertDescription>
                                                        </Alert>
                                                    )}

                                                    <div className="flex flex-wrap items-center gap-2">
                                                        {canRespondApplications &&
                                                            application.status === 'pending' &&
                                                            task.status === 'approved' && (
                                                                <>
                                                                    <Form
                                                                        {...taskApplications.accept.form({
                                                                            task: task.id,
                                                                            application: application.id,
                                                                        })}
                                                                    >
                                                                        {({ processing }) => (
                                                                            <Button
                                                                                size="sm"
                                                                                type="submit"
                                                                                disabled={processing}
                                                                            >
                                                                                {processing && <Spinner />}
                                                                                Accept
                                                                            </Button>
                                                                        )}
                                                                    </Form>
                                                                    <Form
                                                                        {...taskApplications.decline.form({
                                                                            task: task.id,
                                                                            application: application.id,
                                                                        })}
                                                                    >
                                                                        {({ processing }) => (
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                type="submit"
                                                                                disabled={processing}
                                                                            >
                                                                                {processing && <Spinner />}
                                                                                Decline
                                                                            </Button>
                                                                        )}
                                                                    </Form>
                                                                </>
                                                            )}

                                                        {application.conversationId && (
                                                            <Button size="sm" variant="outline" asChild>
                                                                <Link href={`/messages/${application.conversationId}`}>
                                                                    {application.messageBlockedReason
                                                                        ? 'View conversation'
                                                                        : 'Message applicant'}
                                                                </Link>
                                                            </Button>
                                                        )}
                                                    </div>

                                                    {application.messageBlockedReason && (
                                                        <p className="text-xs text-muted-foreground">
                                                            {application.messageBlockedReason}
                                                        </p>
                                                    )}

                                                    {reportAction && problemReport && (
                                                        <ProblemReportForm
                                                            action={reportAction}
                                                            types={problemReport.types}
                                                            reportLabel="Report this applicant"
                                                        />
                                                    )}
                                                </article>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {problemReport?.taskAction && (
                            <ProblemReportForm action={problemReport.taskAction} types={problemReport.types} />
                        )}
                    </div>

                    {/* Right sticky rail: Status & Next Action card, Agreement card, Owner actions */}
                    <aside className="space-y-4 lg:sticky lg:top-[calc(var(--banner-h,0px)+5rem)]">
                        {agreement && (
                            <Card className={brandCardClass}>
                                <CardHeader>
                                    <CardTitle>Agreement</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <p className="text-muted-foreground">
                                        Status: <strong className="text-foreground">{agreement.statusLabel}</strong>
                                    </p>
                                    <div>
                                        <PaymentStatusBadge
                                            status={agreement.paymentStatus}
                                            label={agreement.paymentStatusLabel}
                                        />
                                    </div>
                                    <Button
                                        variant={promoteViewAgreement ? 'default' : 'outline'}
                                        className={`min-h-11 w-full ${promoteViewAgreement ? 'bg-[#065F46] text-white hover:bg-[#064E3B] dark:bg-[#FCD34D] dark:text-[#183324] dark:hover:bg-[#FDE68A]' : 'border-[#D8E5D9] bg-transparent text-[#065F46] hover:bg-[#F5F8F2] dark:border-[#536B5A] dark:text-[#EDF4EC] dark:hover:bg-[#20382B]'}`}
                                        asChild
                                    >
                                        <Link href={agreements.show(agreement.id)}>View agreement</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        <Card className={brandCardClass}>
                            <CardHeader>
                                <CardTitle>Task management</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-muted-foreground">Current status</span>
                                    <TaskStatusBadge status={task.status} label={statusLabel} />
                                </div>

                                {task.createdAt && (
                                    <p className="text-xs tabular-nums text-muted-foreground">
                                        Posted {formatDate(task.createdAt)} · {task.applicantsCount} applicants
                                    </p>
                                )}

                                {task.hasActiveApplications && task.status !== 'assigned' && (
                                    <Alert variant="warning">
                                        <TriangleAlert aria-hidden="true" />
                                        <AlertDescription>
                                            This task has active applicants. Cancel it and post a new task to change its
                                            details.
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {task.status === 'assigned' && (
                                    <Alert variant="info">
                                        <Info aria-hidden="true" />
                                        <AlertDescription>
                                            This task has been assigned and cannot be edited.
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <div className="flex flex-col gap-2 pt-1">
                                    {canProposeAgreement && (
                                        <Button
                                            variant={promoteProposeAgreement ? 'default' : 'outline'}
                                            className={`min-h-11 w-full ${promoteProposeAgreement ? 'bg-[#065F46] text-white hover:bg-[#064E3B] dark:bg-[#FCD34D] dark:text-[#183324] dark:hover:bg-[#FDE68A]' : 'border-[#D8E5D9] bg-transparent text-[#065F46] hover:bg-[#F5F8F2] dark:border-[#536B5A] dark:text-[#EDF4EC] dark:hover:bg-[#20382B]'}`}
                                            asChild
                                        >
                                            <Link href={agreements.create(task.id)}>Propose agreement</Link>
                                        </Button>
                                    )}

                                    {canEditNow && (
                                        <Button
                                            variant={promoteEditTask ? 'default' : 'outline'}
                                            className={`min-h-11 w-full ${promoteEditTask ? 'bg-[#065F46] text-white hover:bg-[#064E3B] dark:bg-[#FCD34D] dark:text-[#183324] dark:hover:bg-[#FDE68A]' : 'border-[#D8E5D9] bg-transparent text-[#065F46] hover:bg-[#F5F8F2] dark:border-[#536B5A] dark:text-[#EDF4EC] dark:hover:bg-[#20382B]'}`}
                                            asChild
                                        >
                                            <Link href={edit(task.id)}>Edit task</Link>
                                        </Button>
                                    )}

                                    <Button variant="outline" className="min-h-11 w-full" asChild>
                                        <Link href={mine()}>My tasks</Link>
                                    </Button>

                                    {canCancel && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            className="w-full text-destructive-foreground hover:bg-danger-bg hover:text-danger-fg"
                                            onClick={() => setCancelDialogOpen(true)}
                                        >
                                            Cancel task
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </aside>
                </div>

                <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Cancel this task?</DialogTitle>
                            <DialogDescription>
                                “{task.title}” will be closed to new applications and removed from Browse Tasks.
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...cancel.form(task.id)} onSuccess={() => setCancelDialogOpen(false)}>
                            {({ processing }) => (
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button type="button" variant="outline" disabled={processing}>
                                            Keep task
                                        </Button>
                                    </DialogClose>
                                    <Button type="submit" variant="destructive" disabled={processing}>
                                        {processing && <Spinner />}
                                        Cancel task
                                    </Button>
                                </DialogFooter>
                            )}
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

ShowTask.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'My tasks', href: '/my-tasks' },
            { title: 'Task details', href: '#' },
        ]}
    >
        {page}
    </AppLayout>
);
