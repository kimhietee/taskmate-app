import { formatDate, formatAmount, formatHoursFlexibility } from '@/lib/format';
import { PAYMENT_BOUNDARY_NOTICE } from '@/constants/notices';
import { Form, Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { TaskStatusBadge } from '@/components/task-status-badge';
import { ApplicationStatusBadge } from '@/components/application-status-badge';
import { VerificationStatusBadge } from '@/components/verification-status-badge';
import { PaymentStatusBadge } from '@/components/payment-status-badge';
import { ToBeDiscussedBadge } from '@/components/terms-status-badge';
import taskApplications from '@/routes/tasks/applications';
import agreements from '@/routes/agreements';
import { edit, mine, cancel } from '@/routes/tasks';
import { RatingSummary } from '@/components/rating-summary';
import { ProblemReportForm } from '@/components/problem-report-form';

type Applicant = {
    id: number;
    applicant: { id: number; name: string; type: string; affiliation: string | null; verificationStatus: 'pending' | 'verified' | 'rejected' | 'more_info_requested'; profileUrl: string; ratingSummary: import('@/components/rating-summary').RatingSummaryData };
    message: string; proposedAmount: string | null; status: string; statusLabel: string; appliedAt: string | null; conversationId: number | null; messageBlockedReason: string | null;
};
type Task = {
    id: number; title: string; category: string; budget: string | null; budgetToBeDiscussed?: boolean;
    payTimingLabel?: string; payTimingToBeDiscussed?: boolean; payTimingNote?: string | null;
    scheduleSummary?: string | null; scheduleNote?: string | null; scheduleToBeDiscussed?: boolean; canHoursChange?: boolean | null;
    workMode: string; status: string; description: string;
    requiredActivities: string | null; deliverables: string | null; estimatedDurationHours: string | null; skillRequirements: string | null;
    workplaceName: string | null; workplaceAddress: string | null;
    deadline: string | null; reviewNote: string | null; removalReason?: string | null; createdAt: string | null;
    hasActiveApplications: boolean; applicantsCount: number;
};
type Props = { task: Task; statusLabel: string; canEdit: boolean; canCancel: boolean; canRespondApplications: boolean; status?: string | null; applicants: Applicant[]; agreement: { id: number; status: string; statusLabel: string; paymentStatus: string; paymentStatusLabel: string } | null; canProposeAgreement: boolean; problemReport?: { taskAction: string | null; types: { value: string; label: string }[]; applicantActions: { applicationId: number; action: string }[]; flaggedApplicants: number[]; offPlatformWarning: boolean } };

export default function ShowTask({ task, statusLabel, canEdit, canCancel, canRespondApplications, status, applicants, agreement, canProposeAgreement, problemReport }: Props) {
    return (
        <>
            <Head title={task.title} />
            <div className="mx-auto max-w-4xl space-y-5 p-4 sm:p-6">
                {status && <div role="status" className="rounded-lg border px-4 py-3 text-sm">{status}</div>}
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><p className="text-sm text-muted-foreground">{task.category}</p><h1 className="mt-1 text-2xl font-semibold">{task.title}</h1></div>
                    <TaskStatusBadge status={task.status} label={statusLabel} />
                </div>
                <section className="space-y-4 rounded-xl border p-5">
                    <h2 className="text-lg font-semibold">Task details</h2>
                    <p className="whitespace-pre-wrap">{task.description}</p>
                    {task.requiredActivities && <div><h3 className="font-medium">Main activities</h3><p className="mt-1 whitespace-pre-wrap text-sm">{task.requiredActivities}</p></div>}
                    {task.deliverables && <div><h3 className="font-medium">Expected result or deliverables</h3><p className="mt-1 whitespace-pre-wrap text-sm">{task.deliverables}</p></div>}
                    {task.estimatedDurationHours && <p className="text-sm">Estimated duration: {task.estimatedDurationHours} hours</p>}
                    {task.skillRequirements && <p className="text-sm">Skills: {task.skillRequirements}</p>}
                </section>
                <section className="space-y-2 rounded-xl border p-5">
                    <h2 className="text-lg font-semibold">Schedule and work setup</h2>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">Work hours:</span>
                        {task.scheduleToBeDiscussed || !task.scheduleSummary ? <ToBeDiscussedBadge /> : <span>{task.scheduleSummary}</span>}
                    </div>
                    <p className="text-sm">Can hours change: {formatHoursFlexibility(task.canHoursChange)}</p>
                    {task.scheduleNote && <p className="text-sm text-muted-foreground">Schedule note: {task.scheduleNote}</p>}
                    <p className="text-sm">Work mode: {task.workMode}</p>
                    {(task.workplaceName || task.workplaceAddress) && <p className="text-sm">Workplace: {[task.workplaceName, task.workplaceAddress].filter(Boolean).join(' · ')}</p>}
                    <p className="text-sm text-muted-foreground">In-person work details are shown to students before they apply. Workplace information should describe a place of work, not a home address.</p>
                    {task.deadline && <p className="text-sm">Deadline: {formatDate(task.deadline)}</p>}
                </section>
                <section className="space-y-3 rounded-xl border p-5">
                    <h2 className="text-lg font-semibold">Compensation</h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <p className="text-xs text-muted-foreground">Pay amount</p>
                            <div className="mt-1">{task.budgetToBeDiscussed || task.budget === null ? <ToBeDiscussedBadge /> : <p className="font-semibold">₱{formatAmount(task.budget)}</p>}</div>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">When paid (pay timing)</p>
                            <div className="mt-1">{task.payTimingToBeDiscussed ? <ToBeDiscussedBadge /> : <p className="font-semibold">{task.payTimingLabel ?? 'To be discussed'}</p>}</div>
                            {task.payTimingNote && <p className="mt-1 text-xs text-muted-foreground">{task.payTimingNote}</p>}
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{PAYMENT_BOUNDARY_NOTICE}</p>
                </section>
                {task.reviewNote && <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">Review note: {task.reviewNote}</div>}
                {task.removalReason && <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-950">This post was removed by an administrator. Reason: {task.removalReason}</div>}
                {agreement && <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-5"><div><h2 className="font-semibold">Agreement</h2><p className="text-sm">Status: {agreement.statusLabel}</p><div className="mt-2"><PaymentStatusBadge status={agreement.paymentStatus} label={agreement.paymentStatusLabel} /></div></div><Button asChild><Link href={agreements.show(agreement.id)}>View agreement</Link></Button></section>}
                {canProposeAgreement && <Button asChild><Link href={agreements.create(task.id)}>Propose agreement</Link></Button>}
                {applicants.length > 0 && <section className="space-y-4 rounded-xl border p-5">
                    <h2 className="text-lg font-semibold">Applicants ({applicants.length})</h2>
                    {applicants.map((application) => <article key={application.id} className="space-y-3 border-t pt-4">
                        <div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-medium"><Link className="underline" href={application.applicant.profileUrl}>{application.applicant.name}</Link></h3><p className="text-sm text-muted-foreground">{application.applicant.type}{application.applicant.affiliation ? ` · ${application.applicant.affiliation}` : ''}</p><RatingSummary summary={application.applicant.ratingSummary} /></div><VerificationStatusBadge status={application.applicant.verificationStatus} /></div>
                        <p className="whitespace-pre-wrap text-sm">{application.message}</p>
                        {problemReport?.flaggedApplicants.includes(application.id) && <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">This message contains a request to move outside TaskMate or skip its steps. Be careful, keep agreements and communications on record, and report anything that makes you uncomfortable.</div>}
                        {problemReport?.applicantActions.find((item) => item.applicationId === application.id) && <ProblemReportForm action={problemReport.applicantActions.find((item) => item.applicationId === application.id)!.action} types={problemReport.types} reportLabel="Report this applicant" />}
                        <p className="text-sm">Suggested amount: {application.proposedAmount ? `₱${formatAmount(application.proposedAmount)}` : 'No suggestion'} · Applied {application.appliedAt ? formatDate(application.appliedAt) : '—'}</p>
                        <div className="flex flex-wrap items-center gap-2"><ApplicationStatusBadge status={application.status} label={application.statusLabel} />{application.conversationId && <Button size="sm" variant="outline" asChild><Link href={`/messages/${application.conversationId}`}>{application.messageBlockedReason ? 'View conversation' : 'Message applicant'}</Link></Button>}{canRespondApplications && application.status === 'pending' && task.status === 'approved' && <><Form {...taskApplications.accept.form({ task: task.id, application: application.id })}><Button size="sm" type="submit">Accept</Button></Form><Form {...taskApplications.decline.form({ task: task.id, application: application.id })}><Button size="sm" variant="outline" type="submit">Decline</Button></Form></>}</div>{application.messageBlockedReason && <p className="text-xs text-muted-foreground">{application.messageBlockedReason}</p>}
                    </article>)}
                </section>}
                {problemReport?.taskAction && <ProblemReportForm action={problemReport.taskAction} types={problemReport.types} />}
                {problemReport?.offPlatformWarning && <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">This message contains a request to move outside TaskMate or skip its steps. Be careful, keep agreements and communications on record, and report anything that makes you uncomfortable.</div>}
                {task.hasActiveApplications && task.status !== 'assigned' && <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">This task has active applicants. Cancel it and post a new task to change its details.</p>}
                {task.status === 'assigned' && <p className="rounded-lg border p-4 text-sm">This task has been assigned and cannot be edited.</p>}
                <div className="flex flex-wrap gap-2"><Button variant="outline" asChild><Link href={mine()}>My tasks</Link></Button>{canEdit && !task.hasActiveApplications && task.status !== 'assigned' && <Button asChild><Link href={edit(task.id)}>Edit task</Link></Button>}{canCancel && <Form {...cancel.form(task.id)} onSubmit={(event) => { if (!window.confirm('Cancel this task?')) event.preventDefault(); }}><Button variant="outline" type="submit">Cancel task</Button></Form>}</div>
            </div>
        </>
    );
}
