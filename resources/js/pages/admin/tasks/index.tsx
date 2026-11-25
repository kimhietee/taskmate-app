import { Head, Link, router } from '@inertiajs/react';
import { BriefcaseBusiness } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { TaskStatusBadge } from '@/components/task-status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminLayout from '@/layouts/admin-layout';
import { formatDate } from '@/lib/format';
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

type PageLink = { url: string | null; label: string; active: boolean };

type Props = {
    tasks: {
        data: Row[];
        links: PageLink[];
        from?: number | null;
        to?: number | null;
        total?: number | null;
    };
    filters: { search?: string; status?: string; work_mode?: string };
    statuses: Option[];
    workModes: Option[];
};

const NATIVE_SELECT_CLASS =
    'focus-ring h-11 w-full rounded-md border border-input bg-field px-3 text-sm text-foreground shadow-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 md:h-9';

function formatPaginationLabel(label: string): string {
    return label
        .replaceAll('&laquo; Previous', 'Previous')
        .replaceAll('Next &raquo;', 'Next')
        .replaceAll('&laquo;', 'Previous')
        .replaceAll('&raquo;', 'Next')
        .trim();
}

export default function AdminTaskQueue({ tasks, filters, statuses, workModes }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [workMode, setWorkMode] = useState(filters.work_mode ?? '');

    const workModeLabelMap = new Map(workModes.map((item) => [item.value, item.label]));

    const formatWorkMode = (value: string): string => {
        return workModeLabelMap.get(value) ?? value.replaceAll('_', ' ');
    };

    const filter = (event: React.FormEvent) => {
        event.preventDefault();
        router.get(
            admin.tasks.index().url,
            {
                search: search || undefined,
                status: status || undefined,
                work_mode: workMode || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    return (
        <>
            <Head title="Task review queue" />
            <div className="space-y-6">
                <header>
                    <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Task review queue</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Pending tasks appear first, with the newest submissions at the top.
                    </p>
                </header>

                <Card className="p-4 shadow-xs">
                    <form onSubmit={filter} className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="tasks-search">Search</Label>
                            <Input
                                id="tasks-search"
                                placeholder="Search title or poster"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="tasks-status">Status</Label>
                            <select
                                id="tasks-status"
                                value={status}
                                onChange={(event) => setStatus(event.target.value)}
                                className={NATIVE_SELECT_CLASS}
                            >
                                <option value="">All statuses</option>
                                {statuses.map((item) => (
                                    <option key={item.value} value={item.value}>
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="tasks-work-mode">Work mode</Label>
                            <select
                                id="tasks-work-mode"
                                value={workMode}
                                onChange={(event) => setWorkMode(event.target.value)}
                                className={NATIVE_SELECT_CLASS}
                            >
                                <option value="">All work modes</option>
                                {workModes.map((item) => (
                                    <option key={item.value} value={item.value}>
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <Button type="submit" className="w-full lg:w-auto">
                                Apply filters
                            </Button>
                        </div>
                    </form>
                </Card>

                {tasks.data.length ? (
                    <>
                        <div className="hidden overflow-x-auto rounded-xl border border-border bg-card shadow-xs md:block">
                            <table className="w-full border-collapse text-left text-sm">
                                <thead className="sticky top-0 z-10 border-b border-border bg-muted/60 text-xs font-semibold text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3">Title</th>
                                        <th className="px-4 py-3">Poster</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Work mode</th>
                                        <th className="px-4 py-3">Submitted</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {tasks.data.map((task) => (
                                        <tr key={task.id} className="transition-colors hover:bg-muted/30">
                                            <td className="px-4 py-3">
                                                <Link
                                                    className="focus-ring rounded-sm font-semibold text-brand underline-offset-4 hover:underline"
                                                    href={admin.tasks.show(task.id)}
                                                >
                                                    {task.title}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-foreground">{task.posterName}</div>
                                                <div className="text-xs text-muted-foreground">{task.posterType}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <TaskStatusBadge status={task.status} label={task.statusLabel} />
                                            </td>
                                            <td className="px-4 py-3 text-foreground">
                                                {formatWorkMode(task.workMode)}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap tabular-nums text-muted-foreground">
                                                {task.submittedAt ? formatDate(task.submittedAt) : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="grid gap-3 md:hidden">
                            {tasks.data.map((task) => (
                                <Card key={task.id} className="space-y-2.5 p-4 shadow-xs">
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <Link
                                            className="focus-ring rounded-sm font-semibold text-brand underline-offset-4 hover:underline"
                                            href={admin.tasks.show(task.id)}
                                        >
                                            {task.title}
                                        </Link>
                                        <TaskStatusBadge status={task.status} label={task.statusLabel} />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {task.posterName} · {task.posterType}
                                    </p>
                                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                                        <span>{formatWorkMode(task.workMode)}</span>
                                        <span className="tabular-nums">
                                            {task.submittedAt ? formatDate(task.submittedAt) : '—'}
                                        </span>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </>
                ) : (
                    <Card className="space-y-2 p-10 text-center">
                        <BriefcaseBusiness className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
                        <p className="text-sm text-muted-foreground">No tasks match these filters.</p>
                    </Card>
                )}

                {tasks.links.length > 3 && (
                    <nav aria-label="Task queue pages" className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        {tasks.from != null && tasks.to != null && tasks.total != null ? (
                            <p className="text-xs tabular-nums text-muted-foreground">
                                Showing {tasks.from}–{tasks.to} of {tasks.total}
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
                                        className={`focus-ring inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border px-3 text-sm transition-colors md:min-h-9 md:min-w-9 ${
                                            link.active
                                                ? 'border-primary bg-primary font-semibold text-primary-foreground'
                                                : 'border-border bg-card text-foreground hover:bg-accent'
                                        }`}
                                    >
                                        {text}
                                    </Link>
                                );
                            })}
                        </div>
                    </nav>
                )}
            </div>
        </>
    );
}

AdminTaskQueue.layout = (page: ReactNode) => <AdminLayout>{page}</AdminLayout>;
