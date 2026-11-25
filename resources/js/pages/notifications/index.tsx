import { Head, Link, router } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { formatDateTime } from '@/lib/format';

type AlertItem = {
    id: string;
    event: string;
    title: string;
    body: string;
    url: string;
    createdAt: string | null;
    readAt: string | null;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Props = {
    alerts: {
        data: AlertItem[];
        links: PaginationLink[];
        from: number | null;
        to: number | null;
        total: number;
    };
    filter: 'all' | 'unread';
    unreadCount: number;
};

function formatPaginationLabel(label: string): string {
    return label
        .replaceAll('&laquo; Previous', 'Previous')
        .replaceAll('Next &raquo;', 'Next')
        .replaceAll('&laquo;', 'Previous')
        .replaceAll('&raquo;', 'Next')
        .trim();
}

export default function NotificationsIndex({ alerts, filter, unreadCount }: Props) {
    return (
        <>
            <Head title="Notifications" />
            <div className="page-narrow space-y-5">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Notifications</h1>
                        <p className="mt-1 text-sm tabular-nums text-muted-foreground">
                            {unreadCount} unread alert{unreadCount === 1 ? '' : 's'}
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => router.post('/notifications/read-all')}
                        >
                            Mark all as read
                        </Button>
                    )}
                </div>

                <nav
                    aria-label="Notification filters"
                    className="inline-flex rounded-lg border border-border bg-muted p-1"
                >
                    <Link
                        href="/notifications?filter=all"
                        className={`focus-ring inline-flex min-h-9 items-center rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                            filter === 'all'
                                ? 'bg-card text-foreground shadow-xs'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        All
                    </Link>
                    <Link
                        href="/notifications?filter=unread"
                        className={`focus-ring inline-flex min-h-9 items-center rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                            filter === 'unread'
                                ? 'bg-card text-foreground shadow-xs'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Unread
                    </Link>
                </nav>

                <section aria-label={`${filter === 'unread' ? 'Unread' : 'All'} alerts`}>
                    {alerts.data.length ? (
                        <Card className="gap-0 divide-y divide-border overflow-hidden py-0">
                            {alerts.data.map((alert) => (
                                <Link
                                    key={alert.id}
                                    href={alert.url}
                                    className="focus-ring flex items-start gap-3 p-4 transition-colors hover:bg-muted/40"
                                >
                                    <span
                                        aria-hidden="true"
                                        className={`mt-2 size-2 shrink-0 rounded-full ${
                                            alert.readAt ? 'bg-transparent' : 'bg-brand'
                                        }`}
                                    />
                                    <Bell
                                        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                                        aria-hidden="true"
                                    />
                                    <div className="min-w-0 flex-1 space-y-1">
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <h2 className="text-sm font-semibold text-foreground">
                                                {alert.title}
                                                {!alert.readAt && <span className="sr-only">, unread</span>}
                                            </h2>
                                            {!alert.readAt && <Badge variant="info">Unread</Badge>}
                                        </div>
                                        <p className="text-sm text-muted-foreground">{alert.body}</p>
                                        {alert.createdAt && (
                                            <p className="text-xs tabular-nums text-muted-foreground">
                                                {formatDateTime(alert.createdAt)}
                                            </p>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </Card>
                    ) : (
                        <Card className="p-8 text-center text-sm text-muted-foreground">
                            {filter === 'unread' ? 'You have no unread alerts.' : 'You have no alerts yet.'}
                        </Card>
                    )}
                </section>

                {alerts.links.length > 3 && (
                    <nav aria-label="Notification pages" className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        {alerts.from !== null && alerts.to !== null ? (
                            <p className="text-xs tabular-nums text-muted-foreground">
                                Showing {alerts.from}–{alerts.to} of {alerts.total}
                            </p>
                        ) : (
                            <span />
                        )}
                        <div className="flex flex-wrap items-center gap-1.5">
                            {alerts.links.map((link, index) => {
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
            </div>
        </>
    );
}

NotificationsIndex.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'Notifications', href: '/notifications' }]}>{page}</AppLayout>
);
