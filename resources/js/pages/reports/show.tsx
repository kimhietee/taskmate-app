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
            <main className="mx-auto max-w-4xl space-y-5 p-4 sm:p-6">
                <p className="rounded-lg border bg-muted/40 p-4 text-sm">
                    {notice}
                </p>
                {responseTargetDays && (
                    <p className="text-sm">
                        Target review time: {responseTargetDays} days
                    </p>
                )}
                {status && (
                    <div
                        role="status"
                        className="rounded-lg border p-3 text-sm"
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
                    <p className="text-xs text-muted-foreground">
                        {contactLine}
                    </p>
                )}
            </main>
        </>
    );
}
