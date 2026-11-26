import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { PasswordRequirementsChecklist } from '@/components/password-requirements-checklist';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
    DEFAULT_PASSWORD_REQUIREMENTS,
    type PasswordRequirements,
} from '@/lib/password-requirements';
import { update } from '@/routes/password';

type Props = {
    token: string;
    email: string;
    passwordRules?: string;
    passwordRequirements?: PasswordRequirements;
};

export default function ResetPassword({
    token,
    email,
    passwordRules = '',
    passwordRequirements = DEFAULT_PASSWORD_REQUIREMENTS,
}: Props) {
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');

    return (
        <>
            <Head title="Reset password" />

            <Form
                {...update.form()}
                transform={(data) => ({ ...data, token, email })}
                resetOnSuccess={['password', 'password_confirmation']}
                onSuccess={() => {
                    setPassword('');
                    setPasswordConfirmation('');
                }}
                className="space-y-4"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-1.5">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                autoComplete="email"
                                value={email}
                                className="bg-muted/50 text-muted-foreground"
                                readOnly
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="password">Password</Label>
                            <PasswordInput
                                id="password"
                                name="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                autoComplete="new-password"
                                autoFocus
                                placeholder="Password"
                                passwordrules={passwordRules}
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="password_confirmation">Confirm password</Label>
                            <PasswordInput
                                id="password_confirmation"
                                name="password_confirmation"
                                value={passwordConfirmation}
                                onChange={(event) => setPasswordConfirmation(event.target.value)}
                                autoComplete="new-password"
                                placeholder="Confirm password"
                                passwordrules={passwordRules}
                            />
                            <InputError message={errors.password_confirmation} />
                        </div>

                        <PasswordRequirementsChecklist
                            password={password}
                            confirmation={passwordConfirmation}
                            requirements={passwordRequirements}
                        />

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={processing}
                            data-test="reset-password-button"
                        >
                            {processing && <Spinner />}
                            Reset password
                        </Button>
                    </>
                )}
            </Form>
        </>
    );
}

ResetPassword.layout = {
    title: 'Reset password',
    description: 'Please enter your new password below',
};
