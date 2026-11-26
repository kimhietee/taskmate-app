import { formatDate, formatDateTime } from '@/lib/format';
import { Head, Link, router } from '@inertiajs/react';

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
            <main className="mx-auto max-w-3xl space-y-5 p-4 sm:p-6">
                <Link href="/dashboard" className="text-sm underline">
                    Back to dashboard
                </Link>
                <h1 className="text-2xl font-semibold">Account actions</h1>
                {status && (
                    <p role="status" className="rounded border p-3">
                        {status}
                    </p>
                )}
                {activeSuspension && (
                    <p className="rounded border border-red-300 p-4 text-sm">
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
                            className="space-y-2 rounded-lg border bg-card p-4"
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
                                    className="underline"
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
                    <p className="rounded-lg border bg-card p-5 text-sm">
                        There are no account actions to show.
                    </p>
                )}
            </main>
        </>
    );
}
