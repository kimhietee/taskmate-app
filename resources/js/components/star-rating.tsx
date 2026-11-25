export function StarRating({ score, label = 'Rating' }: { score: number; label?: string }) {
    const clamped = Math.max(0, Math.min(5, Math.round(score)));

    return (
        <span className="inline-flex items-center gap-1" aria-label={`${label}: ${clamped} out of 5`}>
            <span aria-hidden="true" className="tracking-wide text-warning-fg">
                {'★'.repeat(clamped)}
                {'☆'.repeat(5 - clamped)}
            </span>
            <span className="sr-only">{clamped} out of 5</span>
        </span>
    );
}
