import { Form, Head, useForm, usePage } from '@inertiajs/react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

type Props = {
    status?: string;
    mailUsesLogDriver?: boolean;
    maskedEmail?: string | null;
    codeExpiryMinutes?: number;
    willAutoVerifyStudent?: boolean;
    unverifiedStudentsCanBrowse?: boolean;
};

export default function VerifyEmail({
    status,
    mailUsesLogDriver = false,
    maskedEmail = null,
    codeExpiryMinutes = 15,
    willAutoVerifyStudent = false,
    unverifiedStudentsCanBrowse = true,
}: Props) {
    const { prototypeMode } = usePage<{ prototypeMode?: boolean }>().props;
    const codeForm = useForm({ code: '' });

    const submitCode = (event: React.FormEvent) => {
        event.preventDefault();
        codeForm.post('/email/verify-code');
    };

    return (
        <>
            <Head title="Confirm your email" />

            <div className="mb-5 space-y-3 rounded-xl border bg-muted/30 p-4 text-left text-sm">
                <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <span>Email confirmation</span>
                    <span>Expires in {codeExpiryMinutes} min</span>
                </div>
                <p className="text-sm text-foreground">
                    Enter the 6-digit verification code we sent to{' '}
                    <strong>{maskedEmail ?? 'your email address'}</strong>.
                </p>
                <p className="text-xs text-muted-foreground">
                    {willAutoVerifyStudent
                        ? 'Because you used your CMU institutional email with your Student ID and program, confirming this code will automatically verify you as a CMU Student.'
                        : unverifiedStudentsCanBrowse
                            ? 'After confirming your email, you will go straight to your dashboard. Students can browse approved tasks in preview mode and verify their CMU student status anytime.'
                            : 'After confirming your email, you will go to your dashboard to complete student verification or wait for administrator approval.'}
                </p>
            </div>

            {prototypeMode && mailUsesLogDriver && (
                <div className="mb-4 rounded-lg border border-amber-400 bg-amber-50 p-3 text-left text-xs text-amber-950 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-100">
                    <strong>Local prototype mode:</strong> Mail is set to the <code>log</code> driver, so your 6-digit code (and backup verification link) are written to <code>storage/logs/laravel.log</code> instead of sent to Gmail. To send real emails to Gmail, configure <code>MAIL_MAILER=smtp</code> in <code>.env</code>.
                </div>
            )}

            {status === 'verification-link-sent' && (
                <div role="status" className="mb-4 rounded-lg border border-green-300 bg-green-50 p-3 text-center text-sm font-medium text-green-800 dark:border-green-800 dark:bg-green-950/50 dark:text-green-200">
                    A new 6-digit verification code and backup link have been sent to {maskedEmail ?? 'your email address'}.
                </div>
            )}

            <form onSubmit={submitCode} className="space-y-4">
                <div className="grid gap-2 text-left">
                    <Label htmlFor="code">6-digit verification code</Label>
                    <Input
                        id="code"
                        name="code"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        placeholder="000000"
                        value={codeForm.data.code}
                        onChange={(event) => codeForm.setData('code', event.target.value.replace(/\D/g, '').slice(0, 6))}
                        required
                        autoFocus
                        className="h-12 text-center font-mono text-2xl tracking-[0.4em]"
                    />
                    <InputError message={codeForm.errors.code} />
                </div>

                <Button type="submit" className="w-full" disabled={codeForm.processing || codeForm.data.code.length !== 6}>
                    {codeForm.processing && <Spinner />}
                    Confirm email & continue to dashboard
                </Button>
            </form>

            <div className="mt-5 space-y-3 border-t pt-4 text-center">
                <p className="text-xs text-muted-foreground">
                    Didn&apos;t receive the code? You can resend a fresh code or click the backup link inside the email.
                </p>
                <Form {...send.form()} className="space-y-3 text-center">
                    {({ processing }) => (
                        <>
                            <Button disabled={processing} variant="secondary" className="w-full">
                                {processing && <Spinner />}
                                Resend verification code
                            </Button>

                            <TextLink href={logout()} className="mx-auto block text-sm">
                                Log out
                            </TextLink>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

VerifyEmail.layout = {
    title: 'Confirm your email',
    description: 'Enter the 6-digit code sent to your inbox to reach your dashboard.',
};
