// Components
import { Form, Head, usePage } from '@inertiajs/react';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

export default function VerifyEmail({ status, mailUsesLogDriver = false }: { status?: string; mailUsesLogDriver?: boolean }) {
    const { prototypeMode } = usePage<{ prototypeMode?: boolean }>().props;

    return (
        <>
            <Head title="Email verification" />

            <div className="mb-4 space-y-2 rounded-lg border bg-muted/30 p-4 text-left text-sm">
                <p className="font-medium">Verification has 2 separate steps</p>
                <ol className="list-decimal space-y-1 pl-5 text-xs text-muted-foreground">
                    <li><strong className="text-foreground">Step 1 of 2 (Current):</strong> Confirm your email address using the verification link.</li>
                    <li><strong>Step 2 of 2 (Next):</strong> An administrator reviews and approves your account before browsing, posting, or applying unlocks.</li>
                </ol>
            </div>

            {prototypeMode && mailUsesLogDriver && (
                <div className="mb-4 rounded-lg border border-amber-400 bg-amber-50 p-3 text-left text-xs text-amber-950 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-100">
                    <strong>Local prototype mode:</strong> Mail is set to the <code>log</code> driver, so verification emails are written to <code>storage/logs/laravel.log</code> instead of sent to Gmail. Open the latest <code>/email/verify/...</code> link from that log file while signed in.
                </div>
            )}

            {status === 'verification-link-sent' && (
                <div className="mb-4 text-center text-sm font-medium text-green-600 dark:text-green-400">
                    A new verification link has been sent to the email address
                    you provided during registration.
                </div>
            )}

            <Form {...send.form()} className="space-y-6 text-center">
                {({ processing }) => (
                    <>
                        <Button disabled={processing} variant="secondary">
                            {processing && <Spinner />}
                            Resend verification email
                        </Button>

                        <TextLink
                            href={logout()}
                            className="mx-auto block text-sm"
                        >
                            Log out
                        </TextLink>
                    </>
                )}
            </Form>
        </>
    );
}

VerifyEmail.layout = {
    title: 'Email verification',
    description:
        'Please verify your email address by clicking on the link we just emailed to you.',
};
