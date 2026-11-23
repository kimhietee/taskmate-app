import { PAYMENT_BOUNDARY_NOTICE } from '@/constants/notices';
import { useState } from 'react';
import { Form } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type Option = { value: string; label: string };
type TaskData = {
    title: string;
    category: string;
    description: string;
    budget: string | null;
    budgetToBeDiscussed?: boolean;
    payTiming?: string | null;
    payTimingNote?: string | null;
    scheduleDays?: string[];
    scheduleStartTime?: string | null;
    scheduleEndTime?: string | null;
    scheduleNote?: string | null;
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
        workModes: Option[];
        payTimings?: Option[];
        daysOfWeek?: Option[];
        guidelines: string[];
    };
    task: TaskData | null;
    resetWarning: boolean;
};

export default function TaskForm({ action, options, task, resetWarning }: Props) {
    const [workMode, setWorkMode] = useState(task?.workModeValue ?? '');
    const [budgetToBeDiscussed, setBudgetToBeDiscussed] = useState(Boolean(task?.budgetToBeDiscussed));
    const [scheduleToBeDiscussed, setScheduleToBeDiscussed] = useState(Boolean(task?.scheduleToBeDiscussed));
    const [selectedDays, setSelectedDays] = useState<string[]>(task?.scheduleDays ?? []);
    const hasWorkplace = workMode === 'onsite' || workMode === 'hybrid';
    const payTimings = options.payTimings ?? [];
    const daysOfWeek = options.daysOfWeek ?? [];

    const toggleDay = (day: string) => {
        setSelectedDays((prev) => (prev.includes(day) ? prev.filter((item) => item !== day) : [...prev, day]));
    };

    const canHoursChangeDefault = task?.canHoursChange === true ? '1' : task?.canHoursChange === false ? '0' : '';

    return (
        <Form {...action} className="space-y-5">
            {({ errors, processing }) => (
                <>
                    {resetWarning && (
                        <div role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
                            Saving these changes will send this task back for review and clear the previous review note.
                        </div>
                    )}

                    <section className="space-y-4 rounded-xl border p-5">
                        <div>
                            <h2 className="text-lg font-semibold">Task basics</h2>
                            <p className="mt-1 text-sm text-muted-foreground">Tell students what the work is and what result you need.</p>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="title">Task title</Label>
                            <Input id="title" name="title" maxLength={150} defaultValue={task?.title} required />
                            <InputError message={errors.title} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="category">Category</Label>
                            <select
                                id="category"
                                name="category"
                                defaultValue={task?.category ? options.categories.find((option) => option.label === task.category)?.value ?? '' : ''}
                                className="h-10 rounded-md border bg-background px-3 text-sm"
                                required
                            >
                                <option value="" disabled>Select a category</option>
                                {options.categories.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                            <InputError message={errors.category} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">What needs to be done?</Label>
                            <Textarea
                                id="description"
                                name="description"
                                maxLength={10000}
                                defaultValue={task?.description}
                                placeholder="Describe the work and what students should know before applying."
                                required
                            />
                            <p className="text-xs text-muted-foreground">A clear description helps students decide whether to apply.</p>
                            <InputError message={errors.description} />
                        </div>
                    </section>

                    <section className="space-y-4 rounded-xl border p-5">
                        <div>
                            <h2 className="text-lg font-semibold">Pay and schedule</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Share pay amount, pay timing, and work hours upfront—or mark a negotiable item as “To be discussed” so students know what still needs to be agreed.
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
                                />
                                <input type="hidden" name="budget_to_be_discussed" value={budgetToBeDiscussed ? '1' : '0'} />
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        id="budget_to_be_discussed"
                                        type="checkbox"
                                        checked={budgetToBeDiscussed}
                                        onChange={(event) => setBudgetToBeDiscussed(event.target.checked)}
                                    />
                                    <span>Pay amount is to be discussed</span>
                                </label>
                                <InputError message={errors.budget} />
                            </div>

                            <div className="grid content-start gap-2">
                                <Label htmlFor="pay_timing">When is pay given? (Pay timing)</Label>
                                <select
                                    id="pay_timing"
                                    name="pay_timing"
                                    defaultValue={task?.payTiming ?? 'to_be_discussed'}
                                    className="h-10 rounded-md border bg-background px-3 text-sm"
                                >
                                    {payTimings.length === 0 ? (
                                        <option value="to_be_discussed">To be discussed</option>
                                    ) : (
                                        payTimings.map((option) => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))
                                    )}
                                </select>
                                <Input
                                    id="pay_timing_note"
                                    name="pay_timing_note"
                                    maxLength={255}
                                    defaultValue={task?.payTimingNote ?? ''}
                                    placeholder="Optional note (e.g. Paid Saturdays in cash)"
                                />
                                <InputError message={errors.pay_timing} />
                                <InputError message={errors.pay_timing_note} />
                            </div>
                        </div>

                        <p className="text-sm text-muted-foreground">{PAYMENT_BOUNDARY_NOTICE}</p>

                        <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <h3 className="text-sm font-semibold">Work schedule / hours</h3>
                                    <p className="text-xs text-muted-foreground">Students compare these hours against their class schedule before applying.</p>
                                </div>
                                <input type="hidden" name="schedule_to_be_discussed" value={scheduleToBeDiscussed ? '1' : '0'} />
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        id="schedule_to_be_discussed"
                                        type="checkbox"
                                        checked={scheduleToBeDiscussed}
                                        onChange={(event) => setScheduleToBeDiscussed(event.target.checked)}
                                    />
                                    <span>Work hours are to be discussed</span>
                                </label>
                            </div>

                            {!scheduleToBeDiscussed && (
                                <div className="space-y-3">
                                    <fieldset className="space-y-2">
                                        <legend className="text-sm font-medium">Work days</legend>
                                        <div className="flex flex-wrap gap-2">
                                            {daysOfWeek.map((day) => {
                                                const checked = selectedDays.includes(day.value);
                                                return (
                                                    <label
                                                        key={day.value}
                                                        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm ${checked ? 'border-primary bg-primary/10 font-medium' : 'bg-background'}`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            name="schedule_days[]"
                                                            value={day.value}
                                                            checked={checked}
                                                            onChange={() => toggleDay(day.value)}
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
                                            />
                                            <InputError message={errors.schedule_end_time} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="can_hours_change">Can hours change?</Label>
                                    <select
                                        id="can_hours_change"
                                        name="can_hours_change"
                                        defaultValue={canHoursChangeDefault}
                                        className="h-10 rounded-md border bg-background px-3 text-sm"
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
                                        placeholder="e.g. Flexible after 3:00 PM or weekends"
                                    />
                                    <InputError message={errors.schedule_note} />
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4 rounded-xl border p-5">
                        <h2 className="text-lg font-semibold">Work setup</h2>
                        <div className="grid gap-2">
                            <Label htmlFor="work_mode">Work mode</Label>
                            <select
                                id="work_mode"
                                name="work_mode"
                                value={workMode}
                                onChange={(event) => setWorkMode(event.target.value)}
                                className="h-10 rounded-md border bg-background px-3 text-sm"
                                required
                            >
                                <option value="" disabled>Select a work mode</option>
                                {options.workModes.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                            <InputError message={errors.work_mode} />
                        </div>
                        {hasWorkplace && (
                            <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                                <p className="text-sm text-muted-foreground">Students see the place of work before applying. Enter a worksite, not a home address.</p>
                                <div className="grid gap-2">
                                    <Label htmlFor="workplace_name">Workplace name</Label>
                                    <Input id="workplace_name" name="workplace_name" defaultValue={task?.workplaceName ?? ''} required />
                                    <InputError message={errors.workplace_name} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="workplace_address">Workplace address</Label>
                                    <Input id="workplace_address" name="workplace_address" defaultValue={task?.workplaceAddress ?? ''} required />
                                    <InputError message={errors.workplace_address} />
                                </div>
                            </div>
                        )}
                        <div className="grid gap-2">
                            <Label htmlFor="deadline">Deadline (optional)</Label>
                            <Input
                                id="deadline"
                                name="deadline"
                                type="date"
                                min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
                                defaultValue={task?.deadline ?? ''}
                            />
                            <InputError message={errors.deadline} />
                        </div>
                    </section>

                    <section className="space-y-4 rounded-xl border p-5">
                        <h2 className="text-lg font-semibold">Platform rules</h2>
                        <div className="rounded-lg border bg-muted/40 p-4">
                            <h3 className="font-medium">Task guidelines</h3>
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                                {options.guidelines.map((guideline) => <li key={guideline}>{guideline}</li>)}
                            </ul>
                        </div>
                        <div className="flex items-start gap-2">
                            <input id="guidelines_confirmed" name="guidelines_confirmed" type="checkbox" value="1" required className="mt-1" />
                            <Label htmlFor="guidelines_confirmed">I confirm that this task follows the platform rules.</Label>
                        </div>
                        <InputError message={errors.guidelines_confirmed} />
                    </section>

                    <Button type="submit" disabled={processing}>{task ? 'Save changes' : 'Submit task for review'}</Button>
                </>
            )}
        </Form>
    );
}
