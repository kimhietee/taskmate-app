import { formatAmount, formatHoursFlexibility } from '@/lib/format';
import { Form, Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import InputError from '@/components/input-error';
import { ToBeDiscussedBadge } from '@/components/terms-status-badge';
import agreements from '@/routes/agreements';
import tasks from '@/routes/tasks';

type Props = {
    task: {
        id: number;
        title: string;
        budget: string | null;
        budgetToBeDiscussed?: boolean;
        payTimingLabel?: string;
        payTimingToBeDiscussed?: boolean;
        payTimingNote?: string | null;
        scheduleSummary?: string | null;
        scheduleToBeDiscussed?: boolean;
        scheduleNote?: string | null;
        canHoursChange?: boolean | null;
        workMode: string;
        workplaceName: string | null;
        workplaceAddress: string | null;
    };
    workerName: string;
    defaults: {
        deliverables: string;
        finalAmount: string | number;
        startDate: string;
        dueDate: string;
        workMode: string;
        workplaceName: string | null;
        workplaceAddress: string | null;
        paymentArrangement?: string;
    };
    termsMaxLength: number;
};

const notice = 'This agreement records what the poster and worker agreed. It is not a legal contract. TaskMate does not process, hold, or guarantee payment. Payment is made directly between the two of you.';

export default function CreateAgreement({ task, workerName, defaults, termsMaxLength }: Props) {
    const hasUnsettledTerms = Boolean(task.budgetToBeDiscussed || task.payTimingToBeDiscussed || task.scheduleToBeDiscussed);

    return (
        <>
            <Head title="Propose agreement" />
            <main className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 print:max-w-none print:p-0">
                <div>
                    <Link href={tasks.show(task.id)} className="text-sm underline">Back to task</Link>
                    <h1 className="mt-2 text-2xl font-semibold">Propose agreement</h1>
                    <p className="mt-1 text-muted-foreground">For {task.title} with {workerName}</p>
                </div>

                <p className="rounded-lg border bg-muted/40 p-4 text-sm">{notice}</p>

                <section className="rounded-xl border bg-muted/30 p-5">
                    <h2 className="font-semibold">Before work begins</h2>
                    <p className="mt-1 text-sm">The worker reviews this proposal. Work may begin only after both of you confirm the same version. Either person can ask for changes first.</p>
                </section>

                <section className="space-y-2 rounded-xl border p-5">
                    <h2 className="text-lg font-semibold">Terms from the task listing</h2>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-medium">Listed pay:</span>
                        {task.budgetToBeDiscussed || task.budget === null ? <ToBeDiscussedBadge /> : <span>₱{formatAmount(task.budget)}</span>}
                        <span className="font-medium">· Pay timing:</span>
                        {task.payTimingToBeDiscussed ? <ToBeDiscussedBadge /> : <span>{task.payTimingLabel ?? 'To be discussed'}</span>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-medium">Listed hours:</span>
                        {task.scheduleToBeDiscussed || !task.scheduleSummary ? <ToBeDiscussedBadge /> : <span>{task.scheduleSummary}</span>}
                        <span className="text-muted-foreground">({formatHoursFlexibility(task.canHoursChange)})</span>
                    </div>
                    <p className="text-sm">Work mode: {task.workMode}</p>
                    <p className="text-sm">Workplace: {defaults.workplaceName ?? 'Not applicable'}</p>
                    <p className="text-sm">Workplace address: {defaults.workplaceAddress ?? 'Not applicable'}</p>
                    <p className="text-sm text-muted-foreground">Work mode and workplace stay as listed because the worker applied based on these details.</p>
                    {hasUnsettledTerms && (
                        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
                            One or more listing terms were marked <strong>To be discussed</strong>. Settle the exact final amount, schedule/hours, and payment timing clearly in this agreement before locking.
                        </div>
                    )}
                </section>

                <Form {...agreements.store.form(task.id)} className="space-y-5 rounded-xl border p-5">
                    {({ errors, processing }) => (
                        <>
                            <section className="space-y-4">
                                <h2 className="text-lg font-semibold">Agreed work</h2>
                                <div>
                                    <label htmlFor="deliverables" className="mb-1 block text-sm font-medium">Deliverables</label>
                                    <Textarea id="deliverables" name="deliverables" required defaultValue={defaults.deliverables} />
                                    <InputError message={errors.deliverables} />
                                </div>
                                <div>
                                    <label htmlFor="terms" className="mb-1 block text-sm font-medium">Terms and agreed work hours</label>
                                    <Textarea id="terms" name="terms" required maxLength={termsMaxLength} placeholder="State the agreed duties, schedule/hours, and expectations before work begins." />
                                    <p className="mt-1 text-xs text-muted-foreground">Describe what each person expects—including agreed work hours—before work begins.</p>
                                    <InputError message={errors.terms} />
                                </div>
                                <div>
                                    <label htmlFor="payment_arrangement" className="mb-1 block text-sm font-medium">Payment arrangement and timing between you</label>
                                    <Textarea id="payment_arrangement" name="payment_arrangement" required defaultValue={defaults.paymentArrangement ?? ''} placeholder="Describe the payment method and exact timing (e.g. cash every Saturday or GCash upon completion)." />
                                    <InputError message={errors.payment_arrangement} />
                                </div>
                            </section>
                            <section className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="final_amount" className="mb-1 block text-sm font-medium">Final amount (₱)</label>
                                    <Input id="final_amount" name="final_amount" type="number" min="1" max="1000000" step="0.01" required defaultValue={defaults.finalAmount} />
                                    <InputError message={errors.final_amount} />
                                    <p className="mt-1 text-xs text-muted-foreground">The amount is agreed directly between you.</p>
                                </div>
                                <div>
                                    <label htmlFor="start_date" className="mb-1 block text-sm font-medium">Start date (optional)</label>
                                    <Input id="start_date" name="start_date" type="date" defaultValue={defaults.startDate} />
                                    <InputError message={errors.start_date} />
                                </div>
                                <div>
                                    <label htmlFor="due_date" className="mb-1 block text-sm font-medium">Due date</label>
                                    <Input id="due_date" name="due_date" type="date" required defaultValue={defaults.dueDate} />
                                    <InputError message={errors.due_date} />
                                </div>
                            </section>
                            <div>
                                <label htmlFor="comment" className="mb-1 block text-sm font-medium">Note for the worker (optional)</label>
                                <Textarea id="comment" name="comment" maxLength={1000} />
                                <InputError message={errors.comment} />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button type="submit" disabled={processing}>Send proposal</Button>
                                <Button asChild variant="outline"><Link href={tasks.show(task.id)}>Cancel</Link></Button>
                            </div>
                        </>
                    )}
                </Form>

                <p className="text-sm text-muted-foreground">TaskMate does not process, hold, transfer, recover, or guarantee payment.</p>
            </main>
        </>
    );
}
