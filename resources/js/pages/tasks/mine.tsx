import { formatAmount, formatDate } from '@/lib/format';
import { Form, Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { TaskStatusBadge } from '@/components/task-status-badge';
import { PaymentStatusBadge } from '@/components/payment-status-badge';
import { ToBeDiscussedBadge } from '@/components/terms-status-badge';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { create, show, edit, cancel } from '@/routes/tasks';
import agreements from '@/routes/agreements';

type Task = {
    id: number;
    title: string;
    category: string;
    workType: string;
    workTypeLabel: string;
    budget: string | null;
    budgetToBeDiscussed: boolean;
    payTimingLabel: string;
    payTimingToBeDiscussed: boolean;
    scheduleSummary: string | null;
    scheduleToBeDiscussed: boolean;
    workMode: string;
    status: string;
    statusLabel: string;
    reviewNote: string | null;
    createdAt: string | null;
    applicantsCount: number;
    hasActiveApplications: boolean;
    canEdit: boolean;
    canCancel: boolean;
    paymentStatus: string | null;
    paymentStatusLabel: string | null;
    agreementId: number | null;
    needsRating: boolean;
};
type Props = {
    tasks: {
        data: Task[];
        links: { url: string | null; label: string; active: boolean }[];
        from?: number | null;
        to?: number | null;
        total?: number;
    };
    status?: string | null;
};

type FilterTab = 'all' | 'pending_review' | 'active' | 'changes_requested' | 'closed';

function matchesFilter(task: Task, tab: FilterTab): boolean {
    if (tab === 'all') return true;
    if (tab === 'pending_review') return task.status === 'pending_review';
    if (tab === 'active') return ['approved', 'assigned', 'in_progress'].includes(task.status);
    if (tab === 'changes_requested') return task.status === 'changes_requested';
    return ['completed', 'cancelled', 'rejected', 'removed'].includes(task.status);
}

function formatPaginationLabel(label: string): string {
    return label
        .replaceAll('&laquo; Previous', 'Previous')
        .replaceAll('Next &raquo;', 'Next')
        .replaceAll('&laquo;', 'Previous')
        .replaceAll('&raquo;', 'Next')
        .trim();
}

export default function MyTasks({ tasks, status }: Props) {
    const [activeTab, setActiveTab] = useState<FilterTab>('all');
    const [cancellingTask, setCancellingTask] = useState<Task | null>(null);
    const counts = useMemo(
        () => ({
            all: tasks.data.length,
            pending_review: tasks.data.filter((task) => matchesFilter(task, 'pending_review')).length,
            active: tasks.data.filter((task) => matchesFilter(task, 'active')).length,
            changes_requested: tasks.data.filter((task) => matchesFilter(task, 'changes_requested')).length,
            closed: tasks.data.filter((task) => matchesFilter(task, 'closed')).length,
        }),
        [tasks.data],
    );
    const filteredTasks = useMemo(
        () => tasks.data.filter((task) => matchesFilter(task, activeTab)),
        [tasks.data, activeTab],
    );
    const tabs: { key: FilterTab; label: string; count: number }[] = [
        { key: 'all', label: 'All', count: counts.all },
        { key: 'pending_review', label: 'Pending review', count: counts.pending_review },
        { key: 'active', label: 'Active / approved', count: counts.active },
        { key: 'changes_requested', label: 'Changes requested', count: counts.changes_requested },
        { key: 'closed', label: 'Completed / closed', count: counts.closed },
    ];

    return (
        <>
            <Head title="My tasks" />
            <main className="my-tasks-page">
                <header className="my-tasks-hero">
                    <div>
                        <p className="my-tasks-eyebrow">Your listings</p>
                        <h1>My tasks</h1>
                        <p className="my-tasks-description">
                            Tasks you have posted and their review status.
                        </p>
                    </div>
                    <Button asChild className="my-tasks-create-button">
                        <Link href={create()}>Post a task</Link>
                    </Button>
                </header>
                {status && (
                    <div
                        role="status"
                        className="my-tasks-status"
                    >
                        {status}
                    </div>
                )}
                {tasks.data.length > 0 && (
                    <nav className="my-tasks-tabs" aria-label="Task status filters">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveTab(tab.key)}
                                aria-pressed={activeTab === tab.key}
                                className={activeTab === tab.key ? 'my-tasks-tab is-active' : 'my-tasks-tab'}
                            >
                                {tab.label}<span>{tab.count}</span>
                            </button>
                        ))}
                    </nav>
                )}
                {tasks.data.length === 0 ? (
                    <div className="my-tasks-empty">
                        <h2 className="font-semibold">
                            You have not posted any tasks yet
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Create a task to get started.
                        </p>
                        <Button asChild className="mt-4">
                            <Link href={create()}>Post a task</Link>
                        </Button>
                    </div>
                ) : filteredTasks.length === 0 ? (
                        <div className="my-tasks-empty">
                            <h2>No tasks in this status on this page</h2>
                            <p>Choose another status to see your other listings.</p>
                            <Button type="button" onClick={() => setActiveTab('all')}>Show all tasks</Button>
                        </div>
                ) : (
                    <div className="my-tasks-grid">
                        {filteredTasks.map((task) => (
                            <article
                                key={task.id}
                                className="my-tasks-card"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <h2 className="font-semibold">
                                        {task.title}
                                    </h2>
                                    <div className="flex flex-wrap gap-2">
                                        <TaskStatusBadge
                                            status={task.status}
                                            label={task.statusLabel}
                                        />
                                        {task.paymentStatus &&
                                            task.paymentStatusLabel && (
                                                <PaymentStatusBadge
                                                    status={task.paymentStatus}
                                                    label={
                                                        task.paymentStatusLabel
                                                    }
                                                />
                                            )}
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {task.category} · {task.workTypeLabel}
                                </p>
                                <div className="my-tasks-facts">
                                    <p><span>Work mode</span><strong>{task.workMode}</strong></p>
                                    <p><span>Budget</span><strong>{task.budgetToBeDiscussed || task.budget === null ? <ToBeDiscussedBadge /> : `₱${formatAmount(task.budget)}`}</strong></p>
                                    <p><span>Schedule</span><strong>{task.scheduleToBeDiscussed || !task.scheduleSummary ? <ToBeDiscussedBadge /> : task.scheduleSummary}</strong></p>
                                    <p><span>Pay timing</span><strong>{task.payTimingToBeDiscussed ? <ToBeDiscussedBadge /> : task.payTimingLabel}</strong></p>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Posted{' '}
                                    {task.createdAt
                                        ? formatDate(task.createdAt)
                                        : 'recently'}{' '}
                                    · {task.applicantsCount} applicants
                                </p>
                                {task.reviewNote && (
                                    <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
                                        Review note: {task.reviewNote}
                                    </div>
                                )}
                                {task.needsRating && task.agreementId && (
                                    <Button variant="outline" size="sm" asChild>
                                        <Link
                                            href={agreements.rate(
                                                task.agreementId,
                                            )}
                                        >
                                            Rate your experience
                                        </Link>
                                    </Button>
                                )}
                                <div className="flex flex-wrap gap-2">
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={show(task.id)}>View</Link>
                                    </Button>
                                    {task.canEdit &&
                                        !task.hasActiveApplications &&
                                        [
                                            'pending_review',
                                            'changes_requested',
                                            'approved',
                                        ].includes(task.status) && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                asChild
                                            >
                                                <Link href={edit(task.id)}>
                                                    Edit
                                                </Link>
                                            </Button>
                                        )}
                                    {task.canCancel && <Button variant="outline" size="sm" type="button" onClick={() => setCancellingTask(task)}>Cancel</Button>}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
                {tasks.links.length > 3 && (
                    <nav
                        className="my-tasks-pagination"
                        aria-label="Pagination"
                    >
                        {tasks.from != null && tasks.to != null && tasks.total != null && (
                            <p>Showing {tasks.from}–{tasks.to} of {tasks.total} tasks</p>
                        )}
                        {tasks.links.map((link, index) =>
                            link.url ? (
                                <Link
                                    key={index}
                                    href={link.url}
                                    className={`my-tasks-page-link ${link.active ? 'is-active' : ''}`}
                                    aria-current={link.active ? 'page' : undefined}
                                    dangerouslySetInnerHTML={{
                                        __html: formatPaginationLabel(link.label),
                                    }}
                                />
                            ) : (
                                <span
                                    key={index}
                                    className="my-tasks-page-link is-disabled"
                                    dangerouslySetInnerHTML={{
                                        __html: formatPaginationLabel(link.label),
                                    }}
                                />
                            ),
                        )}
                    </nav>
                )}
                <Dialog open={cancellingTask !== null} onOpenChange={(open) => !open && setCancellingTask(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Cancel this task?</DialogTitle>
                            <DialogDescription>
                                {cancellingTask ? `“${cancellingTask.title}” will be closed to new applications and removed from Browse Tasks.` : ''}
                            </DialogDescription>
                        </DialogHeader>
                        {cancellingTask && (
                            <Form {...cancel.form(cancellingTask.id)} onSuccess={() => setCancellingTask(null)}>
                                <DialogFooter>
                                    <DialogClose asChild><Button type="button" variant="outline">Keep task</Button></DialogClose>
                                    <Button type="submit" variant="destructive">Cancel task</Button>
                                </DialogFooter>
                            </Form>
                        )}
                    </DialogContent>
                </Dialog>
            </main>
        </>
    );
}
