import { Head } from '@inertiajs/react';
import { Info } from 'lucide-react';
import { ReportDetails } from '@/components/report-details';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { COMPLETION_PAYMENT_NOTICE } from '@/constants/notices';

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
            <div className="page space-y-5">
                <ReportDetails
                    report={report}
                    canReply={canReply}
                    statementMaxLength={statementMaxLength}
                    afterHeader={
                        <div className="space-y-3">
                            {status && (
                                <div
                                    role="status"
                                    className="rounded-lg border border-success-border bg-success-bg px-4 py-3 text-sm text-success-fg"
                                >
                                    {status}
                                </div>
                            )}
                            <Alert variant="info">
                                <Info aria-hidden="true" />
                                {responseTargetDays && (
                                    <AlertTitle className="tabular-nums">
                                        Target review time: {responseTargetDays} days
                                    </AlertTitle>
                                )}
                                <AlertDescription>{COMPLETION_PAYMENT_NOTICE}</AlertDescription>
                            </Alert>
                        </div>
                    }
                />
                {report.status === 'open' && contactLine && (
                    <p className="text-xs text-muted-foreground">{contactLine}</p>
                )}
            </div>
        </>
    );
}
