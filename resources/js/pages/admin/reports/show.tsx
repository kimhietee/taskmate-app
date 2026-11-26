import { Form, Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import InputError from '@/components/input-error';
import { ReportDetails } from '@/components/report-details';
import admin from '@/routes/admin';

function DecisionForm({
    reportId,
    options,
}: {
    reportId: number;
    options: { value: string; label: string }[];
}) {
    const [decision, setDecision] = useState('');
    const noteRequired = decision !== '' && decision !== 'start_review';

    return (
        <Form
            {...admin.reports.decision.form(reportId)}
            className="space-y-3 rounded-lg border p-4"
        >
            {({ errors, processing }) => (
                <>
                    <label className="grid gap-1 text-sm font-medium">
                        Action
                        <select
                            name="decision"
                            required
                            value={decision}
                            onChange={(event) =>
                                setDecision(event.target.value)
                            }
                            className="h-10 rounded-md border bg-background px-3"
                        >
                            <option value="">Choose an action</option>
                            {options.map(({ value, label }) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <InputError message={errors.decision} />
                    {decision === 'resolve' && (
                        <div>
                            <label
                                className="mb-1 block text-sm"
                                htmlFor="outcome"
                            >
                                Outcome
                            </label>
                            <select
                                id="outcome"
                                name="outcome"
                                required
                                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                            >
                                <option value="">Choose an outcome</option>
                                <option value="supported">Supported</option>
                                <option value="not_supported">
                                    Not supported
                                </option>
                                <option value="inconclusive">
                                    Inconclusive
                                </option>
                            </select>
                            <InputError message={errors.outcome} />
                        </div>
                    )}
                    {decision === 'resolve' && (
                        <Textarea
                            name="resolution_message"
                            maxLength={3000}
                            placeholder="Optional message visible to the reporter"
                            aria-label="Message to the reporter (optional)"
                        />
                    )}
                    {decision && (
                        <label className="grid gap-1 text-sm font-medium">
                            Internal note{noteRequired ? '' : ' (optional)'}
                            <Textarea
                                name="note"
                                required={noteRequired}
                                maxLength={3000}
                            />
                            <InputError message={errors.note} />
                        </label>
                    )}
                    <Button type="submit" disabled={processing || !decision}>
                        Save decision
                    </Button>
                </>
            )}
        </Form>
    );
}

function AdminReportShow({
    report,
    canReview,
    decisionOptions,
    canRemoveRelatedPost,
    notice,
    status,
}: {
    report: any;
    canReview: boolean;
    decisionOptions: { value: string; label: string }[];
    canRemoveRelatedPost: boolean;
    notice: string;
    status?: string;
}) {
    const [platformAction, setPlatformAction] = useState('warning');

    return (
        <>
            <Head title={`Review report #${report.id}`} />
            <div
                className="admin-page admin-report-detail space-y-4"
                data-tone="reports"
            >
                <Link href={admin.reports.index()} className="admin-back-link">
                    ← Back to reports
                </Link>
                <header className="admin-page-heading flex-wrap">
                    <div>
                        <p className="admin-page-eyebrow">
                            Report review · #{report.id}
                        </p>
                        <h1>{report.typeLabel ?? 'Report details'}</h1>
                        <p className="admin-page-description">
                            {report.task?.title ?? 'Related report record'}
                        </p>
                    </div>
                    <span
                        className="admin-pill"
                        data-variant={
                            report.status === 'open' ? 'urgent' : 'quiet'
                        }
                    >
                        {report.statusLabel ?? report.status}
                    </span>
                </header>
                {status && (
                    <p role="status" className="admin-notice">
                        {status}
                    </p>
                )}
                <p className="admin-notice">{notice}</p>
                <ReportDetails report={report} />
                {report.escalatedAt && (
                    <p className="rounded border p-3 text-sm">
                        Escalated {report.escalatedAt}: {report.escalationNote}
                        {report.escalationOfficeLabel
                            ? ` · ${report.escalationOfficeLabel}`
                            : ''}
                    </p>
                )}
                {canReview && (
                    <section className="admin-detail-card space-y-3">
                        <h2 className="text-lg font-semibold">
                            Review decision
                        </h2>
                        <DecisionForm
                            key={`${report.id}:${report.status}`}
                            reportId={report.id}
                            options={decisionOptions}
                        />
                        {report.reportedUser && (
                            <Form
                                action={`/admin/users/${report.reportedUser.id}/sanctions`}
                                method="post"
                                className="space-y-3 rounded-lg border p-4"
                            >
                                {({ errors, processing }) => (
                                    <>
                                        <h3 className="font-medium">
                                            Platform action for reported user
                                        </h3>
                                        <input
                                            type="hidden"
                                            name="report_id"
                                            value={report.id}
                                        />
                                        <select
                                            name="action"
                                            aria-label="Platform action"
                                            value={platformAction}
                                            onChange={(event) =>
                                                setPlatformAction(
                                                    event.target.value,
                                                )
                                            }
                                            className="h-10 rounded border bg-background px-3"
                                        >
                                            <option value="warning">
                                                Issue warning
                                            </option>
                                            <option value="suspend">
                                                Suspend user
                                            </option>
                                            {canRemoveRelatedPost && (
                                                <option value="remove_post">
                                                    Remove related post
                                                </option>
                                            )}
                                        </select>
                                        <InputError message={errors.action} />
                                        {platformAction === 'remove_post' && (
                                            <input
                                                type="hidden"
                                                name="task_id"
                                                value={report.task.id}
                                            />
                                        )}
                                        <InputError message={errors.task_id} />
                                        {platformAction === 'suspend' && (
                                            <label className="grid gap-1 text-sm font-medium">
                                                Suspension ends
                                                <input
                                                    name="ends_at"
                                                    type="datetime-local"
                                                    required
                                                    className="h-10 rounded border bg-background px-3"
                                                />
                                                <InputError
                                                    message={errors.ends_at}
                                                />
                                            </label>
                                        )}
                                        <Textarea
                                            name="reason"
                                            required
                                            minLength={5}
                                            maxLength={2000}
                                            placeholder="Reason visible to the user"
                                            aria-label="Reason visible to the user"
                                        />
                                        <InputError message={errors.reason} />
                                        <Textarea
                                            name="internal_note"
                                            required
                                            minLength={3}
                                            maxLength={3000}
                                            placeholder="Internal admin note"
                                            aria-label="Internal admin note"
                                        />
                                        <InputError
                                            message={errors.internal_note}
                                        />
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                        >
                                            Record platform action
                                        </Button>
                                        <Link
                                            href={admin.users.show(
                                                report.reportedUser.id,
                                            )}
                                            className="ml-3 text-sm underline"
                                        >
                                            Manage reported account
                                        </Link>
                                    </>
                                )}
                            </Form>
                        )}
                    </section>
                )}
                {!canReview &&
                    ['open', 'under_review'].includes(report.status) && (
                        <p className="rounded border p-4 text-sm">
                            This report is not available for review by this
                            administrator.
                        </p>
                    )}
            </div>
        </>
    );
}
AdminReportShow.layout = (page: React.ReactNode) => (
    <AdminLayout>{page}</AdminLayout>
);
export default AdminReportShow;
