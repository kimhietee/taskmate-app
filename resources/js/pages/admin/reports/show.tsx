import { Form, Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Info, TriangleAlert } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import InputError from '@/components/input-error';
import { ReportDetails } from '@/components/report-details';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/layouts/admin-layout';
import { formatDateTime } from '@/lib/format';
import admin from '@/routes/admin';

type SanctionAction = 'warning' | 'require_verification' | 'suspend' | 'ban' | 'remove_post';

const NATIVE_SELECT_CLASS =
    'focus-ring h-11 w-full rounded-md border border-input bg-field px-3 text-sm text-foreground shadow-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 md:h-9';

const SANCTION_LABELS: Record<SanctionAction, string> = {
    warning: 'Issue warning',
    require_verification: 'Require additional verification',
    suspend: 'Suspend user',
    ban: 'Ban user',
    remove_post: 'Remove related post',
};

const DESTRUCTIVE_SANCTIONS = new Set<SanctionAction>(['suspend', 'ban', 'remove_post']);

function DecisionForm({
    reportId,
    decision,
    label,
    noteRequired,
    variant,
    showOutcome = false,
    confirmRequired = false,
}: {
    reportId: number;
    decision: string;
    label: string;
    noteRequired: boolean;
    variant: 'default' | 'outline' | 'destructive';
    showOutcome?: boolean;
    confirmRequired?: boolean;
}) {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const formId = `report-decision-${decision}`;
    const noteId = `report-note-${decision}`;
    const resolutionMsgId = `report-resolution-msg-${decision}`;

    const openConfirmIfValid = () => {
        const form = document.getElementById(formId) as HTMLFormElement | null;
        if (form?.reportValidity()) {
            setConfirmOpen(true);
        }
    };

    return (
        <Form
            {...admin.reports.decision.form(reportId)}
            id={formId}
            onSuccess={() => setConfirmOpen(false)}
            onError={() => setConfirmOpen(false)}
            className="space-y-3 rounded-lg border border-border bg-muted/20 p-3.5"
        >
            {({ errors, processing }) => {
                const errorRecord = errors as Record<string, string | undefined>;

                return (
                    <>
                        <input type="hidden" name="decision" value={decision} />
                        <h3 className="text-sm font-semibold text-foreground">{label}</h3>

                        {showOutcome && (
                            <div className="grid gap-1.5">
                                <Label htmlFor="report-outcome">Outcome</Label>
                                <select id="report-outcome" name="outcome" required className={NATIVE_SELECT_CLASS}>
                                    <option value="">Choose an outcome</option>
                                    <option value="supported">Supported</option>
                                    <option value="not_supported">Not supported</option>
                                    <option value="inconclusive">Inconclusive</option>
                                </select>
                                <InputError message={errorRecord.outcome} />
                            </div>
                        )}

                        {decision === 'resolve' && (
                            <div className="grid gap-1.5">
                                <Label htmlFor={resolutionMsgId}>Message to reporter (optional)</Label>
                                <Textarea
                                    id={resolutionMsgId}
                                    name="resolution_message"
                                    maxLength={3000}
                                    placeholder="Optional message visible to the reporter"
                                />
                                <InputError message={errorRecord.resolution_message} />
                            </div>
                        )}

                        <div className="grid gap-1.5">
                            <Label htmlFor={noteId}>
                                Internal note {noteRequired ? '(required)' : '(optional)'}
                            </Label>
                            <Textarea
                                id={noteId}
                                name="note"
                                required={noteRequired}
                                maxLength={3000}
                                placeholder={noteRequired ? 'Required internal note' : 'Optional internal note'}
                            />
                            <InputError message={errorRecord.note} />
                        </div>

                        {confirmRequired ? (
                            <>
                                <Button
                                    type="button"
                                    variant={variant}
                                    className="w-full"
                                    disabled={processing}
                                    onClick={openConfirmIfValid}
                                >
                                    {label}
                                </Button>

                                <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Dismiss this report?</DialogTitle>
                                            <DialogDescription>
                                                The report will be closed as dismissed and your note will be recorded in
                                                the audit trail.
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
                                                Confirm dismiss report
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

function AdminReportShow({
    report,
    canReview,
    notice,
}: {
    report: any;
    canReview: boolean;
    notice: string;
}) {
    const flashStatus = (usePage().props as { flash?: { status?: string | null } }).flash?.status;
    const [sanctionAction, setSanctionAction] = useState<SanctionAction>('warning');
    const [sanctionDialogOpen, setSanctionDialogOpen] = useState(false);

    const sanctionRequiresConfirm = DESTRUCTIVE_SANCTIONS.has(sanctionAction);
    const sanctionFormId = `report-sanction-${report.id}`;

    const handleSanctionConfirmCheck = () => {
        const form = document.getElementById(sanctionFormId) as HTMLFormElement | null;
        if (form?.reportValidity()) {
            setSanctionDialogOpen(true);
        }
    };

    return (
        <>
            <Head title={`Review report #${report.id}`} />
            <div className="space-y-6">
                {flashStatus && (
                    <div
                        role="status"
                        className="rounded-lg border border-success-border bg-success-bg px-4 py-3 text-sm text-success-fg"
                    >
                        {flashStatus}
                    </div>
                )}

                <div>
                    <Button variant="ghost" size="sm" asChild className="-ml-2">
                        <Link href={admin.reports.index()}>
                            <ArrowLeft aria-hidden="true" />
                            Back to reports
                        </Link>
                    </Button>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
                    <div className="min-w-0">
                        <ReportDetails
                            report={report}
                            afterHeader={
                                <div className="space-y-3">
                                    <Alert variant="warning">
                                        <TriangleAlert aria-hidden="true" />
                                        <AlertDescription>{notice}</AlertDescription>
                                    </Alert>
                                    {report.escalatedAt && (
                                        <Alert variant="warning">
                                            <TriangleAlert aria-hidden="true" />
                                            <AlertDescription className="tabular-nums">
                                                Escalated {formatDateTime(report.escalatedAt)}
                                                {report.escalationNote ? `: ${report.escalationNote}` : ''}
                                                {report.escalationOfficeLabel
                                                    ? ` · ${report.escalationOfficeLabel}`
                                                    : ''}
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                            }
                        />
                    </div>

                    <aside className="space-y-6 lg:sticky lg:top-[calc(var(--banner-h,0px)+1.5rem)]">
                        {canReview ? (
                            <>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Review decision</CardTitle>
                                        <CardDescription>
                                            Update status, escalate, resolve, or dismiss this report.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <DecisionForm
                                            reportId={report.id}
                                            decision="start_review"
                                            label="Start review"
                                            noteRequired={false}
                                            variant="outline"
                                        />
                                        <DecisionForm
                                            reportId={report.id}
                                            decision="escalate"
                                            label="Escalate"
                                            noteRequired
                                            variant="outline"
                                        />
                                        <DecisionForm
                                            reportId={report.id}
                                            decision="resolve"
                                            label="Resolve report"
                                            noteRequired
                                            showOutcome
                                            variant="default"
                                        />
                                        <DecisionForm
                                            reportId={report.id}
                                            decision="dismiss"
                                            label="Dismiss report"
                                            noteRequired
                                            variant="destructive"
                                            confirmRequired
                                        />
                                    </CardContent>
                                </Card>

                                {report.reportedUser && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Platform action</CardTitle>
                                            <CardDescription>For {report.reportedUser.name}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <Form
                                                {...admin.users.sanctions.form(report.reportedUser.id)}
                                                id={sanctionFormId}
                                                onSuccess={() => setSanctionDialogOpen(false)}
                                                onError={() => setSanctionDialogOpen(false)}
                                                className="space-y-4"
                                            >
                                                {({ processing, errors }) => {
                                                    const errorRecord = errors as Record<string, string | undefined>;

                                                    return (
                                                        <>
                                                            <input type="hidden" name="report_id" value={report.id} />

                                                            <div className="grid gap-1.5">
                                                                <Label htmlFor="report-sanction-action">Action</Label>
                                                                <select
                                                                    id="report-sanction-action"
                                                                    name="action"
                                                                    className={NATIVE_SELECT_CLASS}
                                                                    value={sanctionAction}
                                                                    onChange={(event) =>
                                                                        setSanctionAction(
                                                                            event.target.value as SanctionAction,
                                                                        )
                                                                    }
                                                                >
                                                                    {(
                                                                        Object.keys(SANCTION_LABELS) as SanctionAction[]
                                                                    ).map((key) => (
                                                                        <option key={key} value={key}>
                                                                            {SANCTION_LABELS[key]}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                <InputError message={errorRecord.action} />
                                                            </div>

                                                            {sanctionAction === 'remove_post' && (
                                                                <div className="grid gap-1.5">
                                                                    <Label htmlFor="report-sanction-task">
                                                                        Task ID to remove
                                                                    </Label>
                                                                    <Input
                                                                        id="report-sanction-task"
                                                                        name="task_id"
                                                                        type="number"
                                                                        defaultValue={report.task.id}
                                                                        required
                                                                        className="tabular-nums"
                                                                        onKeyDown={(event) => {
                                                                            if (event.key === 'Enter') {
                                                                                event.preventDefault();
                                                                                handleSanctionConfirmCheck();
                                                                            }
                                                                        }}
                                                                    />
                                                                    <InputError message={errorRecord.task_id} />
                                                                </div>
                                                            )}

                                                            {sanctionAction === 'suspend' && (
                                                                <div className="grid gap-1.5">
                                                                    <Label htmlFor="report-sanction-ends">
                                                                        Suspension ends at
                                                                    </Label>
                                                                    <Input
                                                                        id="report-sanction-ends"
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
                                                                <Label htmlFor="report-sanction-reason">
                                                                    Reason visible to the user
                                                                </Label>
                                                                <Textarea
                                                                    id="report-sanction-reason"
                                                                    name="reason"
                                                                    required
                                                                    minLength={5}
                                                                    maxLength={2000}
                                                                    placeholder="Reason visible to the user"
                                                                />
                                                                <InputError message={errorRecord.reason} />
                                                            </div>

                                                            <div className="grid gap-1.5">
                                                                <Label htmlFor="report-sanction-internal">
                                                                    Internal admin note
                                                                </Label>
                                                                <Textarea
                                                                    id="report-sanction-internal"
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
                                                                                    Confirm{' '}
                                                                                    {SANCTION_LABELS[sanctionAction]}?
                                                                                </DialogTitle>
                                                                                <DialogDescription>
                                                                                    This applies immediately against{' '}
                                                                                    {report.reportedUser.name} and
                                                                                    writes to the audit log.
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
                                                                                    Confirm{' '}
                                                                                    {SANCTION_LABELS[sanctionAction]}
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
                                )}
                            </>
                        ) : ['open', 'under_review'].includes(report.status) ? (
                            <Alert variant="info">
                                <Info aria-hidden="true" />
                                <AlertDescription>
                                    This report is not available for review by this administrator.
                                </AlertDescription>
                            </Alert>
                        ) : null}
                    </aside>
                </div>
            </div>
        </>
    );
}

AdminReportShow.layout = (page: ReactNode) => <AdminLayout>{page}</AdminLayout>;

export default AdminReportShow;
