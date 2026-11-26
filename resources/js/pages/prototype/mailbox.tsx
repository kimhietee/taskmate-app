import { Head, router } from '@inertiajs/react';
import { Check, Copy, ExternalLink, Inbox, Mail, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/format';

type PrototypeEmail = {
    id: string;
    subject: string;
    from: string;
    to: string;
    body: string;
    code: string | null;
    codeLabel?: string | null;
    actionUrl: string | null;
    actionLabel?: string | null;
    actionDescription?: string | null;
    sentAt: string | null;
};

type Props = {
    addresses: string[];
    messages: PrototypeEmail[];
    userName: string;
    mode?: 'account' | 'password_reset';
};

export default function PrototypeMailbox({
    addresses = [],
    messages = [],
    userName,
    mode = 'account',
}: Props) {
    const isPasswordReset = mode === 'password_reset';
    const [selectedId, setSelectedId] = useState<string | null>(messages[0]?.id ?? null);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const selectedMessage = messages.find((item) => item.id === selectedId) ?? messages[0] ?? null;

    const refreshInbox = () => {
        setRefreshing(true);
        router.reload({
            only: ['messages', 'addresses'],
            onFinish: () => setRefreshing(false),
        });
    };

    useEffect(() => {
        const handleVisibilityOrFocus = () => {
            if (document.visibilityState === 'visible') {
                router.reload({ only: ['messages', 'addresses'] });
            }
        };

        window.addEventListener('focus', handleVisibilityOrFocus);
        document.addEventListener('visibilitychange', handleVisibilityOrFocus);

        return () => {
            window.removeEventListener('focus', handleVisibilityOrFocus);
            document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
        };
    }, []);

    const handleCopyCode = async (code: string) => {
        try {
            await navigator.clipboard.writeText(code);
            setCopiedCode(code);
            window.setTimeout(() => setCopiedCode(null), 2500);
        } catch {
            // Clipboard API may be unavailable in non-HTTPS contexts; user can select manually.
        }
    };

    const userInitial = (userName?.trim()?.[0] ?? 'U').toUpperCase();

    return (
        <>
            <Head title="Prototype Mail — Inbox" />
            <div className="prototype-mailbox-page min-h-svh bg-[#f6f8fc] text-slate-900 dark:bg-zinc-950 dark:text-zinc-100">
                {/* Simulated Gmail-style top bar */}
                <header className="prototype-mailbox-header sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
                    <div className="prototype-mailbox-header-inner mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="prototype-mailbox-brand-icon flex size-9 items-center justify-center rounded-lg bg-red-600 text-white shadow-xs">
                                <Mail className="size-5" aria-hidden="true" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-base font-semibold tracking-tight">Prototype Mail</h1>
                                    <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-900 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-200">
                                        Local testing simulator
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-zinc-400">
                                    Simulates your Gmail / CMU inbox for <code>MAIL_MAILER=log</code>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={refreshInbox}
                                disabled={refreshing}
                            >
                                <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
                                Refresh
                            </Button>
                            <div
                                title={addresses.join(', ')}
                                className="flex size-8 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white"
                            >
                                {userInitial}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="prototype-mailbox-content mx-auto max-w-6xl p-4 md:p-6">
                    <div className="prototype-mailbox-addresses mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-slate-900 dark:text-zinc-100">Simulated inbox for:</span>
                            {addresses.length > 0 ? (
                                addresses.map((address) => (
                                    <span
                                        key={address}
                                        className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-800 dark:bg-zinc-800 dark:text-zinc-200"
                                    >
                                        {address}
                                    </span>
                                ))
                            ) : (
                                <span className="text-slate-500 dark:text-zinc-400">
                                    {isPasswordReset ? 'Request a reset code first' : 'No address yet'}
                                </span>
                            )}
                        </div>
                        <span>
                            {isPasswordReset
                                ? 'Copy the 6-digit password reset code below and paste it back into your Forgot password tab.'
                                : 'Copy the 6-digit code below and paste it back into your TaskMate tab.'}
                        </span>
                    </div>

                    {messages.length === 0 ? (
                        <div className="prototype-mailbox-empty flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center dark:border-zinc-800 dark:bg-zinc-900">
                            <Inbox className="size-10 text-slate-400 dark:text-zinc-500" aria-hidden="true" />
                            <h2 className="mt-3 text-base font-semibold">Your prototype inbox is empty</h2>
                            <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-zinc-400">
                                {isPasswordReset ? (
                                    <>
                                        No password reset emails have been captured for this browser session yet. Enter your account email and click{' '}
                                        <strong>Email password reset link</strong> on the Forgot password screen, then click Refresh here.
                                    </>
                                ) : (
                                    <>
                                        No verification emails have been captured for this account yet. Click{' '}
                                        <strong>Resend verification code</strong> or <strong>Send 6-digit CMU code</strong> in your TaskMate tab, then click Refresh here.
                                    </>
                                )}
                            </p>
                            <Button type="button" variant="outline" size="sm" className="mt-4" onClick={refreshInbox}>
                                <RefreshCw className="size-3.5" aria-hidden="true" />
                                Refresh inbox
                            </Button>
                        </div>
                    ) : (
                        <div className="prototype-mailbox-layout grid gap-4 lg:grid-cols-12">
                            {/* Left inbox list */}
                            <aside
                                aria-label="Inbox messages"
                                className="prototype-mailbox-inbox overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-4"
                            >
                                <div className="prototype-mailbox-inbox-heading flex items-center justify-between border-b border-slate-200 px-4 py-3 text-xs font-semibold text-slate-600 dark:border-zinc-800 dark:text-zinc-300">
                                    <span className="flex items-center gap-2">
                                        <Inbox className="size-4 text-red-600" aria-hidden="true" />
                                        Inbox
                                    </span>
                                    <span>{messages.length}</span>
                                </div>
                                <ul className="divide-y divide-slate-100 dark:divide-zinc-800">
                                    {messages.map((message, index) => {
                                        const active = selectedMessage?.id === message.id;
                                        return (
                                            <li key={message.id}>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedId(message.id)}
                                                    className={`prototype-mailbox-message w-full px-4 py-3 text-left transition ${active ? 'is-active' : ''}`}
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-zinc-100">
                                                            {index === 0 && (
                                                                <span className="size-2 rounded-full bg-blue-600" aria-hidden="true" />
                                                            )}
                                                            TaskMate
                                                        </span>
                                                        <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                                                            {message.sentAt ? formatDateTime(message.sentAt) : 'Just now'}
                                                        </span>
                                                    </div>
                                                    <p className="mt-0.5 truncate text-xs font-medium text-slate-800 dark:text-zinc-200">
                                                        {message.subject}
                                                    </p>
                                                    <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-zinc-400">
                                                        To: {message.to}
                                                    </p>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </aside>

                            {/* Right message reader */}
                            {selectedMessage && (
                                <section
                                    aria-label="Email message"
                                    className="prototype-mailbox-reader rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 md:p-6 lg:col-span-8"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-200 pb-4 dark:border-zinc-800">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h2 className="text-xl font-semibold text-slate-900 dark:text-zinc-100">
                                                    {selectedMessage.subject}
                                                </h2>
                                                <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">
                                                    Inbox
                                                </span>
                                            </div>
                                            <div className="mt-3 flex items-center gap-3">
                                                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white">
                                                    T
                                                </div>
                                                <div className="min-w-0 text-xs">
                                                    <p className="font-semibold text-slate-900 dark:text-zinc-100">
                                                        {selectedMessage.from}
                                                    </p>
                                                    <p className="text-slate-500 dark:text-zinc-400">
                                                        to {selectedMessage.to}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-xs text-slate-500 dark:text-zinc-400">
                                            {selectedMessage.sentAt ? formatDateTime(selectedMessage.sentAt) : ''}
                                        </span>
                                    </div>

                                    {selectedMessage.code && (
                                        <div className="prototype-mailbox-code my-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border-2 border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900 dark:bg-blue-950/40">
                                            <div>
                                                <p className="text-xs font-medium uppercase tracking-wide text-blue-900 dark:text-blue-200">
                                                    {selectedMessage.codeLabel ?? '6-digit verification code'}
                                                </p>
                                                <p
                                                    data-test="prototype-verification-code"
                                                    className="mt-1 font-mono text-3xl font-bold tracking-[0.25em] text-slate-950 tabular-nums dark:text-white"
                                                >
                                                    {selectedMessage.code}
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                onClick={() => handleCopyCode(selectedMessage.code!)}
                                            >
                                                {copiedCode === selectedMessage.code ? (
                                                    <>
                                                        <Check className="size-4" aria-hidden="true" />
                                                        Copied code
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="size-4" aria-hidden="true" />
                                                        Copy 6-digit code
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    )}

                                    <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-zinc-300">
                                        {selectedMessage.body}
                                    </div>

                                    {selectedMessage.actionUrl && (
                                        <div className="mt-6 border-t border-slate-200 pt-4 dark:border-zinc-800">
                                            <p className="mb-2 text-xs text-slate-500 dark:text-zinc-400">
                                                {selectedMessage.actionDescription ?? 'Backup signed verification link:'}
                                            </p>
                                            <Button variant="outline" size="sm" asChild>
                                                <a href={selectedMessage.actionUrl}>
                                                    <ExternalLink className="size-3.5" aria-hidden="true" />
                                                    {selectedMessage.actionLabel ?? 'Verify Email Address (backup link)'}
                                                </a>
                                            </Button>
                                        </div>
                                    )}
                                </section>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </>
    );
}

PrototypeMailbox.layout = (page: React.ReactNode) => page;
