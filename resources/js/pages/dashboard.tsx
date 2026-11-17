import { formatDate, formatDateTime } from '@/lib/format';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { SafetyNotice } from '@/components/safety-notice';
import { VerificationStatusBadge } from '@/components/verification-status-badge';
import { dashboard } from '@/routes';
import verificationDetails from '@/routes/verification/details';
import browse from '@/routes/browse';
import tasks from '@/routes/tasks';
import applications from '@/routes/applications';
import reports from '@/routes/reports';
import { ArrowRight, BriefcaseBusiness, ClipboardList, FolderOpen, Search, ShieldCheck, Sparkles } from 'lucide-react';

type Props = {
    status?: string | null;
    verificationNote?: string | null;
    verifiedAt?: string | null;
    ratingsWaiting?: { id: number; taskTitle: string; daysLeft: number }[];
    warningSanction?: { id: number; reason: string } | null;
    activeSuspension?: { id: number; reason: string; endsAt: string | null } | null;
    sanctionContact?: string;
};

export default function Dashboard({ status, verificationNote, verifiedAt, ratingsWaiting = [], warningSanction, activeSuspension, sanctionContact }: Props) {
    const { auth } = usePage().props;
    const user = auth.user;
    const verified = user.verification_status === 'verified';
    const canBrowse = Boolean(user.can_apply_tasks);
    const canPost = Boolean(user.can_post_tasks);

    const actions = [
        ...(canBrowse ? [{ title: 'Find a task', description: 'Explore approved tasks and review the details.', href: browse.index().url, icon: Search, label: 'Browse tasks' }] : []),
        ...(canPost ? [{ title: 'Post a task', description: 'Share clear expectations with the CMU community.', href: tasks.create().url, icon: ClipboardList, label: 'Create a post' }] : []),
        ...(canBrowse ? [{ title: 'Your activity', description: 'Review your applications and their status.', href: applications.mine().url, icon: BriefcaseBusiness, label: 'My applications' }] : []),
        ...(canPost ? [{ title: 'Your activity', description: 'Review tasks you have posted and their status.', href: tasks.mine().url, icon: BriefcaseBusiness, label: 'My tasks' }] : []),
        ...(verified ? [{ title: 'Your reports', description: 'Review the reports you have submitted.', href: reports.mine().url, icon: FolderOpen, label: 'My reports' }] : []),
        ...(!canBrowse && !canPost && !verified ? [{ title: 'Account details', description: 'Review or update your submitted verification details.', href: verificationDetails.edit().url, icon: ShieldCheck, label: 'Review account' }] : []),
    ];

    return (
        <>
            <Head title="Dashboard" />
            <div className="min-h-[calc(100vh-4rem)] bg-background px-4 py-7 text-foreground sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl space-y-6">
                    {status && <div role="status" className="rounded-xl border border-primary/25 bg-primary/10 px-4 py-3 text-sm text-foreground">{status}</div>}

                    {warningSanction && <div className="rounded-xl border border-amber-400 bg-amber-100 p-4 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-300/10 dark:text-amber-100"><p><strong>Account warning:</strong> {warningSanction.reason}</p><button className="mt-2 underline underline-offset-4" type="button" onClick={() => router.post(`/my-sanctions/${warningSanction.id}/acknowledge`)}>Acknowledge warning</button></div>}
                    {activeSuspension && <div role="status" className="rounded-xl border border-red-500/50 bg-red-950/40 p-4 text-sm text-red-100"><p>Your account is suspended until {activeSuspension.endsAt ? formatDateTime(activeSuspension.endsAt) : 'further notice'}.</p><p className="mt-1">{activeSuspension.reason}</p><p className="mt-1">{sanctionContact}</p><Link className="mt-2 inline-block underline" href="/my-sanctions">View account actions</Link></div>}

                    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
                        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                            <div>
                                <p className="text-sm font-medium text-primary">Your TaskMate dashboard</p>
                                <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Welcome, {user.name}</h1>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Keep track of your next steps and make informed decisions about campus work.</p>
                            </div>
                            <div className="flex shrink-0 items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
                                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><ShieldCheck className="size-5" aria-hidden="true" /></span>
                                <div><VerificationStatusBadge status={user.verification_status} />{verified && verifiedAt && <p className="mt-1.5 text-xs text-muted-foreground">Verified {formatDate(verifiedAt)}</p>}</div>
                            </div>
                        </div>

                        {!verified && <div role="status" className="mt-5 rounded-xl border border-amber-400 bg-amber-100 px-4 py-3 text-sm leading-6 text-amber-950 dark:border-amber-700 dark:bg-amber-300/10 dark:text-amber-100">
                            {user.verification_status === 'pending' && 'Your account is awaiting review. Posting and applying are unavailable until your account is verified.'}
                            {user.user_type === 'student' && user.verification_status !== 'pending' && 'Task browsing and applications are available after your account is verified.'}
                            {user.verification_status === 'more_info_requested' && <><p>The administrator needs more information before completing the review.</p>{verificationNote && <p className="mt-1">{verificationNote}</p>}<Link className="mt-2 inline-flex underline underline-offset-4" href={verificationDetails.edit()}>Update your submitted details</Link></>}
                            {user.verification_status === 'rejected' && <><p>Your account verification was rejected. Please review the note and update your submitted details.</p>{verificationNote && <p className="mt-1">{verificationNote}</p>}<Link className="mt-2 inline-flex underline underline-offset-4" href={verificationDetails.edit()}>Update your submitted details</Link></>}
                        </div>}
                        {verified && <p role="status" className="mt-5 rounded-xl border border-primary/25 bg-primary/10 px-4 py-3 text-sm text-foreground">Your account is verified. You can use the options below that are available to your account.</p>}
                    </section>

                    <SafetyNotice />

                    <section aria-labelledby="quick-actions-title">
                        <div className="mb-3 flex items-end justify-between gap-3"><div><h2 id="quick-actions-title" className="text-lg font-semibold">Quick actions</h2><p className="mt-1 text-sm text-muted-foreground">Pick up where you need to.</p></div></div>
                        <div className="grid gap-4 md:grid-cols-3">
                            {actions.map(({ title, description, href, icon: Icon, label }) => <Link key={title} href={href} className="group rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40 hover:bg-accent/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                                <div className="flex items-start justify-between"><span className="flex size-11 items-center justify-center rounded-xl bg-amber-100 text-primary dark:bg-amber-300/15"><Icon className="size-5" aria-hidden="true" /></span><ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" aria-hidden="true" /></div>
                                <h3 className="mt-5 font-semibold">{title}</h3><p className="mt-1 min-h-10 text-sm leading-5 text-muted-foreground">{description}</p><span className="mt-4 inline-block text-sm font-semibold text-primary">{label}</span>
                            </Link>)}
                        </div>
                    </section>

                    <section className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
                        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                            <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><FolderOpen className="size-5" aria-hidden="true" /></span><div><h2 className="font-semibold">Your latest updates</h2><p className="text-sm text-muted-foreground">Items that may need your attention.</p></div></div>
                            {ratingsWaiting.length > 0 ? <div className="mt-5 divide-y divide-border">{ratingsWaiting.map((rating) => <div key={rating.id} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"><div><p className="font-medium">{rating.taskTitle}</p><p className="mt-1 text-sm text-muted-foreground">{rating.daysLeft} day{rating.daysLeft === 1 ? '' : 's'} left to leave a rating</p></div><Link className="text-sm font-semibold text-primary hover:underline" href={`/agreements/${rating.id}/rate`}>Rate your experience <ArrowRight className="ml-1 inline size-4" /></Link></div>)}</div> : <div className="mt-5 rounded-xl border border-dashed border-border px-4 py-6 text-center"><Sparkles className="mx-auto size-5 text-primary" aria-hidden="true"/><p className="mt-2 text-sm font-medium">You’re all caught up</p><p className="mt-1 text-sm text-muted-foreground">New application and task updates will appear here.</p></div>}
                        </div>
                        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6"><span className="flex size-10 items-center justify-center rounded-xl bg-amber-100 text-primary dark:bg-amber-300/15"><ShieldCheck className="size-5" aria-hidden="true" /></span><h2 className="mt-4 font-semibold">Before you agree</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Review the work, time commitment, location, and agreed terms together. Keep a record of completion and payment status.</p><Link href="/how-it-works" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">How TaskMate works <ArrowRight className="size-4" /></Link></div>
                    </section>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = (props: { currentTeam?: { slug: string } | null }) => ({
    breadcrumbs: [{ title: 'Dashboard', href: props.currentTeam ? dashboard(props.currentTeam.slug) : '/' }],
});
