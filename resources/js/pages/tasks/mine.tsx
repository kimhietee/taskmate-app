import { formatAmount, formatDate } from '@/lib/format';
import { Form, Head, Link } from '@inertiajs/react';
import { CalendarDays, ClipboardList, Plus, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PaymentStatusBadge } from '@/components/payment-status-badge';
import { TaskStatusBadge } from '@/components/task-status-badge';
import { create, show, edit, cancel } from '@/routes/tasks';
import agreements from '@/routes/agreements';

type Task = {
    id: number;
    title: string;
    category: string;
    budget: string;
    workMode: string;
    status: string;
    statusLabel: string;
    reviewNote: string | null;
    createdAt: string | null;
    applicantsCount: number;
    hasActiveApplications: boolean;
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
    };
    status?: string | null;
};

export default function MyTasks({ tasks, status }: Props) {
    return (
        <>
            <Head title="My tasks" />
            <div className="min-h-[calc(100vh-4rem)] bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
                <div className="mx-auto max-w-6xl space-y-7">
                    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-sm font-semibold text-primary">Task management</p>
                            <h1 className="mt-1 text-3xl font-semibold tracking-tight">My tasks</h1>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Manage your posts, review status, and applicants.
                            </p>
                        </div>
                        <Button asChild className="self-start sm:self-auto">
                            <Link href={create()}>
                                <Plus aria-hidden="true" />
                                Post a task
                            </Link>
                        </Button>
                    </header>

                    {status && (
                        <div role="status" className="rounded-xl border border-primary/25 bg-primary/10 px-4 py-3 text-sm">
                            {status}
                        </div>
                    )}

                    {tasks.data.length === 0 ? (
                        <section className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center shadow-sm">
                            <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-amber-100 text-primary dark:bg-amber-300/15">
                                <ClipboardList aria-hidden="true" className="size-6" />
                            </span>
                            <h2 className="mt-4 text-lg font-semibold">No tasks posted yet</h2>
                            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                                Create a task to share the work details and start receiving applications.
                            </p>
                            <Button asChild className="mt-5">
                                <Link href={create()}>
                                    <Plus aria-hidden="true" />
                                    Post a task
                                </Link>
                            </Button>
                        </section>
                    ) : (
                        <section aria-label="Your posted tasks" className="grid gap-4 md:grid-cols-2">
                            {tasks.data.map((task) => (
                                <article
                                    key={task.id}
                                    className="flex flex-col gap-4 rounded-2xl border border-border border-t-2 border-t-primary bg-card p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6"
                                >
                                    <div className="flex flex-col gap-3">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <h2 className="min-w-0 flex-1 text-lg font-semibold leading-6 tracking-tight">
                                                {task.title}
                                            </h2>
                                            <div className="flex flex-wrap gap-2">
                                                <TaskStatusBadge status={task.status} label={task.statusLabel} />
                                                {task.paymentStatus && task.paymentStatusLabel && (
                                                    <PaymentStatusBadge
                                                        status={task.paymentStatus}
                                                        label={task.paymentStatusLabel}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {task.category} <span aria-hidden="true">·</span> {task.workMode}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between gap-4 rounded-xl bg-secondary/60 px-4 py-3">
                                        <span className="text-sm text-muted-foreground">Budget</span>
                                        <span className="text-lg font-semibold tabular-nums text-primary">
                                            ₱{formatAmount(task.budget)}
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                                        <span className="inline-flex items-center gap-1.5">
                                            <CalendarDays aria-hidden="true" className="size-3.5" />
                                            Posted {task.createdAt ? formatDate(task.createdAt) : 'recently'}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5">
                                            <UsersRound aria-hidden="true" className="size-3.5" />
                                            {task.applicantsCount} applicant{task.applicantsCount === 1 ? '' : 's'}
                                        </span>
                                    </div>

                                    {task.reviewNote && (
                                        <div className="rounded-xl border border-amber-400 bg-amber-100 px-4 py-3 text-sm leading-5 text-amber-950 dark:border-amber-700 dark:bg-amber-300/10 dark:text-amber-100">
                                            <span className="font-semibold">Review note:</span> {task.reviewNote}
                                        </div>
                                    )}

                                    {task.needsRating && task.agreementId && (
                                        <div>
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={agreements.rate(task.agreementId)}>Rate your experience</Link>
                                            </Button>
                                        </div>
                                    )}

                                    <div className="mt-auto flex flex-wrap gap-2 border-t border-border pt-4">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={show(task.id)}>View</Link>
                                        </Button>
                                        {!task.hasActiveApplications &&
                                            ['pending_review', 'changes_requested', 'approved'].includes(task.status) && (
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={edit(task.id)}>Edit</Link>
                                                </Button>
                                            )}
                                        {task.canCancel && (
                                            <Form
                                                {...cancel.form(task.id)}
                                                onSubmit={(event) => {
                                                    if (!window.confirm('Cancel this task?')) {
                                                        event.preventDefault();
                                                    }
                                                }}
                                            >
                                                <Button variant="outline" size="sm" type="submit">
                                                    Cancel
                                                </Button>
                                            </Form>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </section>
                    )}

                    {tasks.links.length > 3 && (
                        <nav className="flex flex-wrap gap-2" aria-label="Pagination">
                            {tasks.links.map((link, index) =>
                                link.url ? (
                                    <Link
                                        key={index}
                                        href={link.url}
                                        aria-current={link.active ? 'page' : undefined}
                                        className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                                            link.active
                                                ? 'border-primary bg-primary text-primary-foreground'
                                                : 'border-border bg-card hover:bg-accent hover:text-accent-foreground'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ) : (
                                    <span
                                        key={index}
                                        className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground"
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ),
                            )}
                        </nav>
                    )}
                </div>
            </div>
        </>
    );
}
