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
    id: number; title: string; category: string; categoryKey: string; workTypeLabel?: string; description: string; requiredActivities: string | null; deliverables: string | null;
    estimatedDurationHours: string | null; skillRequirements: string | null; complexity: string | null; budget: string | null;
    budgetToBeDiscussed?: boolean; payTimingLabel?: string; payTimingToBeDiscussed?: boolean; payTimingNote?: string | null;
    scheduleSummary?: string | null; scheduleNote?: string | null; scheduleToBeDiscussed?: boolean; canHoursChange?: boolean | null;
    workMode: string;
    workplaceName: string | null; workplaceAddress: string | null; deadline: string | null;
    status: string; statusLabel: string; reviewNote: string | null; submittedAt: string | null;
    poster: { id: number; name: string; type: string; verificationStatus: 'pending' | 'verified' | 'rejected' | 'more_info_requested'; otherTasksCount: number };
};
type Action = { id: number; action: string; adminName: string | null; note: string | null; createdAt: string | null };
type AdminApplication = { id: number; applicantName: string; status: string; appliedAt: string | null; userId: number };
type ContentFlag = { id: number; category: string; matched: string[]; field: string; status: string; createdAt: string | null };
type AgreementSummary = { id: number; status: string; locked_at: string | null };
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

function DecisionForm({ taskId, decision, label, noteRequired }: { taskId: number; decision: string; label: string; noteRequired: boolean }) {
    return <Form {...admin.tasks.decision.form(taskId)} className="space-y-2 rounded-lg border p-4">
        {({ errors, processing }) => <><input type="hidden" name="decision" value={decision} /><label className="block text-sm font-medium" htmlFor={`${decision}-note`}>Admin note {noteRequired ? '(required)' : '(optional)'}</label><Textarea id={`${decision}-note`} name="note" required={noteRequired} placeholder={decision === 'approve' ? 'Optional note for the poster.' : 'Explain the decision to the poster.'} /><InputError message={errors.note} /><Button type="submit" disabled={processing}>{label}</Button></>}
    </Form>;
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

    return <><Head title={`Review: ${task.title}`} /><div className="space-y-6">{status && <div role="status" className="rounded-lg border px-4 py-3 text-sm">{status}</div>}<div className="flex flex-wrap items-start justify-between gap-3"><div><Link href={admin.tasks.index()} className="text-sm underline underline-offset-4">Back to task queue</Link><h1 className="mt-2 text-2xl font-semibold">{task.title}</h1><p className="mt-1 text-sm text-muted-foreground">Submitted {task.submittedAt ? formatDateTime(task.submittedAt) : '—'}</p></div><TaskStatusBadge status={task.status} label={task.statusLabel} /></div><SafetyNotice /><p className="rounded-lg border p-4 text-sm">Every submitted task is reviewed by an administrator before it can be approved.</p>
        <section className="grid gap-4 lg:grid-cols-3"><div className="space-y-4 rounded-xl border p-5 lg:col-span-2"><h2 className="text-lg font-semibold">Task details</h2><p><strong>Category:</strong> {task.category}{task.workTypeLabel ? ` · ${task.workTypeLabel}` : ''}</p><p><strong>Description:</strong> <span className="whitespace-pre-wrap">{task.description || '—'}</span></p><p><strong>Main activities:</strong> <span className="whitespace-pre-wrap">{task.requiredActivities || 'Not provided'}</span></p><p><strong>Expected result or deliverables:</strong> <span className="whitespace-pre-wrap">{task.deliverables || 'Not provided'}</span></p><p><strong>Skills:</strong> <span className="whitespace-pre-wrap">{task.skillRequirements || 'Not provided'}</span></p><p><strong>Estimated duration:</strong> {task.estimatedDurationHours ? `${task.estimatedDurationHours} hours` : 'Not provided'}</p><p><strong>Complexity:</strong> {task.complexity ?? 'Not provided'}</p><div className="flex flex-wrap items-center gap-2"><strong>Pay amount:</strong> {task.budgetToBeDiscussed || task.budget === null ? <ToBeDiscussedBadge /> : <span>₱{formatAmount(task.budget)}</span>}</div><div className="flex flex-wrap items-center gap-2"><strong>Pay timing:</strong> {task.payTimingToBeDiscussed ? <ToBeDiscussedBadge /> : <span>{task.payTimingLabel ?? 'To be discussed'}</span>}{task.payTimingNote && <span className="text-sm text-muted-foreground">({task.payTimingNote})</span>}</div><div className="flex flex-wrap items-center gap-2"><strong>Work hours:</strong> {task.scheduleToBeDiscussed || !task.scheduleSummary ? <ToBeDiscussedBadge /> : <span>{task.scheduleSummary}</span>}</div><p><strong>Can hours change:</strong> {formatHoursFlexibility(task.canHoursChange)}</p>{task.scheduleNote && <p><strong>Schedule note:</strong> {task.scheduleNote}</p>}<p className="text-sm text-muted-foreground">{PAYMENT_BOUNDARY_NOTICE}</p>{task.reviewNote && <p className="rounded border p-3 text-sm">Current review note: {task.reviewNote}</p>}</div><aside className="space-y-3 rounded-xl border p-5"><h2 className="text-lg font-semibold">Poster</h2><p>{task.poster.name}</p><p>{task.poster.type}</p><VerificationStatusBadge status={task.poster.verificationStatus} /><p className="text-sm">Other tasks: {task.poster.otherTasksCount}</p></aside></section>
        <section className="space-y-3 rounded-xl border p-5"><h2 className="text-lg font-semibold">Workplace details</h2><p><strong>Work mode:</strong> {task.workMode}</p><p><strong>Workplace:</strong> {task.workplaceName ?? '—'}</p><p><strong>Workplace address:</strong> {task.workplaceAddress ?? '—'}</p><p className="text-sm text-muted-foreground">This is a stated place of work. TaskMate does not track locations or collect coordinates.</p></section>
        <section className="space-y-3 rounded-xl border p-5"><h2 className="text-lg font-semibold">Off-platform content flags</h2>{flags.length ? flags.map((flag) => <article key={flag.id} className="border-t pt-3 text-sm"><p className="font-medium">{flag.category} · {flag.status.replaceAll('_', ' ')}</p><p>Field: {flag.field.replaceAll('_', ' ')}</p>{flag.matched.length > 0 && <p>Matched indicators: {flag.matched.join(', ')}</p>}{flag.createdAt && <p className="text-muted-foreground">Flagged {formatDateTime(flag.createdAt)}</p>}</article>) : <p className="text-sm text-muted-foreground">No off-platform content flags have been recorded.</p>}</section>
        {agreement && <section className="space-y-2 rounded-xl border p-5"><h2 className="text-lg font-semibold">Agreement</h2><p>Status: {agreement.status.replaceAll('_', ' ')}</p>{agreement.locked_at && <p>Locked {formatDateTime(agreement.locked_at)}</p>}<Link className="text-sm underline" href={admin.agreements.show(agreement.id)}>View agreement versions and confirmations</Link>{task.status === 'in_progress' && agreement.locked_at && <Form action={`/admin/tasks/${task.id}/close`} method="post" className="mt-4 space-y-2 border-t pt-4">{({ processing }) => <><label className="block text-sm">Close task as cancelled by administrator<textarea name="note" required minLength={5} maxLength={3000} className="mt-1 min-h-24 w-full rounded border bg-background p-3" placeholder="Required reason. Agreement records will remain unchanged." /></label><Button type="submit" disabled={processing}>Close task</Button></>}</Form>}</section>}
        {agreement && completionPayment && <CompletionPaymentPanel agreementId={agreement.id} data={completionPayment} readOnly />}
        <section className="space-y-3 rounded-xl border p-5"><h2 className="text-lg font-semibold">Applications</h2>{applications.length ? applications.map((application) => <div key={application.id} className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-sm"><Link className="underline underline-offset-4" href={adminUsers.show(application.userId)}>{application.applicantName}</Link><span>{application.status}</span><span>{application.appliedAt ? formatDateTime(application.appliedAt) : '—'}</span></div>) : <p className="text-sm text-muted-foreground">No applications have been submitted.</p>}</section>
        <section className="space-y-3 rounded-xl border p-5"><h2 className="text-lg font-semibold">Admin action history</h2>{adminActions.length ? adminActions.map((action) => <div key={action.id} className="border-t pt-3 text-sm"><p className="font-medium">{action.action.replaceAll('_', ' ')} · {action.adminName ?? 'Administrator'} · {action.createdAt ? formatDateTime(action.createdAt) : ''}</p>{action.note && <p className="mt-1 whitespace-pre-wrap">{action.note}</p>}</div>) : <p className="text-sm text-muted-foreground">No admin decisions have been recorded for this task.</p>}</section>
        {canReview ? <section className="space-y-4 rounded-xl border p-5"><h2 className="text-lg font-semibold">Review decision</h2><div className="grid gap-3 md:grid-cols-3"><DecisionForm taskId={task.id} decision="approve" label="Approve task" noteRequired={false} /><DecisionForm taskId={task.id} decision="reject" label="Reject task" noteRequired /><DecisionForm taskId={task.id} decision="request_changes" label="Request changes" noteRequired /></div></section> : task.status === 'pending_review' ? <p className="rounded-lg border p-4 text-sm">You cannot review a task you posted yourself.</p> : null}</div></>;
}

AdminTaskReview.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
