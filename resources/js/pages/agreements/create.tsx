import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft, Info, TriangleAlert } from 'lucide-react';
import InputError from '@/components/input-error';
import { ToBeDiscussedBadge } from '@/components/terms-status-badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { formatAmount, formatHoursFlexibility } from '@/lib/format';
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

export default function CreateAgreement({ task, workerName, defaults, termsMaxLength }: Props) {
    const hasUnsettledTerms = Boolean(
        task.budgetToBeDiscussed || task.payTimingToBeDiscussed || task.scheduleToBeDiscussed,
    );

    return (
        <>
            <Head title="Propose agreement" />
            <div className="page-narrow space-y-6 print:max-w-none print:p-0">
                <header className="space-y-2">
                    <Button variant="ghost" size="sm" asChild className="-ml-2">
                        <Link href={tasks.show(task.id)}>
                            <ArrowLeft aria-hidden="true" />
                            Back to task
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Propose agreement</h1>
                    <p className="text-sm text-muted-foreground">
                        For {task.title} with {workerName}
                    </p>
                </header>

                <Alert variant="info">
                    <Info aria-hidden="true" />
                    <AlertTitle>Before work begins</AlertTitle>
                    <AlertDescription>
                        This agreement records what the poster and worker agreed (it is not a legal contract). The
                        worker reviews this proposal, and work may begin only after both of you confirm the same
                        version. Either person can ask for changes first.
                    </AlertDescription>
                </Alert>

                <Card>
                    <CardHeader>
                        <CardTitle>Terms from the task listing</CardTitle>
                        <CardDescription>
                            Work mode and workplace stay as listed because the worker applied based on these details.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <dl className="grid gap-3 text-sm sm:grid-cols-2">
                            <div className="space-y-1">
                                <dt className="text-xs font-semibold text-muted-foreground">Listed pay</dt>
                                <dd className="tabular-nums font-semibold text-foreground">
                                    {task.budgetToBeDiscussed || task.budget === null ? (
                                        <ToBeDiscussedBadge />
                                    ) : (
                                        `₱${formatAmount(task.budget)}`
                                    )}
                                </dd>
                            </div>
                            <div className="space-y-1">
                                <dt className="text-xs font-semibold text-muted-foreground">Pay timing</dt>
                                <dd className="text-foreground">
                                    {task.payTimingToBeDiscussed ? (
                                        <ToBeDiscussedBadge />
                                    ) : (
                                        (task.payTimingLabel ?? 'To be discussed')
                                    )}
                                </dd>
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                                <dt className="text-xs font-semibold text-muted-foreground">Listed hours</dt>
                                <dd className="flex flex-wrap items-center gap-2 text-foreground">
                                    {task.scheduleToBeDiscussed || !task.scheduleSummary ? (
                                        <ToBeDiscussedBadge />
                                    ) : (
                                        <span className="tabular-nums">{task.scheduleSummary}</span>
                                    )}
                                    <span className="text-muted-foreground">
                                        ({formatHoursFlexibility(task.canHoursChange)})
                                    </span>
                                </dd>
                            </div>
                            <div className="space-y-1">
                                <dt className="text-xs font-semibold text-muted-foreground">Work mode</dt>
                                <dd className="text-foreground">{task.workMode}</dd>
                            </div>
                            <div className="space-y-1">
                                <dt className="text-xs font-semibold text-muted-foreground">Workplace</dt>
                                <dd className="text-foreground">{defaults.workplaceName ?? 'Not applicable'}</dd>
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                                <dt className="text-xs font-semibold text-muted-foreground">Workplace address</dt>
                                <dd className="text-foreground">{defaults.workplaceAddress ?? 'Not applicable'}</dd>
                            </div>
                        </dl>

                        {hasUnsettledTerms && (
                            <Alert variant="warning">
                                <TriangleAlert aria-hidden="true" />
                                <AlertDescription>
                                    One or more listing terms were marked <strong>To be discussed</strong>. Settle the
                                    exact final amount, schedule/hours, and payment timing clearly in this agreement
                                    before locking.
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Agreed work</CardTitle>
                        <CardDescription>
                            Set the deliverables, schedule, payment arrangement, and final amount for this task.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...agreements.store.form(task.id)} className="space-y-5">
                            {({ errors, processing }) => (
                                <>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="deliverables">Deliverables</Label>
                                        <Textarea
                                            id="deliverables"
                                            name="deliverables"
                                            required
                                            defaultValue={defaults.deliverables}
                                            aria-describedby={errors.deliverables ? 'deliverables-error' : undefined}
                                        />
                                        <InputError id="deliverables-error" message={errors.deliverables} />
                                    </div>

                                    <div className="grid gap-1.5">
                                        <Label htmlFor="terms">Terms and agreed work hours</Label>
                                        <Textarea
                                            id="terms"
                                            name="terms"
                                            required
                                            maxLength={termsMaxLength}
                                            placeholder="State the agreed duties, schedule/hours, and expectations before work begins."
                                            aria-describedby={errors.terms ? 'terms-error' : 'terms-helper'}
                                        />
                                        <p id="terms-helper" className="text-xs text-muted-foreground">
                                            Describe what each person expects—including agreed work hours—before work
                                            begins.
                                        </p>
                                        <InputError id="terms-error" message={errors.terms} />
                                    </div>

                                    <div className="grid gap-1.5">
                                        <Label htmlFor="payment_arrangement">
                                            Payment arrangement and timing between you
                                        </Label>
                                        <Textarea
                                            id="payment_arrangement"
                                            name="payment_arrangement"
                                            required
                                            defaultValue={defaults.paymentArrangement ?? ''}
                                            placeholder="Describe the payment method and exact timing (e.g. cash every Saturday or GCash upon completion)."
                                            aria-describedby={
                                                errors.payment_arrangement ? 'payment-arrangement-error' : undefined
                                            }
                                        />
                                        <InputError
                                            id="payment-arrangement-error"
                                            message={errors.payment_arrangement}
                                        />
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="grid gap-1.5 sm:col-span-2">
                                            <Label htmlFor="final_amount">Final amount (₱)</Label>
                                            <Input
                                                id="final_amount"
                                                name="final_amount"
                                                type="number"
                                                min="1"
                                                max="1000000"
                                                step="0.01"
                                                required
                                                className="tabular-nums"
                                                defaultValue={defaults.finalAmount}
                                                aria-describedby={
                                                    errors.final_amount ? 'final-amount-error' : 'final-amount-helper'
                                                }
                                            />
                                            <p id="final-amount-helper" className="text-xs text-muted-foreground">
                                                The amount is agreed directly between you.
                                            </p>
                                            <InputError id="final-amount-error" message={errors.final_amount} />
                                        </div>

                                        <div className="grid gap-1.5">
                                            <Label htmlFor="start_date">Start date (optional)</Label>
                                            <Input
                                                id="start_date"
                                                name="start_date"
                                                type="date"
                                                className="tabular-nums"
                                                defaultValue={defaults.startDate}
                                                aria-describedby={errors.start_date ? 'start-date-error' : undefined}
                                            />
                                            <InputError id="start-date-error" message={errors.start_date} />
                                        </div>

                                        <div className="grid gap-1.5">
                                            <Label htmlFor="due_date">Due date</Label>
                                            <Input
                                                id="due_date"
                                                name="due_date"
                                                type="date"
                                                required
                                                className="tabular-nums"
                                                defaultValue={defaults.dueDate}
                                                aria-describedby={errors.due_date ? 'due-date-error' : undefined}
                                            />
                                            <InputError id="due-date-error" message={errors.due_date} />
                                        </div>
                                    </div>

                                    <div className="grid gap-1.5">
                                        <Label htmlFor="comment">Note for the worker (optional)</Label>
                                        <Textarea
                                            id="comment"
                                            name="comment"
                                            maxLength={1000}
                                            aria-describedby={errors.comment ? 'comment-error' : undefined}
                                        />
                                        <InputError id="comment-error" message={errors.comment} />
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 pt-1">
                                        <Button type="submit" disabled={processing}>
                                            {processing && <Spinner />}
                                            Send proposal
                                        </Button>
                                        <Button asChild variant="outline">
                                            <Link href={tasks.show(task.id)}>Cancel</Link>
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Form>
                    </CardContent>
                </Card>

                <p className="text-xs text-muted-foreground">
                    TaskMate does not process, hold, transfer, recover, or guarantee payment. Payment is made directly
                    between the two of you.
                </p>
            </div>
        </>
    );
}
