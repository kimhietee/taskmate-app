import { Form, Head, Link } from '@inertiajs/react';
import { Info, Star, TriangleAlert } from 'lucide-react';
import { useId, useState } from 'react';
import InputError from '@/components/input-error';
import { PaymentStatusBadge } from '@/components/payment-status-badge';
import { ratingNotice } from '@/components/rating-summary';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { formatAmount } from '@/lib/format';
import agreements from '@/routes/agreements';

type Dimension = { key: string; label: string };

type Props = {
    agreement: {
        id: number;
        taskTitle: string;
        agreedAmount: string;
        paymentStatus: string;
        paymentStatusLabel?: string;
    };
    direction: string;
    rateeName: string;
    dimensions: Dimension[];
    commentMaxLength: number;
    visibility: string;
    reportUrl: string;
    status?: string | null;
};

function StarScoreField({
    label,
    name,
    value,
    onChange,
    error,
}: {
    label: string;
    name: string;
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
                    {value ? `${value} / 5` : 'Select 1 to 5'}
                </span>
            </div>
            <div role="radiogroup" aria-labelledby={labelId} className="flex flex-wrap items-center gap-1">
                {[1, 2, 3, 4, 5].map((score) => {
                    const filled = value !== null && score <= value;

                    return (
                        <label
                            key={score}
                            className={`inline-flex size-11 cursor-pointer items-center justify-center rounded-md border transition-colors focus-within:ring-2 focus-within:ring-ring md:size-10 ${
                                filled
                                    ? 'border-warning-border bg-warning-bg/50'
                                    : 'border-border bg-card hover:bg-muted/60'
                            }`}
                        >
                            <input
                                type="radio"
                                className="sr-only"
                                name={name}
                                value={score}
                                checked={value === score}
                                onChange={() => onChange(score)}
                                required
                                aria-label={`${label}: ${score} out of 5`}
                            />
                            <Star
                                className={`size-5 ${
                                    filled ? 'fill-current text-warning-fg' : 'text-muted-foreground'
                                }`}
                                aria-hidden="true"
                            />
                        </label>
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
    dimensions,
    commentMaxLength,
    visibility,
    reportUrl,
    status,
}: Props) {
    const [dimensionScores, setDimensionScores] = useState<Record<string, number>>({});
    const [overallExperience, setOverallExperience] = useState<number | null>(null);

    const paymentStatusKey = agreement.paymentStatus.toLowerCase().replaceAll(' ', '_');

    return (
        <>
            <Head title="Rate your experience" />
            <div className="page-narrow space-y-6">
                <header className="space-y-1">
                    <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Rate your experience</h1>
                    <p className="text-sm text-muted-foreground">
                        Your feedback about {rateeName} and “{agreement.taskTitle}”. Direction:{' '}
                        {direction === 'poster_to_student' ? 'Poster to worker' : 'Worker to poster'}.
                    </p>
                </header>

                {status && (
                    <div
                        role="status"
                        className="rounded-lg border border-success-border bg-success-bg px-4 py-3 text-sm text-success-fg"
                    >
                        {status}
                    </div>
                )}

                <Card className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                    <span className="text-foreground">
                        Agreed amount:{' '}
                        <strong className="tabular-nums">₱{formatAmount(agreement.agreedAmount)}</strong>
                    </span>
                    <PaymentStatusBadge
                        status={paymentStatusKey}
                        label={agreement.paymentStatusLabel ?? agreement.paymentStatus}
                    />
                </Card>

                <div className="space-y-3">
                    <Alert variant="info">
                        <Info aria-hidden="true" />
                        <AlertDescription>{ratingNotice}</AlertDescription>
                    </Alert>

                    <Alert variant="warning">
                        <TriangleAlert aria-hidden="true" />
                        <AlertDescription>
                            <p>
                                Rating comments are not a way to report serious problems. If something went wrong
                                (non-payment, harassment, fraud, unsafe behavior), report it instead.{' '}
                                <Link
                                    className="focus-ring rounded-sm font-semibold underline underline-offset-4"
                                    href={`${reportUrl}#completion-payment`}
                                >
                                    Open the report flow for this agreement
                                </Link>
                                .
                            </p>
                        </AlertDescription>
                    </Alert>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Your ratings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Form {...agreements.rate.store.form(agreement.id)} className="space-y-5">
                            {({ errors, processing }) => {
                                const errorRecord = errors as Record<string, string | undefined>;

                                return (
                                    <>
                                        <fieldset className="space-y-4">
                                            <legend className="sr-only">Your ratings</legend>

                                            <div className="grid gap-3 sm:grid-cols-2">
                                                {dimensions.map((dimension) => (
                                                    <StarScoreField
                                                        key={dimension.key}
                                                        label={dimension.label}
                                                        name={`scores[${dimension.key}]`}
                                                        value={dimensionScores[dimension.key] ?? null}
                                                        onChange={(score) =>
                                                            setDimensionScores((prev) => ({
                                                                ...prev,
                                                                [dimension.key]: score,
                                                            }))
                                                        }
                                                        error={errorRecord[`scores.${dimension.key}`]}
                                                    />
                                                ))}
                                            </div>

                                            <StarScoreField
                                                label="Overall experience"
                                                name="overall_experience"
                                                value={overallExperience}
                                                onChange={setOverallExperience}
                                                error={errors.overall_experience}
                                            />

                                            <div className="grid gap-1.5">
                                                <Label htmlFor="rating-comment">Comment (optional)</Label>
                                                <Textarea
                                                    id="rating-comment"
                                                    name="comment"
                                                    maxLength={commentMaxLength}
                                                    aria-describedby={errors.comment ? 'rating-comment-error' : undefined}
                                                />
                                                <InputError id="rating-comment-error" message={errors.comment} />
                                            </div>
                                        </fieldset>

                                        <p className="text-xs text-muted-foreground">
                                            {visibility === 'immediate'
                                                ? 'Your rating is visible as soon as it is submitted.'
                                                : 'Your rating is hidden from the other person until both of you have rated or the rating window closes.'}
                                        </p>

                                        <Button type="submit" disabled={processing}>
                                            {processing && <Spinner />}
                                            Submit rating
                                        </Button>
                                    </>
                                );
                            }}
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
