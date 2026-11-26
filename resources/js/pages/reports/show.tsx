import { Head } from '@inertiajs/react';
import { ReportDetails } from '@/components/report-details';

import { COMPLETION_PAYMENT_NOTICE } from '@/constants/notices';
const notice = COMPLETION_PAYMENT_NOTICE;

export default function ShowReport({
    report,
    canReply,
    status,
    statementMaxLength,
    responseTargetDays,
    contactLine,
}: {
    report: any;
    canReply: boolean;
    status?: string | null;
    statementMaxLength: number;
    responseTargetDays?: number | null;
    contactLine?: string;
}) {
    return (
        <>
            <Head title={`Report #${report.id}`} />
            <main className="report-detail-page">
                <header className="report-detail-hero">
                    <p className="reports-page-eyebrow">Report update</p>
                    <h1>Report #{report.id}</h1>
                    <p>Review the current status and any response related to your report.</p>
                </header>
                <p className="reports-boundary-notice">
                    {notice}
                </p>
                {responseTargetDays && (
                    <p className="report-response-target">
                        Target review time: {responseTargetDays} days
                    </p>
                )}
                {status && (
                    <div
                        role="status"
                        className="reports-status"
                    >
                        {status}
                    </div>
                )}
                <ReportDetails
                    report={report}
                    canReply={canReply}
                    statementMaxLength={statementMaxLength}
                />
                {report.status === 'open' && contactLine && (
                    <p className="report-contact-line">
                        {contactLine}
                    </p>
                )}
            </main>
        </>
    );
}
