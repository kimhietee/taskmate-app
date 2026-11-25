import { Form } from '@inertiajs/react';
import { Download, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import InputError from '@/components/input-error';
import { ReportStatusBadge } from '@/components/report-status-badge';
import { STATUS, StatusBadge } from '@/components/status-badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { formatAmount, formatDateTime } from '@/lib/format';
import reports from '@/routes/reports';

type Person = {
    id: number;
    name: string;
    type: string;
    verificationStatus: string;
};

type Report = {
    id: number;
    type: string;
    typeLabel: string;
    status: string;
    statusLabel: string;
    outcome: string | null;
    outcomeLabel: string | null;
    adminNote: string | null;
    resolutionMessage?: string | null;
    description: string;
    createdAt: string | null;
    reporter: Person;
    reportedUser: Person;
    task: { id: number; title: string };
    agreement: {
        id: number;
        finalAmount: string | null;
        paymentArrangement: string | null;
        dueDate: string | null;
        recordReference: string | null;
    } | null;
    completion: {
        deliveredAt: string | null;
        deliveredNote: string | null;
        completedAt: string | null;
        completionNote: string | null;
    } | null;
    paymentEvents: {
        id: number;
        event: string;
        actorName: string;
        amount: string | null;
        paidOn: string | null;
        method: string | null;
        note: string | null;
        createdAt: string | null;
        amountMismatch: boolean;
    }[];
    statements: {
        id: number;
        name: string;
        role: string;
        body: string;
        createdAt: string | null;
    }[];
    evidence: {
        id: number;
        name: string;
        mime: string;
        sizeBytes: number;
        downloadUrl: string;
    }[];
    relatedTask?: any;
    reporterSanctions?: any[];
    reportedUserSanctions?: any[];
    reporterPriorReports?: number;
    reportedUserPriorReports?: number;
    versions?: any[];
    messageSnapshots?: {
        sender: string;
        body: string;
        sentAt: string | null;
        isReportedMessage: boolean;
    }[];
};

function formatFieldLabel(key: string): string {
    const spaced = key.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`);

    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function ReportDetails({
    report,
    canReply = false,
    statementMaxLength = 3000,
    afterHeader,
}: {
    report: Report;
    canReply?: boolean;
    statementMaxLength?: number;
    afterHeader?: ReactNode;
}) {
    return (
        <div className="space-y-5">
            <header className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                        {report.typeLabel} · Task: {report.task.title}
                    </p>
                    <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Report #{report.id}</h1>
                    <p className="text-sm tabular-nums text-muted-foreground">
                        Submitted {report.createdAt ? formatDateTime(report.createdAt) : '—'}
                    </p>
                </div>
                <ReportStatusBadge status={report.status} label={report.statusLabel} />
            </header>

            {afterHeader}

            <Card>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                        <h2 className="text-sm font-semibold text-muted-foreground">Reporter</h2>
                        <p className="text-base font-semibold text-foreground">{report.reporter.name}</p>
                        <p className="text-sm text-muted-foreground">
                            {report.reporter.type} · {report.reporter.verificationStatus.replaceAll('_', ' ')}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-sm font-semibold text-muted-foreground">Reported person</h2>
                        <p className="text-base font-semibold text-foreground">{report.reportedUser.name}</p>
                        <p className="text-sm text-muted-foreground">
                            {report.reportedUser.type} · {report.reportedUser.verificationStatus.replaceAll('_', ' ')}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {(report.reporterSanctions || report.reportedUserSanctions) && (
                <Card>
                    <CardContent className="grid gap-5 sm:grid-cols-2">
                        {[
                            [report.reporter, report.reporterSanctions ?? [], report.reporterPriorReports ?? 0] as const,
                            [
                                report.reportedUser,
                                report.reportedUserSanctions ?? [],
                                report.reportedUserPriorReports ?? 0,
                            ] as const,
                        ].map(([person, sanctions, prior]) => (
                            <div key={person.id} className="space-y-2">
                                <h2 className="text-base font-semibold text-foreground">
                                    {person.name}: prior reports and sanctions
                                </h2>
                                <p className="text-sm tabular-nums text-muted-foreground">Prior reports: {prior}</p>
                                {sanctions.length ? (
                                    <ul className="space-y-1.5 text-sm">
                                        {sanctions.map((sanction: any, index: number) => (
                                            <li
                                                key={index}
                                                className="rounded-md border border-border bg-muted/30 px-3 py-2"
                                            >
                                                <span className="font-semibold">{sanction.type}:</span>{' '}
                                                {sanction.reason}
                                                {sanction.active ? ' (active)' : ''}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No sanctions recorded.</p>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {report.relatedTask && (
                <Card>
                    <CardHeader>
                        <CardTitle>Related task record</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <dl className="grid gap-3 text-sm sm:grid-cols-2">
                            {Object.entries(report.relatedTask)
                                .filter(
                                    ([key, value]) =>
                                        !['id', 'flags', 'applications'].includes(key) &&
                                        value !== null &&
                                        typeof value !== 'object',
                                )
                                .map(([key, value]) => (
                                    <div key={key} className="space-y-0.5 rounded-lg border border-border bg-muted/20 p-3">
                                        <dt className="text-xs font-semibold text-muted-foreground">
                                            {formatFieldLabel(key)}
                                        </dt>
                                        <dd className="whitespace-pre-wrap break-words text-foreground">
                                            {String(value)}
                                        </dd>
                                    </div>
                                ))}
                        </dl>

                        <div className="space-y-2 border-t border-border pt-4">
                            <h3 className="text-sm font-semibold text-foreground">Applications</h3>
                            {report.relatedTask.applications?.length ? (
                                <ul className="space-y-1.5 text-sm">
                                    {report.relatedTask.applications.map((application: any, index: number) => (
                                        <li
                                            key={index}
                                            className="rounded-md border border-border bg-muted/20 px-3 py-2 tabular-nums"
                                        >
                                            {application.applicantName} · {application.status} · {application.createdAt}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground">No applications recorded.</p>
                            )}
                        </div>

                        <div className="space-y-2 border-t border-border pt-4">
                            <h3 className="text-sm font-semibold text-foreground">Content flags</h3>
                            {report.relatedTask.flags?.length ? (
                                <ul className="space-y-1.5 text-sm">
                                    {report.relatedTask.flags.map((flag: any) => (
                                        <li
                                            key={flag.id}
                                            className="rounded-md border border-border bg-muted/20 px-3 py-2"
                                        >
                                            {flag.category} · {flag.field} · {flag.status}
                                            {flag.matched?.length ? ` · ${flag.matched.join(', ')}` : ''}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground">No content flags recorded.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {report.agreement && (
                <Card>
                    <CardHeader>
                        <CardTitle>Locked agreement</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="grid gap-3 text-sm sm:grid-cols-2">
                            <div className="space-y-1">
                                <dt className="text-xs font-semibold text-muted-foreground">Agreed amount</dt>
                                <dd className="tabular-nums font-semibold text-foreground">
                                    ₱{formatAmount(report.agreement.finalAmount)}
                                </dd>
                            </div>
                            <div className="space-y-1">
                                <dt className="text-xs font-semibold text-muted-foreground">Due date</dt>
                                <dd className="tabular-nums text-foreground">{report.agreement.dueDate ?? '—'}</dd>
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                                <dt className="text-xs font-semibold text-muted-foreground">Payment arrangement</dt>
                                <dd className="whitespace-pre-wrap text-foreground">
                                    {report.agreement.paymentArrangement}
                                </dd>
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                                <dt className="text-xs font-semibold text-muted-foreground">Record reference</dt>
                                <dd className="font-mono text-xs break-all text-foreground">
                                    {report.agreement.recordReference}
                                </dd>
                            </div>
                        </dl>
                    </CardContent>
                </Card>
            )}

            {report.versions?.map((version: any) => (
                <Card key={version.version}>
                    <CardHeader>
                        <CardTitle className="text-base tabular-nums">
                            Agreement version {version.version} · {version.proposer}
                        </CardTitle>
                        <CardDescription>
                            Confirmed by:{' '}
                            {version.confirmations.map((item: any) => `${item.name} (${item.at})`).join(', ') ||
                                'No confirmations'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <dl className="grid gap-3 text-sm sm:grid-cols-2">
                            <div className="space-y-1">
                                <dt className="text-xs font-semibold text-muted-foreground">Agreed amount</dt>
                                <dd className="tabular-nums font-semibold text-foreground">
                                    ₱{formatAmount(version.finalAmount)}
                                </dd>
                            </div>
                            <div className="space-y-1">
                                <dt className="text-xs font-semibold text-muted-foreground">Dates</dt>
                                <dd className="tabular-nums text-foreground">
                                    {version.startDate ?? '—'} to {version.dueDate}
                                </dd>
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                                <dt className="text-xs font-semibold text-muted-foreground">Deliverables</dt>
                                <dd className="whitespace-pre-wrap text-foreground">{version.deliverables}</dd>
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                                <dt className="text-xs font-semibold text-muted-foreground">Work arrangement</dt>
                                <dd className="text-foreground">
                                    {version.workMode} · {version.workplaceName ?? 'Remote'}
                                    {version.workplaceAddress ? ` · ${version.workplaceAddress}` : ''}
                                </dd>
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                                <dt className="text-xs font-semibold text-muted-foreground">Payment arrangement</dt>
                                <dd className="whitespace-pre-wrap text-foreground">
                                    {version.paymentArrangement}
                                </dd>
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                                <dt className="text-xs font-semibold text-muted-foreground">Terms</dt>
                                <dd className="whitespace-pre-wrap text-foreground">{version.terms}</dd>
                            </div>
                            {version.comment && (
                                <div className="space-y-1 sm:col-span-2">
                                    <dt className="text-xs font-semibold text-muted-foreground">Note</dt>
                                    <dd className="whitespace-pre-wrap text-foreground">{version.comment}</dd>
                                </div>
                            )}
                            <div className="space-y-1 sm:col-span-2">
                                <dt className="text-xs font-semibold text-muted-foreground">Version hash</dt>
                                <dd className="font-mono text-xs break-all text-muted-foreground">{version.hash}</dd>
                            </div>
                        </dl>
                    </CardContent>
                </Card>
            ))}

            {report.messageSnapshots?.length ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Reported conversation context</CardTitle>
                        <CardDescription>
                            Only the reported message and the limited surrounding context are included here.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {report.messageSnapshots.map((message, index) => (
                            <article
                                key={index}
                                className={`rounded-lg border p-3.5 text-sm ${
                                    message.isReportedMessage
                                        ? 'border-warning-border bg-warning-bg text-warning-fg'
                                        : 'border-border bg-muted/20 text-foreground'
                                }`}
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="font-semibold tabular-nums">
                                        {message.sender} · {message.sentAt ?? '—'}
                                    </p>
                                    {message.isReportedMessage && (
                                        <StatusBadge tone={STATUS.attention[0]} icon={STATUS.attention[1]}>
                                            Reported message
                                        </StatusBadge>
                                    )}
                                </div>
                                <p className="mt-1.5 whitespace-pre-wrap break-words">{message.body}</p>
                            </article>
                        ))}
                    </CardContent>
                </Card>
            ) : null}

            <Card>
                <CardHeader>
                    <CardTitle>Report description</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{report.description}</p>
                </CardContent>
            </Card>

            {report.completion && (
                <Card>
                    <CardHeader>
                        <CardTitle>Completion record</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="grid gap-3 text-sm sm:grid-cols-2">
                            <div className="space-y-1">
                                <dt className="text-xs font-semibold text-muted-foreground">Delivered</dt>
                                <dd className="tabular-nums text-foreground">
                                    {report.completion.deliveredAt
                                        ? formatDateTime(report.completion.deliveredAt)
                                        : 'Not marked'}
                                </dd>
                                {report.completion.deliveredNote && (
                                    <dd className="whitespace-pre-wrap text-muted-foreground">
                                        {report.completion.deliveredNote}
                                    </dd>
                                )}
                            </div>
                            <div className="space-y-1">
                                <dt className="text-xs font-semibold text-muted-foreground">Completed</dt>
                                <dd className="tabular-nums text-foreground">
                                    {report.completion.completedAt
                                        ? formatDateTime(report.completion.completedAt)
                                        : 'Not recorded'}
                                </dd>
                                {report.completion.completionNote && (
                                    <dd className="whitespace-pre-wrap text-muted-foreground">
                                        {report.completion.completionNote}
                                    </dd>
                                )}
                            </div>
                        </dl>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Payment timeline</CardTitle>
                </CardHeader>
                <CardContent>
                    {report.paymentEvents.length ? (
                        <div className="space-y-3">
                            {report.paymentEvents.map((event) => (
                                <article
                                    key={event.id}
                                    className={`space-y-1 rounded-lg border p-3.5 text-sm ${
                                        event.amountMismatch
                                            ? 'border-warning-border bg-warning-bg text-warning-fg'
                                            : 'border-border bg-muted/20 text-foreground'
                                    }`}
                                >
                                    <p className="font-semibold tabular-nums">
                                        {event.event.replaceAll('_', ' ')} · {event.actorName} ·{' '}
                                        {event.createdAt ? formatDateTime(event.createdAt) : '—'}
                                    </p>
                                    <p className="tabular-nums">
                                        {event.amount !== null ? `₱${formatAmount(event.amount)}` : ''}
                                        {event.paidOn ? ` · paid ${event.paidOn}` : ''}
                                        {event.method ? ` · ${event.method}` : ''}
                                    </p>
                                    {event.amountMismatch && (
                                        <p className="font-semibold text-warning-fg">
                                            This amount differs from the agreed amount.
                                        </p>
                                    )}
                                    {event.note && <p className="whitespace-pre-wrap">{event.note}</p>}
                                </article>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No payment events were recorded.</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Statements</CardTitle>
                </CardHeader>
                <CardContent>
                    {report.statements.length ? (
                        <div className="divide-y divide-border">
                            {report.statements.map((statement) => (
                                <article key={statement.id} className="py-3 first:pt-0 last:pb-0">
                                    <div className="flex flex-wrap items-center gap-2 text-sm">
                                        <span className="font-semibold text-foreground">{statement.name}</span>
                                        <Badge variant="neutral">{statement.role}</Badge>
                                        <span className="text-xs tabular-nums text-muted-foreground">
                                            {statement.createdAt ? formatDateTime(statement.createdAt) : '—'}
                                        </span>
                                    </div>
                                    <p className="mt-1.5 whitespace-pre-wrap text-sm text-foreground">
                                        {statement.body}
                                    </p>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No response has been added.</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Evidence</CardTitle>
                </CardHeader>
                <CardContent>
                    {report.evidence.length ? (
                        <ul className="divide-y divide-border">
                            {report.evidence.map((evidence) => (
                                <li
                                    key={evidence.id}
                                    className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm first:pt-0 last:pb-0"
                                >
                                    <span className="tabular-nums text-foreground">
                                        {evidence.name} · {(evidence.sizeBytes / 1024).toFixed(0)} KB
                                    </span>
                                    <Button variant="outline" size="sm" asChild>
                                        <a href={evidence.downloadUrl}>
                                            <Download aria-hidden="true" />
                                            Download file
                                        </a>
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted-foreground">No files were submitted.</p>
                    )}
                </CardContent>
            </Card>

            {report.outcomeLabel && (
                <Card>
                    <CardHeader>
                        <CardTitle>Review result</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <p className="font-medium text-foreground">Outcome: {report.outcomeLabel}</p>
                        {report.adminNote && (
                            <p className="whitespace-pre-wrap text-muted-foreground">{report.adminNote}</p>
                        )}
                    </CardContent>
                </Card>
            )}

            {report.resolutionMessage && (
                <Card>
                    <CardHeader>
                        <CardTitle>Message from the administrators</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="whitespace-pre-wrap text-sm text-foreground">{report.resolutionMessage}</p>
                    </CardContent>
                </Card>
            )}

            {canReply && (
                <Card>
                    <CardHeader>
                        <CardTitle>Add your response</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Form
                            {...reports.reply.form(report.id)}
                            encType="multipart/form-data"
                            className="space-y-4"
                        >
                            {({ errors, processing }) => (
                                <>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="reply-body">Your response</Label>
                                        <Textarea
                                            id="reply-body"
                                            name="body"
                                            required
                                            maxLength={statementMaxLength}
                                            placeholder="Share a response or relevant context."
                                            aria-describedby={errors.body ? 'reply-body-error' : undefined}
                                        />
                                        <InputError id="reply-body-error" message={errors.body} />
                                    </div>

                                    <Alert variant="warning">
                                        <TriangleAlert aria-hidden="true" />
                                        <AlertDescription>
                                            Do not upload government ID photos, selfies, or other sensitive documents
                                            beyond what is needed. Administrators and both parties will see uploaded
                                            evidence.
                                        </AlertDescription>
                                    </Alert>

                                    <div className="grid gap-1.5">
                                        <Label htmlFor="reply-evidence">Evidence files (optional)</Label>
                                        <Input
                                            id="reply-evidence"
                                            name="evidence[]"
                                            type="file"
                                            multiple
                                            accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                                            className="cursor-pointer py-2 file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-foreground"
                                            aria-describedby={
                                                errors.evidence || errors['evidence.0']
                                                    ? 'reply-evidence-error'
                                                    : undefined
                                            }
                                        />
                                        <InputError
                                            id="reply-evidence-error"
                                            message={errors.evidence ?? errors['evidence.0']}
                                        />
                                    </div>

                                    <Button type="submit" disabled={processing}>
                                        {processing && <Spinner />}
                                        Add response
                                    </Button>
                                </>
                            )}
                        </Form>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
