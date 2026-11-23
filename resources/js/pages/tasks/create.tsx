import { Head } from '@inertiajs/react';
import TaskForm from '@/components/task-form';
import { store } from '@/routes/tasks';

type Option = { value: string; label: string };
type Props = {
    options: { categories: Option[]; workTypes?: Option[]; workModes: Option[]; payTimings: Option[]; daysOfWeek: Option[]; guidelines: string[] };
    task: null;
    resetWarning: false;
};

export default function CreateTask({ options, task, resetWarning }: Props) {
    return <><Head title="Post a task" /><div className="mx-auto max-w-4xl space-y-5 p-4 sm:p-6"><div><h1 className="text-2xl font-semibold">Post a task</h1><p className="mt-1 text-sm text-muted-foreground">Describe the work clearly so people can decide whether it suits them.</p></div><TaskForm action={store.form()} options={options} task={task} resetWarning={resetWarning} /></div></>;
}
