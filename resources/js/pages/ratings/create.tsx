import { Form, Head, Link } from '@inertiajs/react';
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
            <main className="mx-auto max-w-2xl space-y-5 p-4 sm:p-6">
                <div>
                    <h1 className="text-2xl font-semibold">
                        Rate your experience
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Share your experience working with {rateeName} on “
                        {agreement.taskTitle}”.
                    </p>
                </div>
                {status && (
                    <p role="status" className="rounded border p-3">
                        {status}
                    </p>
                )}
                <p className="rounded-lg border bg-muted/40 p-4 text-sm">
                    {ratingNotice}
                </p>
                <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
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
                    className="space-y-5 rounded-xl border bg-card p-5"
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
