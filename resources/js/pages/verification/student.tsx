import { useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, ExternalLink, Mail, TriangleAlert } from 'lucide-react';
import InputError from '@/components/input-error';
import { VerificationStatusBadge } from '@/components/verification-status-badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

const NATIVE_SELECT_CLASS =
    'focus-ring h-11 w-full rounded-md border border-input bg-field px-3 text-sm text-foreground shadow-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 md:h-9';

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
    const { prototypeMode } = usePage<{ prototypeMode?: boolean }>().props;
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
    const hasPendingCode = method === 'institutional' && Boolean(pendingInstitutionalCode);

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

    const handleMethodKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown' || event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            event.preventDefault();
            setMethod((prev) => (prev === 'institutional' ? 'manual' : 'institutional'));
        }
    };

    const sharedErrors = method === 'institutional' ? sendCodeForm.errors : manualForm.errors;

    return (
        <>
            <Head title="Verify as CMU Student" />
            <div className="page-narrow space-y-6">
                <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <VerificationStatusBadge status={verificationStatus} />
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/dashboard">
                                <ArrowLeft aria-hidden="true" />
                                Back to dashboard
                            </Link>
                        </Button>
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                        Verify your CMU Student status
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Confirm your Student ID number and college/program to unlock applying to tasks, messaging posters, saving your class schedule, and student posting.
                    </p>
                </div>

                {status && (
                    <div
                        role="status"
                        className="rounded-lg border border-success-border bg-success-bg px-4 py-3 text-sm text-success-fg"
                    >
                        {status}
                    </div>
                )}

                {verificationNote && (
                    <Alert variant="warning">
                        <TriangleAlert aria-hidden="true" />
                        <AlertTitle>Administrator note</AlertTitle>
                        <AlertDescription className="whitespace-pre-wrap">
                            {verificationNote}
                        </AlertDescription>
                    </Alert>
                )}

                <section
                    role="radiogroup"
                    aria-label="Verification method"
                    className="grid gap-3 sm:grid-cols-2"
                >
                    <button
                        type="button"
                        role="radio"
                        aria-checked={method === 'institutional'}
                        onClick={() => setMethod('institutional')}
                        onKeyDown={handleMethodKeyDown}
                        className={
                            method === 'institutional'
                                ? 'focus-ring rounded-xl border-2 border-brand bg-info-bg/40 p-4 text-left shadow-xs transition-colors'
                                : 'focus-ring rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-input hover:bg-muted/40'
                        }
                    >
                        <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-foreground">CMU Email Code</span>
                            <Badge variant="success">
                                {autoVerifyInstitutionalStudent ? 'Instant approval' : 'Recommended'}
                            </Badge>
                        </div>
                        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                            Enter your <code>{domainListLabel}</code> email to get a 6-digit code. Your personal Gmail login stays unchanged.
                        </p>
                    </button>

                    <button
                        type="button"
                        role="radio"
                        aria-checked={method === 'manual'}
                        onClick={() => setMethod('manual')}
                        onKeyDown={handleMethodKeyDown}
                        className={
                            method === 'manual'
                                ? 'focus-ring rounded-xl border-2 border-brand bg-info-bg/40 p-4 text-left shadow-xs transition-colors'
                                : 'focus-ring rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-input hover:bg-muted/40'
                        }
                    >
                        <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-foreground">Administrator Review</span>
                            <Badge variant="neutral">No CMU email needed</Badge>
                        </div>
                        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                            Don&apos;t have access to your CMU email right now? Submit your Student ID number and college/program for admin review.
                        </p>
                    </button>
                </section>

                {hasPendingCode && pendingInstitutionalCode && (
                    <Card className="border-2 border-brand/50 bg-info-bg/20" aria-labelledby="enter-cmu-code-heading">
                        <CardHeader>
                            <CardTitle id="enter-cmu-code-heading" className="text-base">
                                Enter the 6-digit code sent to {pendingInstitutionalCode.maskedEmail}
                            </CardTitle>
                            <CardDescription className="tabular-nums">
                                Codes expire after {codeExpiryMinutes} minutes. Confirming it will keep your current login email and verify your CMU student status.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {prototypeMode && mailUsesLogDriver && (
                                <Alert variant="warning">
                                    <TriangleAlert aria-hidden="true" />
                                    <AlertDescription className="space-y-2.5 text-xs">
                                        <p>
                                            <strong>Local prototype mode:</strong> Open the simulated email tab to view your 6-digit CMU student verification code directly (no need to check <code>storage/logs/laravel.log</code>).
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

                            <form onSubmit={handleVerifyInstitutionalCode} className="space-y-4">
                                <div className="grid gap-1.5">
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
                                        onChange={(event) =>
                                            verifyCodeForm.setData('code', event.target.value.replace(/\D/g, '').slice(0, 6))
                                        }
                                        required
                                        className="h-12 max-w-xs text-center font-mono text-2xl tracking-[0.4em] tabular-nums"
                                    />
                                    <InputError message={verifyCodeForm.errors.code} />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={verifyCodeForm.processing || verifyCodeForm.data.code.length !== 6}
                                >
                                    {verifyCodeForm.processing && <Spinner />}
                                    Confirm code &amp; verify as CMU Student
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>
                            {method === 'institutional'
                                ? pendingInstitutionalCode
                                    ? 'Need a new code or want to update your student details?'
                                    : 'Your CMU Student details & institutional email'
                                : 'Submit your CMU Student details for administrator review'}
                        </CardTitle>
                        <CardDescription>
                            Every verified CMU student record includes your Student ID number (private) and College/Program (shown on your campus profile).
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={method === 'institutional' ? handleSendInstitutionalCode : handleRequestManualReview}
                            className="space-y-4"
                        >
                            <div className="grid gap-1.5">
                                <Label htmlFor="student_id_number">Student ID number</Label>
                                <Input
                                    id="student_id_number"
                                    name="id_number"
                                    value={sendCodeForm.data.id_number}
                                    onChange={(event) => handleIdNumberChange(event.target.value)}
                                    required
                                    placeholder="e.g. 2024-01234"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Text only—never upload an ID photo. Visible only to you and administrators.
                                </p>
                                <InputError message={sharedErrors.id_number} />
                            </div>

                            <div className="grid gap-1.5">
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
                                            className={NATIVE_SELECT_CLASS}
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
                                <p className="text-xs text-muted-foreground">
                                    Helps posters see your campus affiliation on your profile.
                                </p>
                                <InputError message={sharedErrors.affiliation} />
                            </div>

                            {method === 'institutional' && (
                                <div className="grid gap-1.5">
                                    <Label htmlFor="institutional_email">
                                        CMU institutional email ({domainListLabel})
                                    </Label>
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
                                    <Button
                                        type="submit"
                                        variant={hasPendingCode ? 'outline' : 'default'}
                                        disabled={sendCodeForm.processing}
                                    >
                                        {sendCodeForm.processing && <Spinner />}
                                        {pendingInstitutionalCode ? 'Resend 6-digit CMU code' : 'Send 6-digit CMU code'}
                                    </Button>
                                ) : (
                                    <Button type="submit" disabled={manualForm.processing}>
                                        {manualForm.processing && <Spinner />}
                                        Submit for administrator review
                                    </Button>
                                )}
                                <Button variant="ghost" asChild>
                                    <Link href="/browse">Continue previewing tasks</Link>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <div className="rounded-lg border border-border bg-muted/40 p-3.5 text-xs leading-relaxed text-muted-foreground">
                    <strong className="text-foreground">Privacy protection:</strong> TaskMate does not collect or accept Student ID photos, selfies, or identity document uploads. Your Student ID number and institutional email are visible only to you and administrators.
                </div>
            </div>
        </>
    );
}
