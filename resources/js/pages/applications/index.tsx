import { formatDate, formatAmount } from '@/lib/format';
import { Form, Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { ApplicationStatusBadge } from '@/components/application-status-badge';
import applicationsRoutes from '@/routes/applications';
import browseRoutes from '@/routes/browse';
import agreementsRoutes from '@/routes/agreements';
import { PaymentStatusBadge } from '@/components/payment-status-badge';
import { ToBeDiscussedBadge } from '@/components/terms-status-badge';

type Item = { id: number; taskId: number; taskTitle: string; posterName: string; budget: string | null; budgetToBeDiscussed?: boolean; payTimingLabel?: string; payTimingToBeDiscussed?: boolean; scheduleSummary?: string | null; scheduleToBeDiscussed?: boolean; status: string; statusLabel: string; taskStatus: string; taskApproved: boolean; otherApplicantAccepted: boolean; agreementId: number | null; agreementStatus: string | null; agreementStatusLabel: string | null; paymentStatus: string | null; paymentStatusLabel: string | null; appliedAt: string | null; needsRating: boolean; conversationId: number | null; messageBlockedReason: string | null };
type Props = { applications: { data: Item[]; links: { url: string | null; label: string; active: boolean }[] }; status?: string | null };

export default function MyApplications({ applications, status }: Props) {
    return <><Head title="My applications" /><div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6"><div><h1 className="text-2xl font-semibold">My applications</h1><p className="mt-1 text-sm text-muted-foreground">See each response and the next step for your task applications.</p></div>{status && <div role="status" className="rounded-lg border px-4 py-3 text-sm">{status}</div>}{applications.data.length ? <div className="grid gap-4 md:grid-cols-2">{applications.data.map((application) => {
        const nextStep = application.status === 'pending'
            ? application.otherApplicantAccepted
                ? 'The poster is working out an agreement with another applicant. Your application stays active until an agreement is confirmed.'
                : 'Waiting for the poster to respond. You can withdraw while your application is pending.'
            : application.status === 'accepted'
                ? application.agreementStatus === 'agreed'
                    ? 'Both parties confirmed the agreement. Work may begin under the locked terms.'
                    : application.agreementStatus === 'negotiating'
                        ? 'Review the agreement and confirm the same version before work begins. You can ask the poster to change it.'
                        : 'You were accepted. The poster will propose an agreement before work begins.'
                : application.status === 'declined'
                    ? 'The poster declined this application.'
                    : application.status === 'withdrawn'
                        ? 'You withdrew this application.'
                        : application.status === 'cancelled' && application.agreementStatus === 'cancelled'
                            ? 'The agreement was cancelled and your application is closed. The task is open again for other applicants.'
                            : null;

        return <article key={application.id} className="space-y-3 rounded-xl border p-5"><div className="flex flex-wrap items-start justify-between gap-2"><h2 className="font-semibold">{application.taskTitle}</h2><ApplicationStatusBadge status={application.status} label={application.statusLabel} /></div><p className="text-sm">Poster: {application.posterName}</p><div className="flex flex-wrap items-center gap-2 text-sm"><span>Pay:</span>{application.budgetToBeDiscussed || application.budget === null ? <ToBeDiscussedBadge /> : <span className="font-medium">₱{formatAmount(application.budget)}</span>}{application.payTimingLabel && <span className="text-muted-foreground">({application.payTimingLabel})</span>}</div><p className="text-sm text-muted-foreground">Hours: {application.scheduleToBeDiscussed || !application.scheduleSummary ? 'To be discussed' : application.scheduleSummary}</p><p className="text-xs text-muted-foreground">Applied {application.appliedAt ? formatDate(application.appliedAt) : '—'}</p>{nextStep && <p className="rounded-md border bg-muted/40 p-3 text-sm">{nextStep}</p>}{application.paymentStatus && application.paymentStatusLabel && <PaymentStatusBadge status={application.paymentStatus} label={application.paymentStatusLabel} />}{application.needsRating && application.agreementId && <Button size="sm" variant="outline" asChild><Link href={agreementsRoutes.rate(application.agreementId)}>Rate your experience</Link></Button>}{!application.taskApproved && <p className="text-sm text-muted-foreground">Task status: {application.taskStatus}</p>}<div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" asChild><Link href={applicationsRoutes.task(application.id)}>View task details</Link></Button>{application.conversationId && <Button size="sm" variant="outline" asChild><Link href={`/messages/${application.conversationId}`}>{application.messageBlockedReason ? 'View conversation' : 'Message poster'}</Link></Button>}{application.agreementId && <Button size="sm" asChild><Link href={agreementsRoutes.show(application.agreementId)}>View agreement</Link></Button>}{application.status === 'pending' && <Form {...applicationsRoutes.withdraw.form(application.id)} onSubmit={(event) => { if (!window.confirm('Withdraw this application?')) event.preventDefault(); }}><Button size="sm" variant="outline" type="submit">Withdraw</Button></Form>}</div>{application.messageBlockedReason && <p className="text-xs text-muted-foreground">{application.messageBlockedReason}</p>}</article>;
    })}</div> : <div className="rounded-xl border p-8 text-center"><h2 className="font-semibold">You have not applied to any tasks</h2><p className="mt-2 text-sm text-muted-foreground">Browse approved tasks to find work that suits you.</p><Button className="mt-4" asChild><Link href={browseRoutes.index()}>Browse tasks</Link></Button></div>}{applications.links.length > 3 && <nav className="flex flex-wrap gap-2" aria-label="Pagination">{applications.links.map((link, index) => link.url ? <Link key={index} href={link.url} className={`rounded border px-3 py-1 text-sm ${link.active ? 'bg-muted font-medium' : ''}`} dangerouslySetInnerHTML={{ __html: link.label }} /> : <span key={index} className="rounded border px-3 py-1 text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: link.label }} />)}</nav>}</div></>;
}
