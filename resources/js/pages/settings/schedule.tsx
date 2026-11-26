import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatTime12Hour } from '@/lib/format';
import { buildScheduleTimeOptions, type ClassBlock } from '@/lib/schedule-fit';

type Option = { value: string; label: string };

type Props = {
    studentClassSchedule?: ClassBlock[];
    daysOfWeek?: Option[];
    maxClassBlocks?: number;
    canSaveSchedule?: boolean;
    studentVerificationUrl?: string | null;
    status?: string | null;
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

const NATIVE_SELECT_CLASS =
    'focus-ring h-11 w-full rounded-md border border-input bg-field px-3 text-sm tabular-nums text-foreground shadow-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 md:h-9';

export default function SettingsClassSchedule({
    studentClassSchedule = [],
    daysOfWeek = FALLBACK_DAYS,
    maxClassBlocks = 25,
    canSaveSchedule = false,
    studentVerificationUrl = null,
    status = null,
}: Props) {
    const dayLabelMap = useMemo(
        () => Object.fromEntries(daysOfWeek.map((item) => [item.value, item.label])),
        [daysOfWeek],
    );

    const [classBlocks, setClassBlocks] = useState<ClassBlock[]>(studentClassSchedule);
    const [newBlockDay, setNewBlockDay] = useState(daysOfWeek[0]?.value ?? 'mon');
    const [newBlockStart, setNewBlockStart] = useState('08:00');
    const [newBlockEnd, setNewBlockEnd] = useState('12:00');
    const [newBlockLabel, setNewBlockLabel] = useState('');
    const [blockError, setBlockError] = useState<string | null>(null);
    const [savingSchedule, setSavingSchedule] = useState(false);
    const [scheduleDirty, setScheduleDirty] = useState(false);
    const [scheduleSavedNotice, setScheduleSavedNotice] = useState<string | null>(null);

    useEffect(() => {
        setClassBlocks(studentClassSchedule);
    }, [studentClassSchedule]);

    const timeOptions = useMemo(
        () =>
            buildScheduleTimeOptions([
                newBlockStart,
                newBlockEnd,
                ...classBlocks.flatMap((block) => [block.start_time, block.end_time]),
            ]),
        [newBlockStart, newBlockEnd, classBlocks],
    );

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
        setBlockError(null);
        setScheduleDirty(true);
        setScheduleSavedNotice(null);
    };

    const handleSaveClassSchedule = () => {
        setSavingSchedule(true);
        setBlockError(null);
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
                onError: (errors) => {
                    const firstError = Object.values(errors).find((value) => typeof value === 'string' && value.trim() !== '');
                    setBlockError(firstError ?? 'Check your class blocks and try saving again.');
                },
                onFinish: () => {
                    setSavingSchedule(false);
                },
            },
        );
    };

    return (
        <>
            <Head title="My class schedule" />

            <h1 className="sr-only">My class schedule</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="My Class Schedule"
                    description="Save your weekly class hours privately so TaskMate can check task schedule fit while you browse."
                />

                {!canSaveSchedule && (
                    <div
                        role="status"
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning-border bg-warning-bg p-4 text-sm text-warning-fg"
                    >
                        <div className="space-y-0.5">
                            <p className="font-semibold">Verification required to save your schedule</p>
                            <p className="text-xs">
                                Only verified CMU students can save class schedules to their account. You can still test fit live on any task page.
                            </p>
                        </div>
                        <Button asChild size="sm" variant="outline">
                            <Link href={studentVerificationUrl ?? '/verification/student'}>
                                Verify as CMU Student
                            </Link>
                        </Button>
                    </div>
                )}

                <div className="rounded-lg border border-border bg-muted/30 p-3.5 text-xs leading-relaxed text-muted-foreground">
                    Your saved weekly class blocks are strictly private to your student account—posters, other users, and administrators never see your schedule.
                </div>

                <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold tabular-nums text-foreground">
                            Saved weekly blocks ({classBlocks.length}/{maxClassBlocks})
                        </p>
                        {scheduleDirty && (
                            <span className="text-xs text-muted-foreground">
                                Unsaved changes
                            </span>
                        )}
                    </div>

                    {classBlocks.length > 0 ? (
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
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveClassBlock(index)}
                                        aria-label={`Remove ${dayLabelMap[block.day] ?? block.day} class block`}
                                        className="focus-ring inline-flex size-7 items-center justify-center rounded-full text-sm font-semibold text-muted-foreground transition-colors hover:bg-danger-bg hover:text-danger-fg"
                                    >
                                        ×
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                            No saved class blocks yet. Add a class block below, then save your schedule.
                        </p>
                    )}
                </div>

                <div className="space-y-4 border-t border-border pt-4">
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
                            <Label htmlFor="settings_class_start_time">Start time</Label>
                            <select
                                id="settings_class_start_time"
                                value={newBlockStart}
                                onChange={(event) => {
                                    setNewBlockStart(event.target.value);
                                    setBlockError(null);
                                }}
                                className={NATIVE_SELECT_CLASS}
                            >
                                {timeOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="settings_class_end_time">End time</Label>
                            <select
                                id="settings_class_end_time"
                                value={newBlockEnd}
                                onChange={(event) => {
                                    setNewBlockEnd(event.target.value);
                                    setBlockError(null);
                                }}
                                className={NATIVE_SELECT_CLASS}
                            >
                                {timeOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="settings_class_label">Label (optional)</Label>
                            <Input
                                id="settings_class_label"
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

                    <div className="flex flex-wrap items-center gap-3">
                        <Button type="button" variant="outline" onClick={handleAddClassBlock}>
                            Add class block
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSaveClassSchedule}
                            disabled={savingSchedule || !canSaveSchedule}
                        >
                            {savingSchedule ? 'Saving...' : 'Save class schedule'}
                        </Button>
                        {(scheduleSavedNotice || status) && (
                            <span role="status" className="text-sm font-medium text-success-fg">
                                {scheduleSavedNotice ?? status}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

SettingsClassSchedule.layout = {
    breadcrumbs: [
        {
            title: 'My Class Schedule',
            href: '/settings/schedule',
        },
    ],
};
