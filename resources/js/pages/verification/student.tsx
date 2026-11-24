import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { SafetyNotice } from '@/components/safety-notice';
import { VerificationStatusBadge } from '@/components/verification-status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

type Props = {
    verificationStatus: 'unverified' | 'pending' | 'rejected' | 'more_info_requested';
    verificationNote: string | null;
    studentDetails: {
        idNumber: string | null;
        affiliation: string | null;
    };
    pendingInstitutionalCode: {
        maskedEmail: string;
        expiresAt: string | null;
    } | null;
    institutionalEmailDomains: string[];
    autoVerifyInstitutionalStudent: boolean;
    codeExpiryMinutes: number;
    affiliationOptions: string[];
    mailUsesLogDriver: boolean;
    status?: string | null;
};

const OTHER_VALUE = '__other__';

export default function StudentVerification({
    verificationStatus,
    verificationNote,
    studentDetails,
    pendingInstitutionalCode,
    institutionalEmailDomains = ['cmu.edu.ph'],
    autoVerifyInstitutionalStudent = true,
    codeExpiryMinutes = 15,
    affiliationOptions = [],
    mailUsesLogDriver = false,
    status = null,
}: Props) {
    const [method, setMethod] = useState<'institutional' | 'manual'>('institutional');

    const savedAffiliation = studentDetails.affiliation ?? '';
    const initialInPresets = affiliationOptions.includes(savedAffiliation);
    const [selectedAffiliation, setSelectedAffiliation] = useState(
        affiliationOptions.length > 0 ? (initialInPresets ? savedAffiliation : savedAffiliation ? OTHER_VALUE : '') : '',
    );
    const [customAffiliation, setCustomAffiliation] = useState(initialInPresets ? '' : savedAffiliation);
    const resolvedAffiliation = affiliationOptions.length > 0
        ? (selectedAffiliation === OTHER_VALUE ? customAffiliation : selectedAffiliation)
        : customAffiliation;

    const sendCodeForm = useForm({
        id_number: studentDetails.idNumber ?? '',
        affiliation: savedAffiliation,
        institutional_email: '',
    });

    const verifyCodeForm = useForm({
        code: '',
    });

    const manualForm = useForm({
        id_number: studentDetails.idNumber ?? '',
        affiliation: savedAffiliation,
    });

    const domainListLabel = institutionalEmailDomains.map((d) => `@${d}`).join(', ');

    const handleAffiliationSelect = (value: string) => {
        setSelectedAffiliation(value);
        const next = value === OTHER_VALUE ? customAffiliation : value;
        sendCodeForm.setData('affiliation', next);
        manualForm.setData('affiliation', next);
    };

    const handleCustomAffiliationChange = (value: string) => {
        setCustomAffiliation(value);
        sendCodeForm.setData('affiliation', value);
        manualForm.setData('affiliation', value);
    };

    const handleIdNumberChange = (value: string) => {
        sendCodeForm.setData('id_number', value);
        manualForm.setData('id_number', value);
    };

    const handleSendInstitutionalCode = (event: React.FormEvent) => {
        event.preventDefault();
        sendCodeForm.transform((data) => ({
            ...data,
            affiliation: resolvedAffiliation,
        }));
        sendCodeForm.post('/verification/student/institutional-code', { preserveScroll: true });
    };

    const handleVerifyInstitutionalCode = (event: React.FormEvent) => {
        event.preventDefault();
        verifyCodeForm.post('/verification/student/institutional-verify', { preserveScroll: true });
    };

    const handleRequestManualReview = (event: React.FormEvent) => {
        event.preventDefault();
        manualForm.transform((data) => ({
            ...data,
            affiliation: resolvedAffiliation,
        }));
        manualForm.post('/verification/student/manual-request', { preserveScroll: true });
    };

    const sharedErrors = method === 'institutional' ? sendCodeForm.errors : manualForm.errors;

    return (
        <>
            <Head title="Verify as CMU Student" />
            <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                            <VerificationStatusBadge status={verificationStatus} />
                            <Link href="/dashboard" className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">
                                Back to dashboard
                            </Link>
                        </div>
                        <h1 className="text-2xl font-semibold">Verify your CMU Student status</h1>
                        <p className="text-sm text-muted-foreground">
                            Confirm your Student ID number and college/program to unlock applying to tasks, messaging posters, saving your class schedule, and student posting.
                        </p>
                    </div>
                </div>

                {status && (
                    <div role="status" className="rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-900 dark:border-green-800 dark:bg-green-950/50 dark:text-green-200">
                        {status}
                    </div>
                )}

                {verificationNote && (
                    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100">
                        <p className="font-medium">Administrator note</p>
                        <p className="mt-1 whitespace-pre-wrap">{verificationNote}</p>
                    </div>
                )}

                {/* Step 1: Choose verification track */}
                <section aria-label="Choose verification method" className="grid gap-3 sm:grid-cols-2">
                    <button
                        type="button"
                        onClick={() => setMethod('institutional')}
                        className={`rounded-xl border p-4 text-left transition ${
                            method === 'institutional'
                                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                : 'border-input hover:border-primary/40 hover:bg-muted/30'
                        }`}
                    >
                        <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold">CMU Email Code</span>
                            <span className="rounded-full border border-green-300 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-900 dark:border-green-800 dark:bg-green-950/60 dark:text-green-200">
                                {autoVerifyInstitutionalStudent ? 'Instant approval' : 'Recommended'}
                            </span>
                        </div>
                        <p className="mt-1.5 text-xs text-muted-foreground">
                            Enter your <code>{domainListLabel}</code> email to get a 6-digit code. Your personal Gmail login stays unchanged.
                        </p>
                    </button>

                    <button
                        type="button"
                        onClick={() => setMethod('manual')}
                        className={`rounded-xl border p-4 text-left transition ${
                            method === 'manual'
                                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                : 'border-input hover:border-primary/40 hover:bg-muted/30'
                        }`}
                    >
                        <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold">Administrator Review</span>
                            <span className="rounded-full border bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                No CMU email needed
                            </span>
                        </div>
                        <p className="mt-1.5 text-xs text-muted-foreground">
                            Don&apos;t have access to your CMU email right now? Submit your Student ID number and college/program for admin review.
                        </p>
                    </button>
                </section>

                {/* Privacy reassurance */}
                <div className="rounded-lg border bg-muted/30 p-3.5 text-xs text-muted-foreground">
                    <strong className="text-foreground">Privacy protection:</strong> TaskMate does not collect or accept Student ID photos, selfies, or identity document uploads. Your Student ID number and institutional email are visible only to you and administrators.
                </div>

                {/* If a CMU email verification code is already pending, show the 6-digit entry card first */}
                {method === 'institutional' && pendingInstitutionalCode && (
                    <section aria-labelledby="enter-cmu-code-heading" className="space-y-4 rounded-xl border-2 border-primary/40 bg-primary/5 p-5">
                        <div>
                            <h2 id="enter-cmu-code-heading" className="text-base font-semibold">Enter the 6-digit code sent to {pendingInstitutionalCode.maskedEmail}</h2>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Codes expire after {codeExpiryMinutes} minutes. Confirming it will keep your current login email and verify your CMU student status.
                            </p>
                        </div>

                        {mailUsesLogDriver && (
                            <div className="rounded-lg border border-amber-400 bg-amber-50 p-3 text-xs text-amber-950 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-100">
                                <strong>Local prototype mode:</strong> Check <code>storage/logs/laravel.log</code> for the 6-digit CMU student verification code.
                            </div>
                        )}

                        <form onSubmit={handleVerifyInstitutionalCode} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="cmu_verification_code">6-digit CMU verification code</Label>
                                <Input
                                    id="cmu_verification_code"
                                    name="code"
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    maxLength={6}
                                    placeholder="000000"
                                    value={verifyCodeForm.data.code}
                                    onChange={(event) => verifyCodeForm.setData('code', event.target.value.replace(/\D/g, '').slice(0, 6))}
                                    required
                                    className="h-12 max-w-xs text-center font-mono text-2xl tracking-[0.4em]"
                                />
                                <InputError message={verifyCodeForm.errors.code} />
                            </div>
                            <Button type="submit" disabled={verifyCodeForm.processing || verifyCodeForm.data.code.length !== 6}>
                                {verifyCodeForm.processing && <Spinner />}
                                Confirm code & verify as CMU Student
                            </Button>
                        </form>
                    </section>
                )}

                {/* Form card */}
                <section className="space-y-5 rounded-xl border p-5">
                    <div>
                        <h2 className="text-lg font-semibold">
                            {method === 'institutional'
                                ? pendingInstitutionalCode
                                    ? 'Need a new code or want to update your student details?'
                                    : 'Your CMU Student details & institutional email'
                                : 'Submit your CMU Student details for administrator review'}
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Every verified CMU student record includes your Student ID number (private) and College/Program (shown on your campus profile).
                        </p>
                    </div>

                    <form onSubmit={method === 'institutional' ? handleSendInstitutionalCode : handleRequestManualReview} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="student_id_number">Student ID number</Label>
                            <Input
                                id="student_id_number"
                                name="id_number"
                                value={sendCodeForm.data.id_number}
                                onChange={(event) => handleIdNumberChange(event.target.value)}
                                required
                                placeholder="e.g. 2024-01234"
                            />
                            <p className="text-xs text-muted-foreground">Text only—never upload an ID photo. Visible only to you and administrators.</p>
                            <InputError message={sharedErrors.id_number} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor={affiliationOptions.length > 0 ? 'student_affiliation_select' : 'student_affiliation'}>
                                College and program
                            </Label>
                            {affiliationOptions.length > 0 ? (
                                <>
                                    <select
                                        id="student_affiliation_select"
                                        value={selectedAffiliation}
                                        onChange={(event) => handleAffiliationSelect(event.target.value)}
                                        required
                                        className="border-input bg-background h-10 w-full rounded-md border px-3 py-2 text-sm"
                                    >
                                        <option value="" disabled>Select college and program</option>
                                        {affiliationOptions.map((item) => (
                                            <option key={item} value={item}>{item}</option>
                                        ))}
                                        <option value={OTHER_VALUE}>Other (specify below)</option>
                                    </select>
                                    {selectedAffiliation === OTHER_VALUE && (
                                        <Input
                                            id="student_affiliation_custom"
                                            value={customAffiliation}
                                            onChange={(event) => handleCustomAffiliationChange(event.target.value)}
                                            required
                                            placeholder="Enter your college and program"
                                        />
                                    )}
                                </>
                            ) : (
                                <Input
                                    id="student_affiliation"
                                    name="affiliation"
                                    value={customAffiliation}
                                    onChange={(event) => handleCustomAffiliationChange(event.target.value)}
                                    required
                                    placeholder="College and program"
                                />
                            )}
                            <p className="text-xs text-muted-foreground">Helps posters see your campus affiliation on your profile.</p>
                            <InputError message={sharedErrors.affiliation} />
                        </div>

                        {method === 'institutional' && (
                            <div className="grid gap-2">
                                <Label htmlFor="institutional_email">CMU institutional email ({domainListLabel})</Label>
                                <Input
                                    id="institutional_email"
                                    name="institutional_email"
                                    type="email"
                                    value={sendCodeForm.data.institutional_email}
                                    onChange={(event) => sendCodeForm.setData('institutional_email', event.target.value)}
                                    required
                                    placeholder={`yourname@${institutionalEmailDomains[0] ?? 'cmu.edu.ph'}`}
                                />
                                <p className="text-xs text-muted-foreground">
                                    We send a one-time 6-digit code here to prove active CMU email ownership. Your personal login email will not change.
                                </p>
                                <InputError message={sendCodeForm.errors.institutional_email} />
                            </div>
                        )}

                        <div className="flex flex-wrap items-center gap-3 pt-1">
                            {method === 'institutional' ? (
                                <Button type="submit" disabled={sendCodeForm.processing}>
                                    {sendCodeForm.processing && <Spinner />}
                                    {pendingInstitutionalCode ? 'Resend 6-digit CMU code' : 'Send 6-digit CMU code'}
                                </Button>
                            ) : (
                                <Button type="submit" disabled={manualForm.processing}>
                                    {manualForm.processing && <Spinner />}
                                    Submit for administrator review
                                </Button>
                            )}
                            <Link href="/browse" className="text-sm underline underline-offset-4">
                                Continue previewing tasks
                            </Link>
                        </div>
                    </form>
                </section>

                <SafetyNotice />
            </div>
        </>
    );
}
