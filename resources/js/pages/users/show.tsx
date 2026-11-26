import { formatDate } from '@/lib/format';
import { Head } from '@inertiajs/react';
import { VerificationStatusBadge } from '@/components/verification-status-badge';
import { RatingSummary, ratingNotice } from '@/components/rating-summary';
import { StarRating } from '@/components/star-rating';
import { ProblemReportForm } from '@/components/problem-report-form';

type Profile = {
    id: number;
    displayName: string;
    type: string;
    affiliation: string | null;
    verificationStatus:
        | 'pending'
        | 'verified'
        | 'rejected'
        | 'more_info_requested';
    memberSince: string | null;
    completedTasks: number;
    ratingSummary: import('@/components/rating-summary').RatingSummaryData;
};
type Review = {
    id: number;
    comment: string | null;
    overall: number;
    taskTitle: string;
    date: string | null;
    raterName: string;
};
export default function UserProfile({
    profile,
    ratings,
    notice,
    problemReport,
}: {
    profile: Profile;
    ratings: Review[];
    notice: string;
    problemReport?: {
        action: string;
        types: { value: string; label: string }[];
    } | null;
}) {
    return (
        <>
            <Head title={`${profile.displayName} profile`} />
            <main className="mx-auto max-w-3xl space-y-5 p-4 sm:p-6">
                <header>
                    <h1 className="text-2xl font-semibold">
                        {profile.displayName}
                    </h1>
                    <p className="mt-1 text-sm">
                        {profile.type}
                        {profile.affiliation ? ` · ${profile.affiliation}` : ''}
                    </p>
                    <div className="mt-2">
                        <VerificationStatusBadge
                            status={profile.verificationStatus}
                        />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Member since{' '}
                        {profile.memberSince
                            ? formatDate(profile.memberSince)
                            : '—'}{' '}
                        · {profile.completedTasks} completed tasks
                    </p>
                </header>
                <RatingSummary summary={profile.ratingSummary} />
                <p className="rounded-lg border bg-muted/40 p-4 text-sm">
                    {notice}
                </p>
                {problemReport && <ProblemReportForm {...problemReport} />}
                <section className="space-y-3">
                    <h2 className="text-lg font-semibold">
                        Recent visible feedback
                    </h2>
                    {ratings.length ? (
                        ratings.map((rating) => (
                            <article
                                key={rating.id}
                                className="space-y-2 rounded-xl border bg-card p-4"
                            >
                                <div className="flex justify-between gap-2">
                                    <p className="font-medium">
                                        {rating.taskTitle}
                                    </p>
                                    <StarRating
                                        score={rating.overall}
                                        label="Overall experience"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    From {rating.raterName} ·{' '}
                                    {rating.date
                                        ? formatDate(rating.date)
                                        : '—'}
                                </p>
                                {rating.comment && (
                                    <p className="text-sm whitespace-pre-wrap">
                                        {rating.comment}
                                    </p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    {ratingNotice}
                                </p>
                            </article>
                        ))
                    ) : (
                        <p className="rounded-lg border p-4 text-sm text-muted-foreground">
                            No visible comments yet.
                        </p>
                    )}
                </section>
            </main>
        </>
    );
}
