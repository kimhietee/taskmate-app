import { Head, Link } from '@inertiajs/react';
import { CircleCheck, Clock, FilePenLine, ShieldCheck } from 'lucide-react';
import TaskForm from '@/components/task-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { show, update } from '@/routes/tasks';

type Option = { value: string; label: string };
type TaskData = {
    id: number;
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
    options: {
        categories: Option[];
        workTypes?: Option[];
        workModes: Option[];
        payTimings: Option[];
        daysOfWeek: Option[];
        guidelines: string[];
    };
    task: TaskData;
    resetWarning: boolean;
};

export default function EditTask({ options, task, resetWarning }: Props) {
    return (
        <>
            <Head title="Edit task" />
            <div className="page-wide space-y-6 task-editor-page">
                <header className="task-editor-hero task-editor-title-row">
                    <span className="task-editor-icon" aria-hidden="true">
                        <FilePenLine />
                    </span>
                    <div className="task-editor-heading">
                        <p className="task-editor-eyebrow">Update your listing</p>
                        <h1>Edit task</h1>
                        <p className="task-editor-description">
                            Update the work details and submit them for review.
                        </p>
                    </div>
                    <Button variant="outline" size="sm" asChild className="task-editor-back">
                        <Link href={show(task.id)}>Back to task</Link>
                    </Button>
                </header>

                <div className="task-editor-layout">
                    <div className="task-editor-form-wrap">
                        <TaskForm
                            action={update.form(task.id)}
                            options={options}
                            task={task}
                            resetWarning={resetWarning}
                        />
                    </div>

                    <aside className="task-editor-preview">
                        <Card className="task-editor-preview-card">
                            <CardHeader>
                                <CardTitle>How students will see it</CardTitle>
                                <CardDescription>
                                    Approved tasks appear as a 4-part Job Terms Card so students can check key terms
                                    before applying.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <ol className="space-y-2.5">
                                    <li className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/30 p-3">
                                        <CircleCheck
                                            className="mt-0.5 size-4 shrink-0 text-success-fg"
                                            aria-hidden="true"
                                        />
                                        <div>
                                            <p className="font-semibold text-foreground">1. The offer</p>
                                            <p className="text-xs text-muted-foreground">
                                                Clear pay amount, pay timing, workplace, and deliverables reduce
                                                back-and-forth questions.
                                            </p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/30 p-3">
                                        <ShieldCheck
                                            className="mt-0.5 size-4 shrink-0 text-info-fg"
                                            aria-hidden="true"
                                        />
                                        <div>
                                            <p className="font-semibold text-foreground">2. The poster</p>
                                            <p className="text-xs text-muted-foreground">
                                                Your verification badge and rating summary are shown alongside a 3-item
                                                student check.
                                            </p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/30 p-3">
                                        <Clock className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
                                        <div>
                                            <p className="font-semibold text-foreground">3. My classes</p>
                                            <p className="text-xs text-muted-foreground">
                                                Setting weekly hours lets students verify class-schedule fit
                                                automatically.
                                            </p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/30 p-3">
                                        <CircleCheck
                                            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                                            aria-hidden="true"
                                        />
                                        <div>
                                            <p className="font-semibold text-foreground">4. My decision</p>
                                            <p className="text-xs text-muted-foreground">
                                                Students review a final summary before applying or messaging you.
                                            </p>
                                        </div>
                                    </li>
                                </ol>

                                <p className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                                    Every edited task is reviewed by an administrator before updated details go live in
                                    Browse Tasks.
                                </p>
                            </CardContent>
                        </Card>
                    </aside>
                </div>
            </div>
        </>
    );
}

EditTask.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'My tasks', href: '/my-tasks' },
            { title: 'Edit task', href: '#' },
        ]}
    >
        {page}
    </AppLayout>
);
