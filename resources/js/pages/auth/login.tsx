import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
/* @chisel-registration */
import { register } from '@/routes';
/* @end-chisel-registration */
import { store } from '@/routes/login';
import { request } from '@/routes/password';
/* @chisel-passkeys */
import PasskeyVerify from '@/components/passkey-verify';
/* @end-chisel-passkeys */

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
    return (
        <>
            <Head title="Log in" />

            {status && (
                <p
                    role="status"
                    className="text-sm leading-snug text-foreground"
                >
                    {status}
                </p>
            )}

            {/* @chisel-passkeys */}
            <div className="mb-5 flex flex-col gap-5 empty:hidden [&_button]:h-11 [&_button]:border-primary/40 [&_button]:bg-secondary/40 [&_button]:font-semibold [&_button]:text-foreground [&_button:hover]:bg-secondary">
                <PasskeyVerify />
            </div>
            {/* @end-chisel-passkeys */}

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-3"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-4">
                            <div className="grid content-start gap-1.5">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    autoComplete="email"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid content-start gap-1.5">
                                <Label htmlFor="password">Password</Label>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    autoComplete="current-password"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                                <div className="flex items-center gap-2">
                                    <Checkbox id="remember" name="remember" />
                                    <Label htmlFor="remember">
                                        Remember me
                                    </Label>
                                </div>
                                {canResetPassword && (
                                    <TextLink
                                        href={request()}
                                        className="text-sm"
                                    >
                                        Forgot password?
                                    </TextLink>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="h-11 w-full font-semibold"
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                Log in
                            </Button>
                        </div>

                        {/* @chisel-registration */}
                        <div className="text-center text-sm text-muted-foreground">
                            Don't have an account?{' '}
                            <TextLink
                                href={register()}
                                data-test="register-link"
                            >
                                Create an account
                            </TextLink>
                        </div>
                        {/* @end-chisel-registration */}
                    </>
                )}
            </Form>
        </>
    );
}

Login.layout = {
    title: 'Log in',
};
