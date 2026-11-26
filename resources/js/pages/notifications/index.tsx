import { Head, Link, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { formatDateTime } from "@/lib/format";
import {
    Bell,
    BellOff,
    CheckCheck,
    FileCheck2,
    MessageSquare,
    ShieldAlert,
    Star,
    WalletCards,
} from "lucide-react";

type Alert = {
    id: string;
    event: string;
    title: string;
    body: string;
    url: string;
    createdAt: string | null;
    readAt: string | null;
};
type PaginationLink = { url: string | null; label: string; active: boolean };
type Props = {
    alerts: {
        data: Alert[];
        links: PaginationLink[];
        from: number | null;
        to: number | null;
        total: number;
    };
    filter: "all" | "unread";
    unreadCount: number;
};

function NotificationIcon({ event }: { event: string }) {
    const Icon = event.startsWith("conversation.message")
        ? MessageSquare
        : event.startsWith("agreement.")
          ? FileCheck2
          : event.startsWith("rating.")
            ? Star
            : event.startsWith("payment.")
              ? WalletCards
              : event.startsWith("sanction.") || event.startsWith("report.")
                ? ShieldAlert
                : Bell;

    return <Icon aria-hidden="true" />;
}

export default function NotificationsIndex({ alerts, filter, unreadCount }: Props) {
    return (
        <>
            <Head title="Notifications" />
            <main className="notifications-page mx-auto w-full max-w-7xl space-y-5 p-4 sm:p-6 lg:p-8">
                <header className="notifications-page-header">
                    <div className="notifications-heading-icon">
                        <Bell aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="notifications-eyebrow">Your updates</p>
                        <h1>Notifications</h1>
                        <p className="notifications-subtitle">
                            Stay up to date with your tasks and account.
                        </p>
                    </div>
                    <div className="notifications-header-side">
                        <span className="notifications-unread-summary">
                            <span className="notifications-unread-dot" aria-hidden="true" />
                            {unreadCount} unread
                        </span>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={() => router.post("/notifications/read-all")}
                                className="notifications-read-all"
                            >
                                <CheckCheck aria-hidden="true" />
                                Mark all as read
                            </button>
                        )}
                    </div>
                </header>
                <nav className="notifications-filter" aria-label="Notification filters">
                    <Link
                        className={filter === "all" ? "is-active" : ""}
                        href="/notifications?filter=all"
                    >
                        All alerts <span>{alerts.total}</span>
                    </Link>
                    <Link
                        className={filter === "unread" ? "is-active" : ""}
                        href="/notifications?filter=unread"
                    >
                        Unread <span>{unreadCount}</span>
                    </Link>
                </nav>
                <section
                    className="notifications-list"
                    aria-label={`${filter === "unread" ? "Unread" : "All"} alerts`}
                >
                    {alerts.data.length ? (
                        alerts.data.map((alert) => (
                            <Link
                                key={alert.id}
                                href={alert.url}
                                className={`notification-page-item ${alert.readAt ? "is-read" : "is-unread"}`}
                            >
                                <span className="notification-page-icon">
                                    <NotificationIcon event={alert.event} />
                                </span>
                                <span className="notification-page-content">
                                    <span className="notification-page-title-row">
                                        <h2>
                                            {alert.title}
                                            {!alert.readAt && (
                                                <span className="sr-only">, unread</span>
                                            )}
                                        </h2>
                                        {!alert.readAt && (
                                            <span className="notification-page-new">New</span>
                                        )}
                                    </span>
                                    <span className="notification-page-body">{alert.body}</span>
                                    <span className="notification-page-date">
                                        {alert.createdAt ? formatDateTime(alert.createdAt) : ""}
                                    </span>
                                </span>
                                <span className="notification-page-arrow" aria-hidden="true">
                                    →
                                </span>
                            </Link>
                        ))
                    ) : (
                        <div className="notifications-empty">
                            <span>
                                <BellOff aria-hidden="true" />
                            </span>
                            <h2>
                                {filter === "unread"
                                    ? "You’re all caught up"
                                    : "No notifications yet"}
                            </h2>
                            <p>
                                {filter === "unread"
                                    ? "New alerts will appear here when there is something for you to review."
                                    : "Updates about your tasks and account will appear here."}
                            </p>
                        </div>
                    )}
                </section>
                {alerts.links.length > 3 && (
                    <nav aria-label="Notification pages" className="notifications-pagination">
                        {alerts.links.map((link, index) => (
                            <Link
                                key={`${index}-${link.label}`}
                                href={link.url ?? "#"}
                                aria-current={link.active ? "page" : undefined}
                                className={`${link.active ? "is-active" : ""} ${!link.url ? "pointer-events-none opacity-50" : ""}`}
                            >
                                {link.label.replaceAll("&laquo;", "«").replaceAll("&raquo;", "»")}
                            </Link>
                        ))}
                    </nav>
                )}
            </main>
        </>
    );
}

NotificationsIndex.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
