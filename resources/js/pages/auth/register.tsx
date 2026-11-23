import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { SafetyNotice } from '@/components/safety-notice';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { login } from '@/routes';
import { store } from '@/routes/register';

type UserType = 'student' | 'faculty_staff' | 'organization';
type AffiliationOptions = { student: string[]; faculty_staff: string[] };

type Props = {
    passwordRules?: string;
    institutionalEmailDomains?: string[];
    requireInstitutionalEmail?: boolean;
    affiliationOptions?: AffiliationOptions;
};

const OTHER_VALUE = '__other__';

export default function Register({
    passwordRules = '',
    institutionalEmailDomains = ['cmu.edu.ph'],
    requireInstitutionalEmail = true,
    affiliationOptions = { student: [], faculty_staff: [] },
}: Props) {
    const [userType, setUserType] = useState<UserType>('student');
    const [selectedAffiliation, setSelectedAffiliation] = useState('');
    const [customAffiliation, setCustomAffiliation] = useState('');

    const affiliationLabel = userType === 'student' ? 'College and program' : 'College or office';
    const idLabel = userType === 'student' ? 'Student ID number' : 'Employee ID number';
    const presetAffiliations = userType === 'student' ? affiliationOptions.student : affiliationOptions.faculty_staff;
    const hasPresets = presetAffiliations.length > 0;
    const isOtherAffiliation = selectedAffiliation === OTHER_VALUE;
    const resolvedAffiliation = hasPresets ? (isOtherAffiliation ? customAffiliation : selectedAffiliation) : customAffiliation;

    const accountTypeGuidance = {
        student: 'After administrator approval, students can browse and apply. Students can also post tasks when student posting is enabled.',
        faculty_staff: 'After administrator approval, faculty and staff can post tasks. Faculty and staff accounts cannot apply to tasks.',
        organization: 'After administrator approval, organization representatives can post tasks. Organization accounts cannot browse or apply to tasks.',
    }[userType];

    return (
        <>
            <Head title="Register" />
            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="user_type">Choose your account type</Label>
                                <select
                                    id="user_type"
                                    name="user_type"
                                    value={userType}
                                    onChange={(event) => {
                                        setUserType(event.target.value as UserType);
                                        setSelectedAffiliation('');
                                        setCustomAffiliation('');
                                    }}
                                    required
                                    className="border-input bg-background ring-offset-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                                >
                                    <option value="student">CMU Student</option>
                                    <option value="faculty_staff">CMU Faculty / Staff</option>
                                    <option value="organization">Office or Organization Representative</option>
                                </select>
                                <InputError message={errors.user_type} />
                                <p className="text-sm text-muted-foreground">{accountTypeGuidance}</p>
                            </div>

                            <section className="space-y-2 rounded-lg border bg-muted/30 p-4 text-sm" aria-label="How account verification works">
                                <h2 className="font-medium">How account review works</h2>
                                <p>An administrator reviews the details you submit. You must also confirm your email address. Email confirmation and TaskMate account review are separate steps.</p>
                                <ol className="list-decimal space-y-1 pl-5 text-xs text-muted-foreground">
                                    <li><strong>Step 1 — Confirm your email:</strong> Open the verification link sent after registration.</li>
                                    <li><strong>Step 2 — Administrator approval:</strong> An administrator checks your details before activating browsing, posting, or applying.</li>
                                </ol>
                                <p>Until your account is approved, you cannot browse, post, or apply. TaskMate does not ask for ID photos or other identity documents.</p>
                            </section>

                            <SafetyNotice />

                            {userType === 'organization' ? (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="organization_name">Organization name</Label>
                                        <Input id="organization_name" name="organization_name" required placeholder="Organization name" />
                                        <p className="text-xs text-muted-foreground">This is the organization’s display name on TaskMate.</p>
                                        <InputError message={errors.organization_name} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="position">Your position</Label>
                                        <Input id="position" name="position" required placeholder="Representative position" />
                                        <p className="text-xs text-muted-foreground">Used by administrators to review this account.</p>
                                        <InputError message={errors.position} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="supporting_info">About the organization and why it posts tasks</Label>
                                        <Textarea id="supporting_info" name="supporting_info" required maxLength={1000} placeholder="Briefly describe your organization and why you want to post tasks." />
                                        <p className="text-xs text-muted-foreground">This description is for administrator review and is not shown on public profiles.</p>
                                        <InputError message={errors.supporting_info} />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="id_number">{idLabel}</Label>
                                        <Input id="id_number" name="id_number" required placeholder={idLabel} />
                                        <p className="text-xs text-muted-foreground">Used for account review. Your ID number is visible only to you and administrators.</p>
                                        <InputError message={errors.id_number} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor={hasPresets ? 'affiliation_select' : 'affiliation'}>{affiliationLabel}</Label>
                                        {hasPresets ? (
                                            <>
                                                <input type="hidden" name="affiliation" value={resolvedAffiliation} />
                                                <select
                                                    id="affiliation_select"
                                                    value={selectedAffiliation}
                                                    onChange={(event) => setSelectedAffiliation(event.target.value)}
                                                    required
                                                    className="border-input bg-background ring-offset-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                                                >
                                                    <option value="" disabled>Select {affiliationLabel.toLowerCase()}</option>
                                                    {presetAffiliations.map((item) => (
                                                        <option key={item} value={item}>{item}</option>
                                                    ))}
                                                    <option value={OTHER_VALUE}>Other (specify below)</option>
                                                </select>
                                                {isOtherAffiliation && (
                                                    <Input
                                                        id="affiliation_custom"
                                                        value={customAffiliation}
                                                        onChange={(event) => setCustomAffiliation(event.target.value)}
                                                        required
                                                        placeholder={`Enter your ${affiliationLabel.toLowerCase()}`}
                                                    />
                                                )}
                                            </>
                                        ) : (
                                            <Input
                                                id="affiliation"
                                                name="affiliation"
                                                value={customAffiliation}
                                                onChange={(event) => setCustomAffiliation(event.target.value)}
                                                required
                                                placeholder={affiliationLabel}
                                            />
                                        )}
                                        <p className="text-xs text-muted-foreground">Helps other users understand your campus affiliation and may appear on your profile.</p>
                                        <InputError message={errors.affiliation} />
                                    </div>
                                </>
                            )}

                            <div className="grid gap-2">
                                <Label htmlFor="name">{userType === 'organization' ? 'Representative name' : 'Full name'}</Label>
                                <Input id="name" name="name" required autoFocus autoComplete="name" placeholder="Full name" />
                                <p className="text-xs text-muted-foreground">Use your real name (letters, spaces, periods, hyphens, or apostrophes). Extra spaces are cleaned automatically.</p>
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input id="email" type="email" required autoComplete="email" name="email" placeholder="email@example.com" />
                                <InputError message={errors.email} />
                                {userType !== 'organization' && requireInstitutionalEmail ? (
                                    <p className="text-sm text-muted-foreground">
                                        Use your CMU institutional email address ({institutionalEmailDomains.map((domain) => `@${domain}`).join(', ')}).
                                    </p>
                                ) : userType !== 'organization' ? (
                                    <p className="text-sm text-muted-foreground">
                                        Any valid email address is accepted under the current configuration. An administrator will still review your ID number and details.
                                    </p>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Organization representatives may use any valid email address.
                                    </p>
                                )}
                                <p className="text-xs text-muted-foreground">Your email is used to sign in and confirm your address. It is not shown on your public profile.</p>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <PasswordInput id="password" required autoComplete="new-password" name="password" placeholder="Password" passwordrules={passwordRules} />
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">Confirm password</Label>
                                <PasswordInput id="password_confirmation" required autoComplete="new-password" name="password_confirmation" placeholder="Confirm password" passwordrules={passwordRules} />
                                <InputError message={errors.password_confirmation} />
                            </div>

                            <Button type="submit" className="mt-2 w-full" disabled={processing} data-test="register-user-button">
                                {processing && <Spinner />}
                                Create account
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <TextLink href={login()} data-test="login-link">
                                Log in
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

Register.layout = {
    title: 'Create an account',
    description: 'Enter your details below to create your account',
};
