import { Head, Link } from "@inertiajs/react";
import { ArrowRight, CheckCheck, MessageCircle, MessagesSquare } from "lucide-react";
import AppLayout from "@/layouts/app-layout";
import { formatDateTime } from "@/lib/format";
import { VerificationStatusBadge } from "@/components/verification-status-badge";

type Item = {
    id: number;
    taskTitle: string;
    otherPerson: {
        name: string;
        type: string;
        verificationStatus: "pending" | "verified" | "rejected" | "more_info_requested";
    };
    preview: string | null;
    latestAt: string | null;
    hasUnreadMessages: boolean;
    status: "open" | "closed" | "read_only";
};

function initials(name: string) {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0))
        .join("")
        .toUpperCase();
}

export default function MessagesIndex({
    conversations,
}: {
    conversations: {
        data: Item[];
        links: { url: string | null; label: string; active: boolean }[];
    };
}) {
    const unread = conversations.data.filter((item) => item.hasUnreadMessages).length;

    return (
        <>
            <Head title="Messages" />
            <main className="messages-page messages-inbox mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
                <header className="messages-page-header">
                    <span className="messages-heading-icon">
                        <MessagesSquare aria-hidden="true" />
                    </span>
                    <div className="messages-heading-copy">
                        <p className="messages-eyebrow">Your private conversations</p>
                        <h1>Messages</h1>
                        <p>
                            Keep task details and questions in one place with the people involved.
                        </p>
                    </div>
                    <div className="messages-inbox-counts" aria-label="Conversation summary">
                        <div>
                            <strong>{conversations.data.length}</strong>
                            <span>shown here</span>
                        </div>
                        <div className="messages-unread-count">
                            <strong>{unread}</strong>
                            <span>unread here</span>
                        </div>
                    </div>
                </header>

                <section className="messages-list-panel" aria-label="Your conversations">
                    <div className="messages-list-heading">
                        <div>
                            <h2>Recent conversations</h2>
                            <p>Private to you and the other task participant.</p>
                        </div>
                        <span className="messages-secure-label">
                            <span aria-hidden="true">●</span> Private
                        </span>
                    </div>
                    {conversations.data.length ? (
                        <div className="messages-conversation-list">
                            {conversations.data.map((item) => (
                                <Link
                                    key={item.id}
                                    href={`/messages/${item.id}`}
                                    className={`messages-conversation ${item.hasUnreadMessages ? "is-unread" : ""}`}
                                >
                                    <span className="messages-person-avatar" aria-hidden="true">
                                        {initials(item.otherPerson.name) || "?"}
                                    </span>
                                    <span className="messages-conversation-main">
                                        <span className="messages-person-line">
                                            <strong>{item.otherPerson.name}</strong>
                                            <span className="messages-person-meta">
                                                {item.otherPerson.type}
                                            </span>
                                            <VerificationStatusBadge
                                                status={item.otherPerson.verificationStatus}
                                            />
                                        </span>
                                        <span className="messages-task-line">
                                            <MessageCircle aria-hidden="true" />
                                            {item.taskTitle}
                                        </span>
                                        <span className="messages-preview">
                                            {item.preview ??
                                                "No messages yet. Start the conversation."}
                                        </span>
                                    </span>
                                    <span className="messages-conversation-side">
                                        <time>
                                            {item.latestAt
                                                ? formatDateTime(item.latestAt)
                                                : "New conversation"}
                                        </time>
                                        {item.status !== "open" && (
                                            <span
                                                className={`messages-state-pill ${item.status === "closed" ? "is-closed" : "is-readonly"}`}
                                            >
                                                {item.status === "closed" ? "Closed" : "Read-only"}
                                            </span>
                                        )}
                                        {item.hasUnreadMessages ? (
                                            <span className="messages-unread-pill">
                                                <span className="sr-only">Unread messages</span>
                                                <span aria-hidden="true" />
                                            </span>
                                        ) : (
                                            <CheckCheck
                                                aria-label="All caught up"
                                                className="messages-read-icon"
                                            />
                                        )}
                                        <ArrowRight
                                            aria-hidden="true"
                                            className="messages-open-arrow"
                                        />
                                    </span>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="messages-empty">
                            <span>
                                <MessageCircle aria-hidden="true" />
                            </span>
                            <h2>No conversations yet</h2>
                            <p>
                                A private conversation opens when someone applies to a task. You can
                                use it to discuss the work before confirming an agreement.
                            </p>
                        </div>
                    )}
                </section>

                {conversations.links.length > 3 && (
                    <nav className="messages-pagination" aria-label="Conversation pages">
                        {conversations.links.map((link, index) =>
                            link.url ? (
                                <Link
                                    key={index}
                                    href={link.url}
                                    aria-current={link.active ? "page" : undefined}
                                    className={link.active ? "is-active" : ""}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ) : (
                                <span
                                    key={index}
                                    className="is-disabled"
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

MessagesIndex.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
