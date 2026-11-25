import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft, ChevronDown, Flag, Info, TriangleAlert } from 'lucide-react';
import { isValidElement, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import InputError from '@/components/input-error';
import { ProblemReportForm } from '@/components/problem-report-form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { VerificationStatusBadge } from '@/components/verification-status-badge';
import AppLayout from '@/layouts/app-layout';
import { formatDateTime } from '@/lib/format';

type Message = {
    id: number;
    senderId: number;
    senderName: string;
    isMine: boolean;
    body: string;
    createdAt: string | null;
    flaggedForRecipient: boolean;
    reportUrl: string | null;
};

type EventItem = {
    id: number;
    event: 'closed' | 'reopened';
    actor: string;
    createdAt: string | null;
};

type Props = {
    conversation: {
        id: number;
        taskId: number;
        taskTitle: string;
        otherPerson: {
            name: string;
            type: string;
            verificationStatus: 'pending' | 'verified' | 'rejected' | 'more_info_requested';
        };
        status: string;
        closedBy: string | null;
        closedAt: string | null;
        sendBlockedReason: string | null;
        canSend: boolean;
        canClose: boolean;
        canReopen: boolean;
        lastMessageId: number;
    };
    messages: Message[];
    events: EventItem[];
    messageMaxLength: number;
    pollSeconds: number;
    reportContextMessages: number;
    reportTypes: { value: string; label: string }[];
    status?: string | null;
};

const PRIVATE_NOTICE =
    'This conversation is private between you and the other person. Administrators can read a message only if one of you reports it or if the system flags it. Keep your agreement on record in TaskMate, and report anything that makes you uncomfortable. Do not share passwords or identity documents.';
const FLAG_NOTICE =
    'This message contains a request to move outside TaskMate or skip its steps. Be careful, keep agreements and communications on record, and report anything that makes you uncomfortable.';

export default function ConversationShow(props: Props) {
    const { conversation } = props;
    const [messages, setMessages] = useState(props.messages);
    const [closeDialogOpen, setCloseDialogOpen] = useState(false);
    const [reportingMessageId, setReportingMessageId] = useState<number | null>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const cursor = useRef(conversation.lastMessageId);
    const backoff = useRef(0);

    useEffect(() => {
        setMessages(props.messages);
        cursor.current = Math.max(cursor.current, conversation.lastMessageId);
    }, [props.messages, conversation.lastMessageId]);

    const timeline = useMemo(
        () =>
            [
                ...messages.map((message) => ({
                    kind: 'message' as const,
                    at: message.createdAt,
                    id: message.id,
                    message,
                })),
                ...props.events.map((event) => ({
                    kind: 'event' as const,
                    at: event.createdAt,
                    id: event.id,
                    event,
                })),
            ].sort((a, b) => (a.at ?? '').localeCompare(b.at ?? '') || a.id - b.id),
        [messages, props.events],
    );

    useEffect(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    }, []);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout> | undefined;
        let stopped = false;
        let request: AbortController | undefined;

        const schedule = (delay: number) => {
            if (!stopped && document.visibilityState === 'visible') {
                timer = setTimeout(poll, delay);
            }
        };

        const poll = async () => {
            if (stopped || document.visibilityState !== 'visible') {
                return;
            }
            request = new AbortController();
            try {
                const response = await fetch(
                    `/messages/${conversation.id}/updates?after_id=${cursor.current}`,
                    {
                        credentials: 'same-origin',
                        headers: {
                            Accept: 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        signal: request.signal,
                    },
                );
                if (response.redirected || response.status === 401) {
                    stopped = true;
                    return;
                }
                if (!response.ok) {
                    throw new Error(`Message refresh failed (${response.status}).`);
                }
                const data = (await response.json()) as { messages: Message[] };
                if (data.messages.length) {
                    const shouldStick =
                        !!listRef.current &&
                        listRef.current.scrollHeight -
                            listRef.current.scrollTop -
                            listRef.current.clientHeight <
                            80;
                    cursor.current = Math.max(
                        cursor.current,
                        ...data.messages.map((message) => message.id),
                    );
                    setMessages((current) => [
                        ...current,
                        ...data.messages.filter(
                            (message) => !current.some((existing) => existing.id === message.id),
                        ),
                    ]);
                    if (shouldStick) {
                        requestAnimationFrame(() =>
                            listRef.current?.scrollTo({
                                top: listRef.current.scrollHeight,
                                behavior: 'smooth',
                            }),
                        );
                    }
                }
                backoff.current = 0;
                schedule(Math.max(1, props.pollSeconds) * 1000);
            } catch (error) {
                if (error instanceof DOMException && error.name === 'AbortError') {
                    return;
                }
                backoff.current = Math.min(backoff.current + 1, 6);
                schedule(
                    Math.min(
                        Math.max(1, props.pollSeconds) * 1000 * 2 ** backoff.current,
                        300_000,
                    ),
                );
            }
        };

        const onVisibility = () => {
            if (document.visibilityState === 'visible') {
                if (timer) {
                    clearTimeout(timer);
                }
                void poll();
            } else {
                if (timer) {
                    clearTimeout(timer);
                }
                request?.abort();
            }
        };

        document.addEventListener('visibilitychange', onVisibility);
        if (document.visibilityState === 'visible') {
            void poll();
        }
        return () => {
            stopped = true;
            if (timer) {
                clearTimeout(timer);
            }
            request?.abort();
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [conversation.id, props.pollSeconds]);

    const conversationControls = (
        <div className="space-y-3">
            {conversation.canClose && (
                <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setCloseDialogOpen(true)}
                >
                    Close conversation
                </Button>
            )}
            {conversation.canReopen && (
                <Form action={`/messages/${conversation.id}/reopen`} method="post">
                    {({ processing }) => (
                        <Button type="submit" variant="outline" className="w-full" disabled={processing}>
                            {processing && <Spinner />}
                            Reopen conversation
                        </Button>
                    )}
                </Form>
            )}
            {conversation.closedBy && (
                <p className="text-xs tabular-nums text-muted-foreground">
                    Closed by {conversation.closedBy}
                    {conversation.closedAt ? ` on ${formatDateTime(conversation.closedAt)}` : ''}.
                </p>
            )}
        </div>
    );

    return (
        <>
            <Head title={`Messages · ${conversation.taskTitle}`} />
            <div className="page grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
                <div className="min-w-0 space-y-4">
                    <Card className="p-4 shadow-xs">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 space-y-1.5">
                                <Button variant="ghost" size="sm" asChild className="-ml-2">
                                    <Link href="/messages">
                                        <ArrowLeft aria-hidden="true" />
                                        Back to messages
                                    </Link>
                                </Button>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
                                        {conversation.otherPerson.name}
                                    </h1>
                                    <VerificationStatusBadge
                                        status={conversation.otherPerson.verificationStatus}
                                    />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {conversation.otherPerson.type} · Task: {conversation.taskTitle}
                                </p>
                            </div>
                        </div>

                        <details className="group mt-3 border-t border-border pt-3 lg:hidden">
                            <summary className="focus-ring flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-md text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                                <span>Conversation info &amp; controls</span>
                                <ChevronDown
                                    className="size-4 text-muted-foreground transition-transform group-open:rotate-180"
                                    aria-hidden="true"
                                />
                            </summary>
                            <div className="mt-3 space-y-3">
                                <Alert variant="info">
                                    <Info aria-hidden="true" />
                                    <AlertDescription>{PRIVATE_NOTICE}</AlertDescription>
                                </Alert>
                                {conversationControls}
                            </div>
                        </details>
                    </Card>

                    {props.status && (
                        <div
                            role="status"
                            className="rounded-lg border border-success-border bg-success-bg px-4 py-3 text-sm text-success-fg"
                        >
                            {props.status}
                        </div>
                    )}

                    {conversation.sendBlockedReason && (
                        <div
                            role="status"
                            className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-foreground"
                        >
                            {conversation.sendBlockedReason}
                        </div>
                    )}

                    <div
                        ref={listRef}
                        aria-label="Conversation messages"
                        className="min-h-72 max-h-[calc(100svh-18rem)] space-y-3 overflow-y-auto rounded-xl border border-border bg-muted/20 p-4 shadow-xs"
                    >
                        {timeline.length ? (
                            timeline.map((item) =>
                                item.kind === 'event' ? (
                                    <p
                                        key={`event-${item.id}`}
                                        className="py-1 text-center text-xs tabular-nums text-muted-foreground"
                                    >
                                        {item.event.event === 'closed'
                                            ? `${item.event.actor} closed this conversation`
                                            : `${item.event.actor} reopened this conversation`}{' '}
                                        · {item.event.createdAt ? formatDateTime(item.event.createdAt) : '—'}
                                    </p>
                                ) : (
                                    <article
                                        key={`message-${item.id}`}
                                        className={`max-w-[85%] p-3.5 text-sm shadow-xs ${
                                            item.message.isMine
                                                ? 'ml-auto rounded-2xl rounded-br-sm border border-brand/25 bg-info-bg/50 text-foreground'
                                                : 'mr-auto rounded-2xl rounded-bl-sm border border-border bg-card text-foreground'
                                        }`}
                                    >
                                        <p className="text-xs font-medium tabular-nums text-muted-foreground">
                                            {item.message.senderName} ·{' '}
                                            {item.message.createdAt
                                                ? formatDateTime(item.message.createdAt)
                                                : '—'}
                                        </p>
                                        <p className="mt-1.5 whitespace-pre-wrap break-words text-sm text-foreground">
                                            {item.message.body}
                                        </p>

                                        {item.message.flaggedForRecipient && !item.message.isMine && (
                                            <Alert variant="warning" className="mt-3">
                                                <TriangleAlert aria-hidden="true" />
                                                <AlertDescription>{FLAG_NOTICE}</AlertDescription>
                                            </Alert>
                                        )}

                                        {!item.message.isMine && item.message.reportUrl && (
                                            <div className="mt-2">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        setReportingMessageId((current) =>
                                                            current === item.message.id ? null : item.message.id,
                                                        )
                                                    }
                                                >
                                                    <Flag aria-hidden="true" />
                                                    Report
                                                </Button>
                                                {reportingMessageId === item.message.id && (
                                                    <div className="mt-2">
                                                        <ProblemReportForm
                                                            action={item.message.reportUrl}
                                                            types={props.reportTypes}
                                                            reportLabel="Report this message"
                                                            contextMessages={props.reportContextMessages}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </article>
                                ),
                            )
                        ) : (
                            <p className="py-12 text-center text-sm text-muted-foreground">
                                No messages yet. Send a message to start the conversation.
                            </p>
                        )}
                    </div>

                    {conversation.canSend && (
                        <Form
                            action={`/messages/${conversation.id}/send`}
                            method="post"
                            resetOnSuccess={['body']}
                            className="sticky bottom-0 z-20 space-y-3 rounded-xl border border-border bg-card/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-xs backdrop-blur-xs md:p-4"
                        >
                            {({ errors, processing }) => (
                                <>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="body">Message</Label>
                                        <Textarea
                                            id="body"
                                            name="body"
                                            required
                                            maxLength={props.messageMaxLength}
                                            rows={3}
                                            placeholder="Write a message about this task"
                                            aria-describedby={errors.body ? 'body-error' : 'body-helper'}
                                        />
                                        <InputError id="body-error" message={errors.body} />
                                    </div>
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <p id="body-helper" className="text-xs text-muted-foreground">
                                            Text only. Links are shown as plain text. Do not share passwords or
                                            identity documents.
                                        </p>
                                        <Button type="submit" disabled={processing}>
                                            {processing && <Spinner />}
                                            {processing ? 'Sending…' : 'Send message'}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Form>
                    )}
                </div>

                <aside className="hidden lg:sticky lg:top-[calc(var(--banner-h,0px)+1.5rem)] lg:block">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Conversation info</CardTitle>
                            <CardDescription className="truncate">{conversation.taskTitle}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5">
                                <p className="text-sm font-semibold text-foreground">
                                    {conversation.otherPerson.name}
                                </p>
                                <div className="flex flex-wrap items-center gap-2">
                                    <VerificationStatusBadge
                                        status={conversation.otherPerson.verificationStatus}
                                    />
                                    <span className="text-xs text-muted-foreground">
                                        {conversation.otherPerson.type}
                                    </span>
                                </div>
                            </div>

                            <Alert variant="info">
                                <Info aria-hidden="true" />
                                <AlertDescription>{PRIVATE_NOTICE}</AlertDescription>
                            </Alert>

                            {conversationControls}
                        </CardContent>
                    </Card>
                </aside>
            </div>

            <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Close conversation?</DialogTitle>
                        <DialogDescription>Check the details before you continue.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Go back
                            </Button>
                        </DialogClose>
                        <Form
                            action={`/messages/${conversation.id}/close`}
                            method="post"
                            onSuccess={() => setCloseDialogOpen(false)}
                        >
                            {({ processing }) => (
                                <Button type="submit" variant="destructive" disabled={processing}>
                                    {processing && <Spinner />}
                                    Close conversation
                                </Button>
                            )}
                        </Form>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

ConversationShow.layout = (page: ReactNode) => {
    const taskTitle = isValidElement<Props>(page) ? page.props.conversation.taskTitle : 'Conversation';

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Messages', href: '/messages' },
                { title: taskTitle, href: '#' },
            ]}
        >
            {page}
        </AppLayout>
    );
};
