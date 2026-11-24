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

export default function AdminDashboard({ counts, recentActions, latestPendingTasks }: Props) {
    return (
        <>
            <Head title="Admin dashboard" />
            <div className="space-y-8">
                <div>
                    <h1 className="text-2xl font-semibold">Admin dashboard</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Review account verification and recent actions.</p>
                </div>
                <section aria-label="Verification counts" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {countCards.map((card) => (
                        <div key={card.key} className="rounded-lg border p-4">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-sm text-muted-foreground">{card.label}</span>
                                <VerificationStatusBadge status={card.status} />
                            </div>
                            <p className="mt-3 text-3xl font-semibold">{counts[card.key as keyof Props['counts']]}</p>
                        </div>
                    ))}
                </section>
                <section aria-label="Task review counts" className="grid gap-4">
                    <Link href={admin.tasks.index()} className="rounded-lg border p-4 hover:bg-muted/50">
                        <span className="text-sm text-muted-foreground">Tasks awaiting review</span>
                        <p className="mt-3 text-3xl font-semibold">{counts.tasksAwaitingReview}</p>
                    </Link>
                </section>

                <section aria-label="Latest tasks awaiting review" className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold">Latest tasks awaiting review</h2>
                            <p className="text-sm text-muted-foreground">The newest submissions appear first.</p>
                        </div>
                        <Link href={admin.tasks.index({ query: { status: 'pending_review' } })} className="text-sm underline underline-offset-4">Review all</Link>
                    </div>
                    {latestPendingTasks.length ? (
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/50 text-muted-foreground"><tr><th className="p-3">Task</th><th className="p-3">Poster</th><th className="p-3">Submitted</th></tr></thead>
                                <tbody>{latestPendingTasks.map((task) => <tr key={task.id} className="border-t"><td className="p-3"><Link className="font-medium underline underline-offset-4" href={admin.tasks.show(task.id)}>{task.title}</Link></td><td className="p-3">{task.posterName}</td><td className="whitespace-nowrap p-3">{task.submittedAt ?? '—'}</td></tr>)}</tbody>
                            </table>
                        </div>
                    ) : <p className="rounded-lg border p-5 text-sm text-muted-foreground">No tasks are waiting for review.</p>}
                </section>

                <section aria-label="Report review counts" className="grid gap-4 sm:grid-cols-2">
                    <Link href={admin.reports.index({ query: { status: 'open' } })} className="rounded-lg border p-4 hover:bg-muted/50">
                        <span className="text-sm text-muted-foreground">Open reports</span>
                        <p className="mt-3 text-3xl font-semibold">{counts.openReports}</p>
                    </Link>
                    <Link href={admin.reports.index({ query: { status: 'under_review' } })} className="rounded-lg border p-4 hover:bg-muted/50">
                        <span className="text-sm text-muted-foreground">Reports under review</span>
                        <p className="mt-3 text-3xl font-semibold">{counts.reportsUnderReview}</p>
                    </Link>
                </section>
                <section aria-label="Safety and account actions" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Link href={admin.reports.index({ query: { priority: 'high' } })} className="rounded-lg border p-4 hover:bg-muted/50"><span className="text-sm text-muted-foreground">High-priority reports</span><p className="mt-3 text-3xl font-semibold">{counts.highPriorityReports}</p></Link>
                    <Link href={admin.reports.index({ query: { escalated: '1' } })} className="rounded-lg border p-4 hover:bg-muted/50"><span className="text-sm text-muted-foreground">Escalated reports</span><p className="mt-3 text-3xl font-semibold">{counts.escalatedReports}</p></Link>
                    <Link href="/admin/flags" className="rounded-lg border p-4 hover:bg-muted/50"><span className="text-sm text-muted-foreground">Open content flags</span><p className="mt-3 text-3xl font-semibold">{counts.openFlags}</p></Link>
                    <Link href={admin.users.index()} className="rounded-lg border p-4 hover:bg-muted/50"><span className="text-sm text-muted-foreground">Active suspensions</span><p className="mt-3 text-3xl font-semibold">{counts.activeSuspensions}</p></Link>
                </section>

                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Recent admin actions</h2>
                        <Link href={admin.users.index()} className="text-sm underline underline-offset-4">Review users</Link>
                    </div>
                    {recentActions.length ? (
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/50 text-muted-foreground">
                                    <tr><th className="p-3">Action</th><th className="p-3">Account</th><th className="p-3">Actor</th><th className="p-3">Note</th><th className="p-3">Date</th></tr>
                                </thead>
                                <tbody>
                                    {recentActions.map((item) => (
                                        <tr key={item.id} className="border-t align-top">
                                            <td className="p-3">{item.action.replaceAll('_', ' ')}</td>
                                            <td className="p-3">{item.subjectName}</td>
                                            <td className="p-3">{item.adminName ?? 'Account removed'}</td>
                                            <td className="max-w-xs whitespace-pre-wrap p-3">{item.note ?? '—'}</td>
                                            <td className="whitespace-nowrap p-3">{item.createdAt ?? '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="rounded-lg border p-5 text-sm text-muted-foreground">No admin actions have been recorded yet.</p>
                    )}
                </section>
            </div>
        </>
    );
}

AdminDashboard.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
