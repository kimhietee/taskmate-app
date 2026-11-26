import { formatDate, formatDateTime } from "@/lib/format";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { SafetyNotice } from "@/components/safety-notice";
import { VerificationStatusBadge } from "@/components/verification-status-badge";
import { ArrowRight, Bell, Clock3, IdCard, Mail, Star, TriangleAlert } from "lucide-react";
import { dashboard } from "@/routes";
import admin from "@/routes/admin";
import applications from "@/routes/applications";
import browse from "@/routes/browse";
import { create as createTask, mine as myTasks } from "@/routes/tasks";
import verificationDetails from "@/routes/verification/details";

type Props = {
    status?: string | null;
    accountIdentity: { email: string; idNumber: string | null };
    studentsCanPost?: boolean;
    verificationNote?: string | null;
    verifiedAt?: string | null;
    ratingsWaiting?: { id: number; taskTitle: string; daysLeft: number }[];
    warningSanction?: { id: number; reason: string } | null;
    activeSuspension?: {
        id: number;
        reason: string;
        endsAt: string | null;
    } | null;
    sanctionContact?: string;
    recentAlerts?: {
        id: string;
        title: string;
        body: string;
        url: string;
        readAt: string | null;
        createdAt: string | null;
    }[];
};

export default function Dashboard({
    status,
    accountIdentity,
    studentsCanPost = true,
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

    return (
        <>
            <Head title="Dashboard" />
            <div
                className={`mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 p-4 sm:p-6 lg:p-8 ${user.is_admin ? "" : "student-dashboard"}`}
            >
                {status && (
                    <div role="status" className="rounded-lg border px-4 py-3 text-sm">
                        {status}
                    </div>
                )}

                <section
                    className={`relative overflow-hidden rounded-2xl border border-t-4 border-t-brand-gold p-5 shadow-sm md:p-7 ${user.is_admin ? "bg-card" : "student-dashboard-hero"}`}
                    aria-labelledby="next-step-title"
                >
                    <div className="student-dashboard-hero-content">
                        <div className="max-w-4xl">
                            <p className="text-sm font-semibold tracking-wide text-primary uppercase">
                                Your TaskMate workspace
                            </p>
                            <h1
                                id="next-step-title"
                                className="mt-1 text-3xl font-semibold tracking-tight"
                            >
                                Good day, {user.name}
                            </h1>

                            {user.is_admin ? (
                                <>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Review accounts, tasks, and reports that need administrator
                                        attention.
                                    </p>
                                    <Link
                                        className="mt-4 inline-flex min-h-11 items-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        href={admin.dashboard().url}
                                    >
                                        Open admin dashboard
                                    </Link>
                                </>
                            ) : activeSuspension ? (
                                <>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Posting, applying, and browsing are paused while your
                                        account is suspended. You can still review your account
                                        status and records.
                                    </p>
                                    <Link
                                        className="mt-4 inline-flex min-h-11 items-center rounded-md border bg-card px-5 py-2.5 text-sm font-semibold transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        href="/my-sanctions"
                                    >
                                        View account actions
                                    </Link>
                                </>
                            ) : user.verification_status !== "verified" ? (
                                <>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        {user.verification_status === "pending"
                                            ? user.user_type === "student"
                                                ? `Your account is awaiting administrator review. You can browse approved tasks now; verification is required before applying${studentsCanPost ? ". You can also post tasks after approval" : ""}.`
                                                : user.user_type === "faculty_staff"
                                                  ? "Your account is awaiting administrator review. After approval, you can post tasks. Faculty and staff accounts cannot apply to tasks."
                                                  : "Your organization details are awaiting administrator review. After approval, you can post tasks. Organization accounts cannot browse or apply to tasks."
                                            : "Update the submitted details requested by the administrator. Your account will return to pending review, and task actions remain unavailable until it is approved."}
                                    </p>
                                    {user.user_type === "student" && user.can_browse_tasks && (
                                        <Link
                                            className="mt-4 inline-flex min-h-11 items-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            href={browse.index().url}
                                        >
                                            Browse tasks
                                        </Link>
                                    )}
                                    {["rejected", "more_info_requested"].includes(
                                        user.verification_status,
                                    ) && (
                                        <Link
                                            className="mt-4 inline-flex min-h-10 items-center rounded-md border px-4 py-2 text-sm font-medium underline-offset-4 hover:underline"
                                            href={verificationDetails.edit()}
                                        >
                                            Update submitted details
                                        </Link>
                                    )}
                                </>
                            ) : (
                                <>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Find a suitable task, post work, or check the applications
                                        and tasks you already have.
                                    </p>
                                    <div className="mt-4 flex flex-wrap gap-3">
                                        {user.can_browse_tasks && (
                                            <Link
                                                className="inline-flex min-h-11 items-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                href={browse.index().url}
                                            >
                                                Browse tasks
                                            </Link>
                                        )}
                                        {user.can_post_tasks && (
                                            <Link
                                                className="inline-flex min-h-11 items-center rounded-md border bg-card px-5 py-2.5 text-sm font-semibold transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                href={createTask().url}
                                            >
                                                Post a task
                                            </Link>
                                        )}
                                        {user.can_apply_tasks && (
                                            <Link
                                                className="inline-flex min-h-11 items-center rounded-md border bg-card px-5 py-2.5 text-sm font-semibold transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                href={applications.mine().url}
                                            >
                                                My applications
                                            </Link>
                                        )}
                                        {user.can_post_tasks && (
                                            <Link
                                                className="inline-flex min-h-10 items-center rounded-md border px-4 py-2 text-sm font-medium underline-offset-4 hover:underline"
                                                href={myTasks().url}
                                            >
                                                My tasks
                                            </Link>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                        {!user.is_admin && (
                            <aside
                                className="student-dashboard-hero-badge"
                                aria-label="Account verification status"
                            >
                                <VerificationStatusBadge status={user.verification_status} />
                                {user.verification_status === "verified" ? (
                                    <p role="status" className="student-dashboard-status-copy">
                                        Your account is verified
                                        {verifiedAt ? ` as of ${formatDate(verifiedAt)}` : ""}.
                                    </p>
                                ) : user.verification_status === "pending" ? (
                                    <p role="status" className="student-dashboard-status-copy">
                                        Your account is awaiting administrator review.
                                    </p>
                                ) : (
                                    <div role="status" className="student-dashboard-status-copy">
                                        <p>
                                            {user.verification_status === "more_info_requested"
                                                ? "More information is needed to complete your review."
                                                : "Your account verification was rejected."}
                                        </p>
                                        {verificationNote && <p>{verificationNote}</p>}
                                    </div>
                                )}
                            </aside>
                        )}
                    </div>
                </section>

                {warningSanction && (
                    <div className="student-dashboard-warning" role="status">
                        <TriangleAlert aria-hidden="true" />
                        <p>
                            <strong>Account warning</strong>
                            <span>{warningSanction.reason}</span>
                        </p>
                        <button
                            className="student-dashboard-warning-action"
                            type="button"
                            onClick={() =>
                                router.post(`/my-sanctions/${warningSanction.id}/acknowledge`)
                            }
                        >
                            Acknowledge <ArrowRight aria-hidden="true" />
                        </button>
                    </div>
                )}
                {activeSuspension && (
                    <div role="status" className="rounded-lg border border-red-300 p-4 text-sm">
                        <p>
                            Your account is suspended until{" "}
                            {activeSuspension.endsAt
                                ? formatDateTime(activeSuspension.endsAt)
                                : "further notice"}
                            .
                        </p>
                        <p className="mt-1">{activeSuspension.reason}</p>
                        <p className="mt-1">{sanctionContact}</p>
                    </div>
                )}

                <div className="student-dashboard-overview">
                    <section
                        className="space-y-2 rounded-2xl border bg-card p-5 shadow-sm"
                        aria-label="Your account details"
                    >
                        <h2 className="student-dashboard-card-title">
                            <span className="student-dashboard-icon">
                                <IdCard aria-hidden="true" />
                            </span>
                            Your account details
                        </h2>
                        <p className="student-dashboard-account-row">
                            <Mail aria-hidden="true" />
                            <strong>Email:</strong> {accountIdentity.email}
                        </p>
                        {accountIdentity.idNumber && (
                            <p className="student-dashboard-account-row">
                                <IdCard aria-hidden="true" />
                                <strong>ID number:</strong> {accountIdentity.idNumber}
                            </p>
                        )}
                    </section>
                </div>

                <SafetyNotice />

                <div className="student-dashboard-activity">
                    {ratingsWaiting.length > 0 && (
                        <section className="space-y-3 rounded-2xl border bg-card p-5 shadow-sm">
                            <h2 className="student-dashboard-card-title">
                                <span className="student-dashboard-icon student-dashboard-icon--rating">
                                    <Star aria-hidden="true" />
                                </span>
                                Ratings waiting for you
                            </h2>
                            {ratingsWaiting.map((rating) => (
                                <div key={rating.id} className="student-dashboard-rating-row">
                                    <div className="student-dashboard-rating-info">
                                        <span className="student-dashboard-rating-icon">
                                            <Star aria-hidden="true" />
                                        </span>
                                        <div>
                                            <p className="font-medium">{rating.taskTitle}</p>
                                            <p className="text-sm text-muted-foreground">
                                                <Clock3
                                                    aria-hidden="true"
                                                    className="mr-1 inline size-3.5"
                                                />
                                                {rating.daysLeft} day
                                                {rating.daysLeft === 1 ? "" : "s"} left
                                            </p>
                                        </div>
                                    </div>
                                    <Link
                                        className="student-dashboard-rating-link"
                                        href={`/agreements/${rating.id}/rate`}
                                    >
                                        Rate now <ArrowRight aria-hidden="true" />
                                    </Link>
                                </div>
                            ))}
                        </section>
                    )}

                    <section
                        className="space-y-3 rounded-2xl border bg-card p-5 shadow-sm"
                        aria-label="Recent activity"
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="student-dashboard-card-title">
                                <span className="student-dashboard-icon">
                                    <Bell aria-hidden="true" />
                                </span>
                                Recent activity
                            </h2>
                            <Link className="student-dashboard-view-all" href="/notifications">
                                View all alerts
                            </Link>
                        </div>
                        {recentAlerts.length ? (
                            recentAlerts.map((alert) => (
                                <Link
                                    key={alert.id}
                                    href={alert.url}
                                    className="student-dashboard-alert-row"
                                >
                                    <p className="font-medium">{alert.title}</p>
                                    <p className="text-sm text-muted-foreground">{alert.body}</p>
                                </Link>
                            ))
                        ) : (
                            <p className="rounded border p-3 text-sm text-muted-foreground">
                                No recent activity yet.
                            </p>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = (props: { currentTeam?: { slug: string } | null }) => ({
    breadcrumbs: [
        {
            title: "Dashboard",
            href: props.currentTeam ? dashboard(props.currentTeam.slug) : "/dashboard",
        },
    ],
});
