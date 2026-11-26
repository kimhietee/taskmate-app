import { formatDate, formatDateTime } from '@/lib/format';
import { Head, Link, router } from '@inertiajs/react';
import { ShieldAlert } from 'lucide-react';

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
            <main className="sanctions-page">
                <Link href="/dashboard" className="sanctions-back-link">
                    Back to dashboard
                </Link>
                <header className="sanctions-hero">
                    <span className="sanctions-hero-icon" aria-hidden="true"><ShieldAlert /></span>
                    <div>
                        <p>Account status</p>
                        <h1>Account actions</h1>
                        <span>Review notices and any restrictions on your account.</span>
                    </div>
                </header>
                {status && (
                    <p role="status" className="sanctions-status">
                        {status}
                    </p>
                )}
                {activeSuspension && (
                    <p className="sanctions-active-notice">
                        Your account is suspended until{' '}
                        {activeSuspension.endsAt
                            ? formatDateTime(activeSuspension.endsAt)
                            : 'further notice'}
                        . {activeSuspension.reason} {contact}
                    </p>
                )}
                {sanctions.length ? (
                    sanctions.map((item) => (
                        <article
                            key={item.id}
                            className={`sanction-record ${item.active ? 'is-active' : ''}`}
                        >
                            <h2 className="font-semibold">
                                {item.type.replaceAll('_', ' ')}
                            </h2>
                            <p>{item.reason}</p>
                            <p className="text-sm text-muted-foreground">
                                Started{' '}
                                {item.startsAt
                                    ? formatDateTime(item.startsAt)
                                    : '—'}
                                {item.endsAt
                                    ? ` · Ends ${formatDateTime(item.endsAt)}`
                                    : ''}
                                {item.liftedAt
                                    ? ` · Lifted ${formatDate(item.liftedAt)}`
                                    : ''}
                            </p>
                            {item.type === 'warning' && !item.acknowledged && (
                                <button
                                    className="sanction-acknowledge"
                                    type="button"
                                    onClick={() =>
                                        router.post(
                                            `/my-sanctions/${item.id}/acknowledge`,
                                        )
                                    }
                                >
                                    Acknowledge warning
                                </button>
                            )}
                        </article>
                    ))
                ) : (
                    <p className="sanctions-empty-state">
                        There are no account actions to show.
                    </p>
                )}
            </main>
        </>
    );
}
