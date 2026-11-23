import { Head } from '@inertiajs/react';
import TaskForm from '@/components/task-form';
import { update } from '@/routes/tasks';

type Option = { value: string; label: string };
type TaskData = {
    id: number; title: string; category: string; workType?: string | null; description: string; requiredActivities: string | null; deliverables: string | null;
    estimatedDurationHours: string | null; skillRequirements: string | null; complexity: string | null; budget: string | null;
    budgetToBeDiscussed?: boolean; payTiming?: string | null; payTimingNote?: string | null;
    scheduleDays?: string[]; scheduleStartTime?: string | null; scheduleEndTime?: string | null; scheduleNote?: string | null;
    scheduleFlexible?: boolean; scheduleToBeDiscussed?: boolean; canHoursChange?: boolean | null;
    workModeValue: string; workplaceName: string | null; workplaceAddress: string | null; deadline: string | null;
};
type Props = {
    options: { categories: Option[]; workTypes?: Option[]; workModes: Option[]; payTimings: Option[]; daysOfWeek: Option[]; guidelines: string[] };
    task: TaskData;
    resetWarning: boolean;
};

export default function EditTask({ options, task, resetWarning }: Props) {
    return <><Head title="Edit task" /><div className="mx-auto max-w-4xl space-y-5 p-4 sm:p-6"><div><h1 className="text-2xl font-semibold">Edit task</h1><p className="mt-1 text-sm text-muted-foreground">Update the work details and submit them for review.</p></div><TaskForm action={update.form(task.id)} options={options} task={task} resetWarning={resetWarning} /></div></>;
}
