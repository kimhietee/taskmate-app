import { Form, Head, useForm, usePage } from '@inertiajs/react';
import { ExternalLink, LoaderCircle, Mail, TriangleAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { email as sendPasswordResetEmail } from '@/routes/password';

type Props = {
    status?: string;
    mailUsesLogDriver?: boolean;
    prototypeMailboxEnabled?: boolean;
    requestedEmail?: string | null;
    maskedEmail?: string | null;
    codeExpiryMinutes?: number;
};

export default function ForgotPassword({
    status,
    mailUsesLogDriver = false,
    prototypeMailboxEnabled = false,
    requestedEmail = null,
    maskedEmail = null,
    codeExpiryMinutes = 15,
}: Props) {
    const { prototypeMode } = usePage<{ prototypeMode?: boolean }>().props;
    const showPrototypeMailbox = prototypeMailboxEnabled && mailUsesLogDriver;
    const [showCodeForm, setShowCodeForm] = useState(Boolean(requestedEmail || status));
    const codeForm = useForm({
        email: requestedEmail ?? '',
        code: '',
    });

    useEffect(() => {
        if (requestedEmail) {
            codeForm.setData('email', requestedEmail);
            setShowCodeForm(true);
        }
    }, [requestedEmail]);

    const submitCode = (event: React.FormEvent) => {
        event.preventDefault();
        codeForm.post('/forgot-password/verify-code', {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Forgot password" />

            <div className="space-y-5">
                {status && (
                    <div
                        role="status"
                        className="rounded-lg border border-success-border bg-success-bg px-4 py-3 text-center text-sm font-medium text-success-fg"
                    >
                        {status}
                    </div>
                )}

                <Form
                    {...sendPasswordResetEmail.form()}
                    options={{ preserveScroll: true }}
                    onSuccess={() => setShowCodeForm(true)}
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    defaultValue={requestedEmail ?? ''}
                                    autoComplete="email"
                                    autoFocus
                                    placeholder="email@example.com"
                                />

                                <InputError message={errors.email} />
                            </div>

                            <div className="mt-4 flex items-center justify-start">
                                <Button
                                    className="w-full"
                                    disabled={processing}
                                    data-test="email-password-reset-link-button"
                                >
                                    {processing && (
                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                    )}
                                    Email password reset link
                                </Button>
                            </div>
                        </>
                    )}
                </Form>

                {(showPrototypeMailbox || (prototypeMode && mailUsesLogDriver)) && (
                    <Alert variant="warning">
                        <TriangleAlert aria-hidden="true" />
                        <AlertDescription className="space-y-2.5 text-xs">
                            <p>
                                <strong>Prototype mode:</strong>{' '}
                                {showPrototypeMailbox
                                    ? 'Open the simulated email tab to view your 6-digit password reset code or backup link directly.'
                                    : 'Mail is set to the log driver. Configure SMTP in .env to deliver reset codes to real inboxes.'}
                            </p>
                            {showPrototypeMailbox && (
                                <div>
                                    <Button size="sm" variant="outline" asChild>
                                        <a
                                            href="/prototype/password-reset-mailbox"
                                            target="taskmate_prototype_mailbox"
                                            rel="noopener"
                                        >
                                            <Mail className="size-3.5" aria-hidden="true" />
                                            Open Prototype Email Tab
                                            <ExternalLink className="size-3.5" aria-hidden="true" />
                                        </a>
                                    </Button>
                                </div>
                            )}
                        </AlertDescription>
                    </Alert>
                )}

                {showCodeForm ? (
                    <form
                        onSubmit={submitCode}
                        className="space-y-3 border-t border-border pt-4"
                        aria-labelledby="reset-code-heading"
                    >
                        <div className="space-y-1">
                            <h2 id="reset-code-heading" className="text-sm font-semibold text-foreground">
                                Enter 6-digit reset code
                            </h2>
                            <p className="text-xs text-muted-foreground tabular-nums">
                                {requestedEmail
                                    ? `Enter the 6-digit code sent to ${maskedEmail ?? requestedEmail}. Codes expire after ${codeExpiryMinutes} minutes.`
                                    : `Enter your account email and the 6-digit code from your email (expires after ${codeExpiryMinutes} minutes).`}
                            </p>
                        </div>

                        {!requestedEmail && (
                            <div className="grid gap-1.5 text-left">
                                <Label htmlFor="reset_code_email">Account email</Label>
                                <Input
                                    id="reset_code_email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                    value={codeForm.data.email}
                                    onChange={(event) => codeForm.setData('email', event.target.value)}
                                    required
                                />
                                <InputError message={codeForm.errors.email} />
                            </div>
                        )}

                        <div className="grid gap-1.5 text-left">
                            <Label htmlFor="reset_code">6-digit reset code</Label>
                            <Input
                                id="reset_code"
                                name="code"
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                maxLength={6}
                                placeholder="000000"
                                value={codeForm.data.code}
                                onChange={(event) =>
                                    codeForm.setData(
                                        'code',
                                        event.target.value.replace(/\D/g, '').slice(0, 6),
                                    )
                                }
                                required
                                className="h-11 w-full text-center font-mono text-xl tracking-[0.35em] tabular-nums"
                            />
                            <InputError message={codeForm.errors.code} />
                        </div>

                        <Button
                            type="submit"
                            variant="outline"
                            className="w-full"
                            data-test="verify-password-reset-code-button"
                            disabled={
                                codeForm.processing ||
                                codeForm.data.code.length < 6 ||
                                codeForm.data.email.trim() === ''
                            }
                        >
                            {codeForm.processing && <Spinner />}
                            Verify code &amp; reset password
                        </Button>
                    </form>
                ) : (
                    <div className="border-t border-border pt-3 text-center">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowCodeForm(true)}
                        >
                            Already have a 6-digit code?
                        </Button>
                    </div>
                )}

                <div className="space-x-1 text-center text-sm text-muted-foreground">
                    <span>Or, return to</span>
                    <TextLink href={login()}>log in</TextLink>
                </div>
            </div>
        </>
    );
}

ForgotPassword.layout = {
    title: 'Forgot password',
    description: 'Enter your email to receive a password reset link or 6-digit code',
};
