import { formatDate } from '@/lib/format';
import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { AdminPageHeading } from '@/components/admin-page-heading';
import { TaskStatusBadge } from '@/components/task-status-badge';
import admin from '@/routes/admin';

type Option = { value: string; label: string };
type Row = {
    id: number;
    title: string;
    posterName: string;
    posterType: string;
    status: string;
    statusLabel: string;
    workMode: string;
    submittedAt: string | null;
};
type Props = {
    tasks: {
        data: Row[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: { search?: string; status?: string; work_mode?: string };
    statuses: Option[];
    workModes: Option[];
};

export default function AdminTaskQueue({
    tasks,
    filters,
    statuses,
    workModes,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [workMode, setWorkMode] = useState(filters.work_mode ?? '');
    const filter = (event: React.FormEvent) => {
        event.preventDefault();
        router.get(
            admin.tasks.index().url,
            { search, status, work_mode: workMode },
            { preserveState: true, replace: true },
        );
    };

    return (
        <>
            <Head title="Task review queue" />
            <div className="admin-page space-y-5" data-tone="tasks">
                <AdminPageHeading
                    eyebrow="Task moderation"
                    title="Task review queue"
                    description="Pending tasks appear first, newest submissions at the top."
                    count={tasks.data.length}
                    countLabel="on this page"
                />
                <form onSubmit={filter} className="admin-filter-panel">
                    <p className="admin-filter-heading">Find a task</p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.5fr)_1fr_1fr_auto]">
                        <input
                            aria-label="Search title or poster"
                            placeholder="Search title or poster"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            className="h-10 rounded-md border bg-background px-3 text-sm"
                        />
                        <select
                            aria-label="Filter status"
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                            className="h-10 rounded-md border bg-background px-3 text-sm"
                        >
                            <option value="">All statuses</option>
                            {statuses.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                        <select
                            aria-label="Filter work mode"
                            value={workMode}
                            onChange={(event) =>
                                setWorkMode(event.target.value)
                            }
                            className="h-10 rounded-md border bg-background px-3 text-sm"
                        >
                            <option value="">All work modes</option>
                            {workModes.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                        <button className="admin-filter-submit" type="submit">
                            Apply filters
                        </button>
                    </div>
                </form>
                {tasks.data.length ? (
                    <div className="admin-list-panel">
                        <div className="admin-list-heading">
                            <h2>Submitted tasks</h2>
                            <p>Open a task to review it</p>
                        </div>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th className="p-3">Title</th>
                                    <th className="p-3">Poster</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3">Work mode</th>
                                    <th className="p-3">Submitted</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.data.map((task) => (
                                    <tr key={task.id}>
                                        <td data-label="Title">
                                            <Link
                                                className="font-medium"
                                                href={admin.tasks.show(task.id)}
                                            >
                                                {task.title}
                                            </Link>
                                        </td>
                                        <td data-label="Poster">
                                            {task.posterName}
                                            <div className="text-xs text-muted-foreground">
                                                {task.posterType}
                                            </div>
                                        </td>
                                        <td data-label="Status">
                                            <TaskStatusBadge
                                                status={task.status}
                                                label={task.statusLabel}
                                            />
                                        </td>
                                        <td data-label="Work mode">
                                            {task.workMode}
                                        </td>
                                        <td
                                            data-label="Submitted"
                                            className="whitespace-nowrap"
                                        >
                                            {task.submittedAt
                                                ? formatDate(task.submittedAt)
                                                : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="admin-list-panel admin-empty">
                        No tasks match these filters.
                    </div>
                )}
                {tasks.links.length > 3 && (
                    <nav className="admin-pagination" aria-label="Pagination">
                        {tasks.links.map((link, index) =>
                            link.url ? (
                                <Link
                                    key={index}
                                    href={link.url}
                                    aria-current={
                                        link.active ? 'page' : undefined
                                    }
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ) : (
                                <span
                                    key={index}
                                    className="text-muted-foreground"
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ),
                        )}
                    </nav>
                )}
            </div>
        </>
    );
}

AdminTaskQueue.layout = (page: React.ReactNode) => (
    <AdminLayout>{page}</AdminLayout>
);
