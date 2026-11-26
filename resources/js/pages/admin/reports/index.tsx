import { formatDate } from '@/lib/format';
import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { AdminPageHeading } from '@/components/admin-page-heading';
import { ReportStatusBadge } from '@/components/report-status-badge';
import admin from '@/routes/admin';

type Option = { value: string; label: string };
type Item = {
    id: number;
    typeLabel: string;
    status: string;
    statusLabel: string;
    reporterName: string;
    reportedUserName: string;
    taskTitle: string;
    createdAt: string | null;
    priority: string;
    escalated: boolean;
};
type Props = {
    reports: {
        data: Item[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: {
        search?: string;
        type?: string;
        status?: string;
        priority?: string;
        escalated?: string;
        has_evidence?: string;
    };
    types: Option[];
    statuses: Option[];
};
function AdminReportsQueue({ reports, filters, types, statuses }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [type, setType] = useState(filters.type ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [priority, setPriority] = useState(filters.priority ?? '');
    const [escalated, setEscalated] = useState(filters.escalated ?? '');
    const [hasEvidence, setHasEvidence] = useState(filters.has_evidence ?? '');
    const [moreFiltersOpen, setMoreFiltersOpen] = useState(
        Boolean(filters.escalated || filters.has_evidence),
    );
    const filter = (event: React.FormEvent) => {
        event.preventDefault();
        router.get(
            admin.reports.index().url,
            {
                search,
                type,
                status,
                priority,
                escalated,
                has_evidence: hasEvidence,
            },
            { preserveState: true, replace: true },
        );
    };
    return (
        <>
            <Head title="Report review queue" />
            <div className="admin-page space-y-5" data-tone="reports">
                <AdminPageHeading
                    eyebrow="Community concerns"
                    title="Report review queue"
                    description="Review reports and the related TaskMate records."
                    count={reports.data.length}
                    countLabel="on this page"
                />
                <p className="admin-notice">
                    This review is a platform record, not a legal ruling.
                    TaskMate cannot recover or guarantee payment.
                </p>
                <form onSubmit={filter} className="admin-filter-panel">
                    <p className="admin-filter-heading">Find a report</p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <input
                            aria-label="Search parties"
                            placeholder="Search reporter or reported person"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            className="h-10 rounded-md border bg-background px-3 text-sm"
                        />
                        <select
                            aria-label="Filter type"
                            value={type}
                            onChange={(event) => setType(event.target.value)}
                            className="h-10 rounded-md border bg-background px-3 text-sm"
                        >
                            <option value="">All types</option>
                            {types.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
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
                            aria-label="Filter priority"
                            value={priority}
                            onChange={(event) =>
                                setPriority(event.target.value)
                            }
                            className="h-10 rounded-md border bg-background px-3 text-sm"
                        >
                            <option value="">All priorities</option>
                            <option value="high">High</option>
                            <option value="normal">Normal</option>
                        </select>
                        <details
                            open={moreFiltersOpen}
                            onToggle={(event) =>
                                setMoreFiltersOpen(event.currentTarget.open)
                            }
                            className="rounded-md border p-3 sm:col-span-2 lg:col-span-4"
                        >
                            <summary className="cursor-pointer text-sm font-medium">
                                More filters
                            </summary>
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                <select
                                    aria-label="Filter escalation"
                                    value={escalated}
                                    onChange={(event) =>
                                        setEscalated(event.target.value)
                                    }
                                    className="h-10 rounded-md border bg-background px-3 text-sm"
                                >
                                    <option value="">Any escalation</option>
                                    <option value="1">Escalated</option>
                                    <option value="0">Not escalated</option>
                                </select>
                                <select
                                    aria-label="Filter evidence"
                                    value={hasEvidence}
                                    onChange={(event) =>
                                        setHasEvidence(event.target.value)
                                    }
                                    className="h-10 rounded-md border bg-background px-3 text-sm"
                                >
                                    <option value="">Any evidence</option>
                                    <option value="1">Has evidence</option>
                                    <option value="0">No evidence</option>
                                </select>
                            </div>
                        </details>
                        <button
                            className="admin-filter-submit sm:col-span-2 lg:col-span-4"
                            type="submit"
                        >
                            Apply filters
                        </button>
                    </div>
                </form>
                {reports.data.length ? (
                    <div className="admin-list-panel">
                        <div className="admin-list-heading">
                            <h2>Reported concerns</h2>
                            <p>Open a report to review its record</p>
                        </div>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th className="p-3">Type / Task</th>
                                    <th className="p-3">Priority</th>
                                    <th className="p-3">Reporter</th>
                                    <th className="p-3">Reported person</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3">Filed</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.data.map((item) => (
                                    <tr key={item.id}>
                                        <td data-label="Report">
                                            <Link
                                                className="font-medium"
                                                href={admin.reports.show(
                                                    item.id,
                                                )}
                                            >
                                                {item.typeLabel} ·{' '}
                                                {item.taskTitle}
                                            </Link>
                                            {item.escalated && (
                                                <span className="admin-pill ml-2">
                                                    Escalated
                                                </span>
                                            )}
                                        </td>
                                        <td data-label="Priority">
                                            <span
                                                className="admin-pill"
                                                data-variant={
                                                    item.priority === 'high'
                                                        ? 'urgent'
                                                        : 'quiet'
                                                }
                                            >
                                                {item.priority}
                                            </span>
                                        </td>
                                        <td data-label="Reporter">
                                            {item.reporterName}
                                        </td>
                                        <td data-label="Reported person">
                                            {item.reportedUserName}
                                        </td>
                                        <td data-label="Status">
                                            <ReportStatusBadge
                                                status={item.status}
                                                label={item.statusLabel}
                                            />
                                        </td>
                                        <td data-label="Filed">
                                            {item.createdAt
                                                ? formatDate(item.createdAt)
                                                : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="admin-list-panel admin-empty">
                        No reports match these filters.
                    </p>
                )}
                {reports.links.length > 3 && (
                    <nav className="admin-pagination" aria-label="Report pages">
                        {reports.links.map((link, index) =>
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
AdminReportsQueue.layout = (page: React.ReactNode) => (
    <AdminLayout>{page}</AdminLayout>
);
export default AdminReportsQueue;
