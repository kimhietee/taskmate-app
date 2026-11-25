import { Form, Head, useForm, usePage } from '@inertiajs/react';
import { ExternalLink, Mail, TriangleAlert } from 'lucide-react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

            <div className="space-y-5">
                <div className="space-y-2 rounded-xl border border-border bg-muted/40 p-4 text-left text-sm">
                    <div className="flex items-center justify-between text-xs font-semibold tabular-nums text-muted-foreground">
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
                    <Alert variant="warning">
                        <TriangleAlert aria-hidden="true" />
                        <AlertDescription className="space-y-2.5 text-xs">
                            <p>
                                <strong>Local prototype mode:</strong> Mail is set to the <code>log</code> driver instead of real Gmail. Open the simulated email tab below to view your 6-digit verification code directly (no need to open <code>storage/logs/laravel.log</code>).
                            </p>
                            <div>
                                <Button size="sm" variant="outline" asChild>
                                    <a
                                        href="/prototype/mailbox"
                                        target="taskmate_prototype_mailbox"
                                        rel="noopener"
                                    >
                                        <Mail className="size-3.5" aria-hidden="true" />
                                        Open Prototype Email Tab
                                        <ExternalLink className="size-3.5" aria-hidden="true" />
                                    </a>
                                </Button>
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                {status === 'verification-link-sent' && (
                    <div
                        role="status"
                        className="rounded-lg border border-success-border bg-success-bg px-4 py-3 text-center text-sm text-success-fg"
                    >
                        A new 6-digit verification code and backup link have been sent to {maskedEmail ?? 'your email address'}.
                    </div>
                )}

                <form onSubmit={submitCode} className="space-y-4">
                    <div className="grid gap-1.5 text-left">
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
                            className="h-12 w-full text-center font-mono text-2xl tracking-[0.4em] tabular-nums"
                        />
                        <InputError message={codeForm.errors.code} />
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={codeForm.processing || codeForm.data.code.length < 6}
                    >
                        {codeForm.processing && <Spinner />}
                        Confirm email &amp; continue to dashboard
                    </Button>
                </form>

                <div className="space-y-3 border-t border-border pt-4 text-center">
                    <p className="text-xs text-muted-foreground">
                        Didn&apos;t receive the code? You can resend a fresh code or click the backup link inside the email.
                    </p>
                    <Form {...send.form()} className="space-y-3 text-center">
                        {({ processing }) => (
                            <>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    variant="outline"
                                    className="w-full"
                                >
                                    {processing && <Spinner />}
                                    Resend verification code
                                </Button>

                                <TextLink
                                    href={logout()}
                                    method="post"
                                    as="button"
                                    className="mx-auto block text-sm"
                                >
                                    Log out
                                </TextLink>
                            </>
                        )}
                    </Form>
                </div>
            </div>
        </>
    );
}

VerifyEmail.layout = {
    title: 'Confirm your email',
    description: 'Enter the 6-digit code sent to your inbox to reach your dashboard.',
};
