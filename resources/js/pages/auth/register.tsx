import { Head, useForm } from '@inertiajs/react';
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
    autoVerifyInstitutionalStudent?: boolean;
    unverifiedStudentsCanBrowse?: boolean;
    affiliationOptions?: AffiliationOptions;
};

const OTHER_VALUE = '__other__';

const ROLE_CARDS: { value: UserType; title: string; badge: string; summary: string }[] = [
    {
        value: 'student',
        title: 'CMU Student',
        badge: 'Browse & apply',
        summary: 'Use your personal email or CMU email. Browse approved campus tasks right away, then verify as a CMU student to apply and agree on work.',
    },
    {
        value: 'faculty_staff',
        title: 'CMU Faculty / Staff',
        badge: 'Post tasks',
        summary: 'Post clear tasks for verified CMU students after administrator approval. Faculty and staff accounts cannot apply to tasks.',
    },
    {
        value: 'organization',
        title: 'Office or Organization Representative',
        badge: 'Post tasks',
        summary: 'For campus offices and approved local employers posting tasks after administrator approval. Cannot browse or apply.',
    },
];

const NATIVE_SELECT_CLASS =
    'focus-ring h-11 w-full rounded-md border border-input bg-field px-3 text-sm text-foreground shadow-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 md:h-9';

export default function Register({
    passwordRules = '',
    institutionalEmailDomains = ['cmu.edu.ph'],
    requireInstitutionalEmail = false,
    autoVerifyInstitutionalStudent = true,
    unverifiedStudentsCanBrowse = true,
    affiliationOptions = { student: [], faculty_staff: [] },
}: Props) {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [selectedAffiliation, setSelectedAffiliation] = useState('');
    const [customAffiliation, setCustomAffiliation] = useState('');
    const [stepError, setStepError] = useState<string | null>(null);

    const form = useForm({
        user_type: 'student' as UserType,
        first_name: '',
        middle_initial: '',
        last_name: '',
        email: '',
        password: '',
        password_confirmation: '',
        id_number: '',
        affiliation: '',
        organization_name: '',
        position: '',
        supporting_info: '',
    });

    const userType = form.data.user_type;
    const normalizedDomains = institutionalEmailDomains.map((d) => d.trim().toLowerCase());
    const trimmedEmail = form.data.email.trim().toLowerCase();
    const emailDomain = trimmedEmail.includes('@') ? trimmedEmail.slice(trimmedEmail.lastIndexOf('@') + 1) : '';
    const isInstitutionalEmail = emailDomain !== '' && normalizedDomains.includes(emailDomain);
    const isPersonalStudentSignup = userType === 'student' && !requireInstitutionalEmail && !isInstitutionalEmail;
    const totalSteps: 2 | 3 = isPersonalStudentSignup ? 2 : 3;

    const affiliationLabel = userType === 'student' ? 'College and program' : 'College or office';
    const idLabel = userType === 'student' ? 'Student ID number' : 'Employee ID number';
    const presetAffiliations = userType === 'student' ? affiliationOptions.student : affiliationOptions.faculty_staff;
    const hasPresets = presetAffiliations.length > 0;
    const isOtherAffiliation = selectedAffiliation === OTHER_VALUE;

    const domainListLabel = institutionalEmailDomains.map((d) => `@${d}`).join(', ');
    const progressWidthClass =
        totalSteps === 2
            ? step === 1
                ? 'w-1/2'
                : 'w-full'
            : step === 1
                ? 'w-1/3'
                : step === 2
                    ? 'w-2/3'
                    : 'w-full';

    const handleRoleSelect = (nextType: UserType) => {
        form.setData((prev) => ({
            ...prev,
            user_type: nextType,
            id_number: '',
            affiliation: '',
            organization_name: '',
            position: '',
            supporting_info: '',
        }));
        setSelectedAffiliation('');
        setCustomAffiliation('');
        setStepError(null);
    };

    const handleRoleKeyDown = (event: React.KeyboardEvent, index: number) => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
            event.preventDefault();
            const nextIndex = (index + 1) % ROLE_CARDS.length;
            handleRoleSelect(ROLE_CARDS[nextIndex].value);
        } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
            event.preventDefault();
            const prevIndex = (index - 1 + ROLE_CARDS.length) % ROLE_CARDS.length;
            handleRoleSelect(ROLE_CARDS[prevIndex].value);
        }
    };

    const handleAffiliationSelect = (value: string) => {
        setSelectedAffiliation(value);
        if (value === OTHER_VALUE) {
            form.setData('affiliation', customAffiliation);
        } else {
            form.setData('affiliation', value);
        }
    };

    const handleCustomAffiliationChange = (value: string) => {
        setCustomAffiliation(value);
        form.setData('affiliation', value);
    };

    const validateStepTwo = (): boolean => {
        if (!form.data.first_name.trim()) {
            setStepError('Enter your first name to continue.');
            return false;
        }
        if (!form.data.last_name.trim()) {
            setStepError('Enter your last name to continue.');
            return false;
        }
        if (!form.data.email.trim() || !form.data.email.includes('@')) {
            setStepError('Enter a valid email address to receive your 6-digit verification code.');
            return false;
        }
        if (userType !== 'organization' && requireInstitutionalEmail && !isInstitutionalEmail) {
            setStepError(`Use your CMU institutional email address (${domainListLabel}).`);
            return false;
        }
        if (!form.data.password) {
            setStepError('Create a password to continue.');
            return false;
        }
        if (form.data.password !== form.data.password_confirmation) {
            setStepError('Password confirmation does not match.');
            return false;
        }
        setStepError(null);
        return true;
    };

    const handleNextFromStepTwo = () => {
        if (!validateStepTwo()) return;
        setStep(3);
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        if (step === 1) {
            setStep(2);
            return;
        }

        if (step === 2 && totalSteps === 3) {
            handleNextFromStepTwo();
            return;
        }

        if (!validateStepTwo()) {
            setStep(2);
            return;
        }

        form.transform((data) => {
            const basePayload = {
                user_type: data.user_type,
                first_name: data.first_name,
                middle_initial: data.middle_initial,
                last_name: data.last_name,
                email: data.email,
                password: data.password,
                password_confirmation: data.password_confirmation,
            };

            if (data.user_type === 'organization') {
                return {
                    ...basePayload,
                    organization_name: data.organization_name,
                    position: data.position,
                    supporting_info: data.supporting_info,
                };
            }

            if (isPersonalStudentSignup) {
                return basePayload;
            }

            return {
                ...basePayload,
                id_number: data.id_number,
                affiliation: data.affiliation,
            };
        });

        form.post(store.url(), {
            onSuccess: () => form.reset('password', 'password_confirmation'),
            onError: (errors) => {
                if (errors.user_type) {
                    setStep(1);
                } else if (
                    errors.first_name ||
                    errors.middle_initial ||
                    errors.last_name ||
                    errors.email ||
                    errors.password ||
                    errors.password_confirmation
                ) {
                    setStep(2);
                } else if (errors.id_number || errors.affiliation || errors.organization_name || errors.position || errors.supporting_info) {
                    setStep(3);
                }
            },
        });
    };

    return (
        <>
            <Head title="Register" />
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2" aria-label="Registration progress">
                    <div className="flex items-center justify-between text-xs font-semibold tabular-nums text-muted-foreground">
                        <span>Step {Math.min(step, totalSteps)} of {totalSteps}</span>
                        <span>
                            {step === 1
                                ? 'Choose your role'
                                : step === 2
                                    ? 'Account basics'
                                    : userType === 'organization'
                                        ? 'Organization details'
                                        : userType === 'student'
                                            ? 'CMU student details'
                                            : 'Faculty / staff details'}
                        </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                            className={`h-full rounded-full bg-brand transition-all duration-300 ${progressWidthClass}`}
                        />
                    </div>
                </div>

                {stepError && (
                    <div
                        role="alert"
                        className="rounded-lg border border-warning-border bg-warning-bg px-4 py-3 text-sm text-warning-fg"
                    >
                        {stepError}
                    </div>
                )}

                {step === 1 && (
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <h2 className="text-base font-semibold">How will you use TaskMate?</h2>
                            <p className="text-sm text-muted-foreground">
                                Pick one role to personalize your setup. You can confirm your email in under a minute.
                            </p>
                        </div>

                        <div className="grid gap-3" role="radiogroup" aria-label="Choose your account type">
                            {ROLE_CARDS.map((card, index) => {
                                const selected = userType === card.value;
                                return (
                                    <button
                                        key={card.value}
                                        type="button"
                                        role="radio"
                                        aria-checked={selected}
                                        onClick={() => handleRoleSelect(card.value)}
                                        onKeyDown={(event) => handleRoleKeyDown(event, index)}
                                        className={
                                            selected
                                                ? 'focus-ring w-full rounded-xl border-2 border-brand bg-info-bg/40 p-4 text-left shadow-xs transition-colors'
                                                : 'focus-ring w-full rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-input hover:bg-muted/40'
                                        }
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-2.5">
                                                {selected ? (
                                                    <span
                                                        aria-hidden="true"
                                                        className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-brand-foreground"
                                                    >
                                                        ✓
                                                    </span>
                                                ) : (
                                                    <span
                                                        aria-hidden="true"
                                                        className="inline-flex size-5 shrink-0 rounded-full border border-input"
                                                    />
                                                )}
                                                <span className="font-semibold text-foreground">{card.title}</span>
                                            </div>
                                            <span className="shrink-0 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                                                {card.badge}
                                            </span>
                                        </div>
                                        <p className="mt-2 pl-7.5 text-xs leading-relaxed text-muted-foreground">
                                            {card.summary}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                        <InputError message={form.errors.user_type} />

                        <section
                            className="space-y-2 rounded-lg border border-border bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground"
                            aria-label="How account verification works"
                        >
                            <p className="font-semibold text-foreground">How verification works</p>
                            <ol className="list-decimal space-y-1 pl-4">
                                <li>
                                    <strong>Confirm your email:</strong> Enter the 6-digit code sent to your inbox.
                                </li>
                                <li>
                                    <strong>Verify campus status:</strong>{' '}
                                    {userType === 'student'
                                        ? autoVerifyInstitutionalStudent
                                            ? `CMU emails (${domainListLabel}) auto-verify right after confirmation. Personal emails enter the dashboard${unverifiedStudentsCanBrowse ? ' with read-only task browsing' : ''} and can verify as a CMU student anytime.`
                                            : 'An administrator reviews your student details before applying unlocks.'
                                        : 'An administrator reviews your submitted details before posting unlocks.'}
                                </li>
                            </ol>
                            <p>TaskMate does not ask for ID photos or identity document uploads.</p>
                        </section>

                        <Button type="button" className="w-full" onClick={() => setStep(2)}>
                            Continue as {ROLE_CARDS.find((r) => r.value === userType)?.title}
                        </Button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            {userType === 'organization' && (
                                <p className="text-xs font-medium text-muted-foreground">Representative&apos;s name</p>
                            )}
                            <div className="grid gap-3 sm:grid-cols-12">
                                <div className="grid gap-1.5 sm:col-span-5">
                                    <Label htmlFor="first_name">First name</Label>
                                    <Input
                                        id="first_name"
                                        name="first_name"
                                        value={form.data.first_name}
                                        onChange={(event) => {
                                            form.setData('first_name', event.target.value);
                                            setStepError(null);
                                        }}
                                        required
                                        autoFocus
                                        autoComplete="given-name"
                                        placeholder="e.g. Kim Hie"
                                    />
                                    <InputError message={form.errors.first_name} />
                                </div>
                                <div className="grid gap-1.5 sm:col-span-2">
                                    <Label htmlFor="middle_initial">M.I.</Label>
                                    <Input
                                        id="middle_initial"
                                        name="middle_initial"
                                        value={form.data.middle_initial}
                                        onChange={(event) => {
                                            form.setData('middle_initial', event.target.value);
                                            setStepError(null);
                                        }}
                                        maxLength={5}
                                        autoComplete="additional-name"
                                        placeholder="Opt."
                                    />
                                    <InputError message={form.errors.middle_initial} />
                                </div>
                                <div className="grid gap-1.5 sm:col-span-5">
                                    <Label htmlFor="last_name">Last name</Label>
                                    <Input
                                        id="last_name"
                                        name="last_name"
                                        value={form.data.last_name}
                                        onChange={(event) => {
                                            form.setData('last_name', event.target.value);
                                            setStepError(null);
                                        }}
                                        required
                                        autoComplete="family-name"
                                        placeholder="e.g. Tee"
                                    />
                                    <InputError message={form.errors.last_name} />
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Use your real name (multi-word first names and suffixes like Jr. are supported). M.I. is optional and extra spaces are cleaned automatically.
                            </p>
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="email">Email address</Label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                value={form.data.email}
                                onChange={(event) => {
                                    form.setData('email', event.target.value);
                                    setStepError(null);
                                }}
                                required
                                autoComplete="email"
                                placeholder={
                                    userType === 'student' && !requireInstitutionalEmail
                                        ? 'you@gmail.com or you@cmu.edu.ph'
                                        : 'email@example.com'
                                }
                            />
                            <InputError message={form.errors.email} />

                            {userType === 'student' && !requireInstitutionalEmail ? (
                                trimmedEmail !== '' && isInstitutionalEmail ? (
                                    <p className="rounded-lg border border-success-border bg-success-bg px-3.5 py-2.5 text-xs text-success-fg">
                                        <strong>CMU institutional email detected:</strong>{' '}
                                        {autoVerifyInstitutionalStudent
                                            ? 'Add your Student ID number and program on the next step—confirming your 6-digit email code will automatically verify you as a CMU Student.'
                                            : 'Add your Student ID number and program on the next step for administrator review.'}
                                    </p>
                                ) : (
                                    <p className="text-xs text-muted-foreground">
                                        Use a personal email (like Gmail) for a quick signup—we will send a 6-digit code, let you into your dashboard
                                        {unverifiedStudentsCanBrowse ? ' to browse approved tasks' : ''}, and let you verify as a CMU student anytime. Or use your <code>{domainListLabel}</code> email for instant verification.
                                    </p>
                                )
                            ) : userType !== 'organization' && requireInstitutionalEmail ? (
                                <p className="text-xs text-muted-foreground">
                                    Use your CMU institutional email address ({domainListLabel}).
                                </p>
                            ) : (
                                <p className="text-xs text-muted-foreground">
                                    Any valid email address is accepted. Your email is used to sign in and receive your verification code, and is never shown publicly.
                                </p>
                            )}
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="password">Password</Label>
                            <PasswordInput
                                id="password"
                                name="password"
                                value={form.data.password}
                                onChange={(event) => {
                                    form.setData('password', event.target.value);
                                    setStepError(null);
                                }}
                                required
                                autoComplete="new-password"
                                placeholder="Password"
                                passwordrules={passwordRules}
                            />
                            <InputError message={form.errors.password} />
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="password_confirmation">Confirm password</Label>
                            <PasswordInput
                                id="password_confirmation"
                                name="password_confirmation"
                                value={form.data.password_confirmation}
                                onChange={(event) => {
                                    form.setData('password_confirmation', event.target.value);
                                    setStepError(null);
                                }}
                                required
                                autoComplete="new-password"
                                placeholder="Confirm password"
                                passwordrules={passwordRules}
                            />
                            <InputError message={form.errors.password_confirmation} />
                        </div>

                        <SafetyNotice />

                        <div className="flex items-center gap-3 pt-2">
                            <Button type="button" variant="outline" onClick={() => setStep(1)}>
                                Back
                            </Button>
                            {totalSteps === 2 ? (
                                <Button
                                    type="submit"
                                    className="flex-1"
                                    disabled={form.processing}
                                    data-test="register-user-button"
                                >
                                    {form.processing && <Spinner />}
                                    Create account & send code
                                </Button>
                            ) : (
                                <Button type="button" className="flex-1" onClick={handleNextFromStepTwo}>
                                    Continue to {userType === 'organization' ? 'organization details' : 'campus details'}
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-4">
                        {userType === 'organization' ? (
                            <>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="organization_name">Organization name</Label>
                                    <Input
                                        id="organization_name"
                                        name="organization_name"
                                        value={form.data.organization_name}
                                        onChange={(event) => form.setData('organization_name', event.target.value)}
                                        required
                                        autoFocus
                                        placeholder="Organization name"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        This is the organization’s display name on TaskMate.
                                    </p>
                                    <InputError message={form.errors.organization_name} />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="position">Your position</Label>
                                    <Input
                                        id="position"
                                        name="position"
                                        value={form.data.position}
                                        onChange={(event) => form.setData('position', event.target.value)}
                                        required
                                        placeholder="Representative position"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Used by administrators to review this account.
                                    </p>
                                    <InputError message={form.errors.position} />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="supporting_info">About the organization and why it posts tasks</Label>
                                    <Textarea
                                        id="supporting_info"
                                        name="supporting_info"
                                        value={form.data.supporting_info}
                                        onChange={(event) => form.setData('supporting_info', event.target.value)}
                                        required
                                        maxLength={1000}
                                        placeholder="Briefly describe your organization and why you want to post tasks."
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        For administrator review only—not shown on public profiles. No ID photo uploads required.
                                    </p>
                                    <InputError message={form.errors.supporting_info} />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="id_number">{idLabel}</Label>
                                    <Input
                                        id="id_number"
                                        name="id_number"
                                        value={form.data.id_number}
                                        onChange={(event) => form.setData('id_number', event.target.value)}
                                        required
                                        autoFocus
                                        placeholder={idLabel}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Text only (no ID photo uploads). Your ID number is visible only to you and administrators.
                                    </p>
                                    <InputError message={form.errors.id_number} />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor={hasPresets ? 'affiliation_select' : 'affiliation'}>
                                        {affiliationLabel}
                                    </Label>
                                    {hasPresets ? (
                                        <>
                                            <select
                                                id="affiliation_select"
                                                value={selectedAffiliation}
                                                onChange={(event) => handleAffiliationSelect(event.target.value)}
                                                required
                                                className={NATIVE_SELECT_CLASS}
                                            >
                                                <option value="" disabled>
                                                    Select {affiliationLabel.toLowerCase()}
                                                </option>
                                                {presetAffiliations.map((item) => (
                                                    <option key={item} value={item}>
                                                        {item}
                                                    </option>
                                                ))}
                                                <option value={OTHER_VALUE}>Other (specify below)</option>
                                            </select>
                                            {isOtherAffiliation && (
                                                <Input
                                                    id="affiliation_custom"
                                                    value={customAffiliation}
                                                    onChange={(event) => handleCustomAffiliationChange(event.target.value)}
                                                    required
                                                    placeholder={`Enter your ${affiliationLabel.toLowerCase()}`}
                                                />
                                            )}
                                        </>
                                    ) : (
                                        <Input
                                            id="affiliation"
                                            name="affiliation"
                                            value={form.data.affiliation}
                                            onChange={(event) => form.setData('affiliation', event.target.value)}
                                            required
                                            placeholder={affiliationLabel}
                                        />
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        Helps other users understand your campus affiliation and may appear on your profile.
                                    </p>
                                    <InputError message={form.errors.affiliation} />
                                </div>
                            </>
                        )}

                        <div className="flex items-center gap-3 pt-2">
                            <Button type="button" variant="outline" onClick={() => setStep(2)}>
                                Back
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1"
                                disabled={form.processing}
                                data-test="register-user-button"
                            >
                                {form.processing && <Spinner />}
                                Create account & send code
                            </Button>
                        </div>
                    </div>
                )}

                <div className="text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <TextLink href={login()} data-test="login-link">
                        Log in
                    </TextLink>
                </div>
            </form>
        </>
    );
}

Register.layout = {
    title: 'Create an account',
    description: 'Set up your TaskMate account in a few quick steps',
};
