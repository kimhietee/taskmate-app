import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import admin from '@/routes/admin';

type Action = {
    id: number;
    action: string;
    adminName: string | null;
    subjectName: string;
    note: string | null;
    createdAt: string | null;
};

type PendingTask = {
    id: number;
    title: string;
    posterName: string;
    submittedAt: string | null;
};

type Props = {
    counts: {
        pending: number;
        moreInfoRequested: number;
        verified: number;
        rejected: number;
        tasksAwaitingReview: number;
        openReports: number;
        reportsUnderReview: number;
        highPriorityReports: number;
        activeSuspensions: number;
    };
    recentActions: Action[];
    latestPendingTasks: PendingTask[];
};

export default function AdminDashboard({
    counts,
    recentActions,
    latestPendingTasks,
}: Props) {
    const attentionCards = [
        {
            label: 'Tasks awaiting review',
            count: counts.tasksAwaitingReview,
            href: admin.tasks.index({ query: { status: 'pending_review' } }),
            detail: 'Open task queue',
            tone: 'tasks',
        },
        {
            label: 'Accounts awaiting review',
            count: counts.pending,
            href: admin.users.index({
                query: { verification_status: 'pending' },
            }),
            detail: 'Review accounts',
            tone: 'accounts',
        },
        {
            label: 'Open reports',
            count: counts.openReports,
            href: admin.reports.index({ query: { status: 'open' } }),
            detail: 'Review reports',
            tone: 'reports',
        },
        {
            label: 'More information requested',
            count: counts.moreInfoRequested,
            href: admin.users.index({
                query: { verification_status: 'more_info_requested' },
            }),
            detail: 'View accounts',
            tone: 'info',
        },
    ];

    return (
        <>
            <Head title="Admin dashboard" />
            <div className="space-y-6 pb-4">
                <header className="admin-dashboard-hero flex flex-col justify-between gap-4 rounded-2xl p-5 sm:flex-row sm:items-end sm:p-6">
                    <div>
                        <p className="text-xs font-bold tracking-[0.14em] text-primary uppercase">
                            Administration
                        </p>
                        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
                            Admin dashboard
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Start with the latest submissions and requests that
                            need a decision.
                        </p>
                    </div>
                    <Link
                        href={admin.tasks.index({
                            query: { status: 'pending_review' },
                        })}
                        className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
                    >
                        Review tasks{' '}
                        <span aria-hidden="true" className="ml-2">
                            →
                        </span>
                    </Link>
                </header>

                <section
                    aria-label="Items needing attention"
                    className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
                >
                    {attentionCards.map((card) => (
                        <Link
                            key={card.label}
                            href={card.href}
                            aria-label={`${card.label}: ${card.count}. ${card.detail}`}
                            className={`admin-attention-card admin-attention-card--${card.tone} group flex min-h-36 flex-col justify-between rounded-xl p-4 shadow-sm transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none`}
                        >
                            <span className="text-sm font-semibold">
                                {card.label}
                            </span>
                            <div className="flex items-end justify-between gap-3">
                                <strong className="text-4xl leading-none font-semibold tabular-nums">
                                    {card.count}
                                </strong>
                                <span
                                    aria-hidden="true"
                                    className="admin-attention-arrow text-xl transition-transform group-hover:translate-x-1"
                                >
                                    →
                                </span>
                            </div>
                        </Link>
                    ))}
                </section>

                <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(17rem,1fr)]">
                    <section
                        aria-label="Latest tasks awaiting review"
                        className="overflow-hidden rounded-xl border bg-card shadow-sm"
                    >
                        <div className="admin-dashboard-section-header flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    Latest tasks awaiting review
                                </h2>
                                <p className="mt-0.5 text-sm text-muted-foreground">
                                    Newest submissions appear first.
                                </p>
                            </div>
                            <Link
                                href={admin.tasks.index({
                                    query: { status: 'pending_review' },
                                })}
                                className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
                            >
                                Review all
                            </Link>
                        </div>
                        {latestPendingTasks.length ? (
                            <ul className="divide-y">
                                {latestPendingTasks.map((task) => (
                                    <li key={task.id}>
                                        <Link
                                            href={admin.tasks.show(task.id)}
                                            className="group flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                                        >
                                            <span className="min-w-0">
                                                <span className="block truncate font-semibold group-hover:text-primary">
                                                    {task.title}
                                                </span>
                                                <span className="mt-1 block text-xs text-muted-foreground">
                                                    {task.posterName} ·{' '}
                                                    {task.submittedAt ??
                                                        'Date unavailable'}
                                                </span>
                                            </span>
                                            <span className="shrink-0 text-sm font-semibold text-primary">
                                                Review{' '}
                                                <span aria-hidden="true">
                                                    →
                                                </span>
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="px-5 py-10 text-center">
                                <p className="font-medium">All caught up</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    No tasks are waiting for review.
                                </p>
                            </div>
                        )}
                    </section>

                    <aside className="space-y-5">
                        <section className="admin-dashboard-side-panel admin-dashboard-side-panel--accounts rounded-xl border p-5 shadow-sm">
                            <h2 className="font-semibold">Account status</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                A quick view of verification decisions.
                            </p>
                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <Link
                                    href={admin.users.index({
                                        query: {
                                            verification_status: 'verified',
                                        },
                                    })}
                                    className="admin-status-verified rounded-lg border p-3 hover:brightness-95"
                                >
                                    <span className="block text-xs text-muted-foreground">
                                        Verified
                                    </span>
                                    <strong className="mt-1 block text-2xl tabular-nums">
                                        {counts.verified}
                                    </strong>
                                </Link>
                                <Link
                                    href={admin.users.index({
                                        query: {
                                            verification_status: 'rejected',
                                        },
                                    })}
                                    className="admin-status-rejected rounded-lg border p-3 hover:brightness-95"
                                >
                                    <span className="block text-xs text-muted-foreground">
                                        Rejected
                                    </span>
                                    <strong className="mt-1 block text-2xl tabular-nums">
                                        {counts.rejected}
                                    </strong>
                                </Link>
                            </div>
                        </section>

                        <section className="admin-dashboard-side-panel admin-dashboard-side-panel--activity rounded-xl border p-5 shadow-sm">
                            <h2 className="font-semibold">Other activity</h2>
                            <div className="mt-3 divide-y text-sm">
                                <Link
                                    href={admin.reports.index({
                                        query: { status: 'under_review' },
                                    })}
                                    className="flex items-center justify-between gap-3 py-2.5 hover:text-primary"
                                >
                                    <span>Reports under review</span>
                                    <strong className="tabular-nums">
                                        {counts.reportsUnderReview}
                                    </strong>
                                </Link>
                                <Link
                                    href={admin.reports.index({
                                        query: { priority: 'high' },
                                    })}
                                    className="flex items-center justify-between gap-3 py-2.5 hover:text-primary"
                                >
                                    <span>High-priority reports</span>
                                    <strong className="tabular-nums">
                                        {counts.highPriorityReports}
                                    </strong>
                                </Link>
                                <div className="flex items-center justify-between gap-3 py-2.5">
                                    <span>Active suspensions</span>
                                    <strong className="tabular-nums">
                                        {counts.activeSuspensions}
                                    </strong>
                                </div>
                            </div>
                        </section>
                    </aside>
                </div>

                <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <div className="admin-dashboard-section-header flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
                        <div>
                            <h2 className="text-lg font-semibold">
                                Recent admin actions
                            </h2>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                The latest decisions and account updates.
                            </p>
                        </div>
                        <Link
                            href={admin.users.index()}
                            className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
                        >
                            Review users
                        </Link>
                    </div>
                    {recentActions.length ? (
                        <ul className="divide-y">
                            {recentActions.map((item) => (
                                <li key={item.id} className="px-5 py-3.5">
                                    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                                        <div>
                                            <p className="font-medium capitalize">
                                                {item.action.replaceAll(
                                                    '_',
                                                    ' ',
                                                )}
                                                <span className="font-normal text-muted-foreground">
                                                    {' '}
                                                    · {item.subjectName}
                                                </span>
                                            </p>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                By{' '}
                                                {item.adminName ??
                                                    'System or former admin'}
                                            </p>
                                        </div>
                                        <time className="text-xs whitespace-nowrap text-muted-foreground">
                                            {item.createdAt ??
                                                'Date unavailable'}
                                        </time>
                                    </div>
                                    {item.note && (
                                        <p className="mt-2 rounded-md bg-muted/40 px-3 py-2 text-sm break-words text-muted-foreground">
                                            {item.note}
                                        </p>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                            No admin actions have been recorded yet.
                        </p>
                    )}
                </section>
            </div>
        </>
    );
}

AdminDashboard.layout = (page: React.ReactNode) => (
    <AdminLayout>{page}</AdminLayout>
);
