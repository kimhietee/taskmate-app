import { useEffect, useMemo, useRef, useState } from "react";
import { Form, Head, Link } from "@inertiajs/react";
import { ArrowLeft, LockKeyhole, Send, ShieldCheck } from "lucide-react";
import AppLayout from "@/layouts/app-layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import InputError from "@/components/input-error";
import { VerificationStatusBadge } from "@/components/verification-status-badge";
import { ProblemReportForm } from "@/components/problem-report-form";
import { formatDateTime } from "@/lib/format";

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
    event: "closed" | "reopened";
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
            verificationStatus: "pending" | "verified" | "rejected" | "more_info_requested";
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
    "This conversation is private between you and {person}. Only the two of you can read it unless you report a message or the system flags it. Keep task terms on the agreement page. Never share passwords or identity documents.";
const FLAG_NOTICE =
    "This message contains a request to move outside TaskMate or skip its steps. Be careful, keep agreements and communications on record, and report anything that makes you uncomfortable.";

function getMessageInitials(name: string) {
    return (
        name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part.charAt(0))
            .join("")
            .toUpperCase() || "?"
    );
}

export default function ConversationShow(props: Props) {
    return <ConversationThread key={props.conversation.id} {...props} />;
}

function ConversationThread(props: Props) {
    const { conversation } = props;
    const [polledMessages, setPolledMessages] = useState<Message[]>([]);
    const [activeReportMessageId, setActiveReportMessageId] = useState<number | null>(null);
    const [timestampMessageId, setTimestampMessageId] = useState<number | null>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const reportPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const cursor = useRef(conversation.lastMessageId);
    const backoff = useRef(0);
    const lastSavedMessage = props.messages.at(-1);
    const timeline = useMemo(
        () =>
            [
                ...[
                    ...props.messages,
                    ...polledMessages.filter(
                        (message) =>
                            message.id > conversation.lastMessageId &&
                            !props.messages.some((existing) => existing.id === message.id),
                    ),
                ].map((message) => ({
                    kind: "message" as const,
                    at: message.createdAt,
                    id: message.id,
                    message,
                })),
                ...props.events.map((event) => ({
                    kind: "event" as const,
                    at: event.createdAt,
                    id: event.id,
                    event,
                })),
            ].sort((a, b) => (a.at ?? "").localeCompare(b.at ?? "") || a.id - b.id),
        [props.messages, polledMessages, conversation.lastMessageId, props.events],
    );

    const clearReportPressTimer = () => {
        if (reportPressTimer.current) {
            clearTimeout(reportPressTimer.current);
            reportPressTimer.current = null;
        }
    };

    useEffect(() => clearReportPressTimer, []);

    useEffect(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    }, []);

    useEffect(() => {
        cursor.current = Math.max(cursor.current, conversation.lastMessageId);
        if (lastSavedMessage?.isMine) {
            listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
        }
    }, [conversation.lastMessageId, lastSavedMessage?.isMine]);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout> | undefined;
        let stopped = false;
        let request: AbortController | undefined;
        const schedule = (delay: number) => {
            if (!stopped && document.visibilityState === "visible") timer = setTimeout(poll, delay);
        };
        const poll = async () => {
            if (stopped || document.visibilityState !== "visible") return;
            request = new AbortController();
            try {
                const response = await fetch(
                    `/messages/${conversation.id}/updates?after_id=${cursor.current}`,
                    {
                        credentials: "same-origin",
                        headers: {
                            Accept: "application/json",
                            "X-Requested-With": "XMLHttpRequest",
                        },
                        signal: request.signal,
                    },
                );
                if (response.redirected || response.status === 401) {
                    stopped = true;
                    return;
                }
                if (!response.ok) throw new Error(`Message refresh failed (${response.status}).`);
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
                    setPolledMessages((current) => [
                        ...current,
                        ...data.messages.filter(
                            (message) => !current.some((existing) => existing.id === message.id),
                        ),
                    ]);
                    if (shouldStick)
                        requestAnimationFrame(() =>
                            listRef.current?.scrollTo({
                                top: listRef.current.scrollHeight,
                                behavior: "smooth",
                            }),
                        );
                }
                backoff.current = 0;
                schedule(Math.max(1, props.pollSeconds) * 1000);
            } catch (error) {
                if (error instanceof DOMException && error.name === "AbortError") return;
                backoff.current = Math.min(backoff.current + 1, 6);
                schedule(
                    Math.min(Math.max(1, props.pollSeconds) * 1000 * 2 ** backoff.current, 300_000),
                );
            }
        };
        const onVisibility = () => {
            if (document.visibilityState === "visible") {
                if (timer) clearTimeout(timer);
                void poll();
            } else {
                if (timer) clearTimeout(timer);
                request?.abort();
            }
        };
        document.addEventListener("visibilitychange", onVisibility);
        if (document.visibilityState === "visible") void poll();
        return () => {
            stopped = true;
            if (timer) clearTimeout(timer);
            request?.abort();
            document.removeEventListener("visibilitychange", onVisibility);
        };
    }, [conversation.id, props.pollSeconds]);

    return (
        <>
            <Head title={`Messages · ${conversation.taskTitle}`} />
            <main className="messages-page messages-thread-page mx-auto w-full max-w-7xl p-3 sm:p-5 lg:p-8">
                <div className="messages-thread-shell">
                    <header className="messages-thread-header">
                        <Link
                            href="/messages"
                            className="messages-back-link"
                            aria-label="Back to messages"
                        >
                            <ArrowLeft aria-hidden="true" />
                            <span>Messages</span>
                        </Link>
                        <div className="messages-thread-identity">
                            <span
                                className="messages-person-avatar messages-thread-avatar"
                                aria-hidden="true"
                            >
                                {conversation.otherPerson.name
                                    .trim()
                                    .split(/\s+/)
                                    .slice(0, 2)
                                    .map((part) => part.charAt(0))
                                    .join("")
                                    .toUpperCase() || "?"}
                            </span>
                            <div className="messages-thread-person-copy">
                                <h1>{conversation.otherPerson.name}</h1>
                                <p>
                                    {conversation.otherPerson.type}{" "}
                                    <span aria-hidden="true">·</span> {conversation.taskTitle}
                                </p>
                            </div>
                        </div>
                        <div className="messages-thread-header-status">
                            <VerificationStatusBadge
                                status={conversation.otherPerson.verificationStatus}
                            />
                            {conversation.status === "open" ? (
                                <span className="messages-state-pill is-open">Open</span>
                            ) : (
                                <span
                                    className={`messages-state-pill ${conversation.status === "closed" ? "is-closed" : "is-readonly"}`}
                                >
                                    {conversation.status === "closed" ? "Closed" : "Read-only"}
                                </span>
                            )}
                        </div>
                    </header>
                    {props.status && (
                        <div
                            aria-live="polite"
                            aria-atomic="true"
                            className="messages-flash-status"
                        >
                            {props.status}
                        </div>
                    )}
                    <p className="messages-private-notice">
                        <ShieldCheck aria-hidden="true" />
                        <span>
                            {PRIVATE_NOTICE.replace("{person}", conversation.otherPerson.name)}{" "}
                            Press and hold a message from them to report it.
                        </span>
                    </p>
                    {conversation.sendBlockedReason && (
                        <div
                            aria-live="polite"
                            aria-atomic="true"
                            className="messages-readonly-notice"
                        >
                            <LockKeyhole aria-hidden="true" />
                            {conversation.sendBlockedReason}
                        </div>
                    )}
                    <div
                        ref={listRef}
                        aria-label="Conversation messages"
                        className="messages-thread-body"
                    >
                        {timeline.length ? (
                            timeline.map((item) =>
                                item.kind === "event" ? (
                                    <p key={`event-${item.id}`} className="messages-system-event">
                                        {item.event.event === "closed"
                                            ? `${item.event.actor} closed this conversation`
                                            : `${item.event.actor} reopened this conversation`}{" "}
                                        ·{" "}
                                        {item.event.createdAt
                                            ? formatDateTime(item.event.createdAt)
                                            : "—"}
                                    </p>
                                ) : (
                                    <div
                                        key={`message-${item.id}`}
                                        className={`messages-message-row ${item.message.isMine ? "is-mine" : "is-theirs"}`}
                                    >
                                        {!item.message.isMine && (
                                            <span
                                                className="messages-chat-avatar"
                                                aria-hidden="true"
                                            >
                                                {getMessageInitials(item.message.senderName)}
                                            </span>
                                        )}
                                        <div className="messages-message-content">
                                            <article
                                                className={`messages-bubble ${item.message.isMine ? "is-mine" : "is-theirs"}`}
                                            >
                                                <p className="messages-bubble-meta">
                                                    {item.message.senderName}
                                                </p>
                                                <button
                                                    type="button"
                                                    className="messages-bubble-text"
                                                    aria-expanded={
                                                        timestampMessageId === item.message.id
                                                    }
                                                    aria-label={
                                                        !item.message.isMine &&
                                                        item.message.reportUrl
                                                            ? `Message from ${item.message.senderName}. Activate to show the time, or press and hold to report.`
                                                            : undefined
                                                    }
                                                    onPointerDown={(event) => {
                                                        if (
                                                            !item.message.isMine &&
                                                            item.message.reportUrl &&
                                                            event.pointerType !== "mouse"
                                                        ) {
                                                            clearReportPressTimer();
                                                            reportPressTimer.current = setTimeout(
                                                                () => {
                                                                    setActiveReportMessageId(
                                                                        item.message.id,
                                                                    );
                                                                },
                                                                550,
                                                            );
                                                        }
                                                    }}
                                                    onPointerUp={clearReportPressTimer}
                                                    onPointerCancel={clearReportPressTimer}
                                                    onPointerLeave={clearReportPressTimer}
                                                    onContextMenu={(event) => {
                                                        if (
                                                            !item.message.isMine &&
                                                            item.message.reportUrl
                                                        ) {
                                                            event.preventDefault();
                                                            setActiveReportMessageId(
                                                                item.message.id,
                                                            );
                                                        }
                                                    }}
                                                    onKeyDown={(event) => {
                                                        if (
                                                            (event.key === "ContextMenu" ||
                                                                (event.shiftKey &&
                                                                    event.key === "F10")) &&
                                                            !item.message.isMine &&
                                                            item.message.reportUrl
                                                        ) {
                                                            event.preventDefault();
                                                            setActiveReportMessageId(
                                                                item.message.id,
                                                            );
                                                        }
                                                    }}
                                                    onClick={() =>
                                                        setTimestampMessageId(
                                                            timestampMessageId === item.message.id
                                                                ? null
                                                                : item.message.id,
                                                        )
                                                    }
                                                >
                                                    {item.message.body}
                                                </button>
                                                {item.message.flaggedForRecipient &&
                                                    !item.message.isMine && (
                                                        <div className="messages-flag-notice">
                                                            {FLAG_NOTICE}
                                                        </div>
                                                    )}
                                                {!item.message.isMine &&
                                                    item.message.reportUrl &&
                                                    activeReportMessageId === item.message.id && (
                                                        <div className="messages-report-action">
                                                            <ProblemReportForm
                                                                action={item.message.reportUrl}
                                                                types={props.reportTypes}
                                                                reportLabel="Report this message"
                                                                contextMessages={
                                                                    props.reportContextMessages
                                                                }
                                                            />
                                                        </div>
                                                    )}
                                            </article>
                                            {timestampMessageId === item.message.id &&
                                                item.message.createdAt && (
                                                    <time className="messages-message-time">
                                                        {formatDateTime(item.message.createdAt)}
                                                    </time>
                                                )}
                                        </div>
                                        {item.message.isMine && (
                                            <span
                                                className="messages-chat-avatar is-mine"
                                                aria-hidden="true"
                                            >
                                                {getMessageInitials(item.message.senderName)}
                                            </span>
                                        )}
                                    </div>
                                ),
                            )
                        ) : (
                            <p className="messages-thread-empty">
                                No messages yet. Send a message to start the conversation.
                            </p>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {conversation.canReopen && (
                            <Form
                                action={`/messages/${conversation.id}/reopen`}
                                method="post"
                                options={{ preserveScroll: true }}
                            >
                                <Button
                                    type="submit"
                                    variant="outline"
                                    className="messages-secondary-action"
                                >
                                    Reopen conversation
                                </Button>
                            </Form>
                        )}
                        {conversation.closedBy && (
                            <p className="messages-closed-by">
                                Closed by {conversation.closedBy}
                                {conversation.closedAt
                                    ? ` on ${formatDateTime(conversation.closedAt)}`
                                    : ""}
                                .
                            </p>
                        )}
                    </div>
                    {conversation.canSend && (
                        <Form
                            action={`/messages/${conversation.id}/send`}
                            method="post"
                            resetOnSuccess={["body"]}
                            options={{ preserveScroll: true }}
                            className="messages-composer"
                        >
                            {({ errors, processing }) => (
                                <>
                                    <label htmlFor="body" className="messages-composer-label">
                                        Message
                                    </label>
                                    <div className="messages-composer-row">
                                        <Textarea
                                            id="body"
                                            name="body"
                                            required
                                            readOnly={processing}
                                            maxLength={props.messageMaxLength}
                                            rows={1}
                                            className="messages-composer-input"
                                            placeholder="Write a message about this task"
                                        />
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="messages-send-button"
                                        >
                                            <Send aria-hidden="true" />
                                            {processing ? "Sending…" : "Send"}
                                        </Button>
                                    </div>
                                    <InputError message={errors.body} />
                                    <div className="messages-composer-footer">
                                        <p>
                                            Private to this conversation · Links appear as plain
                                            text.
                                        </p>
                                    </div>
                                </>
                            )}
                        </Form>
                    )}
                    {conversation.canClose && (
                        <details className="messages-conversation-options">
                            <summary>Conversation options</summary>
                            <Form
                                action={`/messages/${conversation.id}/close`}
                                method="post"
                                options={{ preserveScroll: true }}
                                className="messages-close-form"
                                onBefore={() =>
                                    window.confirm("Close this conversation for both participants?")
                                }
                            >
                                <Button
                                    type="submit"
                                    variant="outline"
                                    className="messages-secondary-action"
                                >
                                    Close conversation
                                </Button>
                            </Form>
                        </details>
                    )}
                </div>
            </main>
        </>
    );
}
ConversationShow.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
