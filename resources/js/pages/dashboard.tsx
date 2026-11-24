import { formatDate, formatDateTime } from '@/lib/format';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { SafetyNotice } from '@/components/safety-notice';
import { VerificationStatusBadge } from '@/components/verification-status-badge';
import { dashboard } from '@/routes';
import admin from '@/routes/admin';
import applications from '@/routes/applications';
import browse from '@/routes/browse';
import { create as createTask, mine as myTasks } from '@/routes/tasks';
import verificationDetails from '@/routes/verification/details';

type Props = {
    status?: string | null;
    studentsCanPost?: boolean;
    unverifiedStudentsCanBrowse?: boolean;
    autoVerifyInstitutionalStudent?: boolean;
    hasStudentDetails?: boolean;
    verificationMethod?: string | null;
    studentVerificationUrl?: string | null;
    verificationNote?: string | null;
    verifiedAt?: string | null;
    ratingsWaiting?: { id: number; taskTitle: string; daysLeft: number }[];
    warningSanction?: { id: number; reason: string } | null;
    activeSuspension?: { id: number; reason: string; endsAt: string | null } | null;
    sanctionContact?: string;
    recentAlerts?: { id: string; title: string; body: string; url: string; readAt: string | null; createdAt: string | null }[];
};

export default function Dashboard({
    status,
    studentsCanPost = true,
    unverifiedStudentsCanBrowse = true,
    autoVerifyInstitutionalStudent = true,
    verificationMethod = null,
    studentVerificationUrl = null,
    verificationNote,
    verifiedAt,
    ratingsWaiting = [],
    warningSanction,
    activeSuspension,
    sanctionContact,
    recentAlerts = [],
}: Props) {
    const { auth } = usePage().props;
    const user = auth.user;
    const isUnverifiedStudent = !user.is_admin && user.user_type === 'student' && user.verification_status !== 'verified';
    const studentVerifyHref = studentVerificationUrl ?? '/verification/student';

    return (
        <>
            <Head title="Dashboard" />
            <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 p-4 md:p-6">
                {status && <div role="status" className="rounded-lg border px-4 py-3 text-sm">{status}</div>}

                <section className="rounded-xl border p-5 md:p-6" aria-labelledby="next-step-title">
                    <div className="max-w-3xl">
                        <p className="text-sm font-medium text-muted-foreground">TaskMate</p>
                        <h1 id="next-step-title" className="mt-1 text-2xl font-semibold">
                            {isUnverifiedStudent ? 'Complete your CMU Student setup' : 'What would you like to do next?'}
                        </h1>

                        {user.is_admin ? (
                            <>
                                <p className="mt-2 text-sm text-muted-foreground">Review accounts, tasks, and reports that need administrator attention.</p>
                                <Link className="mt-4 inline-flex min-h-10 items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground underline-offset-4 hover:underline" href={admin.dashboard().url}>Open admin dashboard</Link>
                            </>
                        ) : activeSuspension ? (
                            <>
                                <p className="mt-2 text-sm text-muted-foreground">Posting, applying, and browsing are paused while your account is suspended. You can still review your account status and records.</p>
                                <Link className="mt-4 inline-flex min-h-10 items-center rounded-md border px-4 py-2 text-sm font-medium underline-offset-4 hover:underline" href="/my-sanctions">View account actions</Link>
                            </>
                        ) : isUnverifiedStudent ? (
                            <div className="mt-4 space-y-4">
                                {/* Duolingo-inspired visible onboarding progression */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                                        <span>Onboarding progress</span>
                                        <span>{user.verification_status === 'pending' ? 'Step 3 of 3 — In review' : '2 of 3 steps complete'}</span>
                                    </div>
                                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                                        <div
                                            className="h-full rounded-full bg-primary transition-all"
                                            style={{ width: user.verification_status === 'pending' ? '85%' : '67%' }}
                                        />
                                    </div>
                                    <ol className="grid gap-2 pt-2 text-xs sm:grid-cols-3">
                                        <li className="rounded-lg border bg-muted/20 p-3">
                                            <p className="font-semibold text-green-700 dark:text-green-300">1. Account created ✓</p>
                                            <p className="mt-0.5 text-muted-foreground">Your student profile is ready.</p>
                                        </li>
                                        <li className="rounded-lg border bg-muted/20 p-3">
                                            <p className="font-semibold text-green-700 dark:text-green-300">2. Email confirmed ✓</p>
                                            <p className="mt-0.5 text-muted-foreground">
                                                {unverifiedStudentsCanBrowse ? 'Preview browsing is unlocked.' : 'Your login email is confirmed.'}
                                            </p>
                                        </li>
                                        <li className="rounded-lg border border-primary/40 bg-primary/5 p-3">
                                            <p className="font-semibold">
                                                {user.verification_status === 'pending'
                                                    ? '3. Admin review pending'
                                                    : '3. Verify as CMU Student'}
                                            </p>
                                            <p className="mt-0.5 text-muted-foreground">
                                                {user.verification_status === 'pending'
                                                    ? autoVerifyInstitutionalStudent
                                                        ? 'Wait for approval, or verify instantly with a CMU email code.'
                                                        : 'An administrator is reviewing your details.'
                                                    : `Unlocks applying, messaging${studentsCanPost ? ', and posting' : ''}.`}
                                            </p>
                                        </li>
                                    </ol>
                                </div>

                                <p className="text-sm text-muted-foreground">
                                    {user.verification_status === 'unverified'
                                        ? `Your account is not verified as a CMU student yet. ${unverifiedStudentsCanBrowse ? 'You can browse approved tasks in preview mode now. ' : ''}Verify with your CMU email code${autoVerifyInstitutionalStudent ? ' for instant approval' : ''}, or submit your Student ID number and college/program for administrator review.`
                                        : user.verification_status === 'pending'
                                            ? `Your student verification request is awaiting administrator review.${autoVerifyInstitutionalStudent ? ' If you have access to your CMU institutional email, you can verify instantly instead.' : ''}`
                                            : 'Update your details to complete CMU student verification. Applying and posting remain unavailable until verified.'}
                                </p>

                                <div className="flex flex-wrap gap-3">
                                    <Link
                                        className="inline-flex min-h-10 items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground underline-offset-4 hover:underline"
                                        href={studentVerifyHref}
                                    >
                                        {user.verification_status === 'pending'
                                            ? 'Verify instantly with CMU email'
                                            : 'Verify as CMU Student'}
                                    </Link>
                                    {user.can_browse_tasks && (
                                        <Link
                                            className="inline-flex min-h-10 items-center rounded-md border px-4 py-2 text-sm font-medium underline-offset-4 hover:underline"
                                            href={browse.index().url}
                                        >
                                            Browse tasks (Preview)
                                        </Link>
                                    )}
                                    {['rejected', 'more_info_requested'].includes(user.verification_status) && (
                                        <Link
                                            className="inline-flex min-h-10 items-center rounded-md border px-4 py-2 text-sm font-medium underline-offset-4 hover:underline"
                                            href={verificationDetails.edit()}
                                        >
                                            Update submitted details
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ) : user.verification_status !== 'verified' ? (
                            <>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {user.verification_status === 'pending'
                                        ? user.user_type === 'faculty_staff'
                                            ? 'Your account is awaiting administrator review. After approval, you can post tasks. Faculty and staff accounts cannot apply to tasks.'
                                            : 'Your organization details are awaiting administrator review. After approval, you can post tasks. Organization accounts cannot browse or apply to tasks.'
                                        : 'Update the submitted details requested by the administrator. Your account will return to pending review, and task actions remain unavailable until it is approved.'}
                                </p>
                                {['rejected', 'more_info_requested'].includes(user.verification_status) && (
                                    <Link className="mt-4 inline-flex min-h-10 items-center rounded-md border px-4 py-2 text-sm font-medium underline-offset-4 hover:underline" href={verificationDetails.edit()}>Update submitted details</Link>
                                )}
                            </>
                        ) : (
                            <>
                                <p className="mt-2 text-sm text-muted-foreground">Find a suitable task, post work, or check the applications and tasks you already have.</p>
                                <div className="mt-4 flex flex-wrap gap-3">
                                    {user.can_apply_tasks && <Link className="inline-flex min-h-10 items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground underline-offset-4 hover:underline" href={browse.index().url}>Browse tasks</Link>}
                                    {user.can_post_tasks && <Link className="inline-flex min-h-10 items-center rounded-md border px-4 py-2 text-sm font-medium underline-offset-4 hover:underline" href={createTask().url}>Post a task</Link>}
                                    {user.can_apply_tasks && <Link className="inline-flex min-h-10 items-center rounded-md border px-4 py-2 text-sm font-medium underline-offset-4 hover:underline" href={applications.mine().url}>My applications</Link>}
                                    {user.can_post_tasks && <Link className="inline-flex min-h-10 items-center rounded-md border px-4 py-2 text-sm font-medium underline-offset-4 hover:underline" href={myTasks().url}>My tasks</Link>}
                                </div>
                            </>
                        )}
                    </div>
                </section>

                {warningSanction && <div className="rounded-lg border border-amber-400 bg-amber-50 p-4 text-sm text-amber-950"><p><strong>Account warning:</strong> {warningSanction.reason}</p><button className="mt-2 underline" type="button" onClick={() => router.post(`/my-sanctions/${warningSanction.id}/acknowledge`)}>Acknowledge warning</button></div>}
                {activeSuspension && <div role="status" className="rounded-lg border border-red-300 p-4 text-sm"><p>Your account is suspended until {activeSuspension.endsAt ? formatDateTime(activeSuspension.endsAt) : 'further notice'}.</p><p className="mt-1">{activeSuspension.reason}</p><p className="mt-1">{sanctionContact}</p></div>}

                <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4" aria-label="Account verification">
                    <div className="flex flex-wrap items-center gap-3">
                        <VerificationStatusBadge status={user.verification_status} />
                        {user.verification_status === 'verified' ? (
                            <p role="status" className="text-sm text-green-900 dark:text-green-200">
                                Your account is verified{verifiedAt ? ` as of ${formatDate(verifiedAt)}` : ''}
                                {verificationMethod === 'institutional_email' ? ' via CMU institutional email' : ''}.
                            </p>
                        ) : user.verification_status === 'unverified' ? (
                            <p role="status" className="text-sm">
                                Not verified as a CMU student yet. Verify your CMU student status to unlock applying, messaging{studentsCanPost ? ', and posting' : ''}.
                            </p>
                        ) : user.verification_status === 'pending' ? (
                            <p role="status" className="text-sm">Your account is awaiting administrator review. Applying and posting are unavailable until approval.</p>
                        ) : (
                            <div role="status" className="text-sm">
                                <p>{user.verification_status === 'more_info_requested' ? 'The administrator needs more information before completing the review. Update your details to return your account to review.' : 'Your account verification was rejected. Review the note and update your submitted details if you want another review.'}</p>
                                {verificationNote && <p className="mt-1">{verificationNote}</p>}
                            </div>
                        )}
                    </div>
                    {isUnverifiedStudent && (
                        <Link href={studentVerifyHref} className="text-sm font-medium underline underline-offset-4">
                            Verify as CMU Student
                        </Link>
                    )}
                </section>

                <SafetyNotice />

                {ratingsWaiting.length > 0 && <section className="space-y-3 rounded-xl border p-5"><h2 className="text-lg font-semibold">Ratings waiting for you</h2>{ratingsWaiting.map((rating) => <div key={rating.id} className="flex flex-wrap items-center justify-between gap-3 border-t pt-3"><div><p className="font-medium">{rating.taskTitle}</p><p className="text-sm text-muted-foreground">{rating.daysLeft} day{rating.daysLeft === 1 ? '' : 's'} left</p></div><Link className="text-sm underline" href={`/agreements/${rating.id}/rate`}>Rate your experience</Link></div>)}</section>}

                <section className="space-y-3 rounded-xl border p-5" aria-label="Recent activity">
                    <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Recent activity</h2><Link className="text-sm underline" href="/notifications">View all alerts</Link></div>
                    {recentAlerts.length ? recentAlerts.map((alert) => <Link key={alert.id} href={alert.url} className="block border-t pt-3"><p className="font-medium">{alert.title}</p><p className="text-sm text-muted-foreground">{alert.body}</p></Link>) : <p className="rounded border p-3 text-sm text-muted-foreground">No recent activity yet.</p>}
                </section>
            </div>
        </>
    );
}

Dashboard.layout = (props: { currentTeam?: { slug: string } | null }) => ({
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: props.currentTeam ? dashboard(props.currentTeam.slug) : '/dashboard',
        },
    ],
});
