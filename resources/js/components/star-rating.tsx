export function StarRating({
    score,
    label = 'Rating',
}: {
    score: number;
    label?: string;
}) {
    return (
        <span
            className="inline-flex items-center gap-1"
            aria-label={`${label}: ${score} out of 5`}
        >
            <span aria-hidden="true" className="tracking-wide text-amber-600">
                {'★'.repeat(score)}
                {'☆'.repeat(5 - score)}
            </span>
            <span className="sr-only">{score} out of 5</span>
        </span>
    );
}
