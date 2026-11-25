import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Bell,
    Briefcase,
    CircleAlert,
    CircleCheck,
    Clock,
    FileText,
    PlusCircle,
    Search,
    TriangleAlert,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VerificationStatusBadge } from '@/components/verification-status-badge';
import { formatDate, formatDateTime } from '@/lib/format';
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
    const needsDetailUpdate = ['rejected', 'more_info_requested'].includes(user.verification_status);
    const studentVerifyHref = studentVerificationUrl ?? '/verification/student';

    const quickActionTiles = [
        ...(user.can_apply_tasks
            ? [
                { label: 'Browse tasks', href: browse.index().url, icon: Search },
                { label: 'My applications', href: applications.mine().url, icon: FileText },
            ]
            : []),
        ...(user.can_post_tasks
            ? [
                { label: 'Post a task', href: createTask().url, icon: PlusCircle },
                { label: 'My tasks', href: myTasks().url, icon: Briefcase },
            ]
            : []),
    ];

    const primaryVerifiedAction = user.can_apply_tasks
        ? { label: 'Browse tasks', href: browse.index().url }
        : user.can_post_tasks
            ? { label: 'Post a task', href: createTask().url }
            : null;

    return (
        <>
            <Head title="Dashboard" />
            <div className="page space-y-6">
                {status && (
                    <div
                        role="status"
                        className="rounded-lg border border-success-border bg-success-bg px-4 py-3 text-sm text-success-fg"
                    >
                        {status}
                    </div>
                )}

                {warningSanction && (
                    <Alert variant="warning">
                        <TriangleAlert aria-hidden="true" />
                        <AlertTitle>Account warning</AlertTitle>
                        <AlertDescription className="space-y-3">
                            <p>{warningSanction.reason}</p>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => router.post(`/my-sanctions/${warningSanction.id}/acknowledge`)}
                            >
                                Acknowledge warning
                            </Button>
                        </AlertDescription>
                    </Alert>
                )}

                {activeSuspension && (
                    <Alert variant="destructive">
                        <CircleAlert aria-hidden="true" />
                        <AlertTitle>Account suspended</AlertTitle>
                        <AlertDescription className="space-y-1">
                            <p>
                                Your account is suspended until{' '}
                                <span className="tabular-nums">
                                    {activeSuspension.endsAt ? formatDateTime(activeSuspension.endsAt) : 'further notice'}
                                </span>
                                .
                            </p>
                            <p>{activeSuspension.reason}</p>
                            {sanctionContact && <p>{sanctionContact}</p>}
                        </AlertDescription>
                    </Alert>
                )}

                <Card aria-labelledby="next-step-title">
                    <CardHeader className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Welcome back
                        </p>
                        <CardTitle id="next-step-title" className="text-2xl font-semibold tracking-tight md:text-3xl">
                            {isUnverifiedStudent ? 'Complete your CMU Student setup' : `Welcome back, ${user.name}`}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {user.is_admin ? (
                            <>
                                <p className="text-sm text-muted-foreground">
                                    Review accounts, tasks, and reports that need administrator attention.
                                </p>
                                <div>
                                    <Button asChild>
                                        <Link href={admin.dashboard().url}>Open admin dashboard</Link>
                                    </Button>
                                </div>
                            </>
                        ) : activeSuspension ? (
                            <>
                                <p className="text-sm text-muted-foreground">
                                    Posting, applying, and browsing are paused while your account is suspended. You can still review your account status and records.
                                </p>
                                <div>
                                    <Button variant="outline" asChild>
                                        <Link href="/my-sanctions">View account actions</Link>
                                    </Button>
                                </div>
                            </>
                        ) : isUnverifiedStudent ? (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs font-semibold tabular-nums text-muted-foreground">
                                        <span>Onboarding progress</span>
                                        <span>
                                            {user.verification_status === 'pending'
                                                ? 'Step 3 of 3 — In review'
                                                : needsDetailUpdate
                                                    ? 'Step 3 of 3 — Update needed'
                                                    : '2 of 3 steps complete'}
                                        </span>
                                    </div>
                                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                                        <div
                                            className={`h-full rounded-full bg-brand transition-all ${user.verification_status === 'pending' ? 'w-5/6' : 'w-2/3'
                                                }`}
                                        />
                                    </div>
                                    <ol className="grid gap-2 pt-2 text-xs sm:grid-cols-3">
                                        <li className="rounded-lg border border-border bg-muted/40 p-3">
                                            <p className="flex items-center gap-1.5 font-semibold text-success-fg">
                                                <CircleCheck className="size-4 shrink-0" aria-hidden="true" />
                                                <span>1. Account created</span>
                                            </p>
                                            <p className="mt-1 text-muted-foreground">Your student profile is ready.</p>
                                        </li>
                                        <li className="rounded-lg border border-border bg-muted/40 p-3">
                                            <p className="flex items-center gap-1.5 font-semibold text-success-fg">
                                                <CircleCheck className="size-4 shrink-0" aria-hidden="true" />
                                                <span>2. Email confirmed</span>
                                            </p>
                                            <p className="mt-1 text-muted-foreground">
                                                {unverifiedStudentsCanBrowse ? 'Preview browsing is unlocked.' : 'Your login email is confirmed.'}
                                            </p>
                                        </li>
                                        <li className="rounded-lg border border-brand/50 bg-info-bg/30 p-3">
                                            <p
                                                className={`flex items-center gap-1.5 font-semibold ${user.verification_status === 'rejected'
                                                        ? 'text-danger-fg'
                                                        : 'text-warning-fg'
                                                    }`}
                                            >
                                                {user.verification_status === 'pending' ? (
                                                    <Clock className="size-4 shrink-0" aria-hidden="true" />
                                                ) : (
                                                    <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
                                                )}
                                                <span>
                                                    {user.verification_status === 'pending'
                                                        ? '3. Admin review pending'
                                                        : needsDetailUpdate
                                                            ? '3. Update required'
                                                            : '3. Verify as CMU Student'}
                                                </span>
                                            </p>
                                            <p className="mt-1 text-muted-foreground">
                                                {user.verification_status === 'pending'
                                                    ? autoVerifyInstitutionalStudent
                                                        ? 'Wait for approval, or verify instantly with a CMU email code.'
                                                        : 'An administrator is reviewing your details.'
                                                    : needsDetailUpdate
                                                        ? 'Review the administrator note and update your details.'
                                                        : `Unlocks applying, messaging${studentsCanPost ? ', and posting' : ''}.`}
                                            </p>
                                        </li>
                                    </ol>
                                </div>

                                <p className="text-sm text-muted-foreground">
                                    {user.verification_status === 'unverified'
                                        ? `Verify with your CMU email code${autoVerifyInstitutionalStudent ? ' for instant approval' : ''} or submit your Student ID and program to unlock applying${studentsCanPost ? ' and posting' : ''}.`
                                        : user.verification_status === 'pending'
                                            ? `Your student verification is awaiting review.${autoVerifyInstitutionalStudent ? ' You can verify instantly anytime using your CMU email.' : ''}`
                                            : 'Update your submitted details so an administrator can complete your review.'}
                                </p>

                                <div className="flex flex-wrap items-center gap-3">
                                    <Button asChild>
                                        <Link href={studentVerifyHref}>
                                            {user.verification_status === 'pending'
                                                ? 'Verify instantly with CMU email'
                                                : 'Verify as CMU Student'}
                                        </Link>
                                    </Button>
                                    {user.can_browse_tasks && (
                                        <Button variant="outline" asChild>
                                            <Link href={browse.index().url}>Browse tasks (Preview)</Link>
                                        </Button>
                                    )}
                                    {needsDetailUpdate && (
                                        <Button variant="outline" asChild>
                                            <Link href={verificationDetails.edit()}>Update submitted details</Link>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ) : user.verification_status !== 'verified' ? (
                            <>
                                <p className="text-sm text-muted-foreground">
                                    {user.verification_status === 'pending'
                                        ? user.user_type === 'faculty_staff'
                                            ? 'Your account is awaiting administrator review. Posting unlocks after approval.'
                                            : 'Your organization details are awaiting administrator review. Posting unlocks after approval.'
                                        : 'Update the submitted details requested by the administrator to return your account to review.'}
                                </p>
                                {needsDetailUpdate && (
                                    <div>
                                        <Button asChild>
                                            <Link href={verificationDetails.edit()}>Update submitted details</Link>
                                        </Button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <p className="text-sm text-muted-foreground">
                                        Find a suitable task, post work, or check the applications and tasks you already have.
                                    </p>
                                    {primaryVerifiedAction && (
                                        <Button asChild>
                                            <Link href={primaryVerifiedAction.href}>{primaryVerifiedAction.label}</Link>
                                        </Button>
                                    )}
                                </div>
                                {quickActionTiles.length > 0 && (
                                    <div className="grid grid-cols-2 gap-3">
                                        {quickActionTiles.map((tile) => {
                                            const Icon = tile.icon;
                                            return (
                                                <Link
                                                    key={tile.label}
                                                    href={tile.href}
                                                    className="focus-ring flex min-h-11 items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-3 text-sm font-semibold leading-snug text-foreground shadow-xs transition-colors hover:border-brand/50 hover:bg-muted/40 sm:gap-3 sm:p-3.5"
                                                >
                                                    <Icon className="size-4 shrink-0 text-brand" aria-hidden="true" />
                                                    <span className="min-w-0">{tile.label}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
                    <div className="space-y-6">
                        {ratingsWaiting.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Ratings waiting for you</CardTitle>
                                </CardHeader>
                                <CardContent className="divide-y divide-border">
                                    {ratingsWaiting.map((rating) => (
                                        <div
                                            key={rating.id}
                                            className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                                        >
                                            <div className="space-y-1">
                                                <p className="text-sm font-semibold text-foreground">{rating.taskTitle}</p>
                                                <Badge variant="warning" className="tabular-nums">
                                                    {rating.daysLeft} day{rating.daysLeft === 1 ? '' : 's'} left
                                                </Badge>
                                            </div>
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/agreements/${rating.id}/rate`}>
                                                    Rate your experience
                                                </Link>
                                            </Button>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        <Card aria-label="Recent activity">
                            <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
                                <CardTitle>Recent activity</CardTitle>
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href="/notifications">View all alerts</Link>
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {recentAlerts.length ? (
                                    <div className="divide-y divide-border">
                                        {recentAlerts.map((alert) => (
                                            <Link
                                                key={alert.id}
                                                href={alert.url}
                                                className="focus-ring flex items-start gap-3 rounded-md px-2 py-3 transition-colors hover:bg-muted/30"
                                            >
                                                <span
                                                    aria-hidden="true"
                                                    className={`mt-2 size-2 shrink-0 rounded-full ${alert.readAt ? 'bg-transparent' : 'bg-brand'
                                                        }`}
                                                />
                                                <Bell
                                                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                                                    aria-hidden="true"
                                                />
                                                <div className="min-w-0 flex-1 space-y-0.5">
                                                    <p className="text-sm font-semibold text-foreground">
                                                        {alert.title}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">{alert.body}</p>
                                                    {alert.createdAt && (
                                                        <p className="text-xs tabular-nums text-muted-foreground">
                                                            {formatDateTime(alert.createdAt)}
                                                        </p>
                                                    )}
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="py-6 text-center text-sm text-muted-foreground">
                                        No recent activity yet.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="order-first p-4 md:p-5 lg:order-last" aria-label="Account verification">
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <VerificationStatusBadge status={user.verification_status} />
                            </div>
                            {user.verification_status === 'verified' ? (
                                <p role="status" className="text-sm text-success-fg">
                                    Verified
                                    {verifiedAt ? (
                                        <>
                                            {' '}
                                            on <span className="tabular-nums">{formatDate(verifiedAt)}</span>
                                        </>
                                    ) : (
                                        ''
                                    )}
                                    {verificationMethod === 'institutional_email' ? ' via CMU institutional email' : ''}.
                                </p>
                            ) : user.verification_status === 'unverified' ? (
                                <p role="status" className="text-sm text-muted-foreground">
                                    Verify your CMU student status to unlock applying, messaging
                                    {studentsCanPost ? ', and posting' : ''}.
                                </p>
                            ) : user.verification_status === 'pending' ? (
                                <p role="status" className="text-sm text-muted-foreground">
                                    Awaiting administrator review before full task actions unlock.
                                </p>
                            ) : (
                                <div role="status" className="space-y-1.5 text-sm text-muted-foreground">
                                    <p>
                                        {user.verification_status === 'more_info_requested'
                                            ? 'More information was requested for your verification review.'
                                            : 'Your verification was rejected. Update your details to request another review.'}
                                    </p>
                                    {verificationNote && (
                                        <p className="rounded-md border border-border bg-muted/40 p-2.5 text-xs text-foreground">
                                            {verificationNote}
                                        </p>
                                    )}
                                </div>
                            )}

                            {isUnverifiedStudent ? (
                                <div>
                                    <Button variant="link" size="sm" className="h-auto p-0" asChild>
                                        <Link href={studentVerifyHref}>Verify as CMU Student</Link>
                                    </Button>
                                </div>
                            ) : needsDetailUpdate && !user.is_admin ? (
                                <div>
                                    <Button variant="link" size="sm" className="h-auto p-0" asChild>
                                        <Link href={verificationDetails.edit()}>Update submitted details</Link>
                                    </Button>
                                </div>
                            ) : null}
                        </div>
                    </Card>
                </div>
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
