import { formatDate } from '@/lib/format';
import { Form, Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { TaskStatusBadge } from '@/components/task-status-badge';
import { PaymentStatusBadge } from '@/components/payment-status-badge';
import { create, show, edit, cancel } from '@/routes/tasks';
import agreements from '@/routes/agreements';

type Task = {
    id: number;
    title: string;
    category: string;
    budget: string | null;
    budgetDisplay: string;
    workMode: string;
    estimatedDurationDays: number | null;
    estimatedDurationLabel: string | null;
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
    };
    status?: string | null;
};

export default function MyTasks({ tasks, status }: Props) {
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
                ) : (
                    <div className="my-tasks-grid">
                        {tasks.data.map((task) => (
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
                                    {task.category} · {task.workMode}
                                </p>
                                <p className="text-sm">
                                    Estimated duration:{' '}
                                    {task.estimatedDurationLabel ??
                                        'Not provided'}
                                </p>
                                <p className="font-medium">
                                    {task.budgetDisplay}
                                </p>
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
                                    {task.canCancel && (
                                        <Form
                                            {...cancel.form(task.id)}
                                            onSubmit={(event) => {
                                                if (
                                                    !window.confirm(
                                                        'Cancel this task?',
                                                    )
                                                )
                                                    event.preventDefault();
                                            }}
                                        >
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                type="submit"
                                            >
                                                Cancel
                                            </Button>
                                        </Form>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
                {tasks.links.length > 3 && (
                    <nav
                        className="flex flex-wrap gap-2"
                        aria-label="Pagination"
                    >
                        {tasks.links.map((link, index) =>
                            link.url ? (
                                <Link
                                    key={index}
                                    href={link.url}
                                    className={`rounded border px-3 py-1 text-sm ${link.active ? 'bg-muted font-medium' : ''}`}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ) : (
                                <span
                                    key={index}
                                    className="rounded border px-3 py-1 text-sm text-muted-foreground"
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ),
                        )}
                    </nav>
                )}
            </main>
        </>
    );
}
