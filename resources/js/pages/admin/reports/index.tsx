import { Head, Link, router } from '@inertiajs/react';
import { Info, ShieldCheck } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { ReportStatusBadge } from '@/components/report-status-badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminLayout from '@/layouts/admin-layout';
import { formatDate } from '@/lib/format';
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

type PageLink = { url: string | null; label: string; active: boolean };

type Props = {
    reports: {
        data: Item[];
        links: PageLink[];
        from?: number | null;
        to?: number | null;
        total?: number | null;
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

function PriorityBadge({ priority }: { priority: string }) {
    if (priority === 'high') {
        return <Badge variant="warning">High</Badge>;
    }

    return <Badge variant="neutral">Normal</Badge>;
}

function AdminReportsQueue({ reports, filters, types, statuses }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [type, setType] = useState(filters.type ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [priority, setPriority] = useState(filters.priority ?? '');
    const [escalated, setEscalated] = useState(filters.escalated ?? '');
    const [hasEvidence, setHasEvidence] = useState(filters.has_evidence ?? '');

    const filter = (event: React.FormEvent) => {
        event.preventDefault();
        router.get(
            admin.reports.index().url,
            {
                search: search || undefined,
                type: type || undefined,
                status: status || undefined,
                priority: priority || undefined,
                escalated: escalated || undefined,
                has_evidence: hasEvidence || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    return (
        <>
            <Head title="Report review queue" />
            <div className="space-y-6">
                <header>
                    <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Report review queue</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Review reports and related TaskMate records.</p>
                </header>

                <Alert variant="info">
                    <Info aria-hidden="true" />
                    <AlertDescription>
                        This review is a platform record, not a legal ruling. TaskMate cannot recover or guarantee
                        payment.
                    </AlertDescription>
                </Alert>

                <Card className="p-4 shadow-xs">
                    <form onSubmit={filter} className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="reports-search">Search parties</Label>
                            <Input
                                id="reports-search"
                                placeholder="Search reporter or reported person"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="reports-type">Type</Label>
                            <select
                                id="reports-type"
                                value={type}
                                onChange={(event) => setType(event.target.value)}
                                className={NATIVE_SELECT_CLASS}
                            >
                                <option value="">All types</option>
                                {types.map((item) => (
                                    <option key={item.value} value={item.value}>
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="reports-status">Status</Label>
                            <select
                                id="reports-status"
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
                            <Label htmlFor="reports-priority">Priority</Label>
                            <select
                                id="reports-priority"
                                value={priority}
                                onChange={(event) => setPriority(event.target.value)}
                                className={NATIVE_SELECT_CLASS}
                            >
                                <option value="">All priorities</option>
                                <option value="high">High</option>
                                <option value="normal">Normal</option>
                            </select>
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="reports-escalated">Escalation</Label>
                            <select
                                id="reports-escalated"
                                value={escalated}
                                onChange={(event) => setEscalated(event.target.value)}
                                className={NATIVE_SELECT_CLASS}
                            >
                                <option value="">Any escalation</option>
                                <option value="1">Escalated</option>
                                <option value="0">Not escalated</option>
                            </select>
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="reports-evidence">Evidence</Label>
                            <select
                                id="reports-evidence"
                                value={hasEvidence}
                                onChange={(event) => setHasEvidence(event.target.value)}
                                className={NATIVE_SELECT_CLASS}
                            >
                                <option value="">Any evidence</option>
                                <option value="1">Has evidence</option>
                                <option value="0">No evidence</option>
                            </select>
                        </div>
                        <div className="sm:col-span-2 lg:col-span-2">
                            <Button type="submit" className="w-full lg:w-auto">
                                Apply filters
                            </Button>
                        </div>
                    </form>
                </Card>

                {reports.data.length ? (
                    <>
                        <div className="hidden overflow-x-auto rounded-xl border border-border bg-card shadow-xs md:block">
                            <table className="w-full border-collapse text-left text-sm">
                                <thead className="sticky top-0 z-10 border-b border-border bg-muted/60 text-xs font-semibold text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3">Type / Task</th>
                                        <th className="px-4 py-3">Priority</th>
                                        <th className="px-4 py-3">Reporter</th>
                                        <th className="px-4 py-3">Reported person</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Filed</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {reports.data.map((item) => (
                                        <tr key={item.id} className="transition-colors hover:bg-muted/30">
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Link
                                                        className="focus-ring rounded-sm font-semibold text-brand underline-offset-4 hover:underline"
                                                        href={admin.reports.show(item.id)}
                                                    >
                                                        {item.typeLabel} · {item.taskTitle}
                                                    </Link>
                                                    {item.escalated && <Badge variant="danger">Escalated</Badge>}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <PriorityBadge priority={item.priority} />
                                            </td>
                                            <td className="px-4 py-3 text-foreground">{item.reporterName}</td>
                                            <td className="px-4 py-3 text-foreground">{item.reportedUserName}</td>
                                            <td className="px-4 py-3">
                                                <ReportStatusBadge status={item.status} label={item.statusLabel} />
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap tabular-nums text-muted-foreground">
                                                {item.createdAt ? formatDate(item.createdAt) : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="grid gap-3 md:hidden">
                            {reports.data.map((item) => (
                                <Card key={item.id} className="space-y-2.5 p-4 shadow-xs">
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <Link
                                            className="focus-ring rounded-sm font-semibold text-brand underline-offset-4 hover:underline"
                                            href={admin.reports.show(item.id)}
                                        >
                                            {item.typeLabel} · {item.taskTitle}
                                        </Link>
                                        <ReportStatusBadge status={item.status} label={item.statusLabel} />
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <PriorityBadge priority={item.priority} />
                                        {item.escalated && <Badge variant="danger">Escalated</Badge>}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {item.reporterName} → {item.reportedUserName}
                                    </p>
                                    <p className="text-xs tabular-nums text-muted-foreground">
                                        Filed: {item.createdAt ? formatDate(item.createdAt) : '—'}
                                    </p>
                                </Card>
                            ))}
                        </div>
                    </>
                ) : (
                    <Card className="space-y-2 p-10 text-center">
                        <ShieldCheck className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
                        <p className="text-sm text-muted-foreground">No reports match these filters.</p>
                    </Card>
                )}

                {reports.links.length > 3 && (
                    <nav aria-label="Report queue pages" className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        {reports.from != null && reports.to != null && reports.total != null ? (
                            <p className="text-xs tabular-nums text-muted-foreground">
                                Showing {reports.from}–{reports.to} of {reports.total}
                            </p>
                        ) : (
                            <span />
                        )}
                        <div className="flex flex-wrap items-center gap-1.5">
                            {reports.links.map((link, index) => {
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

AdminReportsQueue.layout = (page: ReactNode) => <AdminLayout>{page}</AdminLayout>;

export default AdminReportsQueue;
