import { Head } from '@inertiajs/react';
import { Info } from 'lucide-react';
import { ProblemReportForm } from '@/components/problem-report-form';
import { RatingSummary, ratingNotice, type RatingSummaryData } from '@/components/rating-summary';
import { StarRating } from '@/components/star-rating';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VerificationStatusBadge } from '@/components/verification-status-badge';
import { formatDate } from '@/lib/format';

type Profile = {
    id: number;
    displayName: string;
    type: string;
    affiliation: string | null;
    verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected' | 'more_info_requested';
    memberSince: string | null;
    completedTasks: number;
    ratingSummary: RatingSummaryData;
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
    problemReport?: { action: string; types: { value: string; label: string }[] } | null;
}) {
    const showExtraNotice = Boolean(notice && notice.trim() !== ratingNotice.trim());

    return (
        <>
            <Head title={`${profile.displayName} profile`} />
            <div className="page-narrow space-y-6">
                <Card>
                    <CardHeader className="space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-1">
                                <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                                    {profile.displayName}
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    {profile.type}
                                    {profile.affiliation ? ` · ${profile.affiliation}` : ''}
                                </p>
                            </div>
                            <VerificationStatusBadge status={profile.verificationStatus} />
                        </div>
                        <p className="text-sm tabular-nums text-muted-foreground">
                            Member since {profile.memberSince ? formatDate(profile.memberSince) : '—'} ·{' '}
                            {profile.completedTasks} completed task{profile.completedTasks === 1 ? '' : 's'}
                        </p>
                    </CardHeader>
                </Card>

                <RatingSummary summary={profile.ratingSummary} />

                {showExtraNotice && (
                    <Alert variant="info">
                        <Info aria-hidden="true" />
                        <AlertDescription>{notice}</AlertDescription>
                    </Alert>
                )}

                {problemReport && <ProblemReportForm {...problemReport} />}

                <section className="space-y-3" aria-labelledby="feedback-heading">
                    <h2 id="feedback-heading" className="text-lg font-semibold">
                        Recent visible feedback
                    </h2>
                    {ratings.length ? (
                        <div className="space-y-3">
                            {ratings.map((rating) => (
                                <Card key={rating.id} className="gap-2">
                                    <CardHeader className="flex-row flex-wrap items-start justify-between gap-2 space-y-0">
                                        <CardTitle className="text-base font-semibold">
                                            {rating.taskTitle}
                                        </CardTitle>
                                        <StarRating score={rating.overall} label="Overall experience" />
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <p className="text-xs tabular-nums text-muted-foreground">
                                            From {rating.raterName} · {rating.date ? formatDate(rating.date) : '—'}
                                        </p>
                                        {rating.comment && (
                                            <p className="whitespace-pre-wrap text-sm text-foreground">
                                                {rating.comment}
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="p-6 text-center text-sm text-muted-foreground">
                            No visible comments yet.
                        </Card>
                    )}
                </section>
            </div>
        </>
    );
}
