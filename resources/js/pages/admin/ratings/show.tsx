import { Form, Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Info, TriangleAlert } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import InputError from '@/components/input-error';
import { ratingNotice } from '@/components/rating-summary';
import { StarRating } from '@/components/star-rating';
import { STATUS, StatusBadge } from '@/components/status-badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/layouts/admin-layout';
import { formatAmount, formatDate } from '@/lib/format';
import admin from '@/routes/admin';

type Rating = {
    id: number;
    overall: number;
    comment: string | null;
    direction: string;
    scores: { dimension: string; label: string; score: number }[];
    taskTitle: string;
    agreementId: number;
    recordReference: string | null;
    agreedAmount: string | null;
    paymentArrangement: string | null;
    dueDate: string | null;
    rater: string;
    ratee: string;
    hidden: boolean;
    hiddenReason: string | null;
    visibleToOthers: boolean;
};

function Page({ rating, notice }: { rating: Rating; notice: string }) {
    const flashStatus = (usePage().props as { flash?: { status?: string | null } }).flash?.status;
    const [hideDialogOpen, setHideDialogOpen] = useState(false);

    const hideFormId = `hide-rating-${rating.id}`;

    const handleOpenHideDialog = () => {
        const form = document.getElementById(hideFormId) as HTMLFormElement | null;
        if (form?.reportValidity()) {
            setHideDialogOpen(true);
        }
    };

    return (
        <>
            <Head title="Review rating" />
            <div className="space-y-6">
                {flashStatus && (
                    <div
                        role="status"
                        className="rounded-lg border border-success-border bg-success-bg px-4 py-3 text-sm text-success-fg"
                    >
                        {flashStatus}
                    </div>
                )}

                <header className="space-y-2">
                    <Button variant="ghost" size="sm" asChild className="-ml-2">
                        <Link href={admin.ratings.index()}>
                            <ArrowLeft aria-hidden="true" />
                            Back to ratings
                        </Link>
                    </Button>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                                Rating for {rating.taskTitle}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {rating.rater} rated {rating.ratee}
                            </p>
                        </div>
                        <StatusBadge
                            tone={rating.hidden ? STATUS.pending[0] : STATUS.success[0]}
                            icon={rating.hidden ? STATUS.pending[1] : STATUS.success[1]}
                        >
                            {rating.hidden ? 'Hidden' : 'Visible'}
                        </StatusBadge>
                    </div>
                </header>

                <div className="space-y-3">
                    <Alert variant="info">
                        <Info aria-hidden="true" />
                        <AlertDescription>{ratingNotice}</AlertDescription>
                    </Alert>
                    <Alert variant="warning">
                        <TriangleAlert aria-hidden="true" />
                        <AlertDescription>{notice}</AlertDescription>
                    </Alert>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
                    <div className="min-w-0 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Rating breakdown</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <dl className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <dt className="text-xs font-semibold text-muted-foreground">Direction</dt>
                                        <dd className="capitalize text-foreground">
                                            {rating.direction.replaceAll('_', ' ')}
                                        </dd>
                                    </div>
                                    <div className="space-y-1">
                                        <dt className="text-xs font-semibold text-muted-foreground">
                                            Overall experience
                                        </dt>
                                        <dd className="flex items-center gap-2 font-semibold tabular-nums text-foreground">
                                            <StarRating score={rating.overall} label="Overall experience" />
                                            <span>{rating.overall}/5</span>
                                        </dd>
                                    </div>
                                </dl>

                                <div className="space-y-2 border-t border-border pt-4">
                                    <p className="text-xs font-semibold text-muted-foreground">Dimension scores</p>
                                    <dl className="grid gap-3 sm:grid-cols-2">
                                        {rating.scores.map((score) => (
                                            <div
                                                key={score.dimension}
                                                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/20 p-3"
                                            >
                                                <dt className="text-sm text-foreground">{score.label}</dt>
                                                <dd className="flex items-center gap-1.5 font-semibold tabular-nums text-foreground">
                                                    <StarRating score={score.score} label={score.label} />
                                                    <span>{score.score}/5</span>
                                                </dd>
                                            </div>
                                        ))}
                                    </dl>
                                </div>

                                {rating.comment && (
                                    <div className="space-y-1 border-t border-border pt-4">
                                        <p className="text-xs font-semibold text-muted-foreground">Comment</p>
                                        <p className="whitespace-pre-wrap text-foreground">{rating.comment}</p>
                                    </div>
                                )}

                                <div className="space-y-1 border-t border-border pt-4">
                                    <p className="text-xs font-semibold text-muted-foreground">Visibility status</p>
                                    <p className="text-foreground">
                                        {rating.hidden
                                            ? `Hidden — ${rating.hiddenReason ?? ''}`
                                            : rating.visibleToOthers
                                              ? 'Visible to others'
                                              : 'Waiting for both ratings or window close'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Agreement summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <dl className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <dt className="text-xs font-semibold text-muted-foreground">Agreed amount</dt>
                                        <dd className="font-semibold tabular-nums text-foreground">
                                            {rating.agreedAmount ? `₱${formatAmount(rating.agreedAmount)}` : '—'}
                                        </dd>
                                    </div>
                                    <div className="space-y-1">
                                        <dt className="text-xs font-semibold text-muted-foreground">Due date</dt>
                                        <dd className="tabular-nums text-foreground">
                                            {rating.dueDate ? formatDate(rating.dueDate) : '—'}
                                        </dd>
                                    </div>
                                    <div className="space-y-1 sm:col-span-2">
                                        <dt className="text-xs font-semibold text-muted-foreground">
                                            Payment arrangement
                                        </dt>
                                        <dd className="whitespace-pre-wrap text-foreground">
                                            {rating.paymentArrangement ?? '—'}
                                        </dd>
                                    </div>
                                    <div className="space-y-1 sm:col-span-2">
                                        <dt className="text-xs font-semibold text-muted-foreground">
                                            Agreement record reference
                                        </dt>
                                        <dd className="font-mono text-xs break-all text-foreground">
                                            {rating.recordReference ?? 'Unavailable'}
                                        </dd>
                                    </div>
                                </dl>

                                <div>
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={admin.agreements.show(rating.agreementId)}>View agreement</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <aside className="lg:sticky lg:top-[calc(var(--banner-h,0px)+1.5rem)]">
                        <Card>
                            <CardHeader>
                                <CardTitle>Moderation</CardTitle>
                                <CardDescription>
                                    {rating.hidden
                                        ? 'Restore this rating so it follows normal visibility rules.'
                                        : 'Hide this rating from public profile summaries.'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {rating.hidden ? (
                                    <Form {...admin.ratings.moderate.form(rating.id)} className="space-y-3">
                                        {({ processing, errors }) => (
                                            <>
                                                <input type="hidden" name="action" value="restore" />
                                                <InputError message={(errors as Record<string, string | undefined>).action} />
                                                <Button
                                                    type="submit"
                                                    variant="outline"
                                                    className="w-full"
                                                    disabled={processing}
                                                >
                                                    {processing && <Spinner />}
                                                    Restore rating
                                                </Button>
                                            </>
                                        )}
                                    </Form>
                                ) : (
                                    <Form
                                        {...admin.ratings.moderate.form(rating.id)}
                                        id={hideFormId}
                                        onSuccess={() => setHideDialogOpen(false)}
                                        onError={() => setHideDialogOpen(false)}
                                        className="space-y-4"
                                    >
                                        {({ processing, errors }) => {
                                            const errorRecord = errors as Record<string, string | undefined>;

                                            return (
                                                <>
                                                    <input type="hidden" name="action" value="hide" />
                                                    <div className="grid gap-1.5">
                                                        <Label htmlFor="reason">Reason for hiding (required)</Label>
                                                        <Textarea
                                                            id="reason"
                                                            name="reason"
                                                            required
                                                            maxLength={2000}
                                                            placeholder="Explain why this rating is being hidden"
                                                        />
                                                        <InputError message={errorRecord.reason ?? errorRecord.action} />
                                                    </div>

                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        className="w-full"
                                                        disabled={processing}
                                                        onClick={handleOpenHideDialog}
                                                    >
                                                        Hide rating
                                                    </Button>

                                                    <Dialog open={hideDialogOpen} onOpenChange={setHideDialogOpen}>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>Hide this rating?</DialogTitle>
                                                                <DialogDescription>
                                                                    This excludes the rating from public rating counts
                                                                    and averages while keeping the record for audit.
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <DialogFooter>
                                                                <DialogClose asChild>
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        disabled={processing}
                                                                    >
                                                                        Cancel
                                                                    </Button>
                                                                </DialogClose>
                                                                <Button
                                                                    type="submit"
                                                                    form={hideFormId}
                                                                    variant="destructive"
                                                                    disabled={processing}
                                                                >
                                                                    {processing && <Spinner />}
                                                                    Confirm hide rating
                                                                </Button>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>
                                                </>
                                            );
                                        }}
                                    </Form>
                                )}
                            </CardContent>
                        </Card>
                    </aside>
                </div>
            </div>
        </>
    );
}

Page.layout = (page: ReactNode) => <AdminLayout>{page}</AdminLayout>;

export default Page;
