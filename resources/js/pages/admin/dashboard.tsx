import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { VerificationStatusBadge } from '@/components/verification-status-badge';
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
        unverified?: number;
        pending: number;
        moreInfoRequested: number;
        verified: number;
        rejected: number;
        tasksAwaitingReview: number;
        openReports: number;
        reportsUnderReview: number;
        highPriorityReports: number;
        escalatedReports: number;
        openFlags: number;
        activeSuspensions: number;
    };
    recentActions: Action[];
    latestPendingTasks: PendingTask[];
};

const countCards = [
    { key: 'pending', label: 'Awaiting review', status: 'pending' as const },
    { key: 'moreInfoRequested', label: 'More information requested', status: 'more_info_requested' as const },
    { key: 'verified', label: 'Verified', status: 'verified' as const },
    { key: 'rejected', label: 'Rejected', status: 'rejected' as const },
];

const PRIMARY_LINK_CLASS =
    'focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 md:h-9';
const OUTLINE_LINK_CLASS =
    'focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-semibold text-foreground shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground md:h-9';

export default function AdminDashboard({ counts, recentActions, latestPendingTasks }: Props) {
    const queueLinks = [
        {
            label: 'Tasks awaiting review',
            count: counts.tasksAwaitingReview,
            href: admin.tasks.index({ query: { status: 'pending_review' } }),
        },
        {
            label: 'Open reports',
            count: counts.openReports,
            href: admin.reports.index({ query: { status: 'open' } }),
        },
        {
            label: 'Reports under review',
            count: counts.reportsUnderReview,
            href: admin.reports.index({ query: { status: 'under_review' } }),
        },
        {
            label: 'High-priority reports',
            count: counts.highPriorityReports,
            href: admin.reports.index({ query: { priority: 'high' } }),
        },
        {
            label: 'Escalated reports',
            count: counts.escalatedReports,
            href: admin.reports.index({ query: { escalated: '1' } }),
        },
        {
            label: 'Open content flags',
            count: counts.openFlags,
            href: '/admin/flags',
        },
        {
            label: 'Active suspensions',
            count: counts.activeSuspensions,
            href: admin.users.index(),
        },
    ];

    return (
        <>
            <Head title="Admin dashboard" />
            <div className="space-y-8">
                <header>
                    <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Admin dashboard</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Review account verification and recent actions.
                    </p>
                </header>

                <section aria-label="Verification counts" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {countCards.map((card) => (
                        <div
                            key={card.key}
                            className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-xs"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                                <span className="text-xs font-semibold text-muted-foreground">{card.label}</span>
                                <VerificationStatusBadge status={card.status} />
                            </div>
                            <p className="mt-3 text-3xl font-semibold tabular-nums text-foreground">
                                {counts[card.key as keyof Props['counts']] ?? 0}
                            </p>
                        </div>
                    ))}
                </section>

                <section aria-label="Moderation queue counts" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {queueLinks.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="focus-ring flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-xs transition-colors hover:border-brand/50 hover:bg-muted/30"
                        >
                            <span className="text-xs font-semibold text-muted-foreground">{item.label}</span>
                            <p className="mt-3 text-3xl font-semibold tabular-nums text-foreground">{item.count}</p>
                        </Link>
                    ))}
                </section>

                <section aria-label="Latest tasks awaiting review" className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold">Latest tasks awaiting review</h2>
                            <p className="text-sm text-muted-foreground">The newest submissions appear first.</p>
                        </div>
                        <Link
                            href={admin.tasks.index({ query: { status: 'pending_review' } })}
                            className={PRIMARY_LINK_CLASS}
                        >
                            Review all
                        </Link>
                    </div>

                    {latestPendingTasks.length ? (
                        <>
                            <div className="hidden overflow-x-auto rounded-xl border border-border bg-card shadow-xs md:block">
                                <table className="w-full border-collapse text-left text-sm">
                                    <thead className="sticky top-0 z-10 border-b border-border bg-muted/60 text-xs font-semibold text-muted-foreground">
                                        <tr>
                                            <th className="px-4 py-3">Task</th>
                                            <th className="px-4 py-3">Poster</th>
                                            <th className="px-4 py-3">Submitted</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {latestPendingTasks.map((task) => (
                                            <tr key={task.id} className="transition-colors hover:bg-muted/30">
                                                <td className="px-4 py-3">
                                                    <Link
                                                        className="focus-ring rounded-sm font-semibold text-brand underline-offset-4 hover:underline"
                                                        href={admin.tasks.show(task.id)}
                                                    >
                                                        {task.title}
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-3 text-foreground">{task.posterName}</td>
                                                <td className="px-4 py-3 whitespace-nowrap tabular-nums text-muted-foreground">
                                                    {task.submittedAt ?? '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="grid gap-3 md:hidden">
                                {latestPendingTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className="space-y-1.5 rounded-xl border border-border bg-card p-4 shadow-xs"
                                    >
                                        <Link
                                            className="focus-ring block rounded-sm font-semibold text-brand underline-offset-4 hover:underline"
                                            href={admin.tasks.show(task.id)}
                                        >
                                            {task.title}
                                        </Link>
                                        <p className="text-xs text-muted-foreground">{task.posterName}</p>
                                        <p className="text-xs tabular-nums text-muted-foreground">
                                            Submitted: {task.submittedAt ?? '—'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground shadow-xs">
                            No tasks are waiting for review.
                        </p>
                    )}
                </section>

                <section className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-lg font-semibold">Recent admin actions</h2>
                        <Link href={admin.users.index()} className={OUTLINE_LINK_CLASS}>
                            Review users
                        </Link>
                    </div>

                    {recentActions.length ? (
                        <>
                            <div className="hidden overflow-x-auto rounded-xl border border-border bg-card shadow-xs md:block">
                                <table className="w-full border-collapse text-left text-sm">
                                    <thead className="sticky top-0 z-10 border-b border-border bg-muted/60 text-xs font-semibold text-muted-foreground">
                                        <tr>
                                            <th className="px-4 py-3">Action</th>
                                            <th className="px-4 py-3">Account</th>
                                            <th className="px-4 py-3">Actor</th>
                                            <th className="px-4 py-3">Note</th>
                                            <th className="px-4 py-3">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {recentActions.map((item) => (
                                            <tr key={item.id} className="align-top transition-colors hover:bg-muted/30">
                                                <td className="px-4 py-3 font-medium capitalize text-foreground">
                                                    {item.action.replaceAll('_', ' ')}
                                                </td>
                                                <td className="px-4 py-3 text-foreground">{item.subjectName}</td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {item.adminName ?? 'Account removed'}
                                                </td>
                                                <td className="max-w-xs px-4 py-3 whitespace-pre-wrap text-muted-foreground">
                                                    {item.note ?? '—'}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap tabular-nums text-muted-foreground">
                                                    {item.createdAt ?? '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="grid gap-3 md:hidden">
                                {recentActions.map((item) => (
                                    <div
                                        key={item.id}
                                        className="space-y-2 rounded-xl border border-border bg-card p-4 shadow-xs"
                                    >
                                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                                            <span className="font-semibold capitalize text-foreground">
                                                {item.action.replaceAll('_', ' ')}
                                            </span>
                                            <span className="text-xs tabular-nums text-muted-foreground">
                                                {item.createdAt ?? '—'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-foreground">
                                            {item.subjectName} · {item.adminName ?? 'Account removed'}
                                        </p>
                                        {item.note && (
                                            <p className="whitespace-pre-wrap text-xs text-muted-foreground">
                                                {item.note}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground shadow-xs">
                            No admin actions have been recorded yet.
                        </p>
                    )}
                </section>
            </div>
        </>
    );
}

AdminDashboard.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
