import { formatDate, formatAmount, formatHoursFlexibility, formatTime12Hour } from '@/lib/format';
import { buildAskPosterMessage, evaluateScheduleFit, type ClassBlock } from '@/lib/schedule-fit';
import { PAYMENT_BOUNDARY_NOTICE, STUDENT_TASK_SAFETY_NOTICE } from '@/constants/notices';
import { useMemo, useRef, useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import InputError from '@/components/input-error';
import { VerificationStatusBadge } from '@/components/verification-status-badge';
import { ApplicationStatusBadge } from '@/components/application-status-badge';
import { ScheduleFitBadge, ToBeDiscussedBadge } from '@/components/terms-status-badge';
import browse from '@/routes/browse';
import applications from '@/routes/applications';
import { RatingSummary } from '@/components/rating-summary';
import { ProblemReportForm } from '@/components/problem-report-form';

type Option = { value: string; label: string };
type Task = {
    id: number;
    title: string;
    category: string;
    description: string;
    requiredActivities: string | null;
    deliverables: string | null;
    estimatedDurationHours: string | null;
    skillRequirements: string | null;
    budget: string | null;
    budgetToBeDiscussed?: boolean;
    payTiming?: string | null;
    payTimingLabel?: string;
    payTimingToBeDiscussed?: boolean;
    payTimingNote?: string | null;
    scheduleDays?: string[];
    scheduleStartTime?: string | null;
    scheduleEndTime?: string | null;
    scheduleNote?: string | null;
    scheduleToBeDiscussed?: boolean;
    scheduleSummary?: string | null;
    canHoursChange?: boolean | null;
    workMode: string;
    workplaceName: string | null;
    workplaceAddress: string | null;
    deadline: string | null;
};
type Poster = {
    displayName: string;
    accountType: string;
    affiliation: string | null;
    verificationStatus: 'pending' | 'verified' | 'rejected' | 'more_info_requested';
    memberSince: string | null;
    profileUrl: string;
    ratingSummary: import('@/components/rating-summary').RatingSummaryData;
};
type Application = { status: string; statusLabel: string; appliedAt: string | null };
type Props = {
    task: Task;
    poster: Poster;
    application: Application | null;
    conversation?: { id: number; sendBlockedReason: string | null } | null;
    canApply?: boolean;
    limitedView?: boolean;
    currentTaskStatus?: string;
    status?: string | null;
    messageMaxLength: number;
    problemReport?: { action: string; types: Option[] };
    offPlatformWarning?: boolean;
    studentClassSchedule?: ClassBlock[];
    daysOfWeek?: Option[];
    maxClassBlocks?: number;
};

const FALLBACK_DAYS: Option[] = [
    { value: 'mon', label: 'Mon' },
    { value: 'tue', label: 'Tue' },
    { value: 'wed', label: 'Wed' },
    { value: 'thu', label: 'Thu' },
    { value: 'fri', label: 'Fri' },
    { value: 'sat', label: 'Sat' },
    { value: 'sun', label: 'Sun' },
];

export default function BrowseTaskDetail({
    task,
    poster,
    application,
    conversation,
    canApply = false,
    limitedView = false,
    currentTaskStatus,
    status,
    messageMaxLength,
    problemReport,
    offPlatformWarning,
    studentClassSchedule = [],
    daysOfWeek = FALLBACK_DAYS,
    maxClassBlocks = 25,
}: Props) {
    const dayLabelMap = useMemo(
        () => Object.fromEntries(daysOfWeek.map((item) => [item.value, item.label])),
        [daysOfWeek],
    );

    const [classBlocks, setClassBlocks] = useState<ClassBlock[]>(studentClassSchedule);
    const [scheduleEditorOpen, setScheduleEditorOpen] = useState(studentClassSchedule.length === 0);
    const [newBlockDay, setNewBlockDay] = useState(daysOfWeek[0]?.value ?? 'mon');
    const [newBlockStart, setNewBlockStart] = useState('08:00');
    const [newBlockEnd, setNewBlockEnd] = useState('12:00');
    const [newBlockLabel, setNewBlockLabel] = useState('');
    const [blockError, setBlockError] = useState<string | null>(null);
    const [savingSchedule, setSavingSchedule] = useState(false);
    const [scheduleDirty, setScheduleDirty] = useState(false);

    const [showConfirmSummary, setShowConfirmSummary] = useState(false);
    const [reviewNotice, setReviewNotice] = useState<string | null>(null);

    const messageRef = useRef<HTMLTextAreaElement | null>(null);
    const summaryRef = useRef<HTMLDivElement | null>(null);

    const applyForm = useForm({
        message: '',
        proposed_amount: '',
        poster_identity_checked: false,
        no_upfront_fee_checked: false,
        known_person_or_reviews_checked: false,
        work_details_confirmed: false,
    });

    const isBudgetTbd = Boolean(task.budgetToBeDiscussed || task.budget === null);
    const isPayTimingTbd = Boolean(task.payTimingToBeDiscussed || !task.payTimingLabel);
    const isScheduleTbd = Boolean(task.scheduleToBeDiscussed || !task.scheduleSummary);

    const missingTerms = useMemo(() => {
        const list: string[] = [];
        if (isScheduleTbd) list.push('Work hours');
        if (isBudgetTbd) list.push('Pay amount');
        if (isPayTimingTbd) list.push('When paid (pay timing)');
        return list;
    }, [isBudgetTbd, isPayTimingTbd, isScheduleTbd]);

    const scheduleFit = useMemo(
        () => evaluateScheduleFit(task, classBlocks, dayLabelMap),
        [task, classBlocks, dayLabelMap],
    );

    const checklistCheckedCount =
        (applyForm.data.poster_identity_checked ? 1 : 0) +
        (applyForm.data.no_upfront_fee_checked ? 1 : 0) +
        (applyForm.data.known_person_or_reviews_checked ? 1 : 0);

    const requiredChecksComplete = applyForm.data.poster_identity_checked && applyForm.data.no_upfront_fee_checked;

    const handleAddClassBlock = () => {
        if (classBlocks.length >= maxClassBlocks) {
            setBlockError(`You can save up to ${maxClassBlocks} class blocks.`);
            return;
        }
        if (!newBlockStart || !newBlockEnd || newBlockEnd <= newBlockStart) {
            setBlockError('Class end time must be later than start time.');
            return;
        }
        setBlockError(null);
        setClassBlocks((prev) => [
            ...prev,
            {
                day: newBlockDay,
                start_time: newBlockStart,
                end_time: newBlockEnd,
                label: newBlockLabel.trim() || null,
            },
        ]);
        setNewBlockLabel('');
        setScheduleDirty(true);
    };

    const handleRemoveClassBlock = (indexToRemove: number) => {
        setClassBlocks((prev) => prev.filter((_, idx) => idx !== indexToRemove));
        setScheduleDirty(true);
    };

    const handleSaveClassSchedule = () => {
        setSavingSchedule(true);
        router.put(
            '/my-class-schedule',
            { blocks: classBlocks },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setScheduleDirty(false);
                },
                onFinish: () => {
                    setSavingSchedule(false);
                },
            },
        );
    };

    const handleAskPosterPrefill = () => {
        const draft = buildAskPosterMessage({
            taskTitle: task.title,
            missingTerms,
            conflicts: scheduleFit.conflicts,
        });
        applyForm.setData('message', draft);
        setShowConfirmSummary(false);
        setReviewNotice(null);
        messageRef.current?.focus();
        messageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const handleOpenSummary = () => {
        if (!requiredChecksComplete) {
            setReviewNotice('Complete the two required poster checks in “The poster” section before reviewing your application.');
            return;
        }
        if (!applyForm.data.message.trim()) {
            setReviewNotice('Write a short message to the poster (or click “Ask poster” to pre-fill questions) before reviewing.');
            messageRef.current?.focus();
            return;
        }
        setReviewNotice(null);
        setShowConfirmSummary(true);
        setTimeout(() => {
            summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 0);
    };

    const handleFinalSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        applyForm.post(applications.store.url(task.id), {
            preserveScroll: true,
            onError: () => {
                setShowConfirmSummary(true);
            },
        });
    };

    return (
        <>
            <Head title={task.title} />
            <div className="mx-auto max-w-4xl space-y-5 p-4 sm:p-6">
                {status && (
                    <div role="status" className="rounded-lg border px-4 py-3 text-sm">
                        {status}
                    </div>
                )}
                {limitedView && (
                    <div className="rounded-lg border p-4 text-sm">
                        This task is currently {currentTaskStatus?.toLowerCase()}. You can review the task details and your application status.
                    </div>
                )}

                <div>
                    <p className="text-sm text-muted-foreground">{task.category}</p>
                    <h1 className="mt-1 text-2xl font-semibold">{task.title}</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Review the offer terms, the poster, and your class schedule in order before you decide.
                    </p>
                    {canApply && !application && (
                        <a
                            href="#my-decision"
                            className="mt-3 inline-flex min-h-10 items-center rounded-md border px-4 py-2 text-sm font-medium underline-offset-4 hover:underline"
                        >
                            Go to my decision
                        </a>
                    )}
                </div>

                {/* GROUP 1: THE OFFER (Fixed order: Tasks -> Hours -> Pay amount & Pay timing side-by-side -> Location -> Contact) */}
                <section aria-labelledby="section-the-offer" className="space-y-4 rounded-xl border p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 id="section-the-offer" className="text-lg font-semibold">1. The offer</h2>
                        {missingTerms.length > 0 && <ToBeDiscussedBadge label={`${missingTerms.length} term${missingTerms.length === 1 ? '' : 's'} to be discussed`} />}
                    </div>

                    <div className="space-y-3 border-t pt-3">
                        <div>
                            <h3 className="text-sm font-medium text-muted-foreground">Tasks</h3>
                            <p className="mt-1 whitespace-pre-wrap text-sm sm:text-base">{task.description}</p>
                            {task.requiredActivities && (
                                <div className="mt-2">
                                    <p className="text-xs font-medium text-muted-foreground">Main activities</p>
                                    <p className="mt-0.5 whitespace-pre-wrap text-sm">{task.requiredActivities}</p>
                                </div>
                            )}
                            {task.deliverables && (
                                <div className="mt-2">
                                    <p className="text-xs font-medium text-muted-foreground">Expected result</p>
                                    <p className="mt-0.5 whitespace-pre-wrap text-sm">{task.deliverables}</p>
                                </div>
                            )}
                            {task.skillRequirements && <p className="mt-2 text-sm"><strong>Skills:</strong> {task.skillRequirements}</p>}
                            {task.estimatedDurationHours && <p className="mt-1 text-sm"><strong>Estimated duration:</strong> {task.estimatedDurationHours} hours</p>}
                        </div>

                        <div className="border-t pt-3">
                            <h3 className="text-sm font-medium text-muted-foreground">Hours</h3>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                {isScheduleTbd ? (
                                    <ToBeDiscussedBadge />
                                ) : (
                                    <p className="font-medium">{task.scheduleSummary}</p>
                                )}
                                <span className="text-sm text-muted-foreground">· Can hours change: {formatHoursFlexibility(task.canHoursChange)}</span>
                            </div>
                            {task.scheduleNote && <p className="mt-1 text-sm text-muted-foreground">{task.scheduleNote}</p>}
                            <p className="mt-1 text-sm text-muted-foreground">
                                Deadline: {task.deadline ? formatDate(task.deadline) : 'No deadline listed'}
                            </p>
                        </div>

                        <div className="rounded-xl border bg-muted/30 p-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pay amount</h3>
                                    <div className="mt-1">
                                        {isBudgetTbd ? (
                                            <ToBeDiscussedBadge />
                                        ) : (
                                            <p className="text-2xl font-semibold">₱{formatAmount(task.budget)}</p>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">When paid (Pay timing)</h3>
                                    <div className="mt-1">
                                        {isPayTimingTbd ? (
                                            <ToBeDiscussedBadge />
                                        ) : (
                                            <p className="text-lg font-semibold">{task.payTimingLabel}</p>
                                        )}
                                    </div>
                                    {task.payTimingNote && <p className="mt-1 text-xs text-muted-foreground">{task.payTimingNote}</p>}
                                </div>
                            </div>
                            <p className="mt-3 text-xs text-muted-foreground">{PAYMENT_BOUNDARY_NOTICE}</p>
                        </div>

                        <div className="grid gap-3 border-t pt-3 sm:grid-cols-2">
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground">Location</h3>
                                <p className="mt-1 font-medium">{task.workMode}</p>
                                {(task.workplaceName || task.workplaceAddress) && (
                                    <p className="mt-1 text-sm">
                                        <strong>Workplace:</strong> {[task.workplaceName, task.workplaceAddress].filter(Boolean).join(' · ')}
                                    </p>
                                )}
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground">Contact person</h3>
                                <p className="mt-1 font-medium">
                                    <Link href={poster.profileUrl} className="underline underline-offset-4">{poster.displayName}</Link>
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">Private in-app messaging opens once you submit your application.</p>
                            </div>
                        </div>

                        {missingTerms.length > 0 && (
                            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
                                <p>
                                    <strong>Missing terms:</strong> {missingTerms.join(', ')} {missingTerms.length === 1 ? 'is' : 'are'} marked <em>To be discussed</em>. Ask the poster before locking an agreement.
                                </p>
                                {canApply && !application && (
                                    <Button type="button" size="sm" variant="outline" onClick={handleAskPosterPrefill}>
                                        Ask poster about missing terms
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </section>

                {/* GROUP 2: THE POSTER (Profile details + 3-Item Pre-Acceptance Checklist) */}
                <section aria-labelledby="section-the-poster" className="space-y-4 rounded-xl border p-5">
                    <h2 id="section-the-poster" className="text-lg font-semibold">2. The poster</h2>
                    <div className="space-y-2">
                        <p className="font-medium">
                            <Link href={poster.profileUrl} className="underline underline-offset-4">{poster.displayName}</Link>
                        </p>
                        <p className="text-sm">{poster.accountType}{poster.affiliation ? ` · ${poster.affiliation}` : ''}</p>
                        <VerificationStatusBadge status={poster.verificationStatus} />
                        <p className="text-sm text-muted-foreground">Member since {poster.memberSince ? formatDate(poster.memberSince) : '—'}</p>
                        <RatingSummary summary={poster.ratingSummary} />
                    </div>

                    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">{STUDENT_TASK_SAFETY_NOTICE}</div>
                    {offPlatformWarning && (
                        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
                            This post contains a request to move outside TaskMate or skip its steps. Be careful, keep agreements and communications on record, and report anything that makes you uncomfortable.
                        </div>
                    )}

                    {canApply && !application && (
                        <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <h3 className="text-sm font-semibold">Pre-acceptance checklist (3 quick checks)</h3>
                                <span className="rounded-full border bg-background px-2.5 py-0.5 text-xs font-medium">
                                    {checklistCheckedCount} of 3 checked
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Complete checks 1 and 2 before applying. Check 3 is optional if you do not personally know the poster.
                            </p>
                            <div className="space-y-2.5 text-sm">
                                <label className="flex items-start gap-2.5">
                                    <input
                                        id="poster_identity_checked"
                                        name="poster_identity_checked"
                                        type="checkbox"
                                        checked={applyForm.data.poster_identity_checked}
                                        onChange={(event) => {
                                            applyForm.setData('poster_identity_checked', event.target.checked);
                                            setReviewNotice(null);
                                        }}
                                        className="mt-1"
                                    />
                                    <span>
                                        <strong>1. Poster name and profile checked</strong> <span className="text-xs text-muted-foreground">(required)</span> — I checked who posted this offer and inspected their profile and verification badge.
                                    </span>
                                </label>
                                <InputError message={applyForm.errors.poster_identity_checked} />

                                <label className="flex items-start gap-2.5">
                                    <input
                                        id="no_upfront_fee_checked"
                                        name="no_upfront_fee_checked"
                                        type="checkbox"
                                        checked={applyForm.data.no_upfront_fee_checked}
                                        onChange={(event) => {
                                            applyForm.setData('no_upfront_fee_checked', event.target.checked);
                                            setReviewNotice(null);
                                        }}
                                        className="mt-1"
                                    />
                                    <span>
                                        <strong>2. No upfront payment or fee asked</strong> <span className="text-xs text-muted-foreground">(required)</span> — This offer does not ask me to pay any upfront fee, deposit, or registration charge.
                                    </span>
                                </label>
                                <InputError message={applyForm.errors.no_upfront_fee_checked} />

                                <label className="flex items-start gap-2.5">
                                    <input
                                        id="known_person_or_reviews_checked"
                                        name="known_person_or_reviews_checked"
                                        type="checkbox"
                                        checked={applyForm.data.known_person_or_reviews_checked}
                                        onChange={(event) => applyForm.setData('known_person_or_reviews_checked', event.target.checked)}
                                        className="mt-1"
                                    />
                                    <span>
                                        <strong>3. Known person can confirm, or I checked reviews/profile</strong> <span className="text-xs text-muted-foreground">(optional)</span> — Someone I trust knows this poster, or I reviewed their past ratings and profile.
                                    </span>
                                </label>
                            </div>
                        </div>
                    )}

                    {problemReport && <ProblemReportForm action={problemReport.action} types={problemReport.types} />}
                </section>

                {/* GROUP 3: MY CLASSES (Schedule Fit Check + Private Student Class Schedule Editor) */}
                <section aria-labelledby="section-my-classes" className="space-y-4 rounded-xl border p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 id="section-my-classes" className="text-lg font-semibold">3. My classes</h2>
                        <ScheduleFitBadge status={scheduleFit.status} />
                    </div>

                    <div className="grid gap-3 rounded-lg border bg-muted/20 p-4 sm:grid-cols-2">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Offered work hours</p>
                            <div className="mt-1">
                                {isScheduleTbd ? <ToBeDiscussedBadge /> : <p className="font-medium">{task.scheduleSummary}</p>}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">{scheduleFit.negotiabilityNote}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Schedule check result</p>
                            <p className="mt-1 text-sm">{scheduleFit.reason}</p>
                        </div>
                    </div>

                    {scheduleFit.conflicts.length > 0 && (
                        <div className="space-y-2 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-950">
                            <p className="font-medium">Conflicting class block{scheduleFit.conflicts.length === 1 ? '' : 's'}:</p>
                            <ul className="list-disc space-y-1 pl-5">
                                {scheduleFit.conflicts.map((conflict, idx) => (
                                    <li key={`${conflict.day}-${idx}`}>
                                        {conflict.dayLabel} {conflict.blockRange}
                                        {conflict.label ? ` (${conflict.label})` : ''} overlaps with work hours {conflict.taskRange}
                                    </li>
                                ))}
                            </ul>
                            {canApply && !application && (
                                <Button type="button" size="sm" variant="outline" onClick={handleAskPosterPrefill} className="mt-2 bg-white">
                                    Ask poster to adjust hours
                                </Button>
                            )}
                        </div>
                    )}

                    <div className="space-y-3 rounded-lg border p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h3 className="text-sm font-semibold">My saved weekly class schedule ({classBlocks.length})</h3>
                                <p className="text-xs text-muted-foreground">Saved privately to your account only—posters and other users never see your class schedule.</p>
                            </div>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setScheduleEditorOpen((open) => !open)}
                            >
                                {scheduleEditorOpen ? 'Hide schedule editor' : 'Edit my classes'}
                            </Button>
                        </div>

                        {classBlocks.length > 0 && (
                            <ul className="flex flex-wrap gap-2">
                                {classBlocks.map((block, index) => (
                                    <li key={`${block.day}-${block.start_time}-${block.end_time}-${index}`} className="inline-flex items-center gap-2 rounded-md border bg-muted/30 px-2.5 py-1 text-xs">
                                        <span>
                                            <strong>{dayLabelMap[block.day] ?? block.day}</strong> {formatTime12Hour(block.start_time)}–{formatTime12Hour(block.end_time)}
                                            {block.label ? ` · ${block.label}` : ''}
                                        </span>
                                        {scheduleEditorOpen && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveClassBlock(index)}
                                                aria-label={`Remove ${dayLabelMap[block.day] ?? block.day} class block`}
                                                className="font-semibold text-muted-foreground hover:text-foreground"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}

                        {scheduleEditorOpen && (
                            <div className="space-y-3 border-t pt-3">
                                <div className="grid gap-3 sm:grid-cols-4">
                                    <div className="grid gap-1">
                                        <Label htmlFor="class_day">Day</Label>
                                        <select
                                            id="class_day"
                                            value={newBlockDay}
                                            onChange={(event) => setNewBlockDay(event.target.value)}
                                            className="h-9 rounded-md border bg-background px-2.5 text-sm"
                                        >
                                            {daysOfWeek.map((day) => (
                                                <option key={day.value} value={day.value}>{day.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid gap-1">
                                        <Label htmlFor="class_start_time">Start</Label>
                                        <Input id="class_start_time" type="time" value={newBlockStart} onChange={(event) => setNewBlockStart(event.target.value)} className="h-9" />
                                    </div>
                                    <div className="grid gap-1">
                                        <Label htmlFor="class_end_time">End</Label>
                                        <Input id="class_end_time" type="time" value={newBlockEnd} onChange={(event) => setNewBlockEnd(event.target.value)} className="h-9" />
                                    </div>
                                    <div className="grid gap-1">
                                        <Label htmlFor="class_label">Label (optional)</Label>
                                        <Input id="class_label" maxLength={80} placeholder="e.g. IT57 Lecture" value={newBlockLabel} onChange={(event) => setNewBlockLabel(event.target.value)} className="h-9" />
                                    </div>
                                </div>
                                {blockError && <p className="text-xs text-red-600">{blockError}</p>}
                                <div className="flex flex-wrap items-center gap-2">
                                    <Button type="button" size="sm" variant="outline" onClick={handleAddClassBlock}>
                                        Add class block
                                    </Button>
                                    <Button type="button" size="sm" onClick={handleSaveClassSchedule} disabled={savingSchedule}>
                                        {savingSchedule ? 'Saving...' : scheduleDirty ? 'Save my class schedule' : 'Save schedule to account'}
                                    </Button>
                                    {scheduleDirty && <span className="text-xs text-muted-foreground">Unsaved changes (fit check updates live above).</span>}
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* GROUP 4: MY DECISION (Ask poster / Review & Apply / Decline + Check Before You Apply Summary) */}
                {application ? (
                    <section id="my-decision" aria-labelledby="section-my-decision" className="space-y-3 rounded-xl border p-5">
                        <h2 id="section-my-decision" className="text-lg font-semibold">4. My decision — Application submitted</h2>
                        <ApplicationStatusBadge status={application.status} label={application.statusLabel} />
                        {application.status === 'accepted' && (
                            <p className="text-sm">You were accepted. The next step is to confirm the agreement with the poster.</p>
                        )}
                        {conversation && (
                            <Button variant="outline" asChild>
                                <Link href={`/messages/${conversation.id}`}>
                                    {conversation.sendBlockedReason ? 'View conversation' : 'Message poster'}
                                </Link>
                            </Button>
                        )}
                        {conversation?.sendBlockedReason && <p className="text-sm text-muted-foreground">{conversation.sendBlockedReason}</p>}
                    </section>
                ) : (
                    canApply && (
                        <section id="my-decision" aria-labelledby="section-my-decision" className="space-y-4 rounded-xl border p-5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <h2 id="section-my-decision" className="text-lg font-semibold">4. My decision</h2>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Ask the poster about unclear terms or schedule fit, review your summary before applying, or decline. You can apply only once.
                                    </p>
                                </div>
                                <Button type="button" size="sm" variant="outline" onClick={handleAskPosterPrefill}>
                                    Ask poster
                                </Button>
                            </div>

                            <form onSubmit={handleFinalSubmit} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="message">Message to the poster</Label>
                                    <Textarea
                                        ref={messageRef}
                                        id="message"
                                        name="message"
                                        maxLength={messageMaxLength}
                                        value={applyForm.data.message}
                                        onChange={(event) => {
                                            applyForm.setData('message', event.target.value);
                                            setReviewNotice(null);
                                        }}
                                        required
                                        placeholder="Introduce yourself, ask about any “To be discussed” terms, or explain how this fits your schedule."
                                    />
                                    <p className="text-xs text-muted-foreground">Up to {messageMaxLength} characters. Submitting opens a private message thread with the poster.</p>
                                    <InputError message={applyForm.errors.message} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="proposed_amount">Suggested amount (optional)</Label>
                                    <Input
                                        id="proposed_amount"
                                        name="proposed_amount"
                                        type="number"
                                        min="1"
                                        max="1000000"
                                        step="0.01"
                                        value={applyForm.data.proposed_amount}
                                        onChange={(event) => applyForm.setData('proposed_amount', event.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">This is only a suggestion. The final amount is agreed later between you and the poster.</p>
                                    <InputError message={applyForm.errors.proposed_amount} />
                                </div>

                                {reviewNotice && (
                                    <div role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
                                        {reviewNotice}
                                    </div>
                                )}

                                {!showConfirmSummary ? (
                                    <div className="flex flex-wrap items-center gap-3 pt-1">
                                        <Button type="button" onClick={handleOpenSummary}>
                                            Review & apply
                                        </Button>
                                        <Button type="button" variant="outline" onClick={handleAskPosterPrefill}>
                                            Ask poster
                                        </Button>
                                        <Button variant="ghost" asChild>
                                            <Link href={browse.index()}>Decline (back to tasks)</Link>
                                        </Button>
                                    </div>
                                ) : (
                                    <div
                                        ref={summaryRef}
                                        aria-labelledby="check-before-apply-heading"
                                        className="space-y-4 rounded-xl border-2 border-primary/40 bg-muted/20 p-5"
                                    >
                                        <div>
                                            <h3 id="check-before-apply-heading" className="text-base font-semibold">Check before you apply</h3>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Nothing is sent until you confirm. Review these key terms one last time.
                                            </p>
                                        </div>

                                        <dl className="grid gap-3 rounded-lg border bg-background p-4 text-sm sm:grid-cols-2">
                                            <div className="sm:col-span-2">
                                                <dt className="text-xs text-muted-foreground">Tasks</dt>
                                                <dd className="mt-0.5 font-medium">{task.title}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-xs text-muted-foreground">Pay amount</dt>
                                                <dd className="mt-0.5 font-medium">
                                                    {isBudgetTbd ? <ToBeDiscussedBadge /> : `₱${formatAmount(task.budget)}`}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-xs text-muted-foreground">When paid (Pay timing)</dt>
                                                <dd className="mt-0.5 font-medium">
                                                    {isPayTimingTbd ? <ToBeDiscussedBadge /> : task.payTimingLabel}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-xs text-muted-foreground">Work hours</dt>
                                                <dd className="mt-0.5 font-medium">
                                                    {isScheduleTbd ? <ToBeDiscussedBadge /> : task.scheduleSummary}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-xs text-muted-foreground">Class fit</dt>
                                                <dd className="mt-1">
                                                    <ScheduleFitBadge status={scheduleFit.status} />
                                                </dd>
                                            </div>
                                            <div className="sm:col-span-2">
                                                <dt className="text-xs text-muted-foreground">Poster checklist</dt>
                                                <dd className="mt-0.5 font-medium">
                                                    {checklistCheckedCount} of 3 checked
                                                    {!applyForm.data.known_person_or_reviews_checked && ' (optional check 3 left unticked)'}
                                                </dd>
                                            </div>
                                        </dl>

                                        {missingTerms.length > 0 && (
                                            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
                                                <strong>Still to be discussed:</strong> {missingTerms.join(', ')}. Make sure you settle these clearly in chat and in the written agreement before starting work.
                                            </div>
                                        )}

                                        {scheduleFit.status === 'clashes' && (
                                            <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-950">
                                                <strong>Class schedule clash detected:</strong> Confirm with the poster whether hours can change before accepting an agreement.
                                            </div>
                                        )}

                                        <div className="space-y-1">
                                            <label className="flex items-start gap-2 text-sm">
                                                <input
                                                    id="work_details_confirmed"
                                                    name="work_details_confirmed"
                                                    type="checkbox"
                                                    checked={applyForm.data.work_details_confirmed}
                                                    onChange={(event) => applyForm.setData('work_details_confirmed', event.target.checked)}
                                                    required
                                                    className="mt-1"
                                                />
                                                <span>I have reviewed the offer terms, poster details, and my class fit.</span>
                                            </label>
                                            <InputError message={applyForm.errors.work_details_confirmed} />
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3">
                                            <Button type="submit" disabled={applyForm.processing || !applyForm.data.work_details_confirmed}>
                                                {applyForm.processing ? 'Submitting...' : 'Confirm & submit application'}
                                            </Button>
                                            <Button type="button" variant="outline" onClick={() => setShowConfirmSummary(false)}>
                                                Go back
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </form>
                        </section>
                    )
                )}

                <Link href={browse.index()} className="inline-block text-sm underline underline-offset-4">
                    Back to Browse Tasks
                </Link>
            </div>
        </>
    );
}
