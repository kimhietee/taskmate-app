import { Head } from '@inertiajs/react';
import { TriangleAlert } from 'lucide-react';
import { AgreementDetails } from '@/components/agreement-details';
import type { CompletionPaymentData } from '@/components/completion-payment-panel';
import { ProblemReportForm } from '@/components/problem-report-form';
import { Alert, AlertDescription } from '@/components/ui/alert';

type ShowAgreementProps = {
    agreement: any;
    completionPayment: CompletionPaymentData;
    ratings?: React.ComponentProps<typeof AgreementDetails>['ratings'];
    viewerId: number;
    actionsAllowed: boolean;
    notice: string;
    termsMaxLength: number;
    status?: string | null;
    problemReport?: { action: string; types: { value: string; label: string }[] };
    offPlatformWarning?: boolean;
};

export default function ShowAgreement(props: ShowAgreementProps) {
    const hasTopBar = Boolean(props.status || props.offPlatformWarning || props.problemReport);

    return (
        <>
            <Head title={`Agreement: ${props.agreement.task.title}`} />
            {hasTopBar && (
                <div className="page space-y-4 pb-0 print:hidden">
                    {props.status && (
                        <div
                            role="status"
                            className="rounded-lg border border-info-border bg-info-bg px-4 py-3 text-sm text-info-fg"
                        >
                            {props.status}
                        </div>
                    )}
                    {props.offPlatformWarning && (
                        <Alert variant="warning">
                            <TriangleAlert aria-hidden="true" />
                            <AlertDescription>
                                This message contains a request to move outside TaskMate or skip its steps. Be careful,
                                keep agreements and communications on record, and report anything that makes you
                                uncomfortable.
                            </AlertDescription>
                        </Alert>
                    )}
                    {props.problemReport && <ProblemReportForm {...props.problemReport} />}
                </div>
            )}
            <AgreementDetails {...props} />
        </>
    );
}
