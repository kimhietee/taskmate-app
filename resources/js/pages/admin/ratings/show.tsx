import { formatAmount } from '@/lib/format';
import { Form, Head, Link } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { ratingNotice } from '@/components/rating-summary';

type Rating = {
    id: number;
    overall: number;
    comment: string | null;
    direction: string;
    scores: { dimension: string; label: string; score: number }[];
    taskTitle: string;
    agreementId: number;
    recordReference: string | null;
    agreedAmount: string | null;
    paymentArrangement: string | null;
    rater: string;
    ratee: string;
    hidden: boolean;
    hiddenReason: string | null;
    visibleToOthers: boolean;
};
function Page({ rating, notice }: { rating: Rating; notice: string }) {
    return (
        <>
            <Head title="Review rating" />
            <div
                className="admin-page admin-rating-detail max-w-4xl space-y-4"
                data-tone="ratings"
            >
                <Link className="admin-back-link" href="/admin/ratings">
                    ← Back to ratings
                </Link>
                <header className="admin-page-heading flex-wrap">
                    <div>
                        <p className="admin-page-eyebrow">Feedback review</p>
                        <h1>Rating for {rating.taskTitle}</h1>
                        <p className="admin-page-description">
                            {rating.rater} rated {rating.ratee}
                        </p>
                    </div>
                    <span
                        className="admin-pill"
                        data-variant={rating.hidden ? 'quiet' : undefined}
                    >
                        {rating.hidden ? 'Hidden' : 'Visible'}
                    </span>
                </header>
                <p className="admin-notice">{ratingNotice}</p>
                <p className="admin-notice">{notice}</p>
                <section className="admin-detail-card space-y-3">
                    <h2 className="text-lg font-semibold">Rating details</h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <p className="rounded-lg bg-muted/40 p-3 text-sm">
                            <span className="block text-muted-foreground">
                                Direction
                            </span>
                            <strong className="capitalize">
                                {rating.direction.replaceAll('_', ' ')}
                            </strong>
                        </p>
                        <p className="rounded-lg bg-muted/40 p-3 text-sm">
                            <span className="block text-muted-foreground">
                                Overall experience
                            </span>
                            <strong>{rating.overall}/5</strong>
                        </p>
                        {rating.scores.map((score) => (
                            <p
                                key={score.dimension}
                                className="rounded-lg bg-muted/40 p-3 text-sm"
                            >
                                <span className="block text-muted-foreground">
                                    {score.label}
                                </span>
                                <strong>{score.score}/5</strong>
                            </p>
                        ))}
                    </div>
                    {rating.comment && (
                        <p className="rounded-lg border p-3 whitespace-pre-wrap">
                            {rating.comment}
                        </p>
                    )}
                    <p>
                        Status:{' '}
                        {rating.hidden
                            ? `Hidden — ${rating.hiddenReason ?? ''}`
                            : rating.visibleToOthers
                              ? 'Visible to others'
                              : 'Waiting for both ratings or window close'}
                    </p>
                    <p>
                        Agreed amount:{' '}
                        {rating.agreedAmount
                            ? `₱${formatAmount(rating.agreedAmount)}`
                            : '—'}
                    </p>
                    <p className="whitespace-pre-wrap">
                        Payment arrangement: {rating.paymentArrangement ?? '—'}
                    </p>
                    <p>
                        Agreement record reference:{' '}
                        <span className="font-mono break-all">
                            {rating.recordReference ?? 'Unavailable'}
                        </span>
                    </p>
                    <p>
                        <Link
                            className="underline"
                            href={`/admin/agreements/${rating.agreementId}`}
                        >
                            View agreement
                        </Link>
                    </p>
                </section>
                {rating.hidden ? (
                    <Form
                        action={`/admin/ratings/${rating.id}/moderate`}
                        method="post"
                    >
                        <input type="hidden" name="action" value="restore" />
                        <button className="admin-filter-submit">
                            Restore rating
                        </button>
                    </Form>
                ) : (
                    <Form
                        action={`/admin/ratings/${rating.id}/moderate`}
                        method="post"
                        className="admin-detail-card admin-rating-action space-y-2"
                    >
                        <input type="hidden" name="action" value="hide" />
                        <label
                            className="block text-sm font-medium"
                            htmlFor="reason"
                        >
                            Reason for hiding (required)
                        </label>
                        <textarea
                            id="reason"
                            name="reason"
                            required
                            maxLength={2000}
                            className="min-h-24 w-full rounded border bg-background p-3"
                        />
                        <button className="rounded bg-destructive px-4 py-2 text-destructive-foreground">
                            Hide rating
                        </button>
                    </Form>
                )}
            </div>
        </>
    );
}
Page.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
export default Page;
