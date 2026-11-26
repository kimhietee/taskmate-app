import { PAYMENT_BOUNDARY_NOTICE } from '@/constants/notices';
import { useState } from 'react';
import { Form } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type Option = { value: string; label: string };
type ScheduleMode = 'fixed' | 'flexible' | 'tbd';
type TaskData = {
    title: string;
    category: string;
    workType?: string | null;
    description: string;
    budget: string | null;
    budgetToBeDiscussed?: boolean;
    payTiming?: string | null;
    payTimingNote?: string | null;
    scheduleDays?: string[];
    scheduleStartTime?: string | null;
    scheduleEndTime?: string | null;
    scheduleNote?: string | null;
    scheduleFlexible?: boolean;
    scheduleToBeDiscussed?: boolean;
    canHoursChange?: boolean | null;
    workModeValue: string;
    workplaceName: string | null;
    workplaceAddress: string | null;
    deadline: string | null;
};
type Props = {
    action: { action: string; method: 'post' | 'put' };
    options: {
        categories: Option[];
        workTypes?: Option[];
        workModes: Option[];
        workModesWithLocation?: string[];
        payTimings?: Option[];
        daysOfWeek?: Option[];
        guidelines: string[];
    };
    task: TaskData | null;
    resetWarning: boolean;
};

const NATIVE_SELECT_CLASS =
    'focus-ring h-11 w-full rounded-md border border-input bg-field px-3 text-sm text-foreground shadow-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 md:h-9';

export default function TaskForm({ action, options, task, resetWarning }: Props) {
    const [workMode, setWorkMode] = useState(task?.workModeValue ?? '');
    const [budgetToBeDiscussed, setBudgetToBeDiscussed] = useState(Boolean(task?.budgetToBeDiscussed));
    const initialScheduleMode: ScheduleMode = task?.scheduleFlexible
        ? 'flexible'
        : task?.scheduleToBeDiscussed
          ? 'tbd'
          : 'fixed';
    const [scheduleMode, setScheduleMode] = useState<ScheduleMode>(initialScheduleMode);
    const [selectedDays, setSelectedDays] = useState<string[]>(task?.scheduleDays ?? []);
    const hasWorkplace = options.workModesWithLocation?.includes(workMode) ?? false;
    const workModes = task?.workModeValue === 'hybrid'
        ? [...options.workModes, { value: 'hybrid', label: 'Hybrid (existing task)' }]
        : options.workModes;
    const workTypes = options.workTypes ?? [
        { value: 'one_time_gig', label: 'One-time gig / task' },
        { value: 'part_time', label: 'Short-term part-time' },
    ];
    const payTimings = options.payTimings ?? [];
    const daysOfWeek = options.daysOfWeek ?? [];

    const toggleDay = (day: string) => {
        setSelectedDays((prev) => (prev.includes(day) ? prev.filter((item) => item !== day) : [...prev, day]));
    };

    const canHoursChangeDefault = task?.canHoursChange === true ? '1' : task?.canHoursChange === false ? '0' : '';

    return (
        <Form {...action} className="task-form">
            {({ errors, processing }) => (
                <>
                    {resetWarning && (
                        <div
                            role="alert"
                            className="task-form-reset-warning"
                        >
                            Saving these changes will send this task back for review and clear the previous review note.
                        </div>
                    )}

                    {/* Section 1: Task basics */}
                    <section className="task-form-section task-form-section--basics">
                        <div>
                            <div className="task-form-section-heading">
                                <span
                                    aria-hidden="true"
                                    className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums text-foreground"
                                >
                                    1
                                </span>
                                <h2 className="text-lg font-semibold">Task basics</h2>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Tell students what the work is and what result you need.
                            </p>
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="title">Task title</Label>
                            <Input id="title" name="title" maxLength={150} defaultValue={task?.title} required />
                            <InputError message={errors.title} />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-1.5">
                                <Label htmlFor="category">Category</Label>
                                <select
                                    id="category"
                                    name="category"
                                    defaultValue={
                                        task?.category
                                            ? options.categories.find((option) => option.label === task.category)
                                                  ?.value ?? ''
                                            : ''
                                    }
                                    className={NATIVE_SELECT_CLASS}
                                    required
                                >
                                    <option value="" disabled>
                                        Select a category
                                    </option>
                                    {options.categories.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.category} />
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="work_type">Work type</Label>
                                <select
                                    id="work_type"
                                    name="work_type"
                                    defaultValue={task?.workType ?? 'one_time_gig'}
                                    className={NATIVE_SELECT_CLASS}
                                >
                                    {workTypes.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.work_type} />
                            </div>
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="description">What needs to be done?</Label>
                            <Textarea
                                id="description"
                                name="description"
                                maxLength={10000}
                                defaultValue={task?.description}
                                placeholder="Describe the work and what students should know before applying."
                                className="min-h-32"
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                A clear description helps students decide whether to apply.
                            </p>
                            <InputError message={errors.description} />
                        </div>
                    </section>

                    {/* Section 2: Pay */}
                    <section className="task-form-section task-form-section--pay">
                        <div>
                            <div className="task-form-section-heading">
                                <span
                                    aria-hidden="true"
                                    className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums text-foreground"
                                >
                                    2
                                </span>
                                <h2 className="text-lg font-semibold">Pay</h2>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Share pay amount and pay timing upfront, or mark a negotiable item as “To be discussed”
                                so students know what still needs to be agreed.
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid content-start gap-2">
                                <Label htmlFor="budget">Estimated budget (PHP)</Label>
                                <Input
                                    id="budget"
                                    name="budget"
                                    type="number"
                                    min="1"
                                    max="1000000"
                                    step="0.01"
                                    defaultValue={task?.budget ?? ''}
                                    disabled={budgetToBeDiscussed}
                                    required={!budgetToBeDiscussed}
                                    className="tabular-nums"
                                />
                                <input
                                    type="hidden"
                                    name="budget_to_be_discussed"
                                    value={budgetToBeDiscussed ? '1' : '0'}
                                />
                                <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-3 text-sm transition-colors hover:bg-muted/40">
                                    <input
                                        id="budget_to_be_discussed"
                                        type="checkbox"
                                        checked={budgetToBeDiscussed}
                                        onChange={(event) => setBudgetToBeDiscussed(event.target.checked)}
                                        className="focus-ring mt-0.5 size-5 shrink-0 rounded-[5px] border border-input bg-field accent-primary disabled:opacity-50"
                                    />
                                    <span className="text-foreground">Pay amount is to be discussed</span>
                                </label>
                                <InputError message={errors.budget} />
                            </div>

                            <div className="grid content-start gap-2">
                                <Label htmlFor="pay_timing">When is pay given? (Pay timing)</Label>
                                <select
                                    id="pay_timing"
                                    name="pay_timing"
                                    defaultValue={task?.payTiming ?? 'to_be_discussed'}
                                    className={NATIVE_SELECT_CLASS}
                                >
                                    {payTimings.length === 0 ? (
                                        <option value="to_be_discussed">To be discussed</option>
                                    ) : (
                                        payTimings.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))
                                    )}
                                </select>
                                <InputError message={errors.pay_timing} />

                                <div className="mt-1 grid gap-1.5">
                                    <Label htmlFor="pay_timing_note">Pay timing note (optional)</Label>
                                    <Input
                                        id="pay_timing_note"
                                        name="pay_timing_note"
                                        maxLength={255}
                                        defaultValue={task?.payTimingNote ?? ''}
                                        placeholder="e.g. Paid Saturdays in cash"
                                    />
                                    <InputError message={errors.pay_timing_note} />
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border border-border bg-muted/40 p-3.5 text-xs text-muted-foreground">
                            {PAYMENT_BOUNDARY_NOTICE}
                        </div>
                    </section>

                    {/* Section 3: Schedule */}
                    <section className="task-form-section task-form-section--schedule">
                        <div>
                            <div className="task-form-section-heading">
                                <span
                                    aria-hidden="true"
                                    className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums text-foreground"
                                >
                                    3
                                </span>
                                <h2 className="text-lg font-semibold">Work schedule / hours</h2>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Students compare these hours against their class schedule before applying.
                            </p>
                        </div>

                        <input type="hidden" name="schedule_flexible" value={scheduleMode === 'flexible' ? '1' : '0'} />
                        <input
                            type="hidden"
                            name="schedule_to_be_discussed"
                            value={scheduleMode === 'tbd' ? '1' : '0'}
                        />

                        <fieldset className="grid gap-2.5 sm:grid-cols-3">
                            <legend className="sr-only">Choose how work hours are set</legend>
                            <label
                                className={
                                    scheduleMode === 'fixed'
                                        ? 'flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg border-2 border-brand bg-info-bg/40 px-3.5 py-2 text-sm font-semibold text-foreground shadow-xs transition-colors md:min-h-9'
                                        : 'flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg border border-border bg-card px-3.5 py-2 text-sm text-foreground transition-colors hover:bg-muted/40 md:min-h-9'
                                }
                            >
                                <input
                                    type="radio"
                                    name="schedule_mode_ui"
                                    checked={scheduleMode === 'fixed'}
                                    onChange={() => setScheduleMode('fixed')}
                                    className="focus-ring size-4 shrink-0 accent-primary"
                                />
                                <span>Set weekly hours</span>
                            </label>

                            <label
                                className={
                                    scheduleMode === 'flexible'
                                        ? 'flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg border-2 border-brand bg-info-bg/40 px-3.5 py-2 text-sm font-semibold text-foreground shadow-xs transition-colors md:min-h-9'
                                        : 'flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg border border-border bg-card px-3.5 py-2 text-sm text-foreground transition-colors hover:bg-muted/40 md:min-h-9'
                                }
                            >
                                <input
                                    type="radio"
                                    name="schedule_mode_ui"
                                    checked={scheduleMode === 'flexible'}
                                    onChange={() => setScheduleMode('flexible')}
                                    className="focus-ring size-4 shrink-0 accent-primary"
                                />
                                <span>Flexible / self-paced before deadline</span>
                            </label>

                            <label
                                className={
                                    scheduleMode === 'tbd'
                                        ? 'flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg border-2 border-brand bg-info-bg/40 px-3.5 py-2 text-sm font-semibold text-foreground shadow-xs transition-colors md:min-h-9'
                                        : 'flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg border border-border bg-card px-3.5 py-2 text-sm text-foreground transition-colors hover:bg-muted/40 md:min-h-9'
                                }
                            >
                                <input
                                    type="radio"
                                    name="schedule_mode_ui"
                                    checked={scheduleMode === 'tbd'}
                                    onChange={() => setScheduleMode('tbd')}
                                    className="focus-ring size-4 shrink-0 accent-primary"
                                />
                                <span>Work hours are to be discussed</span>
                            </label>
                        </fieldset>

                        {scheduleMode === 'fixed' && (
                            <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
                                <fieldset className="space-y-2">
                                    <legend className="text-sm font-semibold text-foreground">Work days</legend>
                                    <div className="flex flex-wrap gap-2">
                                        {daysOfWeek.map((day) => {
                                            const checked = selectedDays.includes(day.value);
                                            return (
                                                <label
                                                    key={day.value}
                                                    className={
                                                        checked
                                                            ? 'inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-brand bg-info-bg px-3 text-xs font-semibold text-info-fg transition-colors md:min-h-9'
                                                            : 'inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-border bg-card px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted/40 md:min-h-9'
                                                    }
                                                >
                                                    <input
                                                        type="checkbox"
                                                        name="schedule_days[]"
                                                        value={day.value}
                                                        checked={checked}
                                                        onChange={() => toggleDay(day.value)}
                                                        className="focus-ring size-4 shrink-0 rounded-[4px] border border-input bg-field accent-primary"
                                                    />
                                                    <span>{day.label}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                    <InputError message={errors.schedule_days} />
                                </fieldset>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="schedule_start_time">Start time</Label>
                                        <Input
                                            id="schedule_start_time"
                                            name="schedule_start_time"
                                            type="time"
                                            defaultValue={task?.scheduleStartTime ?? ''}
                                            className="tabular-nums"
                                        />
                                        <InputError message={errors.schedule_start_time} />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="schedule_end_time">End time</Label>
                                        <Input
                                            id="schedule_end_time"
                                            name="schedule_end_time"
                                            type="time"
                                            defaultValue={task?.scheduleEndTime ?? ''}
                                            className="tabular-nums"
                                        />
                                        <InputError message={errors.schedule_end_time} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-1.5">
                                <Label htmlFor="can_hours_change">Can hours change?</Label>
                                <select
                                    id="can_hours_change"
                                    name="can_hours_change"
                                    defaultValue={canHoursChangeDefault}
                                    disabled={scheduleMode === 'flexible'}
                                    className={NATIVE_SELECT_CLASS}
                                >
                                    <option value="">Not specified</option>
                                    <option value="1">Yes — hours can adjust around classes</option>
                                    <option value="0">No — fixed schedule</option>
                                </select>
                                <InputError message={errors.can_hours_change} />
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="schedule_note">Schedule note (optional)</Label>
                                <Input
                                    id="schedule_note"
                                    name="schedule_note"
                                    maxLength={255}
                                    defaultValue={task?.scheduleNote ?? ''}
                                    placeholder="e.g. Flexible after 3:00 PM or complete before Friday"
                                />
                                <InputError message={errors.schedule_note} />
                            </div>
                        </div>
                    </section>

                    {/* Section 4: Location & deadline */}
                    <section className="task-form-section task-form-section--workplace">
                        <div className="task-form-section-heading">
                            <span
                                aria-hidden="true"
                                className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums text-foreground"
                            >
                                4
                            </span>
                            <h2 className="text-lg font-semibold">Work setup</h2>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-1.5">
                                <Label htmlFor="work_mode">Work mode</Label>
                                <select
                                    id="work_mode"
                                    name="work_mode"
                                    value={workMode}
                                    onChange={(event) => setWorkMode(event.target.value)}
                                    className={NATIVE_SELECT_CLASS}
                                    required
                                >
                                    <option value="" disabled>
                                        Select a work mode
                                    </option>
                                    {workModes.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.work_mode} />
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="deadline">Deadline (optional)</Label>
                                <Input
                                    id="deadline"
                                    name="deadline"
                                    type="date"
                                    min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
                                    defaultValue={task?.deadline ?? ''}
                                    className="tabular-nums"
                                />
                                <InputError message={errors.deadline} />
                            </div>
                        </div>

                        {hasWorkplace && (
                            <div className="task-form-workplace">
                                <p className="text-xs text-muted-foreground">
                                    Students see the place of work before applying. Enter a worksite, not a home
                                    address.
                                </p>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="workplace_name">Workplace name</Label>
                                        <Input
                                            id="workplace_name"
                                            name="workplace_name"
                                            defaultValue={task?.workplaceName ?? ''}
                                            required
                                        />
                                        <InputError message={errors.workplace_name} />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="workplace_address">Workplace address</Label>
                                        <Input
                                            id="workplace_address"
                                            name="workplace_address"
                                            defaultValue={task?.workplaceAddress ?? ''}
                                            required
                                        />
                                        <InputError message={errors.workplace_address} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Section 5: Confirm & submit */}
                    <section className="task-form-section task-form-section--guidelines">
                        <div className="task-form-section-heading">
                            <span
                                aria-hidden="true"
                                className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums text-foreground"
                            >
                                5
                            </span>
                            <h2 className="text-lg font-semibold">Platform rules</h2>
                        </div>

                        <div className="task-form-guidelines">
                            <h3 className="text-sm font-semibold text-foreground">Task guidelines</h3>
                            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
                                {options.guidelines.map((guideline) => (
                                    <li key={guideline}>{guideline}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="space-y-1.5">
                            <div className="task-form-confirm">
                                <input
                                    id="guidelines_confirmed"
                                    name="guidelines_confirmed"
                                    type="checkbox"
                                    value="1"
                                    required
                                    className="focus-ring mt-0.5 size-5 shrink-0 rounded-[5px] border border-input bg-field accent-primary disabled:opacity-50"
                                />
                                <Label htmlFor="guidelines_confirmed" className="cursor-pointer font-normal leading-snug">
                                    I confirm that this task follows the platform rules.
                                </Label>
                            </div>
                            <InputError message={errors.guidelines_confirmed} />
                        </div>
                    </section>

                    <div className="task-form-actions task-form-submit-bar">
                        <Button type="submit" className="task-form-submit w-full md:w-auto" disabled={processing}>
                            {processing ? 'Saving...' : task ? 'Save changes' : 'Submit task for review'}
                        </Button>
                    </div>
                </>
            )}
        </Form>
    );
}
