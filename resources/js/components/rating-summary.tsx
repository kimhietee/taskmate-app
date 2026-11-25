import { StarRating } from '@/components/star-rating';
import { RATINGS_NOTICE } from '@/constants/notices';

export type RatingSummaryData = { count: number; average: number | null };
export const ratingNotice = RATINGS_NOTICE;

export function RatingSummary({ summary }: { summary: RatingSummaryData }) {
    return (
        <section className="space-y-2 rounded-xl border border-border bg-card p-4 text-sm shadow-xs" aria-label="Rating summary">
            <p className="flex flex-wrap items-center gap-2 font-semibold tabular-nums text-foreground">
                {summary.average === null ? (
                    `${summary.count} visible rating${summary.count === 1 ? '' : 's'}`
                ) : (
                    <>
                        <StarRating score={Math.round(summary.average)} label="Average rating" />
                        <span>
                            {summary.average} average · {summary.count} ratings
                        </span>
                    </>
                )}
            </p>
            <p className="border-t border-border pt-2 text-xs text-muted-foreground">{ratingNotice}</p>
        </section>
    );
}
