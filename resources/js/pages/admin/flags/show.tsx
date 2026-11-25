import { Form, Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Info } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import InputError from '@/components/input-error';
import { STATUS, StatusFromMap } from '@/components/status-badge';
import type { StatusConfig } from '@/components/status-badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/layouts/admin-layout';
import { formatDateTime } from '@/lib/format';
import admin from '@/routes/admin';

type FlagSanction = {
    type: string;
    reason: string;
    active: boolean;
};

type ContentFlag = {
    id: number;
    category: string;
    categoryLabel: string;
    matched: string[] | null;
    field: string;
    content: string;
    status: string;
    note: string | null;
    createdAt: string | null;
    author: { id: number; name: string };
    task: { id: number; title: string } | null;
    relatedReportUrl: string | null;
    sanctions: FlagSanction[];
};

type SanctionAction = 'warning' | 'require_verification' | 'suspend' | 'ban';

const NATIVE_SELECT_CLASS =
    'focus-ring h-11 w-full rounded-md border border-input bg-field px-3 text-sm text-foreground shadow-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 md:h-9';

const FLAG_STATUS_MAP: Record<string, StatusConfig> = {
    open: STATUS.pending,
    reviewed: STATUS.success,
    dismissed: STATUS.neutral,
};

const SANCTION_LABELS: Record<SanctionAction, string> = {
    warning: 'Issue warning',
    require_verification: 'Require additional verification',
    suspend: 'Suspend user',
    ban: 'Ban user',
};

const DESTRUCTIVE_SANCTIONS = new Set<SanctionAction>(['suspend', 'ban']);

export default function ShowFlag({ flag }: { flag: ContentFlag }) {
    const flashStatus = (usePage().props as { flash?: { status?: string | null } }).flash?.status;
    const [dismissDialogOpen, setDismissDialogOpen] = useState(false);
    const [sanctionAction, setSanctionAction] = useState<SanctionAction>('warning');
    const [sanctionDialogOpen, setSanctionDialogOpen] = useState(false);

    const decisionFormId = `flag-decision-${flag.id}`;
    const sanctionFormId = `flag-sanction-${flag.id}`;
    const sanctionRequiresConfirm = DESTRUCTIVE_SANCTIONS.has(sanctionAction);

    const handleOpenDismissDialog = () => {
        const form = document.getElementById(decisionFormId) as HTMLFormElement | null;
        if (form?.reportValidity()) {
            setDismissDialogOpen(true);
        }
    };

    const handleOpenSanctionDialog = () => {
        const form = document.getElementById(sanctionFormId) as HTMLFormElement | null;
        if (form?.reportValidity()) {
            setSanctionDialogOpen(true);
        }
    };

    return (
        <>
            <Head title="Review content flag" />
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
                        <Link href={admin.flags.index()}>
                            <ArrowLeft aria-hidden="true" />
                            Back to flags
                        </Link>
                    </Button>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{flag.categoryLabel}</h1>
                            <p className="mt-1 text-sm tabular-nums text-muted-foreground">
                                Field: {flag.field} · {flag.createdAt ? formatDateTime(flag.createdAt) : '—'}
                            </p>
                        </div>
                        <StatusFromMap map={FLAG_STATUS_MAP} status={flag.status}>
                            <span className="capitalize">{flag.status}</span>
                        </StatusFromMap>
                    </div>
                </header>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
                    <div className="min-w-0 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Flagged content</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <dl className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <dt className="text-xs font-semibold text-muted-foreground">Author</dt>
                                        <dd>
                                            <Link
                                                href={admin.users.show(flag.author.id)}
                                                className="focus-ring rounded-sm font-semibold text-brand underline-offset-4 hover:underline"
                                            >
                                                {flag.author.name}
                                            </Link>
                                        </dd>
                                    </div>
                                    <div className="space-y-1">
                                        <dt className="text-xs font-semibold text-muted-foreground">Field</dt>
                                        <dd className="text-foreground">{flag.field}</dd>
                                    </div>
                                    {flag.task && (
                                        <div className="space-y-1 sm:col-span-2">
                                            <dt className="text-xs font-semibold text-muted-foreground">Task</dt>
                                            <dd>
                                                <Link
                                                    href={admin.tasks.show(flag.task.id)}
                                                    className="focus-ring rounded-sm font-medium text-brand underline-offset-4 hover:underline"
                                                >
                                                    {flag.task.title}
                                                </Link>
                                            </dd>
                                        </div>
                                    )}
                                </dl>

                                <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm whitespace-pre-wrap break-words text-foreground">
                                    {flag.content}
                                </div>

                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-muted-foreground">Matched labels</p>
                                    {flag.matched && flag.matched.length > 0 ? (
                                        <div className="flex flex-wrap gap-1.5">
                                            {flag.matched.map((label, index) => (
                                                <Badge key={`${label}-${index}`} variant="warning">
                                                    {label}
                                                </Badge>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No matched labels recorded.</p>
                                    )}
                                </div>

                                {flag.relatedReportUrl && (
                                    <div className="pt-1">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={flag.relatedReportUrl}>Open related report</Link>
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Prior author sanctions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {flag.sanctions.length ? (
                                    <div className="space-y-2.5">
                                        {flag.sanctions.map((item, index) => (
                                            <article
                                                key={index}
                                                className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-border bg-muted/20 p-3.5 text-sm"
                                            >
                                                <div className="space-y-1">
                                                    <p className="font-semibold capitalize text-foreground">
                                                        {item.type.replaceAll('_', ' ')}
                                                    </p>
                                                    <p className="text-muted-foreground">{item.reason}</p>
                                                </div>
                                                <Badge variant={item.active ? 'danger' : 'neutral'}>
                                                    {item.active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </article>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No sanctions on record.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <aside className="space-y-6 lg:sticky lg:top-[calc(var(--banner-h,0px)+1.5rem)]">
                        {flag.status === 'open' ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Review decision</CardTitle>
                                    <CardDescription>Mark this flag reviewed or dismiss it with a note.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Form
                                        {...admin.flags.decision.form(flag.id)}
                                        id={decisionFormId}
                                        onSuccess={() => setDismissDialogOpen(false)}
                                        onError={() => setDismissDialogOpen(false)}
                                        className="space-y-4"
                                    >
                                        {({ processing, errors }) => {
                                            const errorRecord = errors as Record<string, string | undefined>;

                                            return (
                                                <>
                                                    <div className="grid gap-1.5">
                                                        <Label htmlFor="flag-review-note">Review note (required)</Label>
                                                        <Textarea
                                                            id="flag-review-note"
                                                            name="note"
                                                            required
                                                            minLength={3}
                                                            maxLength={2000}
                                                            placeholder="Explain your review decision"
                                                        />
                                                        <InputError message={errorRecord.note ?? errorRecord.decision} />
                                                    </div>

                                                    <div className="flex flex-col gap-2">
                                                        <Button
                                                            type="submit"
                                                            name="decision"
                                                            value="reviewed"
                                                            variant="default"
                                                            className="w-full"
                                                            disabled={processing}
                                                        >
                                                            {processing && <Spinner />}
                                                            Mark reviewed
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            className="w-full"
                                                            disabled={processing}
                                                            onClick={handleOpenDismissDialog}
                                                        >
                                                            Dismiss
                                                        </Button>
                                                    </div>

                                                    <Dialog open={dismissDialogOpen} onOpenChange={setDismissDialogOpen}>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>Dismiss this content flag?</DialogTitle>
                                                                <DialogDescription>
                                                                    The flag status will be set to dismissed with your
                                                                    note recorded in the audit log.
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
                                                                    form={decisionFormId}
                                                                    name="decision"
                                                                    value="dismissed"
                                                                    variant="destructive"
                                                                    disabled={processing}
                                                                >
                                                                    {processing && <Spinner />}
                                                                    Confirm dismiss
                                                                </Button>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>
                                                </>
                                            );
                                        }}
                                    </Form>
                                </CardContent>
                            </Card>
                        ) : (
                            <Alert variant="info">
                                <Info aria-hidden="true" />
                                <AlertDescription>
                                    This flag has been marked as <span className="font-semibold">{flag.status}</span>
                                    {flag.note ? `: ${flag.note}` : '.'}
                                </AlertDescription>
                            </Alert>
                        )}

                        <Card>
                            <CardHeader>
                                <CardTitle>Author account actions</CardTitle>
                                <CardDescription>Issue a warning or sanction for {flag.author.name}.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Form
                                    {...admin.users.sanctions.form(flag.author.id)}
                                    id={sanctionFormId}
                                    onSuccess={() => setSanctionDialogOpen(false)}
                                    onError={() => setSanctionDialogOpen(false)}
                                    className="space-y-4"
                                >
                                    {({ processing, errors }) => {
                                        const errorRecord = errors as Record<string, string | undefined>;

                                        return (
                                            <>
                                                <div className="grid gap-1.5">
                                                    <Label htmlFor="flag-sanction-action">Action</Label>
                                                    <select
                                                        id="flag-sanction-action"
                                                        name="action"
                                                        className={NATIVE_SELECT_CLASS}
                                                        value={sanctionAction}
                                                        onChange={(event) =>
                                                            setSanctionAction(event.target.value as SanctionAction)
                                                        }
                                                    >
                                                        {(Object.keys(SANCTION_LABELS) as SanctionAction[]).map(
                                                            (key) => (
                                                                <option key={key} value={key}>
                                                                    {SANCTION_LABELS[key]}
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                    <InputError message={errorRecord.action} />
                                                </div>

                                                {sanctionAction === 'suspend' && (
                                                    <div className="grid gap-1.5">
                                                        <Label htmlFor="flag-sanction-ends">Suspension ends at</Label>
                                                        <Input
                                                            id="flag-sanction-ends"
                                                            name="ends_at"
                                                            type="datetime-local"
                                                            required
                                                            onKeyDown={(event) => {
                                                                if (event.key === 'Enter') {
                                                                    event.preventDefault();
                                                                    handleOpenSanctionDialog();
                                                                }
                                                            }}
                                                        />
                                                        <InputError message={errorRecord.ends_at} />
                                                    </div>
                                                )}

                                                <div className="grid gap-1.5">
                                                    <Label htmlFor="flag-sanction-reason">
                                                        Reason shown to the user
                                                    </Label>
                                                    <Textarea
                                                        id="flag-sanction-reason"
                                                        name="reason"
                                                        required
                                                        minLength={5}
                                                        maxLength={2000}
                                                        placeholder="Reason shown to the user"
                                                    />
                                                    <InputError message={errorRecord.reason} />
                                                </div>

                                                <div className="grid gap-1.5">
                                                    <Label htmlFor="flag-sanction-internal">Internal admin note</Label>
                                                    <Textarea
                                                        id="flag-sanction-internal"
                                                        name="internal_note"
                                                        required
                                                        minLength={3}
                                                        maxLength={3000}
                                                        placeholder="Internal admin note"
                                                    />
                                                    <InputError message={errorRecord.internal_note} />
                                                </div>

                                                {sanctionRequiresConfirm ? (
                                                    <>
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            className="w-full"
                                                            disabled={processing}
                                                            onClick={handleOpenSanctionDialog}
                                                        >
                                                            {SANCTION_LABELS[sanctionAction]}
                                                        </Button>

                                                        <Dialog
                                                            open={sanctionDialogOpen}
                                                            onOpenChange={setSanctionDialogOpen}
                                                        >
                                                            <DialogContent>
                                                                <DialogHeader>
                                                                    <DialogTitle>
                                                                        Confirm {SANCTION_LABELS[sanctionAction]}?
                                                                    </DialogTitle>
                                                                    <DialogDescription>
                                                                        This applies immediately against{' '}
                                                                        {flag.author.name} and records an audit entry.
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
                                                                        form={sanctionFormId}
                                                                        variant="destructive"
                                                                        disabled={processing}
                                                                    >
                                                                        {processing && <Spinner />}
                                                                        Confirm {SANCTION_LABELS[sanctionAction]}
                                                                    </Button>
                                                                </DialogFooter>
                                                            </DialogContent>
                                                        </Dialog>
                                                    </>
                                                ) : (
                                                    <Button
                                                        type="submit"
                                                        variant="outline"
                                                        className="w-full"
                                                        disabled={processing}
                                                    >
                                                        {processing && <Spinner />}
                                                        Record platform action
                                                    </Button>
                                                )}
                                            </>
                                        );
                                    }}
                                </Form>
                            </CardContent>
                        </Card>
                    </aside>
                </div>
            </div>
        </>
    );
}

ShowFlag.layout = (page: ReactNode) => <AdminLayout>{page}</AdminLayout>;
