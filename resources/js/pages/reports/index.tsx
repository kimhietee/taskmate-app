import { Head, Link } from '@inertiajs/react';
import { Flag, Info } from 'lucide-react';
import { ReportStatusBadge } from '@/components/report-status-badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { COMPLETION_PAYMENT_NOTICE } from '@/constants/notices';
import { formatDate } from '@/lib/format';
import reports from '@/routes/reports';

type Item = {
    id: number;
    typeLabel: string;
    status: string;
    statusLabel: string;
    taskTitle: string;
    otherParty: string;
    createdAt: string | null;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Props = {
    reports: {
        data: Item[];
        links: PaginationLink[];
        from?: number | null;
        to?: number | null;
        total?: number | null;
    };
    status?: string | null;
};

function formatPaginationLabel(label: string): string {
    return label
        .replaceAll('&laquo; Previous', 'Previous')
        .replaceAll('Next &raquo;', 'Next')
        .replaceAll('&laquo;', 'Previous')
        .replaceAll('&raquo;', 'Next')
        .trim();
}

export default function MyReports({ reports: page, status }: Props) {
    return (
        <>
            <Head title="My reports" />
            <div className="page space-y-5">
                <header>
                    <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">My reports</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Track reports you have filed or received and read administrator updates.
                    </p>
                </header>

                <Alert variant="info">
                    <Info aria-hidden="true" />
                    <AlertDescription>{COMPLETION_PAYMENT_NOTICE}</AlertDescription>
                </Alert>

                {status && (
                    <div
                        role="status"
                        className="rounded-lg border border-success-border bg-success-bg px-4 py-3 text-sm text-success-fg"
                    >
                        {status}
                    </div>
                )}

                {page.data.length ? (
                    <>
                        <div className="hidden overflow-x-auto rounded-xl border border-border bg-card shadow-xs md:block">
                            <table className="w-full border-collapse text-left text-sm">
                                <thead className="sticky top-0 z-10 border-b border-border bg-muted/60 text-xs font-semibold text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3">Report</th>
                                        <th className="px-4 py-3">Task</th>
                                        <th className="px-4 py-3">Other party</th>
                                        <th className="px-4 py-3">Filed</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {page.data.map((item) => (
                                        <tr key={item.id} className="transition-colors hover:bg-muted/30">
                                            <td className="px-4 py-3 font-medium text-foreground">{item.typeLabel}</td>
                                            <td className="px-4 py-3 text-foreground">{item.taskTitle}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{item.otherParty}</td>
                                            <td className="px-4 py-3 tabular-nums text-muted-foreground">
                                                {item.createdAt ? formatDate(item.createdAt) : '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <ReportStatusBadge status={item.status} label={item.statusLabel} />
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={reports.show(item.id)}>View</Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="grid gap-3 md:hidden">
                            {page.data.map((item) => (
                                <Card key={item.id} className="space-y-2.5 p-4 shadow-xs">
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <h2 className="font-semibold text-foreground">{item.typeLabel}</h2>
                                            <p className="text-sm text-muted-foreground">{item.taskTitle}</p>
                                        </div>
                                        <ReportStatusBadge status={item.status} label={item.statusLabel} />
                                    </div>
                                    <p className="text-xs tabular-nums text-muted-foreground">
                                        Other party: {item.otherParty} · Filed{' '}
                                        {item.createdAt ? formatDate(item.createdAt) : '—'}
                                    </p>
                                    <div className="pt-1">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={reports.show(item.id)}>View</Link>
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </>
                ) : (
                    <Card className="space-y-2 p-10 text-center">
                        <Flag className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
                        <p className="text-sm text-muted-foreground">You have not filed or received any reports.</p>
                    </Card>
                )}

                {page.links.length > 3 && (
                    <nav aria-label="Report pages" className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        {page.from != null && page.to != null && page.total != null ? (
                            <p className="text-xs tabular-nums text-muted-foreground">
                                Showing {page.from}–{page.to} of {page.total}
                            </p>
                        ) : (
                            <span />
                        )}
                        <div className="flex flex-wrap items-center gap-1.5">
                            {page.links.map((link, index) => {
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
