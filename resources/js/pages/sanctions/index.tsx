import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, CircleAlert } from 'lucide-react';
import { STATUS, StatusBadge } from '@/components/status-badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatDateTime } from '@/lib/format';

type Sanction = {
    id: number;
    type: string;
    reason: string;
    startsAt: string | null;
    endsAt: string | null;
    liftedAt: string | null;
    acknowledged: boolean;
    active: boolean;
};

const SANCTION_TITLES: Record<string, string> = {
    warning: 'Account warning',
    suspension: 'Account suspension',
    ban: 'Account ban',
    remove_post: 'Post removal',
    post_removal: 'Post removal',
};

function formatSanctionTitle(type: string): string {
    return SANCTION_TITLES[type] ?? type.replaceAll('_', ' ');
}

export default function MySanctions({
    sanctions,
    activeSuspension,
    contact,
    status,
}: {
    sanctions: Sanction[];
    activeSuspension: { reason: string; endsAt: string | null } | null;
    contact: string;
    status?: string | null;
}) {
    return (
        <>
            <Head title="Account actions" />
            <div className="page-narrow space-y-5">
                <div>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/dashboard">
                            <ArrowLeft aria-hidden="true" />
                            Back to dashboard
                        </Link>
                    </Button>
                </div>

                <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Account actions</h1>

                {status && (
                    <div
                        role="status"
                        className="rounded-lg border border-success-border bg-success-bg px-4 py-3 text-sm text-success-fg"
                    >
                        {status}
                    </div>
                )}

                {activeSuspension && (
                    <Alert variant="destructive">
                        <CircleAlert aria-hidden="true" />
                        <AlertTitle>Account suspended</AlertTitle>
                        <AlertDescription className="space-y-1">
                            <p>
                                Your account is suspended until{' '}
                                <span className="tabular-nums">
                                    {activeSuspension.endsAt ? formatDateTime(activeSuspension.endsAt) : 'further notice'}
                                </span>
                                .
                            </p>
                            <p>{activeSuspension.reason}</p>
                            {contact && <p>{contact}</p>}
                        </AlertDescription>
                    </Alert>
                )}

                {sanctions.length ? (
                    <div className="space-y-4">
                        {sanctions.map((item) => {
                            const [tone, icon] = item.active
                                ? item.type === 'warning'
                                    ? STATUS.attention
                                    : STATUS.danger
                                : STATUS.closed;

                            return (
                                <Card key={item.id} className="gap-3">
                                    <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
                                        <CardTitle className="text-base font-semibold">
                                            {formatSanctionTitle(item.type)}
                                        </CardTitle>
                                        <StatusBadge tone={tone} icon={icon}>
                                            {item.active ? 'Active' : 'Lifted'}
                                        </StatusBadge>
                                    </CardHeader>
                                    <CardContent className="space-y-3 text-sm">
                                        <p className="text-foreground">{item.reason}</p>
                                        <p className="text-xs tabular-nums text-muted-foreground">
                                            Started {item.startsAt ? formatDateTime(item.startsAt) : '—'}
                                            {item.endsAt ? ` · Ends ${formatDateTime(item.endsAt)}` : ''}
                                            {item.liftedAt ? ` · Lifted ${formatDate(item.liftedAt)}` : ''}
                                        </p>
                                        {item.type === 'warning' && !item.acknowledged && (
                                            <div>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={() => router.post(`/my-sanctions/${item.id}/acknowledge`)}
                                                >
                                                    Acknowledge warning
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <Card className="p-8 text-center text-sm text-muted-foreground">
                        There are no account actions to show.
                    </Card>
                )}
            </div>
        </>
    );
}

MySanctions.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'Account actions', href: '/my-sanctions' }]}>{page}</AppLayout>
);
