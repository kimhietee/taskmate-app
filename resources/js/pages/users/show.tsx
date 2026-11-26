import { formatDate } from '@/lib/format';
import { Head } from '@inertiajs/react';
import { UserRound } from 'lucide-react';
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
            <main className="public-user-profile-page">
                <header className="public-user-profile-hero">
                    <div className="public-user-avatar" aria-hidden="true">
                        <UserRound />
                    </div>
                    <div className="public-user-profile-copy">
                    <p className="public-user-profile-eyebrow">TaskMate member</p>
                    <h1>
                        {profile.displayName}
                    </h1>
                    <p className="public-user-profile-meta">
                        {profile.type}
                        {profile.affiliation ? ` · ${profile.affiliation}` : ''}
                    </p>
                    <div className="public-user-profile-badge">
                        <VerificationStatusBadge
                            status={profile.verificationStatus}
                        />
                    </div>
                    <p className="public-user-profile-stats">
                        Member since{' '}
                        {profile.memberSince
                            ? formatDate(profile.memberSince)
                            : '—'}{' '}
                        · {profile.completedTasks} completed tasks
                    </p>
                    </div>
                </header>
                <section className="public-user-rating-summary">
                    <RatingSummary summary={profile.ratingSummary} />
                </section>
                <p className="public-user-rating-notice">
                    {notice}
                </p>
                {problemReport && <ProblemReportForm {...problemReport} />}
                <section className="public-user-feedback">
                    <h2>
                        Recent visible feedback
                    </h2>
                    {ratings.length ? (
                        ratings.map((rating) => (
                            <article
                                key={rating.id}
                                className="public-user-feedback-card"
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
                        <p className="public-user-feedback-empty">
                            No visible comments yet.
                        </p>
                    )}
                </section>
            </main>
        </>
    );
}
