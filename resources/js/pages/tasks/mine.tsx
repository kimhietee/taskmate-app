import { Form, Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    Banknote,
    BriefcaseBusiness,
    CalendarDays,
    TriangleAlert,
    UsersRound,
} from 'lucide-react';
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
            <div className="relative isolate w-full">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: "url('/images/cmu-campus-background.avif')" }}
                />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-0 bg-[#F7F8F2]/70 dark:bg-[#101B15]/65"
                />
                <div className="page-wide relative z-10 space-y-6">
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
                                    <Card
                                        key={task.id}
                                        className="group relative justify-between gap-0 overflow-hidden rounded-2xl border-[#D8E5D9] bg-white p-0 text-[#183324] shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-[#065F46]/35 hover:shadow-md dark:border-[#32473A] dark:bg-[#17251C] dark:text-[#EDF4EC]"
                                    >
                                        <div
                                            aria-hidden="true"
                                            className="h-1 w-full bg-gradient-to-r from-[#065F46] via-[#0C7A55] to-[#FCD34D]"
                                        />
                                        <div className="flex h-full flex-col gap-4 p-4 sm:p-5">
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div className="flex min-w-0 items-start gap-3">
                                                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#065F46] text-[#FCD34D] shadow-sm dark:bg-[#064E3B]">
                                                        <BriefcaseBusiness aria-hidden="true" className="size-5" />
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold tracking-[0.08em] text-[#065F46] uppercase dark:text-[#FCD34D]">
                                                            {task.category}
                                                        </p>
                                                        <h2 className="mt-1 text-lg leading-snug font-semibold tracking-tight text-[#183324] dark:text-[#EDF4EC]">
                                                            <Link
                                                                href={show(task.id)}
                                                                className="focus-ring rounded-sm hover:text-[#065F46] dark:hover:text-[#FCD34D]"
                                                            >
                                                                {task.title}
                                                            </Link>
                                                        </h2>
                                                        <p className="mt-1 text-sm text-[#526458] dark:text-[#B6C7B9]">
                                                            {task.workMode}
                                                        </p>
                                                    </div>
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

                                            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#D8E5D9] bg-[#F5F8F2] p-3.5 dark:border-[#32473A] dark:bg-[#101B15]">
                                                <div>
                                                    <p className="flex items-center gap-1.5 text-xs font-medium text-[#526458] dark:text-[#B6C7B9]">
                                                        <Banknote aria-hidden="true" className="size-4 text-[#065F46] dark:text-[#FCD34D]" />
                                                        Budget
                                                    </p>
                                                    <div className="mt-1">
                                                        {task.budgetToBeDiscussed || task.budget === null ? (
                                                            <ToBeDiscussedBadge label="To be discussed" />
                                                        ) : (
                                                            <span className="text-xl font-bold tabular-nums tracking-tight text-[#183324] dark:text-[#EDF4EC]">
                                                                ₱{formatAmount(task.budget)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {task.payTimingToBeDiscussed ? (
                                                    <ToBeDiscussedBadge label="Pay timing: To be discussed" />
                                                ) : task.payTimingLabel ? (
                                                    <Badge
                                                        variant="outline"
                                                        className="border-[#D8E5D9] bg-[#F5F8F2] text-[#065F46] dark:border-[#536B5A] dark:bg-[#20382B] dark:text-[#DCE8DD]"
                                                    >
                                                        {task.payTimingLabel}
                                                    </Badge>
                                                ) : null}
                                            </div>

                                            <dl className="grid grid-cols-2 gap-3 text-sm">
                                                <div className="min-w-0 rounded-lg border border-[#E5ECE5] bg-white/70 p-3 dark:border-[#2D4235] dark:bg-[#17251C]/75">
                                                    <dt className="flex items-center gap-1.5 text-xs font-medium text-[#526458] dark:text-[#B6C7B9]">
                                                        <CalendarDays aria-hidden="true" className="size-3.5 text-[#065F46] dark:text-[#FCD34D]" />
                                                        Schedule
                                                    </dt>
                                                    <dd className="mt-1 line-clamp-2 font-medium text-[#183324] dark:text-[#EDF4EC]">
                                                        {task.scheduleToBeDiscussed || !task.scheduleSummary
                                                            ? 'To be discussed'
                                                            : task.scheduleSummary}
                                                    </dd>
                                                </div>
                                                <div className="rounded-lg border border-[#E5ECE5] bg-white/70 p-3 dark:border-[#2D4235] dark:bg-[#17251C]/75">
                                                    <dt className="flex items-center gap-1.5 text-xs font-medium text-[#526458] dark:text-[#B6C7B9]">
                                                        <UsersRound aria-hidden="true" className="size-3.5 text-[#065F46] dark:text-[#FCD34D]" />
                                                        Applicants
                                                    </dt>
                                                    <dd className="mt-1 font-semibold tabular-nums text-[#183324] dark:text-[#EDF4EC]">
                                                        {task.applicantsCount}
                                                    </dd>
                                                </div>
                                            </dl>

                                            <p className="text-xs tabular-nums text-[#617166] dark:text-[#B6C7B9]">
                                                Posted {task.createdAt ? formatDate(task.createdAt) : 'recently'}
                                            </p>

                                            {task.reviewNote && (
                                                <Alert variant="warning">
                                                    <TriangleAlert aria-hidden="true" />
                                                    <AlertTitle>Review note</AlertTitle>
                                                    <AlertDescription className="whitespace-pre-wrap">
                                                        {task.reviewNote}
                                                    </AlertDescription>
                                                </Alert>
                                            )}

                                            <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-[#D8E5D9] pt-4 dark:border-[#32473A]">
                                                <Button
                                                    className="min-h-11 gap-2 bg-[#065F46] text-white shadow-sm hover:bg-[#064E3B] dark:bg-[#FCD34D] dark:text-[#183324] dark:hover:bg-[#FDE68A]"
                                                    asChild
                                                >
                                                    <Link href={show(task.id)} aria-label={`View task: ${task.title}`}>
                                                        View task
                                                        <ArrowRight aria-hidden="true" className="size-4" />
                                                    </Link>
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
            </div>
        </>
    );
}

MyTasks.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'My tasks', href: '/my-tasks' }]}>{page}</AppLayout>
);
