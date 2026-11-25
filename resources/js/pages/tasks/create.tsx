import { Head, Link } from '@inertiajs/react';
import { CircleCheck, Clock, ShieldCheck } from 'lucide-react';
import TaskForm from '@/components/task-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { mine, store } from '@/routes/tasks';

type Option = { value: string; label: string };
type Props = {
    options: {
        categories: Option[];
        workTypes?: Option[];
        workModes: Option[];
        payTimings: Option[];
        daysOfWeek: Option[];
        guidelines: string[];
    };
    task: null;
    resetWarning: false;
};

export default function CreateTask({ options, task, resetWarning }: Props) {
    return (
        <>
            <Head title="Post a task" />
            <div className="page-wide space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Post a task</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Describe the work clearly so people can decide whether it suits them.
                        </p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={mine()}>Back to My tasks</Link>
                    </Button>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
                    <div>
                        <TaskForm
                            action={store.form()}
                            options={options}
                            task={task}
                            resetWarning={resetWarning}
                        />
                    </div>

                    <aside className="space-y-4 lg:sticky lg:top-[calc(var(--banner-h,0px)+5rem)]">
                        <Card>
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
                                    Every new or resubmitted task is reviewed by an administrator before it goes live in
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

CreateTask.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'My tasks', href: '/my-tasks' },
            { title: 'Post a task', href: '/tasks/create' },
        ]}
    >
        {page}
    </AppLayout>
);
