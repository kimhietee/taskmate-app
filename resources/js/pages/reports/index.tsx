import { formatDate } from '@/lib/format';
import { Head, Link } from '@inertiajs/react';
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
            <main className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">
                <h1 className="text-2xl font-semibold">My reports</h1>
                <p className="rounded-lg border p-4 text-sm">
                    {COMPLETION_PAYMENT_NOTICE}
                </p>
                {status && (
                    <p role="status" className="rounded border p-3 text-sm">
                        {status}
                    </p>
                )}
                {page.data.length ? (
                    <div className="space-y-3">
                        {page.data.map((item) => (
                            <article
                                key={item.id}
                                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4"
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
                    <p className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
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
                                    className="rounded border px-3 py-1 text-sm"
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ) : (
                                <span
                                    key={index}
                                    className="rounded border px-3 py-1 text-sm"
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
