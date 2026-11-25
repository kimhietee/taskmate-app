import { Form, Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Info, TriangleAlert } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import InputError from '@/components/input-error';
import { ratingNotice } from '@/components/rating-summary';
import { STATUS, StatusBadge } from '@/components/status-badge';
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
import { VerificationStatusBadge } from '@/components/verification-status-badge';
import AdminLayout from '@/layouts/admin-layout';
import { formatDateTime } from '@/lib/format';
import admin from '@/routes/admin';

type Account = {
    id: number;
    name: string;
    email: string;
    institutionalEmail?: string | null;
    institutionalEmailVerifiedAt?: string | null;
    verificationMethod?: string | null;
    userType: string;
    userTypeLabel: string;
    verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected' | 'more_info_requested';
    idNumber: string | null;
    affiliation: string | null;
    organizationName: string | null;
    position: string | null;
    supportingInfo: string | null;
    verificationNote: string | null;
    registeredAt: string | null;
    verifiedAt: string | null;
    verifiedBy: string | null;
    isSelf: boolean;
};

type HistoryItem = {
    id: number;
    action: string;
    actorName: string | null;
    note: string | null;
    createdAt: string | null;
};

type UserRating = {
    id: number;
    direction: string;
    overall: number;
    comment: string | null;
    taskTitle: string;
    otherParty: string;
    hidden: boolean;
    hiddenReason: string | null;
    scores: { dimension: string; score: number }[];
    date: string | null;
};

type UserSanction = {
    id: number;
    type: string;
    reason: string;
    internalNote: string | null;
    endsAt: string | null;
    liftedAt: string | null;
    liftNote: string | null;
    reportId: number | null;
};

type SanctionAction = 'warning' | 'require_verification' | 'suspend' | 'ban' | 'remove_post';

const NATIVE_SELECT_CLASS =
    'focus-ring h-11 w-full rounded-md border border-input bg-field px-3 text-sm text-foreground shadow-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 md:h-9';

const SANCTION_LABELS: Record<SanctionAction, string> = {
    warning: 'Issue warning',
    require_verification: 'Require additional verification',
    suspend: 'Suspend user',
    ban: 'Ban user',
    remove_post: 'Remove post',
};

const DESTRUCTIVE_SANCTIONS = new Set<SanctionAction>(['suspend', 'ban', 'remove_post']);

function DecisionForm({
    userId,
    decision,
    label,
    variant,
    needsNote = false,
    confirmRequired = false,
    confirmTitle,
    confirmDescription,
}: {
    userId: number;
    decision: string;
    label: string;
    variant: 'default' | 'outline' | 'destructive';
    needsNote?: boolean;
    confirmRequired?: boolean;
    confirmTitle?: string;
    confirmDescription?: string;
}) {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const formId = `verification-decision-${decision}`;

    const handleTriggerConfirm = () => {
        const form = document.getElementById(formId) as HTMLFormElement | null;
        if (form?.reportValidity()) {
            setConfirmOpen(true);
        }
    };

    return (
        <Form
            {...admin.users.verification.form(userId)}
            id={formId}
            onSuccess={() => setConfirmOpen(false)}
            onError={() => setConfirmOpen(false)}
            className="space-y-3 rounded-lg border border-border bg-muted/20 p-3.5"
        >
            {({ processing, errors }) => {
                const errorRecord = errors as Record<string, string | undefined>;

                return (
                    <>
                        <input type="hidden" name="decision" value={decision} />
                        {needsNote && (
                            <div className="grid gap-1.5">
                                <Label htmlFor={`note-${decision}`}>Note for the account holder</Label>
                                <Textarea
                                    id={`note-${decision}`}
                                    name="note"
                                    required
                                    maxLength={2000}
                                    placeholder="Explain the decision in clear terms."
                                    aria-describedby={errorRecord.note ? `note-${decision}-error` : undefined}
                                />
                                <InputError id={`note-${decision}-error`} message={errorRecord.note} />
                            </div>
                        )}
                        <InputError message={errorRecord.decision} />

                        {confirmRequired ? (
                            <>
                                <Button
                                    type="button"
                                    variant={variant}
                                    className="w-full"
                                    disabled={processing}
                                    onClick={handleTriggerConfirm}
                                >
                                    {label}
                                </Button>

                                <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>{confirmTitle ?? `${label}?`}</DialogTitle>
                                            <DialogDescription>
                                                {confirmDescription ??
                                                    'The account holder will receive this decision and your note.'}
                                            </DialogDescription>
                                        </DialogHeader>
                                        <DialogFooter>
                                            <DialogClose asChild>
                                                <Button type="button" variant="outline" disabled={processing}>
                                                    Cancel
                                                </Button>
                                            </DialogClose>
                                            <Button
                                                type="submit"
                                                form={formId}
                                                variant="destructive"
                                                disabled={processing}
                                            >
                                                {processing && <Spinner />}
                                                {label}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </>
                        ) : (
                            <Button type="submit" variant={variant} className="w-full" disabled={processing}>
                                {processing && <Spinner />}
                                {label}
                            </Button>
                        )}
                    </>
                );
            }}
        </Form>
    );
}

function LiftSanctionForm({ sanction }: { sanction: UserSanction }) {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const formId = `lift-sanction-${sanction.id}`;
    const inputId = `lift-note-${sanction.id}`;

    const openConfirmIfValid = () => {
        const form = document.getElementById(formId) as HTMLFormElement | null;
        if (form?.reportValidity()) {
            setConfirmOpen(true);
        }
    };

    return (
        <Form
            {...admin.sanctions.lift.form(sanction.id)}
            id={formId}
            onSuccess={() => setConfirmOpen(false)}
            onError={() => setConfirmOpen(false)}
            className="mt-3 space-y-2 border-t border-border pt-3"
        >
            {({ processing, errors }) => {
                const errorRecord = errors as Record<string, string | undefined>;

                return (
                    <>
                        <div className="grid gap-1.5">
                            <Label htmlFor={inputId} className="text-xs">
                                Lift reason (required)
                            </Label>
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <Input
                                    id={inputId}
                                    name="note"
                                    required
                                    minLength={3}
                                    maxLength={2000}
                                    placeholder="Required lift note"
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') {
                                            event.preventDefault();
                                            openConfirmIfValid();
                                        }
                                    }}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="shrink-0"
                                    disabled={processing}
                                    onClick={openConfirmIfValid}
                                >
                                    Lift sanction
                                </Button>
                            </div>
                            <InputError message={errorRecord.note} />
                        </div>

                        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Lift this sanction?</DialogTitle>
                                    <DialogDescription>
                                        The {sanction.type.replaceAll('_', ' ')} sanction will end immediately and your
                                        note will be recorded in the audit log.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button type="button" variant="outline" disabled={processing}>
                                            Keep sanction
                                        </Button>
                                    </DialogClose>
                                    <Button type="submit" form={formId} variant="destructive" disabled={processing}>
                                        {processing && <Spinner />}
                                        Confirm lift sanction
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </>
                );
            }}
        </Form>
    );
}

export default function AdminUserShow({
    user,
    history,
    ratingsReceived = [],
    ratingsGiven = [],
    sanctions = [],
    postedTasks = [],
}: {
    user: Account;
    history: HistoryItem[];
    ratingsReceived?: UserRating[];
    ratingsGiven?: UserRating[];
    sanctions?: UserSanction[];
    postedTasks?: { id: number; title: string; status: string }[];
}) {
    const flashStatus = (usePage().props as { flash?: { status?: string | null } }).flash?.status;
    const [sanctionAction, setSanctionAction] = useState<SanctionAction>('warning');
    const [sanctionDialogOpen, setSanctionDialogOpen] = useState(false);

    const sanctionRequiresConfirm = DESTRUCTIVE_SANCTIONS.has(sanctionAction);
    const sanctionFormId = `user-sanction-${user.id}`;

    const handleSanctionConfirmCheck = () => {
        const form = document.getElementById(sanctionFormId) as HTMLFormElement | null;
        if (form?.reportValidity()) {
            setSanctionDialogOpen(true);
        }
    };

    return (
        <>
            <Head title={`Review ${user.name}`} />
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
                        <Link href={admin.users.index()}>
                            <ArrowLeft aria-hidden="true" />
                            Back to users
                        </Link>
                    </Button>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Account review</p>
                            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{user.name}</h1>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <VerificationStatusBadge status={user.verificationStatus} />
                    </div>
                </header>

                <Alert variant="warning">
                    <TriangleAlert aria-hidden="true" />
                    <AlertDescription>
                        These checks are based on information the user submitted. They do not guarantee the
                        person&apos;s future behavior or the safety of a task.
                    </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
                    <div className="min-w-0 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Submitted details</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <dl className="grid gap-4 text-sm sm:grid-cols-2">
                                    <Detail label="Account type" value={user.userTypeLabel} />
                                    <Detail label="Email" value={user.email} />
                                    {user.userType === 'student' && (
                                        <Detail
                                            label="CMU institutional email"
                                            value={
                                                user.institutionalEmail
                                                    ? `${user.institutionalEmail}${user.institutionalEmailVerifiedAt ? ` (confirmed ${user.institutionalEmailVerifiedAt})` : ''}`
                                                    : null
                                            }
                                        />
                                    )}
                                    {user.verificationMethod && (
                                        <Detail
                                            label="Verification method"
                                            value={
                                                user.verificationMethod === 'institutional_email'
                                                    ? 'CMU institutional email code'
                                                    : 'Administrator review'
                                            }
                                        />
                                    )}
                                    {user.userType !== 'organization' && (
                                        <Detail
                                            label={
                                                user.userType === 'student' ? 'Student ID number' : 'Employee ID number'
                                            }
                                            value={user.idNumber}
                                        />
                                    )}
                                    {user.userType !== 'organization' && (
                                        <Detail label="Affiliation" value={user.affiliation} />
                                    )}
                                    {user.userType === 'organization' && (
                                        <Detail label="Organization name" value={user.organizationName} />
                                    )}
                                    {user.userType === 'organization' && (
                                        <Detail label="Representative position" value={user.position} />
                                    )}
                                    {user.userType === 'organization' && (
                                        <div className="sm:col-span-2">
                                            <Detail label="Organization description" value={user.supportingInfo} />
                                        </div>
                                    )}
                                    <Detail label="Registered" value={user.registeredAt} />
                                    <Detail
                                        label="Verified"
                                        value={
                                            user.verifiedAt
                                                ? `${user.verifiedAt}${user.verifiedBy ? ` by ${user.verifiedBy}` : ''}`
                                                : null
                                        }
                                    />
                                    <div className="sm:col-span-2">
                                        <Detail label="Current verification note" value={user.verificationNote} />
                                    </div>
                                </dl>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Account history</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {history.length ? (
                                    <div className="divide-y divide-border">
                                        {history.map((item) => (
                                            <article key={item.id} className="py-3 text-sm first:pt-0 last:pb-0">
                                                <div className="flex flex-wrap justify-between gap-2">
                                                    <p className="font-semibold capitalize text-foreground">
                                                        {item.action.replaceAll('_', ' ')}
                                                    </p>
                                                    <p className="tabular-nums text-muted-foreground">
                                                        {item.createdAt ? formatDateTime(item.createdAt) : '—'}
                                                    </p>
                                                </div>
                                                <p className="mt-1 text-muted-foreground">
                                                    By {item.actorName ?? 'an administrator'}
                                                </p>
                                                {item.note && (
                                                    <p className="mt-2 whitespace-pre-wrap text-foreground">
                                                        {item.note}
                                                    </p>
                                                )}
                                            </article>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No account actions have been recorded.</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Ratings received and given</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <Alert variant="info">
                                    <Info aria-hidden="true" />
                                    <AlertDescription>{ratingNotice}</AlertDescription>
                                </Alert>

                                {(
                                    [
                                        ['Received', ratingsReceived],
                                        ['Given', ratingsGiven],
                                    ] as const
                                ).map(([title, records]) => (
                                    <div key={title} className="space-y-2.5">
                                        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                                        {records.length ? (
                                            <div className="space-y-2.5">
                                                {records.map((rating) => (
                                                    <article
                                                        key={rating.id}
                                                        className="space-y-1.5 rounded-lg border border-border bg-muted/20 p-3.5 text-sm"
                                                    >
                                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                                            <p className="font-semibold tabular-nums text-foreground">
                                                                {rating.taskTitle} · {rating.overall}/5 ·{' '}
                                                                <span className="capitalize">
                                                                    {rating.direction.replaceAll('_', ' ')}
                                                                </span>
                                                            </p>
                                                            {rating.hidden && (
                                                                <StatusBadge
                                                                    tone={STATUS.pending[0]}
                                                                    icon={STATUS.pending[1]}
                                                                >
                                                                    Hidden
                                                                </StatusBadge>
                                                            )}
                                                        </div>
                                                        <p className="text-xs tabular-nums text-muted-foreground">
                                                            {title === 'Received' ? 'From' : 'To'} {rating.otherParty} ·{' '}
                                                            {rating.date ? formatDateTime(rating.date) : '—'}
                                                        </p>
                                                        {rating.comment && (
                                                            <p className="whitespace-pre-wrap text-foreground">
                                                                {rating.comment}
                                                            </p>
                                                        )}
                                                        {rating.hiddenReason && (
                                                            <p className="text-xs text-warning-fg">
                                                                Hide reason: {rating.hiddenReason}
                                                            </p>
                                                        )}
                                                        <p className="text-xs tabular-nums text-muted-foreground">
                                                            {rating.scores
                                                                .map((score) => `${score.dimension}: ${score.score}/5`)
                                                                .join(' · ')}
                                                        </p>
                                                    </article>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="rounded-lg border border-border bg-muted/20 p-3 text-sm text-muted-foreground">
                                                No ratings {title.toLowerCase()}.
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Sanctions record</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {sanctions.length ? (
                                    <div className="space-y-3">
                                        {sanctions.map((item) => (
                                            <article
                                                key={item.id}
                                                className="space-y-1.5 rounded-lg border border-border bg-muted/20 p-4 text-sm"
                                            >
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <span className="font-semibold capitalize text-foreground">
                                                        {item.type.replaceAll('_', ' ')}
                                                    </span>
                                                    <Badge variant={item.liftedAt ? 'neutral' : 'danger'}>
                                                        {item.liftedAt ? 'Lifted' : 'Active'}
                                                    </Badge>
                                                </div>
                                                <p className="whitespace-pre-wrap text-foreground">{item.reason}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Internal note: {item.internalNote ?? '—'}
                                                </p>
                                                <p className="text-xs tabular-nums text-muted-foreground">
                                                    {item.endsAt
                                                        ? `Ends ${formatDateTime(item.endsAt)}`
                                                        : 'No end date'}
                                                    {item.liftedAt ? ` · Lifted ${formatDateTime(item.liftedAt)}` : ''}
                                                    {item.liftNote ? ` · Lift note: ${item.liftNote}` : ''}
                                                </p>
                                                {item.liftedAt === null && <LiftSanctionForm sanction={item} />}
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
                        <Card>
                            <CardHeader>
                                <CardTitle>Review decision</CardTitle>
                                <CardDescription>Record a verification decision for this account.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {user.isSelf ? (
                                    <Alert variant="info">
                                        <Info aria-hidden="true" />
                                        <AlertDescription>
                                            You cannot change your own account verification.
                                        </AlertDescription>
                                    </Alert>
                                ) : (
                                    <div className="space-y-3">
                                        <DecisionForm
                                            userId={user.id}
                                            decision="verified"
                                            label="Approve account"
                                            variant="default"
                                        />
                                        <DecisionForm
                                            userId={user.id}
                                            decision="more_info_requested"
                                            label="Request more information"
                                            variant="outline"
                                            needsNote
                                        />
                                        <DecisionForm
                                            userId={user.id}
                                            decision="rejected"
                                            label="Reject account"
                                            variant="destructive"
                                            needsNote
                                            confirmRequired
                                            confirmTitle={`Reject ${user.name}'s account?`}
                                            confirmDescription="This sets the account verification status to rejected and sends your note to the account holder."
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {!user.isSelf && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Platform actions</CardTitle>
                                    <CardDescription>
                                        Issue a warning, require verification, suspend, ban, or remove a post.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Form
                                        {...admin.users.sanctions.form(user.id)}
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
                                                        <Label htmlFor="user-sanction-action">Action</Label>
                                                        <select
                                                            id="user-sanction-action"
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

                                                    {sanctionAction === 'remove_post' && (
                                                        <div className="grid gap-1.5">
                                                            <Label htmlFor="user-sanction-task">Post to remove</Label>
                                                            <select
                                                                id="user-sanction-task"
                                                                name="task_id"
                                                                required
                                                                className={NATIVE_SELECT_CLASS}
                                                            >
                                                                <option value="">Choose a post to remove</option>
                                                                {postedTasks.map((task) => (
                                                                    <option key={task.id} value={task.id}>
                                                                        {task.title} · {task.status}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            {postedTasks.length === 0 && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    This account has no posted tasks.
                                                                </p>
                                                            )}
                                                            <InputError message={errorRecord.task_id} />
                                                        </div>
                                                    )}

                                                    {sanctionAction === 'suspend' && (
                                                        <div className="grid gap-1.5">
                                                            <Label htmlFor="user-sanction-ends">
                                                                Suspension ends at
                                                            </Label>
                                                            <Input
                                                                id="user-sanction-ends"
                                                                name="ends_at"
                                                                type="datetime-local"
                                                                required
                                                                onKeyDown={(event) => {
                                                                    if (event.key === 'Enter') {
                                                                        event.preventDefault();
                                                                        handleSanctionConfirmCheck();
                                                                    }
                                                                }}
                                                            />
                                                            <InputError message={errorRecord.ends_at} />
                                                        </div>
                                                    )}

                                                    <div className="grid gap-1.5">
                                                        <Label htmlFor="user-sanction-reason">
                                                            Reason shown to the user
                                                        </Label>
                                                        <Textarea
                                                            id="user-sanction-reason"
                                                            name="reason"
                                                            required
                                                            minLength={5}
                                                            maxLength={2000}
                                                            placeholder="Explain why this action is being taken."
                                                        />
                                                        <InputError message={errorRecord.reason} />
                                                    </div>

                                                    <div className="grid gap-1.5">
                                                        <Label htmlFor="user-sanction-internal">
                                                            Internal admin note
                                                        </Label>
                                                        <Textarea
                                                            id="user-sanction-internal"
                                                            name="internal_note"
                                                            required
                                                            minLength={3}
                                                            maxLength={3000}
                                                            placeholder="Internal context for administrators."
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
                                                                onClick={handleSanctionConfirmCheck}
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
                                                                            This action applies immediately to{' '}
                                                                            {user.name} and records an immutable audit
                                                                            entry.
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
                                                            Record action
                                                        </Button>
                                                    )}
                                                </>
                                            );
                                        }}
                                    </Form>
                                </CardContent>
                            </Card>
                        )}
                    </aside>
                </div>
            </div>
        </>
    );
}

function Detail({ label, value }: { label: string; value: string | null }) {
    return (
        <div className="space-y-1">
            <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
            <dd className="whitespace-pre-wrap break-words text-sm text-foreground">{value || 'Not provided'}</dd>
        </div>
    );
}

AdminUserShow.layout = (page: ReactNode) => <AdminLayout>{page}</AdminLayout>;
