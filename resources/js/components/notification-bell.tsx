import { useEffect, useRef, useState } from "react";
import {
    Bell,
    BellRing,
    CheckCheck,
    FileCheck2,
    MessageSquare,
    ShieldAlert,
    Star,
} from "lucide-react";
import { Link, usePage } from "@inertiajs/react";

type Alert = {
    id: string;
    event: string;
    title: string;
    body: string;
    url: string;
    createdAt: string | null;
    readAt: string | null;
};
type Summary = { unreadCount: number; unreadMessages: number; latest: Alert[] };

function AlertIcon({ event }: { event: string }) {
    const Icon = event.startsWith("conversation.message")
        ? MessageSquare
        : event.startsWith("agreement.")
          ? FileCheck2
          : event.startsWith("rating.")
            ? Star
            : event.startsWith("sanction.") || event.startsWith("report.")
              ? ShieldAlert
              : event.includes("read")
                ? CheckCheck
                : BellRing;

    return <Icon className="notification-alert-icon" aria-hidden="true" />;
}

export function NotificationBell({
    pollSeconds = 10,
    showMessages = true,
}: {
    pollSeconds?: number;
    showMessages?: boolean;
}) {
    const [summary, setSummary] = useState<Summary>({
        unreadCount: 0,
        unreadMessages: 0,
        latest: [],
    });
    const messagesMenu = useRef<HTMLDetailsElement>(null);
    const notificationsMenu = useRef<HTMLDetailsElement>(null);
    const authUser = (
        usePage().props as {
            auth?: {
                user?: {
                    is_admin?: boolean;
                    verification_status?: string;
                } | null;
            };
        }
    ).auth?.user;
    const backoff = useRef(0);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout> | undefined;
        let stopped = false;
        let request: AbortController | undefined;

        const schedule = (delay: number) => {
            if (stopped || document.visibilityState !== "visible") return;
            timer = setTimeout(poll, delay);
        };

        const poll = async () => {
            if (stopped || document.visibilityState !== "visible") return;
            request = new AbortController();
            try {
                const response = await fetch("/notifications/summary", {
                    credentials: "same-origin",
                    headers: {
                        Accept: "application/json",
                        "X-Requested-With": "XMLHttpRequest",
                    },
                    signal: request.signal,
                });
                if (response.redirected || response.status === 401) {
                    stopped = true;
                    return;
                }
                if (!response.ok)
                    throw new Error(`Notification check failed (${response.status}).`);
                setSummary((await response.json()) as Summary);
                backoff.current = 0;
                schedule(Math.max(1, pollSeconds) * 1000);
            } catch (error) {
                if (error instanceof DOMException && error.name === "AbortError") return;
                backoff.current = Math.min(backoff.current + 1, 6);
                schedule(Math.min(Math.max(1, pollSeconds) * 1000 * 2 ** backoff.current, 300_000));
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
    }, [pollSeconds]);

    return (
        <div className="relative flex items-center gap-2">
            {showMessages &&
                authUser &&
                !authUser.is_admin &&
                authUser.verification_status === "verified" && (
                    <details
                        ref={messagesMenu}
                        className="relative"
                        onToggle={(event) => {
                            if (event.currentTarget.open && notificationsMenu.current) {
                                notificationsMenu.current.open = false;
                            }
                        }}
                    >
                        <summary
                            aria-label={`Messages, ${summary.unreadMessages} unread`}
                            className="notification-trigger"
                            title="Messages"
                        >
                            <MessageSquare className="size-5" aria-hidden="true" />
                            {summary.unreadMessages > 0 && (
                                <span className="notification-count" aria-hidden="true">
                                    {summary.unreadMessages > 99 ? "99+" : summary.unreadMessages}
                                </span>
                            )}
                        </summary>
                        <div className="notification-popover">
                            <div className="notification-popover-heading">
                                <span>
                                    <MessageSquare className="size-4" aria-hidden="true" /> Recent
                                    messages
                                </span>
                                <Link href="/messages">View all messages</Link>
                            </div>
                            <div className="notification-list">
                                {summary.latest.filter((alert) =>
                                    alert.event.startsWith("conversation.message"),
                                ).length ? (
                                    summary.latest
                                        .filter((alert) =>
                                            alert.event.startsWith("conversation.message"),
                                        )
                                        .map((alert) => (
                                            <Link
                                                key={alert.id}
                                                href={alert.url}
                                                className={`notification-item ${alert.readAt ? "is-read" : "is-unread"}`}
                                            >
                                                <span className="notification-item-icon">
                                                    <MessageSquare aria-hidden="true" />
                                                </span>
                                                <span className="notification-item-copy">
                                                    <strong>{alert.title}</strong>
                                                    <small>{alert.body}</small>
                                                </span>
                                                {!alert.readAt && (
                                                    <span
                                                        className="notification-unread-dot"
                                                        aria-label="Unread"
                                                    />
                                                )}
                                            </Link>
                                        ))
                                ) : (
                                    <p className="notification-empty">No recent messages.</p>
                                )}
                            </div>
                        </div>
                    </details>
                )}
            <details
                ref={notificationsMenu}
                className="relative"
                onToggle={(event) => {
                    if (event.currentTarget.open && messagesMenu.current) {
                        messagesMenu.current.open = false;
                    }
                }}
            >
                <summary
                    aria-label={`Notifications, ${summary.unreadCount} unread`}
                    className="notification-trigger"
                    title="Notifications"
                >
                    <Bell className="size-5" aria-hidden="true" />
                    <span className="sr-only">Notifications</span>
                    {summary.unreadCount > 0 && (
                        <span className="notification-count" aria-hidden="true">
                            {summary.unreadCount > 99 ? "99+" : summary.unreadCount}
                        </span>
                    )}
                </summary>
                <div className="notification-popover">
                    <div className="notification-popover-heading">
                        <span>
                            <Bell className="size-4" aria-hidden="true" /> Recent alerts
                        </span>
                        <Link href="/notifications">View all alerts</Link>
                    </div>
                    <div className="notification-list">
                        {summary.latest.length ? (
                            summary.latest.map((alert) => (
                                <Link
                                    key={alert.id}
                                    href={alert.url}
                                    className={`notification-item ${alert.readAt ? "is-read" : "is-unread"}`}
                                >
                                    <span className="notification-item-icon">
                                        <AlertIcon event={alert.event} />
                                    </span>
                                    <span className="notification-item-copy">
                                        <strong>{alert.title}</strong>
                                        <small>{alert.body}</small>
                                    </span>
                                    {!alert.readAt && (
                                        <span
                                            className="notification-unread-dot"
                                            aria-label="Unread"
                                        />
                                    )}
                                </Link>
                            ))
                        ) : (
                            <p className="notification-empty">You have no alerts yet.</p>
                        )}
                    </div>
                </div>
            </details>
        </div>
    );
}
