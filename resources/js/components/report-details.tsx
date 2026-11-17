import { formatDateTime, formatAmount } from '@/lib/format';
import { Form, Link } from '@inertiajs/react';
import { AlertTriangle, CalendarCheck, ClipboardList, FileText, MessageSquareText, Paperclip, ShieldCheck, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import InputError from '@/components/input-error';
import { ReportStatusBadge } from '@/components/report-status-badge';
import reports from '@/routes/reports';

type Person = { id: number; name: string; type: string; verificationStatus: string };
type Report = {
    id: number; type: string; typeLabel: string; status: string; statusLabel: string; outcome: string | null; outcomeLabel: string | null;
    adminNote: string | null; resolutionMessage?: string | null; description: string; createdAt: string | null; reporter: Person; reportedUser: Person;
    task: { id: number; title: string }; agreement: { id: number; finalAmount: string | null; paymentArrangement: string | null; dueDate: string | null; recordReference: string | null } | null;
    completion: { deliveredAt: string | null; deliveredNote: string | null; completedAt: string | null; completionNote: string | null } | null;
    paymentEvents: { id: number; event: string; actorName: string; amount: string | null; paidOn: string | null; method: string | null; note: string | null; createdAt: string | null; amountMismatch: boolean }[];
    statements: { id: number; name: string; role: string; body: string; createdAt: string | null }[];
    evidence: { id: number; name: string; mime: string; sizeBytes: number; downloadUrl: string }[];
    relatedTask?: any;
    reporterSanctions?: any[];
    reportedUserSanctions?: any[];
    reporterPriorReports?: number;
    reportedUserPriorReports?: number;
    versions?: any[];
    agreementMessages?: any[];
};

const sectionClass = 'rounded-2xl border border-[#e1e8df] bg-white p-5 shadow-sm dark:border-[#263c2e] dark:bg-[#17251c] sm:p-6';

function SectionHeading({ icon: Icon, title, description }: { icon: typeof FileText; title: string; description?: string }) {
    return <div className="mb-4 flex items-start gap-3 border-b border-[#edf1eb] pb-4 dark:border-[#263c2e]"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#e7f0e9] text-[#065F46] dark:bg-amber-300/10 dark:text-amber-300"><Icon className="size-4" aria-hidden="true" /></span><div><h2 className="font-semibold tracking-tight text-[#183324] dark:text-[#EDF4EC]">{title}</h2>{description && <p className="mt-1 text-sm leading-5 text-[#617166] dark:text-[#afc2b4]">{description}</p>}</div></div>;
}

function PersonCard({ title, person }: { title: string; person: Person }) {
    return <div className="rounded-xl bg-[#f7f8f2] p-4 dark:bg-[#101b15]"><p className="text-xs font-semibold uppercase tracking-wide text-[#617166] dark:text-[#afc2b4]">{title}</p><p className="mt-1 font-semibold text-[#183324] dark:text-[#EDF4EC]">{person.name}</p><p className="mt-1 text-sm text-[#526458] dark:text-[#bdcbbf]">{person.type} <span aria-hidden="true">·</span> {person.verificationStatus.replaceAll('_', ' ')}</p></div>;
}

export function ReportDetails({ report, canReply = false, statementMaxLength = 3000 }: { report: Report; canReply?: boolean; statementMaxLength?: number }) {
    return <div className="space-y-4">
        <header className="rounded-2xl border border-[#dce8dd] bg-white p-5 shadow-sm dark:border-[#263c2e] dark:bg-[#17251c] sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0"><p className="text-sm font-semibold text-[#065F46] dark:text-amber-300">{report.typeLabel} <span aria-hidden="true">·</span> {report.task.title}</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#183324] dark:text-[#EDF4EC] sm:text-3xl">Report #{report.id}</h1><p className="mt-2 text-sm text-[#617166] dark:text-[#afc2b4]">Submitted {report.createdAt ? formatDateTime(report.createdAt) : '—'}</p></div>
                <ReportStatusBadge status={report.status} label={report.statusLabel} />
            </div>
        </header>

        <section className={sectionClass}>
            <SectionHeading icon={UsersRound} title="People involved" description="Account information related to this report." />
            <div className="grid gap-3 sm:grid-cols-2"><PersonCard title="Reporter" person={report.reporter} /><PersonCard title="Reported person" person={report.reportedUser} /></div>
        </section>

        {(report.reporterSanctions || report.reportedUserSanctions) && <section className={sectionClass}>
            <SectionHeading icon={ShieldCheck} title="Prior reports and sanctions" />
            <div className="grid gap-4 sm:grid-cols-2">{[[report.reporter, report.reporterSanctions, report.reporterPriorReports], [report.reportedUser, report.reportedUserSanctions, report.reportedUserPriorReports]].map(([person, sanctions, prior]) => <div key={(person as Person).id} className="rounded-xl bg-[#f7f8f2] p-4 dark:bg-[#101b15]"><h3 className="font-medium text-[#183324] dark:text-[#EDF4EC]">{(person as Person).name}</h3><p className="mt-1 text-sm text-[#617166] dark:text-[#afc2b4]">Prior reports: {prior as number}</p>{(sanctions as any[]).length ? <ul className="mt-3 space-y-2">{(sanctions as any[]).map((sanction, index) => <li key={index} className="text-sm leading-5">{sanction.type}: {sanction.reason}{sanction.active ? ' (active)' : ''}</li>)}</ul> : <p className="mt-2 text-sm text-[#617166] dark:text-[#afc2b4]">No sanctions recorded.</p>}</div>)}</div>
        </section>}

        {report.relatedTask && <section className={sectionClass}>
            <SectionHeading icon={ClipboardList} title="Related task record" />
            <div className="grid gap-x-5 gap-y-2 sm:grid-cols-2">{Object.entries(report.relatedTask).filter(([key, value]) => !['id', 'screenings', 'flags', 'applications'].includes(key) && value !== null && typeof value !== 'object').map(([key, value]) => <p key={key} className="text-sm leading-6"><strong>{key.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`)}:</strong> {String(value)}</p>)}</div>
            <div className="mt-5 grid gap-4 border-t border-[#edf1eb] pt-4 dark:border-[#263c2e] sm:grid-cols-3">
                <div><h3 className="text-sm font-semibold">Screening history</h3>{report.relatedTask.screenings.map((screen: any, index: number) => <p key={index} className="mt-2 text-xs leading-5 text-[#526458] dark:text-[#bdcbbf]">{screen.level} <span aria-hidden="true">·</span> score {screen.score} <span aria-hidden="true">·</span> {screen.createdAt} <span aria-hidden="true">·</span> {JSON.stringify(screen.factors)}</p>)}</div>
                <div><h3 className="text-sm font-semibold">Applications</h3>{report.relatedTask.applications.map((application: any, index: number) => <p key={index} className="mt-2 text-xs leading-5 text-[#526458] dark:text-[#bdcbbf]">{application.applicantName} <span aria-hidden="true">·</span> {application.status} <span aria-hidden="true">·</span> {application.createdAt}</p>)}</div>
                <div><h3 className="text-sm font-semibold">Content flags</h3>{report.relatedTask.flags.map((flag: any) => <p key={flag.id} className="mt-2 text-xs leading-5 text-[#526458] dark:text-[#bdcbbf]">{flag.category} <span aria-hidden="true">·</span> {flag.field} <span aria-hidden="true">·</span> {flag.status} <span aria-hidden="true">·</span> {(flag.matched ?? []).join(', ')}</p>)}</div>
            </div>
        </section>}

        {report.agreement && <section className={sectionClass}>
            <SectionHeading icon={FileText} title="Locked agreement" />
            <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-[#f7f8f2] p-4 dark:bg-[#101b15]"><p className="text-xs font-semibold uppercase tracking-wide text-[#617166] dark:text-[#afc2b4]">Agreed amount</p><p className="mt-1 text-lg font-semibold text-[#065F46] dark:text-amber-300">₱{formatAmount(report.agreement.finalAmount)}</p></div><div className="rounded-xl bg-[#f7f8f2] p-4 dark:bg-[#101b15]"><p className="text-xs font-semibold uppercase tracking-wide text-[#617166] dark:text-[#afc2b4]">Due date</p><p className="mt-1 font-medium">{report.agreement.dueDate ?? '—'}</p></div><div className="sm:col-span-2"><p className="text-xs font-semibold uppercase tracking-wide text-[#617166] dark:text-[#afc2b4]">Payment arrangement</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6">{report.agreement.paymentArrangement}</p></div><p className="break-all text-sm sm:col-span-2"><strong>Record reference:</strong> <span className="font-mono">{report.agreement.recordReference}</span></p></div>
        </section>}

        {report.versions?.map((version: any) => <section key={version.version} className={sectionClass}>
            <SectionHeading icon={FileText} title={`Agreement version ${version.version}`} description={`${version.proposer} · ${version.createdAt ?? ''}`} />
            <div className="grid gap-x-5 gap-y-3 sm:grid-cols-2"><p><strong>Agreed amount:</strong> ₱{formatAmount(version.finalAmount)}</p><p><strong>Dates:</strong> {version.startDate ?? '—'} to {version.dueDate}</p><p><strong>Work arrangement:</strong> {version.workMode} · {version.workplaceName ?? 'Remote'} · {version.workplaceAddress ?? ''}</p><p><strong>Payment arrangement:</strong> {version.paymentArrangement}</p><p className="sm:col-span-2"><strong>Deliverables:</strong> {version.deliverables}</p><p className="whitespace-pre-wrap sm:col-span-2"><strong>Terms:</strong> {version.terms}</p>{version.comment && <p className="sm:col-span-2"><strong>Note:</strong> {version.comment}</p>}<p className="break-all font-mono text-xs sm:col-span-2">{version.hash}</p><p className="text-sm sm:col-span-2">Confirmed by: {version.confirmations.map((item: any) => `${item.name} (${item.at})`).join(', ') || 'No confirmations'}</p></div>
        </section>)}

        {report.agreementMessages?.map((message: any, index: number) => <article key={index} className="rounded-xl border border-[#dce8dd] bg-[#f5f8f2] p-4 text-sm dark:border-[#31483a] dark:bg-[#17251c]"><p className="font-medium">Agreement message from {message.name}</p><p className="mt-1 whitespace-pre-wrap leading-6">{message.body}</p><p className="mt-2 text-xs text-[#617166] dark:text-[#afc2b4]">{message.createdAt}</p></article>)}

        <section className={`${sectionClass} border-l-4 border-l-[#065F46]`}>
            <SectionHeading icon={MessageSquareText} title="What happened" description="The report description as submitted." />
            <p className="whitespace-pre-wrap text-sm leading-7 text-[#183324] dark:text-[#EDF4EC]">{report.description}</p>
        </section>

        {report.completion && <section className={sectionClass}>
            <SectionHeading icon={CalendarCheck} title="Completion record" />
            <div className="grid gap-3 sm:grid-cols-2"><p className="rounded-xl bg-[#f7f8f2] p-4 text-sm dark:bg-[#101b15]"><strong>Delivered:</strong> {report.completion.deliveredAt ? formatDateTime(report.completion.deliveredAt) : 'Not marked'}{report.completion.deliveredNote && <span className="mt-2 block whitespace-pre-wrap">{report.completion.deliveredNote}</span>}</p><p className="rounded-xl bg-[#f7f8f2] p-4 text-sm dark:bg-[#101b15]"><strong>Completed:</strong> {report.completion.completedAt ? formatDateTime(report.completion.completedAt) : 'Not recorded'}{report.completion.completionNote && <span className="mt-2 block whitespace-pre-wrap">{report.completion.completionNote}</span>}</p></div>
        </section>}

        <section className={sectionClass}>
            <SectionHeading icon={CalendarCheck} title="Payment timeline" description="Recorded payment activity for this agreement." />
            {report.paymentEvents.length ? <div className="space-y-3">{report.paymentEvents.map((event) => <article key={event.id} className={`rounded-xl border p-4 text-sm ${event.amountMismatch ? 'border-amber-400 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-300/10 dark:text-amber-100' : 'border-[#edf1eb] bg-[#f7f8f2] dark:border-[#263c2e] dark:bg-[#101b15]'}`}><div className="flex flex-wrap justify-between gap-2"><p className="font-semibold">{event.event.replaceAll('_', ' ')} <span aria-hidden="true">·</span> {event.actorName}</p><time className="text-xs text-[#617166] dark:text-[#afc2b4]">{event.createdAt ? formatDateTime(event.createdAt) : '—'}</time></div><p className="mt-2">{event.amount !== null ? `₱${formatAmount(event.amount)}` : ''}{event.paidOn ? ` · paid ${event.paidOn}` : ''}{event.method ? ` · ${event.method}` : ''}</p>{event.amountMismatch && <p className="mt-2 flex items-center gap-2 font-medium"><AlertTriangle className="size-4" aria-hidden="true" />This amount differs from the agreed amount.</p>}{event.note && <p className="mt-2 whitespace-pre-wrap leading-6">{event.note}</p>}</article>)}</div> : <p className="rounded-xl bg-[#f7f8f2] p-4 text-sm text-[#617166] dark:bg-[#101b15] dark:text-[#afc2b4]">No payment events were recorded.</p>}
        </section>

        <section className={sectionClass}>
            <SectionHeading icon={MessageSquareText} title="Responses" description="Statements added to this report." />
            {report.statements.length ? <div className="space-y-3">{report.statements.map((statement) => <article key={statement.id} className="rounded-xl bg-[#f7f8f2] p-4 dark:bg-[#101b15]"><p className="text-sm font-semibold">{statement.name} <span aria-hidden="true">·</span> {statement.role}</p><time className="mt-1 block text-xs text-[#617166] dark:text-[#afc2b4]">{statement.createdAt ? formatDateTime(statement.createdAt) : '—'}</time><p className="mt-3 whitespace-pre-wrap text-sm leading-6">{statement.body}</p></article>)}</div> : <p className="rounded-xl bg-[#f7f8f2] p-4 text-sm text-[#617166] dark:bg-[#101b15] dark:text-[#afc2b4]">No response has been added.</p>}
        </section>

        <section className={sectionClass}>
            <SectionHeading icon={Paperclip} title="Evidence" description="Files attached to this report." />
            {report.evidence.length ? <ul className="space-y-2">{report.evidence.map((evidence) => <li key={evidence.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#f7f8f2] p-4 text-sm dark:bg-[#101b15]"><div><p className="font-medium">{evidence.name}</p><p className="mt-1 text-xs text-[#617166] dark:text-[#afc2b4]">{(evidence.sizeBytes / 1024).toFixed(0)} KB</p></div><Button variant="outline" size="sm" className="min-h-10 rounded-lg" asChild><a href={evidence.downloadUrl}>Download</a></Button></li>)}</ul> : <p className="rounded-xl bg-[#f7f8f2] p-4 text-sm text-[#617166] dark:bg-[#101b15] dark:text-[#afc2b4]">No files were submitted.</p>}
        </section>

        {report.outcomeLabel && <section className="rounded-2xl border border-[#dce9df] bg-[#f5f8f2] p-5 dark:border-[#31483a] dark:bg-[#17251c] sm:p-6"><SectionHeading icon={ShieldCheck} title="Review result" /><p><strong>Outcome:</strong> {report.outcomeLabel}</p>{report.adminNote && <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{report.adminNote}</p>}</section>}
        {report.resolutionMessage && <section className={sectionClass}><SectionHeading icon={MessageSquareText} title="Message from the administrators" /><p className="whitespace-pre-wrap text-sm leading-6">{report.resolutionMessage}</p></section>}

        {canReply && <Form {...reports.reply.form(report.id)} encType="multipart/form-data" className={sectionClass}>
            {({ errors, processing }) => <><SectionHeading icon={MessageSquareText} title="Add your response" description="Share relevant context or reply to the report." /><Textarea name="body" required maxLength={statementMaxLength} placeholder="Write your response." /><InputError message={errors.body} /><p className="rounded-lg bg-amber-50 px-3 py-2 text-sm leading-5 text-amber-950 dark:bg-amber-300/10 dark:text-amber-100">Avoid uploading government ID photos, selfies, or sensitive documents. Administrators and both parties can see submitted evidence.</p><Input name="evidence[]" type="file" multiple accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" /><InputError message={errors.evidence} /><InputError message={errors['evidence.0']} /><Button className="min-h-11 rounded-lg bg-[#065F46] px-5 text-white hover:bg-[#064E3B] dark:bg-amber-300 dark:text-[#183324] dark:hover:bg-amber-200" type="submit" disabled={processing}>{processing ? 'Adding response…' : 'Add response'}</Button></>}
        </Form>}
    </div>;
}
