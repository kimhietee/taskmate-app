import { Head, Link } from '@inertiajs/react';
import { MessageSquare } from 'lucide-react';
import type { ReactNode } from 'react';
import { STATUS, StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { VerificationStatusBadge } from '@/components/verification-status-badge';
import AppLayout from '@/layouts/app-layout';
import { formatDateTime } from '@/lib/format';

type Item = {
    id: number;
    taskTitle: string;
    otherPerson: {
        name: string;
        type: string;
        verificationStatus: 'pending' | 'verified' | 'rejected' | 'more_info_requested';
    };
    preview: string | null;
    latestAt: string | null;
    unreadCount: number;
    status: 'open' | 'closed' | 'read_only';
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Props = {
    conversations: {
        data: Item[];
        links: PaginationLink[];
        from?: number | null;
        to?: number | null;
        total?: number | null;
    };
};

function formatPaginationLabel(label: string): string {
    return label
        .replaceAll('&laquo; Previous', 'Previous')
        .replaceAll('Next &raquo;', 'Next')
        .replaceAll('&laquo;', 'Previous')
        .replaceAll('&raquo;', 'Next')
        .trim();
}

const CONVERSATION_STATUS = {
    open: { label: 'Open', config: STATUS.info },
    read_only: { label: 'Read-only', config: STATUS.neutral },
    closed: { label: 'Closed', config: STATUS.closed },
} as const;

export default function MessagesIndex({ conversations }: Props) {
    return (
        <>
            <Head title="Messages" />
            <div className="page space-y-5">
                <header>
                    <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Messages</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Private conversations are available to the task poster and applicant.
                    </p>
                </header>

                {conversations.data.length ? (
                    <Card className="divide-y divide-border overflow-hidden p-0">
                        {conversations.data.map((item) => {
                            const statusMeta = CONVERSATION_STATUS[item.status] ?? CONVERSATION_STATUS.read_only;
                            const [tone, icon] = statusMeta.config;

                            return (
                                <Link
                                    key={item.id}
                                    href={`/messages/${item.id}`}
                                    className="focus-ring flex flex-col justify-between gap-3 p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-start sm:gap-4"
                                >
                                    <div className="min-w-0 flex-1 space-y-1.5">
                                        <p className="truncate text-xs font-medium text-muted-foreground">
                                            {item.taskTitle}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="font-semibold text-foreground">{item.otherPerson.name}</h2>
                                            <VerificationStatusBadge status={item.otherPerson.verificationStatus} />
                                            <span className="text-xs text-muted-foreground">
                                                {item.otherPerson.type}
                                            </span>
                                        </div>
                                        <p className="line-clamp-2 whitespace-pre-wrap text-sm text-muted-foreground">
                                            {item.preview ?? 'No messages yet. Start the conversation.'}
                                        </p>
                                    </div>

                                    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 sm:flex-col sm:items-end">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <StatusBadge tone={tone} icon={icon}>
                                                {statusMeta.label}
                                            </StatusBadge>
                                            {item.unreadCount > 0 && (
                                                <Badge variant="default" className="tabular-nums">
                                                    {item.unreadCount} unread
                                                </Badge>
                                            )}
                                        </div>
                                        <span className="text-xs tabular-nums text-muted-foreground">
                                            {item.latestAt ? formatDateTime(item.latestAt) : '—'}
                                        </span>
                                    </div>
                                </Link>
                            );
                        })}
                    </Card>
                ) : (
                    <Card className="space-y-2 p-10 text-center">
                        <MessageSquare className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
                        <h2 className="text-base font-semibold text-foreground">No conversations yet</h2>
                        <p className="text-sm text-muted-foreground">
                            A private conversation opens when someone applies to a task.
                        </p>
                    </Card>
                )}

                {conversations.links.length > 3 && (
                    <nav
                        aria-label="Conversation pages"
                        className="flex flex-wrap items-center justify-between gap-3 pt-2"
                    >
                        {conversations.from != null &&
                        conversations.to != null &&
                        conversations.total != null ? (
                            <p className="text-xs tabular-nums text-muted-foreground">
                                Showing {conversations.from}–{conversations.to} of {conversations.total}
                            </p>
                        ) : (
                            <span />
                        )}
                        <div className="flex flex-wrap items-center gap-1.5">
                            {conversations.links.map((link, index) => {
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

MessagesIndex.layout = (page: ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'Messages', href: '/messages' }]}>{page}</AppLayout>
);
