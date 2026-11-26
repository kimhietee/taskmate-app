import { Form, Head, Link } from '@inertiajs/react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import InputError from '@/components/input-error';
import agreements from '@/routes/agreements';
import { ratingNotice } from '@/components/rating-summary';

type Props = {
    agreement: {
        id: number;
        taskTitle: string;
    };
    rateeName: string;
    commentMaxLength: number;
    visibility: string;
    reportUrl: string;
    status?: string | null;
};

export default function RateAgreement({
    agreement,
    rateeName,
    commentMaxLength,
    visibility,
    reportUrl,
    status,
}: Props) {
    return (
        <>
            <Head title="Rate your experience" />
            <main className="rating-form-page">
                <header className="rating-form-hero">
                    <span className="rating-form-icon" aria-hidden="true"><Star /></span>
                    <div>
                    <p className="rating-form-eyebrow">Share your experience</p>
                    <h1>
                        Rate your experience
                    </h1>
                    <p className="rating-form-description">
                        Share your experience working with {rateeName} on “
                        {agreement.taskTitle}”.
                    </p>
                    </div>
                </header>
                {status && (
                    <p role="status" className="rating-status">
                        {status}
                    </p>
                )}
                <p className="rating-guidance">
                    {ratingNotice}
                </p>
                <p className="rating-report-guidance">
                    Use the agreement page to{' '}
                    <Link
                        className="underline"
                        href={`${reportUrl}#completion-payment`}
                    >
                        report non-payment
                    </Link>
                    {' or '}
                    <Link
                        className="underline"
                        href={`${reportUrl}#report-a-problem`}
                    >
                        report a safety or conduct concern
                    </Link>
                    .
                </p>
                <Form
                    {...agreements.rate.store.form(agreement.id)}
                    className="rating-form-card"
                >
                    {({ errors, processing }) => (
                        <>
                            <label className="grid gap-1 text-sm font-medium">
                                Overall experience
                                <select
                                    name="overall_experience"
                                    required
                                    defaultValue=""
                                    className="h-10 rounded-md border bg-background px-3"
                                >
                                    <option value="" disabled>
                                        Select 1 to 5
                                    </option>
                                    {[1, 2, 3, 4, 5].map((score) => (
                                        <option key={score} value={score}>
                                            {score === 1
                                                ? '1 (Very poor)'
                                                : score === 5
                                                  ? '5 (Excellent)'
                                                  : score}
                                        </option>
                                    ))}
                                </select>
                                <InputError
                                    message={errors.overall_experience}
                                />
                            </label>
                            <label className="grid gap-1 text-sm font-medium">
                                Comment (optional)
                                <Textarea
                                    name="comment"
                                    maxLength={commentMaxLength}
                                />
                                <InputError message={errors.comment} />
                            </label>
                            <p className="text-sm text-muted-foreground">
                                {visibility === 'immediate'
                                    ? 'Your rating is visible as soon as it is submitted.'
                                    : 'Your rating is hidden from the other person until both of you have rated or the rating window closes.'}
                            </p>
                            <Button disabled={processing}>Submit rating</Button>
                        </>
                    )}
                </Form>
            </main>
        </>
    );
}
