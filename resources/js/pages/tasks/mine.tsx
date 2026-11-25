import { Form, Head, Link } from '@inertiajs/react';
import { TriangleAlert } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PaymentStatusBadge } from '@/components/payment-status-badge';
import { TaskStatusBadge } from '@/components/task-status-badge';
import { ToBeDiscussedBadge } from '@/components/terms-status-badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import AppLayout from '@/layouts/app-layout';
import { formatAmount, formatDate } from '@/lib/format';
import agreements from '@/routes/agreements';
import { cancel, create, edit, show } from '@/routes/tasks';

type Task = {
    id: number;
    title: string;
    category: string;
    budget: string | null;
    budgetToBeDiscussed?: boolean;
    payTimingLabel?: string;
    payTimingToBeDiscussed?: boolean;
    scheduleSummary?: string | null;
    scheduleToBeDiscussed?: boolean;
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

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Props = {
    tasks: {
        data: Task[];
        links: PaginationLink[];
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

    const counts = useMemo(() => {
        return {
            all: tasks.data.length,
            pending_review: tasks.data.filter((t) => matchesFilter(t, 'pending_review')).length,
            active: tasks.data.filter((t) => matchesFilter(t, 'active')).length,
            changes_requested: tasks.data.filter((t) => matchesFilter(t, 'changes_requested')).length,
            closed: tasks.data.filter((t) => matchesFilter(t, 'closed')).length,
        };
    }, [tasks.data]);

    const filteredTasks = useMemo(
        () => tasks.data.filter((task) => matchesFilter(task, activeTab)),
        [tasks.data, activeTab],
    );

    const tabs: { key: FilterTab; label: string; count: number }[] = [
        { key: 'all', label: 'All', count: counts.all },
        { key: 'pending_review', label: 'Pending review', count: counts.pending_review },
        { key: 'active', label: 'Active / Approved', count: counts.active },
        { key: 'changes_requested', label: 'Changes requested', count: counts.changes_requested },
        { key: 'closed', label: 'Completed / Closed', count: counts.closed },
    ];

    return (
        <>
            <Head title="My tasks" />
            <div className="page-wide space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">My tasks</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Tasks you have posted and their review status.
                        </p>
                    </div>
                    <Button asChild>
                        <Link href={create()}>Post a task</Link>
                    </Button>
                </div>

                {status && (
                    <div
                        role="status"
                        className="rounded-lg border border-info-border bg-info-bg px-4 py-3 text-sm text-info-fg"
                    >
                        {status}
                    </div>
                )}

                {tasks.data.length === 0 ? (
                    <Card className="items-center p-10 text-center">
                        <div className="space-y-1.5">
                            <h2 className="text-base font-semibold text-foreground">
                                You have not posted any tasks yet
                            </h2>
                            <p className="text-sm text-muted-foreground">Create a task to get started.</p>
                        </div>
                        <Button variant="outline" asChild>
                            <Link href={create()}>Post a task</Link>
                        </Button>
                    </Card>
                ) : (
                    <>
                        <nav
                            aria-label="Task status filters"
                            className="flex gap-1.5 overflow-x-auto pb-1"
                        >
                            {tabs.map((tab) => {
                                const isActive = activeTab === tab.key;
                                return (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => setActiveTab(tab.key)}
                                        aria-pressed={isActive}
                                        className={
                                            isActive
                                                ? 'focus-ring inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg border border-brand bg-info-bg/50 px-3.5 py-1.5 text-sm font-semibold text-foreground shadow-xs transition-colors md:min-h-9'
                                                : 'focus-ring inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground md:min-h-9'
                                        }
                                    >
                                        <span>{tab.label}</span>
                                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-foreground">
                                            {tab.count}
                                        </span>
                                    </button>
                                );
                            })}
                        </nav>

                        {filteredTasks.length === 0 ? (
                            <Card className="items-center p-10 text-center">
                                <div className="space-y-1.5">
                                    <h2 className="text-base font-semibold text-foreground">
                                        No tasks in this status on the current page
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        Switch back to All to view your posted tasks.
                                    </p>
                                </div>
                                <Button type="button" variant="outline" onClick={() => setActiveTab('all')}>
                                    Show all tasks
                                </Button>
                            </Card>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2">
                                {filteredTasks.map((task) => (
                                    <Card key={task.id} className="justify-between gap-4 p-5 md:gap-4 md:py-5">
                                        <div className="space-y-3">
                                            <div className="flex flex-wrap items-start justify-between gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <h2 className="text-lg font-semibold text-foreground">
                                                        <Link
                                                            href={show(task.id)}
                                                            className="focus-ring rounded-sm hover:text-brand"
                                                        >
                                                            {task.title}
                                                        </Link>
                                                    </h2>
                                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                                        {task.category} · {task.workMode}
                                                    </p>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <TaskStatusBadge status={task.status} label={task.statusLabel} />
                                                    {task.paymentStatus && task.paymentStatusLabel && (
                                                        <PaymentStatusBadge
                                                            status={task.paymentStatus}
                                                            label={task.paymentStatusLabel}
                                                        />
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-border bg-muted/40 p-3">
                                                {task.budgetToBeDiscussed || task.budget === null ? (
                                                    <ToBeDiscussedBadge label="Pay: To be discussed" />
                                                ) : (
                                                    <span className="text-lg font-semibold tabular-nums text-foreground">
                                                        ₱{formatAmount(task.budget)}
                                                    </span>
                                                )}

                                                {task.payTimingToBeDiscussed ? (
                                                    <ToBeDiscussedBadge label="Pay timing: To be discussed" />
                                                ) : task.payTimingLabel ? (
                                                    <Badge variant="neutral">{task.payTimingLabel}</Badge>
                                                ) : null}
                                            </div>

                                            <div className="space-y-1 text-xs text-muted-foreground">
                                                <p className="tabular-nums">
                                                    Hours:{' '}
                                                    <span className="text-foreground">
                                                        {task.scheduleToBeDiscussed || !task.scheduleSummary
                                                            ? 'To be discussed'
                                                            : task.scheduleSummary}
                                                    </span>
                                                </p>
                                                <p className="tabular-nums">
                                                    Posted {task.createdAt ? formatDate(task.createdAt) : 'recently'} ·{' '}
                                                    {task.applicantsCount} applicants
                                                </p>
                                            </div>

                                            {task.reviewNote && (
                                                <Alert variant="warning">
                                                    <TriangleAlert aria-hidden="true" />
                                                    <AlertTitle>Review note</AlertTitle>
                                                    <AlertDescription className="whitespace-pre-wrap">
                                                        {task.reviewNote}
                                                    </AlertDescription>
                                                </Alert>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={show(task.id)}>View</Link>
                                            </Button>

                                            {task.canEdit &&
                                                !task.hasActiveApplications &&
                                                ['pending_review', 'changes_requested', 'approved'].includes(
                                                    task.status,
                                                ) && (
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={edit(task.id)}>Edit</Link>
                                                    </Button>
                                                )}

                                            {task.needsRating && task.agreementId && (
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={agreements.rate(task.agreementId)}>
                                                        Rate your experience
                                                    </Link>
                                                </Button>
                                            )}

                                            {task.canCancel && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="ml-auto text-destructive-foreground hover:bg-danger-bg hover:text-danger-fg"
                                                    onClick={() => setCancellingTask(task)}
                                                >
                                                    Cancel
                                                </Button>
                                            )}
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {tasks.links.length > 3 && (
                    <nav aria-label="My task pages" className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        {tasks.from != null && tasks.to != null && tasks.total != null ? (
                            <p className="text-xs tabular-nums text-muted-foreground">
                                Showing {tasks.from}–{tasks.to} of {tasks.total} tasks
                            </p>
                        ) : (
                            <span />
                        )}
                        <div className="flex flex-wrap items-center gap-1.5">
                            {tasks.links.map((link, index) => {
                                const text = formatPaginationLabel(link.label);
                                if (!link.url) {
                                    return (
                                        <span
                                            key={`${index}-${link.label}`}
                                            aria-disabled="true"
                                            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border/60 bg-muted/40 px-3 text-sm text-muted-foreground opacity-60 md:min-h-9 md:min-w-9"
                                        >
                                            {text}
                                        </span>
                                    );
                                }

                                return (
                                    <Link
                                        key={`${index}-${link.label}`}
                                        href={link.url}
                                        aria-current={link.active ? 'page' : undefined}
                                        className={
                                            link.active
                                                ? 'focus-ring inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-primary bg-primary px-3 text-sm font-semibold text-primary-foreground md:min-h-9 md:min-w-9'
                                                : 'focus-ring inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border bg-card px-3 text-sm text-foreground hover:bg-accent md:min-h-9 md:min-w-9'
                                        }
                                    >
                                        {text}
                                    </Link>
                                );
                            })}
                        </div>
                    </nav>
                )}

                <Dialog open={cancellingTask !== null} onOpenChange={(open) => !open && setCancellingTask(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Cancel this task?</DialogTitle>
                            <DialogDescription>
                                {cancellingTask
                                    ? `“${cancellingTask.title}” will be closed to new applications and removed from Browse Tasks.`
                                    : 'This task will be closed.'}
                            </DialogDescription>
                        </DialogHeader>
                        {cancellingTask && (
                            <Form
                                {...cancel.form(cancellingTask.id)}
                                onSuccess={() => setCancellingTask(null)}
                            >
                                {({ processing }) => (
                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button type="button" variant="outline" disabled={processing}>
                                                Keep task
                                            </Button>
                                        </DialogClose>
                                        <Button type="submit" variant="destructive" disabled={processing}>
                                            {processing && <Spinner />}
                                            Cancel task
                                        </Button>
                                    </DialogFooter>
                                )}
                            </Form>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

MyTasks.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'My tasks', href: '/my-tasks' }]}>{page}</AppLayout>
);
