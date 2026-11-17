import { Head } from '@inertiajs/react';
import { ClipboardList, ShieldCheck } from 'lucide-react';
import TaskForm from '@/components/task-form';
import { store } from '@/routes/tasks';

type Option = { value: string; label: string };
type Props = {
    options: { categories: Option[]; workModes: Option[]; complexities: Option[]; guidelines: string[]; riskQuestions: { physical_demand: Option[]; academic_involvement: Option[]; workplace_setting: Option[] } };
    task: null;
    resetWarning: false;
};

export default function CreateTask({ options, task, resetWarning }: Props) {
    return <>
        <Head title="Post a task" />
        <div className="min-h-full bg-background px-4 py-8 text-foreground sm:px-6 sm:py-10">
            <div className="mx-auto max-w-4xl">
                <header className="mb-7 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
                    <div className="flex items-start gap-4">
                        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-primary dark:bg-amber-300/15"><ClipboardList className="size-6" aria-hidden="true" /></span>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-primary">CMU community tasks</p>
                            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Post a task</h1>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Share the work, time, location, and budget up front so students can make an informed choice.</p>
                        </div>
                    </div>
                    <div className="mt-5 flex items-start gap-3 rounded-xl border border-primary/20 bg-secondary/60 px-4 py-3 text-sm leading-5 text-secondary-foreground"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" /><p>Submitted tasks are reviewed before they are listed. TaskMate records agreements and payment status; payment is arranged directly between users.</p></div>
                </header>
                <TaskForm action={store.form()} options={options} task={task} resetWarning={resetWarning} />
            </div>
        </div>
    </>;
}
