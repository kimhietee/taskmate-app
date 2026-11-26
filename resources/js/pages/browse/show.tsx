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
    workType?: string;
    workTypeLabel?: string;
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
    scheduleFlexible?: boolean;
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
    verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected' | 'more_info_requested';
    memberSince: string | null;
    profileUrl: string | null;
    ratingSummary: import('@/components/rating-summary').RatingSummaryData;
};
type Application = { status: string; statusLabel: string; appliedAt: string | null };
type Props = {
    task: Task;
    poster: Poster;
    application: Application | null;
    conversation?: { id: number; sendBlockedReason: string | null } | null;
    isVerifiedStudent?: boolean;
    studentVerificationUrl?: string | null;
    canSaveSchedule?: boolean;
    canApply?: boolean;
    limitedView?: boolean;
    currentTaskStatus?: string;
    status?: string | null;
    messageMaxLength: number;
    problemReport?: { action: string; types: Option[] } | null;
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
    isVerifiedStudent = true,
    studentVerificationUrl = null,
    canSaveSchedule = true,
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
    const [scheduleSavedNotice, setScheduleSavedNotice] = useState<string | null>(null);

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
    const isScheduleFlexible = Boolean(task.scheduleFlexible);
    const isScheduleTbd = !isScheduleFlexible && Boolean(task.scheduleToBeDiscussed || !task.scheduleSummary);

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
    const hasDecisionSection = Boolean(application || canApply || !isVerifiedStudent);

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
        setScheduleSavedNotice(null);
    };

    const handleRemoveClassBlock = (indexToRemove: number) => {
        setClassBlocks((prev) => prev.filter((_, idx) => idx !== indexToRemove));
        setScheduleDirty(true);
        setScheduleSavedNotice(null);
    };

    const handleSaveClassSchedule = () => {
        setSavingSchedule(true);
        setScheduleSavedNotice(null);
        router.put(
            '/my-class-schedule',
            { blocks: classBlocks },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setScheduleDirty(false);
                    setScheduleSavedNotice('Your class schedule was saved privately to your account.');
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
            <div className="page-wide space-y-5">
                {status && (
                    <div role="status" className="rounded-lg border border-info-border bg-info-bg px-4 py-3 text-sm text-info-fg">
                        {status}
                    </div>
                )}

                {limitedView && (
                    <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-foreground">
                        This task is currently {currentTaskStatus?.toLowerCase()}. You can review the task details and your application status.
                    </div>
                )}

                {!isVerifiedStudent && (
                    <div
                        role="status"
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning-border bg-warning-bg p-4 text-sm text-warning-fg"
                    >
                        <div>
                            <p className="font-semibold">Preview mode — Verify your CMU student status to apply</p>
                            <p className="mt-0.5 text-xs">
                                You can inspect all offer terms and test your class schedule fit live. Applying and messaging unlock right after verification.
                            </p>
                        </div>
                        <Link
                            href={studentVerificationUrl ?? '/verification/student'}
                            className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-semibold text-foreground shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground md:h-9"
                        >
                            Verify as CMU Student
                        </Link>
                    </div>
                )}

                <div className="space-y-1.5">
                    <Link
                        href={browse.index()}
                        className="focus-ring inline-flex items-center gap-1 rounded-sm text-sm font-semibold text-brand underline-offset-4 hover:underline"
                    >
                        ← Back to Browse Tasks
                    </Link>
                    <p className="text-sm text-muted-foreground">
                        {task.category}
                        {task.workTypeLabel ? ` · ${task.workTypeLabel}` : ''}
                    </p>
                    <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{task.title}</h1>
                    <p className="text-sm text-muted-foreground">
                        Review the offer terms, the poster, and your class schedule in order before you decide.
                    </p>
                </div>

                {/* Two-column desktop layout preserving strict 1 -> 2 -> 3 -> 4 DOM order */}
                <div
                    className={
                        hasDecisionSection
                            ? 'grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start'
                            : 'grid grid-cols-1 gap-6'
                    }
                >
                    {/* GROUP 1: THE OFFER */}
                    <section
                        aria-labelledby="section-the-offer"
                        className="space-y-5 rounded-xl border border-border bg-card p-5 shadow-xs lg:col-start-1"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                                <span
                                    aria-hidden="true"
                                    className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums text-foreground"
                                >
                                    1
                                </span>
                                <h2 id="section-the-offer" className="text-lg font-semibold">
                                    1. The offer
                                </h2>
                            </div>
                            {missingTerms.length > 0 && (
                                <ToBeDiscussedBadge
                                    label={`${missingTerms.length} term${missingTerms.length === 1 ? '' : 's'} to be discussed`}
                                />
                            )}
                        </div>

                        <div className="rounded-lg border border-border bg-muted/40 p-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <h3 className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                                        Pay amount
                                    </h3>
                                    <div className="mt-1">
                                        {isBudgetTbd ? (
                                            <ToBeDiscussedBadge />
                                        ) : (
                                            <p className="text-2xl font-semibold tabular-nums text-foreground">
                                                ₱{formatAmount(task.budget)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                                        When paid (Pay timing)
                                    </h3>
                                    <div className="mt-1">
                                        {isPayTimingTbd ? (
                                            <ToBeDiscussedBadge />
                                        ) : (
                                            <p className="text-lg font-semibold text-foreground">{task.payTimingLabel}</p>
                                        )}
                                    </div>
                                    {task.payTimingNote && (
                                        <p className="mt-1 text-xs text-muted-foreground">{task.payTimingNote}</p>
                                    )}
                                </div>
                            </div>
                            <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                                {PAYMENT_BOUNDARY_NOTICE}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground">Tasks</h3>
                                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground sm:text-base">
                                    {task.description}
                                </p>
                                {task.requiredActivities && (
                                    <div className="mt-3">
                                        <p className="text-xs font-semibold text-muted-foreground">Main activities</p>
                                        <p className="mt-0.5 whitespace-pre-wrap text-sm text-foreground">
                                            {task.requiredActivities}
                                        </p>
                                    </div>
                                )}
                                {task.deliverables && (
                                    <div className="mt-3">
                                        <p className="text-xs font-semibold text-muted-foreground">Expected result</p>
                                        <p className="mt-0.5 whitespace-pre-wrap text-sm text-foreground">
                                            {task.deliverables}
                                        </p>
                                    </div>
                                )}
                                {task.skillRequirements && (
                                    <p className="mt-2 text-sm text-foreground">
                                        <strong>Skills:</strong> {task.skillRequirements}
                                    </p>
                                )}
                                {task.estimatedDurationHours && (
                                    <p className="mt-1 text-sm tabular-nums text-foreground">
                                        <strong>Estimated duration:</strong> {task.estimatedDurationHours} hours
                                    </p>
                                )}
                            </div>

                            <div className="border-t border-border pt-4">
                                <h3 className="text-sm font-semibold text-muted-foreground">Hours</h3>
                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                    {isScheduleTbd ? (
                                        <ToBeDiscussedBadge />
                                    ) : (
                                        <p className="font-semibold tabular-nums text-foreground">
                                            {task.scheduleSummary}
                                        </p>
                                    )}
                                    <span className="text-sm text-muted-foreground">
                                        · Can hours change: {formatHoursFlexibility(task.canHoursChange)}
                                    </span>
                                </div>
                                {task.scheduleNote && (
                                    <p className="mt-1 text-sm text-muted-foreground">{task.scheduleNote}</p>
                                )}
                                <p className="mt-1 text-sm tabular-nums text-muted-foreground">
                                    Deadline: {task.deadline ? formatDate(task.deadline) : 'No deadline listed'}
                                </p>
                            </div>

                            <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
                                <div>
                                    <h3 className="text-sm font-semibold text-muted-foreground">Location</h3>
                                    <p className="mt-1 font-semibold text-foreground">{task.workMode}</p>
                                    {(task.workplaceName || task.workplaceAddress) && (
                                        <p className="mt-1 text-sm text-foreground">
                                            <strong>Workplace:</strong>{' '}
                                            {[task.workplaceName, task.workplaceAddress].filter(Boolean).join(' · ')}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-muted-foreground">Contact person</h3>
                                    <p className="mt-1 font-semibold text-foreground">
                                        {poster.profileUrl ? (
                                            <Link
                                                href={poster.profileUrl}
                                                className="focus-ring rounded-sm text-brand underline-offset-4 hover:underline"
                                            >
                                                {poster.displayName}
                                            </Link>
                                        ) : (
                                            <span>{poster.displayName}</span>
                                        )}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Private in-app messaging opens once you submit your application.
                                    </p>
                                </div>
                            </div>

                            {missingTerms.length > 0 && (
                                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning-border bg-warning-bg p-3.5 text-sm text-warning-fg">
                                    <p>
                                        <strong>Missing terms:</strong> {missingTerms.join(', ')}{' '}
                                        {missingTerms.length === 1 ? 'is' : 'are'} marked <em>To be discussed</em>. Ask
                                        the poster before locking an agreement.
                                    </p>
                                    {canApply && !application && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={handleAskPosterPrefill}
                                        >
                                            Ask poster about missing terms
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* GROUP 2: THE POSTER */}
                    <section
                        aria-labelledby="section-the-poster"
                        className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-xs lg:col-start-1"
                    >
                        <div className="flex items-center gap-2.5">
                            <span
                                aria-hidden="true"
                                className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums text-foreground"
                            >
                                2
                            </span>
                            <h2 id="section-the-poster" className="text-lg font-semibold">
                                2. The poster
                            </h2>
                        </div>

                        <div className="space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <p className="text-base font-semibold text-foreground">
                                        {poster.profileUrl ? (
                                            <Link
                                                href={poster.profileUrl}
                                                className="focus-ring rounded-sm text-brand underline-offset-4 hover:underline"
                                            >
                                                {poster.displayName}
                                            </Link>
                                        ) : (
                                            <span>{poster.displayName}</span>
                                        )}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {poster.accountType}
                                        {poster.affiliation ? ` · ${poster.affiliation}` : ''}
                                    </p>
                                </div>
                                <VerificationStatusBadge status={poster.verificationStatus} />
                            </div>
                            <p className="text-xs tabular-nums text-muted-foreground">
                                Member since {poster.memberSince ? formatDate(poster.memberSince) : '—'}
                            </p>
                            <RatingSummary summary={poster.ratingSummary} />
                        </div>

                        <div className="rounded-lg border border-warning-border bg-warning-bg p-3.5 text-sm text-warning-fg">
                            {STUDENT_TASK_SAFETY_NOTICE}
                        </div>

                        {offPlatformWarning && (
                            <div className="rounded-lg border border-warning-border bg-warning-bg p-3.5 text-sm text-warning-fg">
                                This post contains a request to move outside TaskMate or skip its steps. Be careful,
                                keep agreements and communications on record, and report anything that makes you
                                uncomfortable.
                            </div>
                        )}

                        {canApply && !application && (
                            <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <h3 className="text-sm font-semibold text-foreground">
                                        Pre-acceptance checklist (3 quick checks)
                                    </h3>
                                    <span className="rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-semibold tabular-nums text-foreground">
                                        {checklistCheckedCount} of 3 checked
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Complete checks 1 and 2 before applying. Check 3 is optional if you do not
                                    personally know the poster.
                                </p>
                                <div className="space-y-2.5 text-sm">
                                    <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-3 text-sm transition-colors hover:bg-muted/40">
                                        <input
                                            id="poster_identity_checked"
                                            name="poster_identity_checked"
                                            type="checkbox"
                                            checked={applyForm.data.poster_identity_checked}
                                            onChange={(event) => {
                                                applyForm.setData('poster_identity_checked', event.target.checked);
                                                setReviewNotice(null);
                                            }}
                                            className="focus-ring mt-0.5 size-5 shrink-0 rounded-[5px] border border-input bg-field accent-primary disabled:opacity-50"
                                        />
                                        <span className="space-y-0.5">
                                            <span className="flex flex-wrap items-center gap-1.5">
                                                <strong className="text-foreground">
                                                    1. Poster name and profile checked
                                                </strong>
                                                <span className="rounded-full border border-warning-border bg-warning-bg px-2 py-0.5 text-xs font-semibold text-warning-fg">
                                                    (required)
                                                </span>
                                            </span>
                                            <span className="block text-muted-foreground">
                                                I checked who posted this offer and inspected their profile and
                                                verification badge.
                                            </span>
                                        </span>
                                    </label>
                                    <InputError message={applyForm.errors.poster_identity_checked} />

                                    <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-3 text-sm transition-colors hover:bg-muted/40">
                                        <input
                                            id="no_upfront_fee_checked"
                                            name="no_upfront_fee_checked"
                                            type="checkbox"
                                            checked={applyForm.data.no_upfront_fee_checked}
                                            onChange={(event) => {
                                                applyForm.setData('no_upfront_fee_checked', event.target.checked);
                                                setReviewNotice(null);
                                            }}
                                            className="focus-ring mt-0.5 size-5 shrink-0 rounded-[5px] border border-input bg-field accent-primary disabled:opacity-50"
                                        />
                                        <span className="space-y-0.5">
                                            <span className="flex flex-wrap items-center gap-1.5">
                                                <strong className="text-foreground">
                                                    2. No upfront payment or fee asked
                                                </strong>
                                                <span className="rounded-full border border-warning-border bg-warning-bg px-2 py-0.5 text-xs font-semibold text-warning-fg">
                                                    (required)
                                                </span>
                                            </span>
                                            <span className="block text-muted-foreground">
                                                This offer does not ask me to pay any upfront fee, deposit, or
                                                registration charge.
                                            </span>
                                        </span>
                                    </label>
                                    <InputError message={applyForm.errors.no_upfront_fee_checked} />

                                    <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-3 text-sm transition-colors hover:bg-muted/40">
                                        <input
                                            id="known_person_or_reviews_checked"
                                            name="known_person_or_reviews_checked"
                                            type="checkbox"
                                            checked={applyForm.data.known_person_or_reviews_checked}
                                            onChange={(event) =>
                                                applyForm.setData(
                                                    'known_person_or_reviews_checked',
                                                    event.target.checked,
                                                )
                                            }
                                            className="focus-ring mt-0.5 size-5 shrink-0 rounded-[5px] border border-input bg-field accent-primary disabled:opacity-50"
                                        />
                                        <span className="space-y-0.5">
                                            <span className="flex flex-wrap items-center gap-1.5">
                                                <strong className="text-foreground">
                                                    3. Known person can confirm, or I checked reviews/profile
                                                </strong>
                                                <span className="rounded-full border border-neutral-border bg-neutral-bg px-2 py-0.5 text-xs font-semibold text-neutral-fg">
                                                    (optional)
                                                </span>
                                            </span>
                                            <span className="block text-muted-foreground">
                                                Someone I trust knows this poster, or I reviewed their past ratings and
                                                profile.
                                            </span>
                                        </span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {problemReport && <ProblemReportForm action={problemReport.action} types={problemReport.types} />}
                    </section>

                    {/* GROUP 3: MY CLASSES */}
                    <section
                        aria-labelledby="section-my-classes"
                        className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-xs lg:col-start-1"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                                <span
                                    aria-hidden="true"
                                    className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums text-foreground"
                                >
                                    3
                                </span>
                                <h2 id="section-my-classes" className="text-lg font-semibold">
                                    3. My classes
                                </h2>
                            </div>
                            <ScheduleFitBadge status={scheduleFit.status} />
                        </div>

                        <div className="grid gap-3 rounded-lg border border-border bg-muted/40 p-4 sm:grid-cols-2">
                            <div>
                                <p className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                                    Offered work hours
                                </p>
                                <div className="mt-1">
                                    {isScheduleTbd ? (
                                        <ToBeDiscussedBadge />
                                    ) : (
                                        <p className="font-semibold tabular-nums text-foreground">
                                            {task.scheduleSummary}
                                        </p>
                                    )}
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">{scheduleFit.negotiabilityNote}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                                    Schedule check result
                                </p>
                                <p className="mt-1 text-sm text-foreground">{scheduleFit.reason}</p>
                            </div>
                        </div>

                        {scheduleFit.conflicts.length > 0 && (
                            <div className="space-y-2 rounded-lg border border-danger-border bg-danger-bg p-4 text-sm text-danger-fg">
                                <p className="font-semibold">
                                    Conflicting class block{scheduleFit.conflicts.length === 1 ? '' : 's'}:
                                </p>
                                <ul className="list-disc space-y-1 pl-5 tabular-nums">
                                    {scheduleFit.conflicts.map((conflict, idx) => (
                                        <li key={`${conflict.day}-${idx}`}>
                                            {conflict.dayLabel} {conflict.blockRange}
                                            {conflict.label ? ` (${conflict.label})` : ''} overlaps with work hours{' '}
                                            {conflict.taskRange}
                                        </li>
                                    ))}
                                </ul>
                                {canApply && !application && (
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={handleAskPosterPrefill}
                                        className="mt-2"
                                    >
                                        Ask poster to adjust hours
                                    </Button>
                                )}
                            </div>
                        )}

                        <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <h3 className="text-sm font-semibold tabular-nums text-foreground">
                                        My saved weekly class schedule ({classBlocks.length})
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        Saved privately to your account only—posters and other users never see your
                                        class schedule.
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    aria-expanded={scheduleEditorOpen}
                                    onClick={() => setScheduleEditorOpen((open) => !open)}
                                >
                                    {scheduleEditorOpen ? 'Done editing' : 'Edit / save schedule'}
                                </Button>
                            </div>

                            {classBlocks.length > 0 && (
                                <ul className="flex flex-wrap gap-2">
                                    {classBlocks.map((block, index) => (
                                        <li
                                            key={`${block.day}-${block.start_time}-${block.end_time}-${index}`}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs text-foreground shadow-xs"
                                        >
                                            <span className="tabular-nums">
                                                <strong>{dayLabelMap[block.day] ?? block.day}</strong>{' '}
                                                {formatTime12Hour(block.start_time)}–{formatTime12Hour(block.end_time)}
                                                {block.label ? ` · ${block.label}` : ''}
                                            </span>
                                            {scheduleEditorOpen && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveClassBlock(index)}
                                                    aria-label={`Remove ${dayLabelMap[block.day] ?? block.day} class block`}
                                                    className="focus-ring inline-flex size-7 items-center justify-center rounded-full text-sm font-semibold text-muted-foreground transition-colors hover:bg-danger-bg hover:text-danger-fg"
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {scheduleEditorOpen && (
                                <div className="space-y-3 border-t border-border pt-3">
                                    <div className="space-y-1.5">
                                        <span className="text-sm font-semibold text-foreground">Class day</span>
                                        <div role="group" aria-label="Class day" className="flex flex-wrap gap-1.5">
                                            {daysOfWeek.map((day) => {
                                                const selected = newBlockDay === day.value;
                                                return (
                                                    <button
                                                        key={day.value}
                                                        type="button"
                                                        aria-pressed={selected}
                                                        onClick={() => setNewBlockDay(day.value)}
                                                        className={
                                                            selected
                                                                ? 'focus-ring min-h-11 rounded-md border border-brand bg-info-bg px-3 text-xs font-semibold text-info-fg transition-colors md:min-h-9'
                                                                : 'focus-ring min-h-11 rounded-md border border-border bg-card px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted/40 md:min-h-9'
                                                        }
                                                    >
                                                        {day.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-3">
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="class_start_time">Start time</Label>
                                            <Input
                                                id="class_start_time"
                                                type="time"
                                                value={newBlockStart}
                                                onChange={(event) => setNewBlockStart(event.target.value)}
                                                className="tabular-nums"
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="class_end_time">End time</Label>
                                            <Input
                                                id="class_end_time"
                                                type="time"
                                                value={newBlockEnd}
                                                onChange={(event) => setNewBlockEnd(event.target.value)}
                                                className="tabular-nums"
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="class_label">Label (optional)</Label>
                                            <Input
                                                id="class_label"
                                                maxLength={80}
                                                placeholder="e.g. IT57 Lecture"
                                                value={newBlockLabel}
                                                onChange={(event) => setNewBlockLabel(event.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {blockError && (
                                        <p role="alert" className="text-xs font-semibold text-destructive-foreground">
                                            {blockError}
                                        </p>
                                    )}

                                    <div className="flex flex-wrap items-center gap-2">
                                        <Button type="button" size="sm" variant="outline" onClick={handleAddClassBlock}>
                                            Add class block
                                        </Button>
                                        {canSaveSchedule ? (
                                            <>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="default"
                                                    onClick={handleSaveClassSchedule}
                                                    disabled={savingSchedule}
                                                >
                                                    {savingSchedule
                                                        ? 'Saving...'
                                                        : scheduleDirty
                                                          ? 'Save class schedule'
                                                          : 'Save schedule'}
                                                </Button>
                                                {scheduleDirty && (
                                                    <span className="text-xs text-muted-foreground">
                                                        Unsaved changes (fit check updates live above).
                                                    </span>
                                                )}
                                                {scheduleSavedNotice && (
                                                    <span
                                                        role="status"
                                                        className="text-xs font-semibold text-success-fg"
                                                    >
                                                        {scheduleSavedNotice}
                                                    </span>
                                                )}
                                            </>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">
                                                Your schedule stays private. Verify your student account to save it.
                                                {studentVerificationUrl && (
                                                    <> <Link className="font-semibold text-primary underline underline-offset-4" href={studentVerificationUrl}>Verify account</Link></>
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* GROUP 4: MY DECISION */}
                    {application ? (
                        <section
                            id="my-decision"
                            aria-labelledby="section-my-decision"
                            className="scroll-mt-[calc(var(--banner-h,0px)+4.5rem)] space-y-3 rounded-xl border border-border bg-card p-5 shadow-xs lg:sticky lg:top-[calc(var(--banner-h,0px)+5rem)] lg:col-start-2 lg:row-start-1 lg:row-span-3"
                        >
                            <div className="flex items-center gap-2.5">
                                <span
                                    aria-hidden="true"
                                    className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums text-foreground"
                                >
                                    4
                                </span>
                                <h2 id="section-my-decision" className="text-lg font-semibold">
                                    4. My decision — Application submitted
                                </h2>
                            </div>
                            <ApplicationStatusBadge status={application.status} label={application.statusLabel} />
                            {application.status === 'accepted' && (
                                <p className="text-sm text-foreground">
                                    You were accepted. The next step is to confirm the agreement with the poster.
                                </p>
                            )}
                            {conversation && (
                                <Button variant="outline" asChild>
                                    <Link href={`/messages/${conversation.id}`}>
                                        {conversation.sendBlockedReason ? 'View conversation' : 'Message poster'}
                                    </Link>
                                </Button>
                            )}
                            {conversation?.sendBlockedReason && (
                                <p className="text-sm text-muted-foreground">{conversation.sendBlockedReason}</p>
                            )}
                        </section>
                    ) : canApply ? (
                        <section
                            id="my-decision"
                            aria-labelledby="section-my-decision"
                            className="scroll-mt-[calc(var(--banner-h,0px)+4.5rem)] space-y-4 rounded-xl border border-border bg-card p-5 shadow-xs lg:sticky lg:top-[calc(var(--banner-h,0px)+5rem)] lg:col-start-2 lg:row-start-1 lg:row-span-3"
                        >
                            <div>
                                <div className="flex items-center gap-2.5">
                                    <span
                                        aria-hidden="true"
                                        className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums text-foreground"
                                    >
                                        4
                                    </span>
                                    <h2 id="section-my-decision" className="text-lg font-semibold">
                                        4. My decision
                                    </h2>
                                </div>
                                <p className="mt-1.5 text-sm text-muted-foreground">
                                    Ask the poster about unclear terms or schedule fit, review your summary before
                                    applying, or decline. You can apply only once.
                                </p>
                            </div>

                            <form onSubmit={handleFinalSubmit} className="space-y-4">
                                <div className="grid gap-1.5">
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
                                    <p className="text-xs tabular-nums text-muted-foreground">
                                        Up to {messageMaxLength} characters. Submitting opens a private message thread
                                        with the poster.
                                    </p>
                                    <InputError message={applyForm.errors.message} />
                                </div>

                                <div className="grid gap-1.5">
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
                                        className="tabular-nums"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        This is only a suggestion. The final amount is agreed later between you and the
                                        poster.
                                    </p>
                                    <InputError message={applyForm.errors.proposed_amount} />
                                </div>

                                {reviewNotice && (
                                    <div
                                        role="alert"
                                        className="rounded-lg border border-warning-border bg-warning-bg p-3 text-sm text-warning-fg"
                                    >
                                        {reviewNotice}
                                    </div>
                                )}

                                {!showConfirmSummary ? (
                                    <div className="flex flex-col gap-2 pt-1">
                                        <Button type="button" className="w-full" onClick={handleOpenSummary}>
                                            Review & apply
                                        </Button>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="flex-1"
                                                onClick={handleAskPosterPrefill}
                                            >
                                                Ask poster
                                            </Button>
                                            <Button variant="ghost" className="flex-1" asChild>
                                                <Link href={browse.index()}>Decline (back to tasks)</Link>
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        ref={summaryRef}
                                        aria-labelledby="check-before-apply-heading"
                                        className="space-y-4 rounded-xl border-2 border-brand/50 bg-muted/30 p-4"
                                    >
                                        <div>
                                            <h3 id="check-before-apply-heading" className="text-base font-semibold">
                                                Check before you apply
                                            </h3>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Nothing is sent until you confirm. Review these key terms one last time.
                                            </p>
                                        </div>

                                        <dl className="grid gap-3 rounded-lg border border-border bg-card p-4 text-sm sm:grid-cols-2">
                                            <div className="sm:col-span-2">
                                                <dt className="text-xs text-muted-foreground">Tasks</dt>
                                                <dd className="mt-0.5 font-semibold text-foreground">{task.title}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-xs text-muted-foreground">Pay amount</dt>
                                                <dd className="mt-0.5 font-semibold tabular-nums text-foreground">
                                                    {isBudgetTbd ? (
                                                        <ToBeDiscussedBadge />
                                                    ) : (
                                                        `₱${formatAmount(task.budget)}`
                                                    )}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-xs text-muted-foreground">
                                                    When paid (Pay timing)
                                                </dt>
                                                <dd className="mt-0.5 font-semibold text-foreground">
                                                    {isPayTimingTbd ? <ToBeDiscussedBadge /> : task.payTimingLabel}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-xs text-muted-foreground">Work hours</dt>
                                                <dd className="mt-0.5 font-semibold tabular-nums text-foreground">
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
                                                <dd className="mt-0.5 font-semibold tabular-nums text-foreground">
                                                    {checklistCheckedCount} of 3 checked
                                                    {!applyForm.data.known_person_or_reviews_checked &&
                                                        ' (optional check 3 left unticked)'}
                                                </dd>
                                            </div>
                                        </dl>

                                        {missingTerms.length > 0 && (
                                            <div className="rounded-lg border border-warning-border bg-warning-bg p-3 text-sm text-warning-fg">
                                                <strong>Still to be discussed:</strong> {missingTerms.join(', ')}. Make
                                                sure you settle these clearly in chat and in the written agreement
                                                before starting work.
                                            </div>
                                        )}

                                        {scheduleFit.status === 'clashes' && (
                                            <div className="rounded-lg border border-danger-border bg-danger-bg p-3 text-sm text-danger-fg">
                                                <strong>Class schedule clash detected:</strong> Confirm with the poster
                                                whether hours can change before accepting an agreement.
                                            </div>
                                        )}

                                        <div className="space-y-1.5">
                                            <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-3 text-sm transition-colors hover:bg-muted/40">
                                                <input
                                                    id="work_details_confirmed"
                                                    name="work_details_confirmed"
                                                    type="checkbox"
                                                    checked={applyForm.data.work_details_confirmed}
                                                    onChange={(event) =>
                                                        applyForm.setData(
                                                            'work_details_confirmed',
                                                            event.target.checked,
                                                        )
                                                    }
                                                    required
                                                    className="focus-ring mt-0.5 size-5 shrink-0 rounded-[5px] border border-input bg-field accent-primary disabled:opacity-50"
                                                />
                                                <span className="text-foreground">
                                                    I have reviewed the offer terms, poster details, and my class fit.
                                                </span>
                                            </label>
                                            <InputError message={applyForm.errors.work_details_confirmed} />
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <Button
                                                type="submit"
                                                className="w-full"
                                                disabled={applyForm.processing || !applyForm.data.work_details_confirmed}
                                            >
                                                {applyForm.processing
                                                    ? 'Submitting...'
                                                    : 'Confirm & submit application'}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="w-full"
                                                onClick={() => setShowConfirmSummary(false)}
                                            >
                                                Go back
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </form>
                        </section>
                    ) : !isVerifiedStudent ? (
                        <section
                            id="my-decision"
                            aria-labelledby="section-my-decision"
                            className="scroll-mt-[calc(var(--banner-h,0px)+4.5rem)] space-y-3 rounded-xl border border-brand/40 bg-info-bg/30 p-5 shadow-xs lg:sticky lg:top-[calc(var(--banner-h,0px)+5rem)] lg:col-start-2 lg:row-start-1 lg:row-span-3"
                        >
                            <div className="flex items-center gap-2.5">
                                <span
                                    aria-hidden="true"
                                    className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-card text-xs font-semibold tabular-nums text-foreground"
                                >
                                    4
                                </span>
                                <h2 id="section-my-decision" className="text-lg font-semibold">
                                    4. My decision — Verify as a CMU Student to apply
                                </h2>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Only verified CMU students can apply to tasks and start private task conversations.
                                Verify instantly with a 6-digit code sent to your CMU email, or submit your Student ID
                                number and college/program for administrator review.
                            </p>
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                                <Button asChild>
                                    <Link href={studentVerificationUrl ?? '/verification/student'}>
                                        Verify as CMU Student
                                    </Link>
                                </Button>
                                <Button variant="ghost" asChild>
                                    <Link href={browse.index()}>Back to Browse Tasks</Link>
                                </Button>
                            </div>
                        </section>
                    ) : null}
                </div>

                {/* Mobile sticky bottom action bar */}
                {canApply && !application && (
                    <div className="sticky bottom-0 z-30 -mx-4 border-t border-border bg-card/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-lg backdrop-blur-xs md:-mx-6 md:px-6 lg:hidden">
                        <div className="mx-auto flex max-w-lg items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={handleAskPosterPrefill}
                            >
                                Ask poster
                            </Button>
                            <Button
                                type="button"
                                className="flex-1"
                                onClick={() =>
                                    document
                                        .getElementById('my-decision')
                                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                }
                            >
                                Review & apply
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
