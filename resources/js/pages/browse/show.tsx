import { formatDate, formatAmount } from '@/lib/format';
import { PAYMENT_BOUNDARY_NOTICE, STUDENT_TASK_SAFETY_NOTICE } from '@/constants/notices';
import { Form, Head, Link } from '@inertiajs/react';
import { useReducedMotion, motion } from 'motion/react';
import { ArrowLeft, CalendarDays, Clock3, MapPin, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import InputError from '@/components/input-error';
import { VerificationStatusBadge } from '@/components/verification-status-badge';
import { ApplicationStatusBadge } from '@/components/application-status-badge';
import browse from '@/routes/browse';
import applications from '@/routes/applications';
import { RatingSummary } from '@/components/rating-summary';
import { ProblemReportForm } from '@/components/problem-report-form';
import { AnimatedTitleText } from '@/components/animated-title';

type Task = {
    id: number; title: string; category: string; description: string; requiredActivities: string; deliverables: string;
    estimatedDurationHours: string; skillRequirements: string | null; complexity: string; budget: string; workMode: string;
    workplaceName: string | null; workplaceAddress: string | null; workplaceSetting: string | null; deadline: string | null;
    physicalDemand: string | null; academicInvolvement: string | null; hazardExposure: boolean; hazardDescription: string | null;
    privateMeetingRequired: boolean;
};
type Poster = { displayName: string; accountType: string; affiliation: string | null; verificationStatus: 'pending' | 'verified' | 'rejected' | 'more_info_requested'; memberSince: string | null; profileUrl: string; ratingSummary: import('@/components/rating-summary').RatingSummaryData };
type Application = { status: string; statusLabel: string; appliedAt: string | null };
type Props = { task: Task; poster: Poster; application: Application | null; canApply?: boolean; limitedView?: boolean; currentTaskStatus?: string; status?: string | null; messageMaxLength: number; problemReport?: { action: string; types: { value: string; label: string }[] }; offPlatformWarning?: boolean };

const sectionClass = 'rounded-2xl border border-[#e1e8df] bg-white p-5 shadow-sm dark:border-[#263c2e] dark:bg-[#17251c] sm:p-7';

function DetailField({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
    return <div className={`rounded-xl bg-[#f7f8f2] p-4 dark:bg-[#101b15] ${wide ? 'sm:col-span-2' : ''}`}><h3 className="text-xs font-semibold uppercase tracking-wide text-[#617166] dark:text-[#afc2b4]">{label}</h3><div className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-[#183324] dark:text-[#EDF4EC]">{children}</div></div>;
}

export default function BrowseTaskDetail({ task, poster, application, canApply = false, limitedView = false, currentTaskStatus, status, messageMaxLength, problemReport, offPlatformWarning }: Props) {
    const reduceMotion = useReducedMotion();

    return <>
        <Head title={task.title} />
        <motion.main initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.3, ease: 'easeOut' }} className="min-h-full bg-[#f7f8f2] px-4 py-7 text-[#183324] dark:bg-[#101b15] dark:text-[#EDF4EC] sm:px-6 sm:py-9">
            <div className="mx-auto max-w-4xl space-y-5">
                {status && <div role="status" className="rounded-xl border border-[#9dc8aa] bg-[#eaf4ec] px-4 py-3 text-sm dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100">{status}</div>}
                {limitedView && <div role="status" className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950 dark:border-amber-800 dark:bg-amber-300/10 dark:text-amber-100">This task is currently {currentTaskStatus?.toLowerCase()}. You can review its details and your application status.</div>}

                <header className="relative overflow-hidden rounded-2xl border border-[#dce8dd] bg-white p-5 shadow-sm dark:border-[#263c2e] dark:bg-[#17251c] sm:p-7">
                    <motion.span aria-hidden="true" animate={reduceMotion ? undefined : { y: [0, -5, 0], rotate: [0, 2, 0] }} transition={reduceMotion ? undefined : { duration: 4.5, repeat: Infinity, ease: 'easeInOut' }} className="absolute -right-3 -top-3 flex size-20 items-center justify-center rounded-3xl bg-[#e7f0e9] text-[#065F46] dark:bg-amber-300/10 dark:text-amber-300 sm:right-6 sm:top-6"><Sparkles className="size-8" /></motion.span>
                    <Link href={browse.index()} className="relative inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-medium text-[#526458] hover:text-[#065F46] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#065F46] dark:text-[#bdcbbf] dark:hover:text-amber-300 dark:focus-visible:outline-amber-300"><ArrowLeft className="size-4" aria-hidden="true" />Browse tasks</Link>
                    <div className="relative mt-5 max-w-3xl pr-12 sm:pr-20">
                        <div className="flex flex-wrap gap-2"><span className="rounded-full bg-[#e7f0e9] px-3 py-1 text-xs font-semibold text-[#065F46] dark:bg-emerald-900/50 dark:text-emerald-200">{task.category}</span><span className="rounded-full bg-[#f5f8f2] px-3 py-1 text-xs font-medium text-[#526458] dark:bg-[#101b15] dark:text-[#bdcbbf]">{task.workMode}</span></div>
                        <h1 className="mt-4 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl"><AnimatedTitleText text={task.title} /></h1>
                        <p className="mt-3 max-w-2xl whitespace-pre-wrap text-sm leading-6 text-[#526458] dark:text-[#bdcbbf]">{task.description}</p>
                    </div>
                    <div className="relative mt-6 flex flex-wrap gap-x-5 gap-y-3 border-t border-[#edf1eb] pt-5 text-sm dark:border-[#263c2e]">
                        <span className="inline-flex items-center gap-2 font-semibold text-[#065F46] dark:text-amber-300"><span aria-hidden="true">₱</span>{formatAmount(task.budget)} <span className="font-normal text-[#617166] dark:text-[#afc2b4]">estimated budget</span></span>
                        <span className="inline-flex items-center gap-2 text-[#526458] dark:text-[#bdcbbf]"><Clock3 className="size-4" aria-hidden="true" />{task.estimatedDurationHours} hours</span>
                        {task.deadline && <span className="inline-flex items-center gap-2 text-[#526458] dark:text-[#bdcbbf]"><CalendarDays className="size-4" aria-hidden="true" />Due {formatDate(task.deadline)}</span>}
                    </div>
                </header>

                <section className={sectionClass}>
                    <div className="mb-5"><h2 className="text-lg font-semibold tracking-tight">Work details</h2><p className="mt-1 text-sm text-[#617166] dark:text-[#afc2b4]">Review the responsibilities and conditions before deciding.</p></div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <DetailField label="Required activities" wide>{task.requiredActivities}</DetailField>
                        <DetailField label="Expected deliverables" wide>{task.deliverables}</DetailField>
                        {task.skillRequirements && <DetailField label="Skills or experience">{task.skillRequirements}</DetailField>}
                        <DetailField label="Experience level">{task.complexity}</DetailField>
                        <DetailField label="Work mode">{task.workMode}</DetailField>
                        {task.workplaceName && <DetailField label="Workplace">{task.workplaceName}</DetailField>}
                        {task.workplaceAddress && <DetailField label="Workplace address">{task.workplaceAddress}</DetailField>}
                        {task.workplaceSetting && <DetailField label="Workplace setting">{task.workplaceSetting.replaceAll('_', ' ')}</DetailField>}
                        <DetailField label="Physical demand">{task.physicalDemand}</DetailField>
                        <DetailField label="Academic involvement">{task.academicInvolvement}</DetailField>
                        <DetailField label="Hazards involved">{task.hazardExposure ? `Yes — ${task.hazardDescription}` : 'No'}</DetailField>
                        <DetailField label="Private or isolated one-on-one meeting">{task.privateMeetingRequired ? 'Yes' : 'No'}</DetailField>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
                    <div className={sectionClass}>
                        <h2 className="text-lg font-semibold">About the poster</h2>
                        <p className="mt-3 font-semibold"><Link href={poster.profileUrl} className="underline decoration-[#b9cbbd] underline-offset-4 hover:text-[#065F46] dark:decoration-[#48604d] dark:hover:text-amber-300">{poster.displayName}</Link></p>
                        <p className="mt-1 text-sm text-[#526458] dark:text-[#bdcbbf]">{poster.accountType}{poster.affiliation ? ` · ${poster.affiliation}` : ''}</p>
                        <div className="mt-3"><VerificationStatusBadge status={poster.verificationStatus} /></div>
                        <p className="mt-3 text-xs text-[#617166] dark:text-[#afc2b4]">Member since {poster.memberSince ? formatDate(poster.memberSince) : '—'}</p>
                        <div className="mt-4 border-t border-[#edf1eb] pt-4 dark:border-[#263c2e]"><RatingSummary summary={poster.ratingSummary} /></div>
                    </div>
                    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-300/10 sm:p-6"><div className="flex items-center gap-2 font-semibold text-amber-950 dark:text-amber-100"><ShieldCheck className="size-5" aria-hidden="true" />Make an informed choice</div><p className="mt-3 text-sm leading-6 text-amber-950/90 dark:text-amber-100/90">{STUDENT_TASK_SAFETY_NOTICE}</p><p className="mt-3 border-t border-amber-300/70 pt-3 text-xs leading-5 text-amber-950/80 dark:border-amber-800 dark:text-amber-100/80">{PAYMENT_BOUNDARY_NOTICE}</p></div>
                </section>

                {problemReport && <ProblemReportForm action={problemReport.action} types={problemReport.types} />}
                {offPlatformWarning && <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:border-amber-800 dark:bg-amber-300/10 dark:text-amber-100">This message contains a request to move outside TaskMate or skip its steps. Be careful, keep agreements and communications on record, and report anything that makes you uncomfortable.</div>}

                {application ? <section className={sectionClass}>
                    <h2 className="text-lg font-semibold">Your application</h2>
                    <div className="mt-3"><ApplicationStatusBadge status={application.status} label={application.statusLabel} /></div>
                    {application.status === 'accepted' && <p className="mt-3 text-sm text-[#526458] dark:text-[#bdcbbf]">You were accepted. The next step is to confirm the agreement with the poster.</p>}
                </section> : canApply && <section className={sectionClass}>
                    <div className="mb-5"><h2 className="text-lg font-semibold">Apply to this task</h2><p className="mt-1 text-sm text-[#617166] dark:text-[#afc2b4]">You can apply once. Review the work details before sending your message.</p></div>
                    <Form {...applications.store.form(task.id)} className="space-y-4">
                        {({ errors, processing }) => <>
                            <div className="grid gap-2"><Label htmlFor="message">Message to the poster</Label><Textarea id="message" name="message" maxLength={messageMaxLength} required /><p className="text-xs text-muted-foreground">Maximum {messageMaxLength} characters.</p><InputError message={errors.message} /></div>
                            <div className="grid gap-2"><Label htmlFor="proposed_amount">Suggested amount (optional)</Label><Input id="proposed_amount" name="proposed_amount" type="number" min="1" max="1000000" step="0.01" /><p className="text-xs text-muted-foreground">This is only a suggestion. The final amount is agreed later between you and the poster.</p><InputError message={errors.proposed_amount} /></div>
                            <div className="flex items-start gap-2"><input id="work_details_confirmed" name="work_details_confirmed" type="checkbox" value="1" required className="mt-1 size-4 accent-[#065F46]" /><Label htmlFor="work_details_confirmed">I have read the work details and conditions.</Label></div>
                            <InputError message={errors.work_details_confirmed} />
                            <Button className="min-h-11 rounded-lg bg-[#065F46] px-5 text-white hover:bg-[#064E3B] dark:bg-amber-300 dark:text-[#183324] dark:hover:bg-amber-200" type="submit" disabled={processing}>{processing ? 'Sending…' : 'Submit application'}</Button>
                        </>}
                    </Form>
                </section>}
            </div>
        </motion.main>
    </>;
}
