import { Head, Link, useForm } from '@inertiajs/react';
import { Star } from 'lucide-react';
import { useId, useState } from 'react';
import InputError from '@/components/input-error';
import { ratingNotice } from '@/components/rating-summary';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import agreements from '@/routes/agreements';

type Dimension = {
    key: string;
    label: string;
};

type Props = {
    agreement: {
        id: number;
        taskTitle: string;
        agreedAmount?: string;
        paymentStatus?: string;
    };
    direction?: string;
    rateeName: string;
    dimensions: Dimension[];
    commentMaxLength: number;
    visibility: string;
    reportUrl: string;
    status?: string | null;
};

function StarScoreField({
    label,
    value,
    onChange,
    error,
}: {
    label: string;
    value: number | null;
    onChange: (score: number) => void;
    error?: string;
}) {
    const labelId = useId();

    return (
        <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <span id={labelId} className="text-sm font-medium text-foreground">
                    {label}
                </span>
                <span className="text-xs font-medium tabular-nums text-muted-foreground">
                    {value !== null ? `${value} / 5` : 'Select 1 to 5'}
                </span>
            </div>
            <div role="radiogroup" aria-labelledby={labelId} className="flex flex-wrap items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((score) => {
                    const filled = value !== null && score <= value;

                    return (
                        <button
                            key={score}
                            type="button"
                            role="radio"
                            aria-checked={value === score}
                            aria-label={`${label}: ${score} out of 5`}
                            onClick={() => onChange(score)}
                            className={`focus-ring inline-flex size-11 cursor-pointer items-center justify-center rounded-md border transition-colors md:size-10 ${
                                filled
                                    ? 'border-warning-border bg-warning-bg/60 text-warning-fg'
                                    : 'border-border bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                            }`}
                        >
                            <Star
                                className={filled ? 'size-5 fill-current' : 'size-5'}
                                aria-hidden="true"
                            />
                        </button>
                    );
                })}
            </div>
            <InputError message={error} />
        </div>
    );
}

export default function RateAgreement({
    agreement,
    direction,
    rateeName,
    dimensions = [],
    commentMaxLength,
    visibility,
    reportUrl,
    status,
}: Props) {
    const { data, setData, post, processing, errors } = useForm<{
        overall_experience: number | null;
        comment: string;
        scores: Record<string, number>;
    }>({
        overall_experience: null,
        comment: '',
        scores: {},
    });
    const [clientError, setClientError] = useState<string | null>(null);

    const errorRecord = errors as Record<string, string | undefined>;
    const directionLabel =
        direction === 'poster_to_student'
            ? 'Employer feedback for student'
            : direction === 'student_to_poster'
              ? 'Student feedback for poster'
              : null;

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        const missingDimension = dimensions.some((dimension) => !data.scores[dimension.key]);
        if (missingDimension || data.overall_experience === null) {
            setClientError(
                'Please select a star rating (1 to 5) for every category and overall experience before submitting.',
            );
            return;
        }

        setClientError(null);
        post(agreements.rate.store(agreement.id).url, {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Rate your experience" />
            <main className="rating-form-page">
                <header className="rating-form-hero">
                    <span className="rating-form-icon" aria-hidden="true">
                        <Star />
                    </span>
                    <div>
                        <p className="rating-form-eyebrow">Share your experience</p>
                        <h1>Rate your experience</h1>
                        <p className="rating-form-description">
                            Share your experience working with {rateeName} on “{agreement.taskTitle}”.
                            {directionLabel ? ` ${directionLabel}.` : ''}
                        </p>
                    </div>
                </header>

                {status && (
                    <p role="status" className="rating-status">
                        {status}
                    </p>
                )}

                <p className="rating-guidance">{ratingNotice}</p>

                <p className="rating-report-guidance">
                    Use the agreement page to{' '}
                    <Link className="underline" href={`${reportUrl}#completion-payment`}>
                        report non-payment
                    </Link>
                    {' or '}
                    <Link className="underline" href={`${reportUrl}#report-a-problem`}>
                        report a safety or conduct concern
                    </Link>
                    .
                </p>

                <form onSubmit={handleSubmit} className="rating-form-card">
                    {dimensions.length > 0 && (
                        <fieldset className="space-y-3">
                            <legend className="text-sm font-semibold text-foreground">
                                Rating categories
                            </legend>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {dimensions.map((dimension) => (
                                    <StarScoreField
                                        key={dimension.key}
                                        label={dimension.label}
                                        value={data.scores[dimension.key] ?? null}
                                        onChange={(score) => {
                                            setClientError(null);
                                            setData('scores', {
                                                ...data.scores,
                                                [dimension.key]: score,
                                            });
                                        }}
                                        error={errorRecord[`scores.${dimension.key}`]}
                                    />
                                ))}
                            </div>
                            <InputError message={errors.scores} />
                        </fieldset>
                    )}

                    <StarScoreField
                        label="Overall experience"
                        value={data.overall_experience}
                        onChange={(score) => {
                            setClientError(null);
                            setData('overall_experience', score);
                        }}
                        error={errors.overall_experience}
                    />

                    <label htmlFor="rating-comment" className="grid gap-1 text-sm font-medium">
                        Comment (optional)
                        <Textarea
                            id="rating-comment"
                            name="comment"
                            value={data.comment}
                            onChange={(event) => setData('comment', event.target.value)}
                            maxLength={commentMaxLength}
                            aria-describedby={errors.comment ? 'rating-comment-error' : undefined}
                        />
                        <InputError id="rating-comment-error" message={errors.comment} />
                    </label>

                    {clientError && (
                        <p role="alert" className="text-sm font-medium text-destructive">
                            {clientError}
                        </p>
                    )}

                    <p className="text-sm text-muted-foreground">
                        {visibility === 'immediate'
                            ? 'Your rating is visible as soon as it is submitted.'
                            : 'Your rating is hidden from the other person until both of you have rated or the rating window closes.'}
                    </p>

                    <div>
                        <Button type="submit" disabled={processing}>
                            {processing && <Spinner />}
                            Submit rating
                        </Button>
                    </div>
                </form>
            </main>
        </>
    );
}
