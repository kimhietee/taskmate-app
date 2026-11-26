import { formatDate } from '@/lib/format';
import { Head, Link } from '@inertiajs/react';
import { ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReportStatusBadge } from '@/components/report-status-badge';
import reports from '@/routes/reports';
import { COMPLETION_PAYMENT_NOTICE } from '@/constants/notices';

type Item = {
    id: number;
    typeLabel: string;
    status: string;
    statusLabel: string;
    taskTitle: string;
    otherParty: string;
    createdAt: string | null;
};
export default function MyReports({
    reports: page,
    status,
}: {
    reports: {
        data: Item[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    status?: string | null;
}) {
    return (
        <>
            <Head title="My reports" />
            <main className="reports-list-page">
                <header className="reports-page-hero">
                    <span className="reports-page-icon" aria-hidden="true"><ClipboardList /></span>
                    <div>
                        <p className="reports-page-eyebrow">Help and safety</p>
                        <h1>My reports</h1>
                        <p>Track concerns you filed or reports involving you.</p>
                    </div>
                </header>
                <p className="reports-boundary-notice">
                    {COMPLETION_PAYMENT_NOTICE}
                </p>
                {status && (
                    <p role="status" className="reports-status">
                        {status}
                    </p>
                )}
                {page.data.length ? (
                    <div className="reports-list">
                        {page.data.map((item) => (
                            <article
                                key={item.id}
                                className="report-list-card"
                            >
                                <div>
                                    <h2 className="font-medium">
                                        {item.typeLabel} · {item.taskTitle}
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        Other party: {item.otherParty} · Filed{' '}
                                        {item.createdAt
                                            ? formatDate(item.createdAt)
                                            : '—'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ReportStatusBadge
                                        status={item.status}
                                        label={item.statusLabel}
                                    />
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={reports.show(item.id)}>
                                            View
                                        </Link>
                                    </Button>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <p className="reports-empty-state">
                        You have not filed or received any reports.
                    </p>
                )}
                {page.links.length > 3 && (
                    <nav className="flex gap-2">
                        {page.links.map((link, index) =>
                            link.url ? (
                                <Link
                                    key={index}
                                    href={link.url}
                                    className={`reports-pagination-link ${link.active ? 'is-active' : ''}`}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ) : (
                                <span
                                    key={index}
                                    className="reports-pagination-link is-disabled"
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
