import { Head } from '@inertiajs/react';
import { AgreementDetails } from '@/components/agreement-details';
import { ProblemReportForm } from '@/components/problem-report-form';

export default function ShowAgreement(props: { agreement: any; completionPayment: import('@/components/completion-payment-panel').CompletionPaymentData; viewerId: number; notice: string; termsMaxLength: number; status?: string | null; problemReport?: { action: string; types: { value: string; label: string }[] }; offPlatformWarning?: boolean }) {
    return <>
        <Head title={`Agreement: ${props.agreement.task.title}`} />
        <div className="print:hidden">
            {props.status && <p role="status" className="mx-auto mt-4 max-w-4xl rounded-xl border border-[#9dc8aa] bg-[#eaf4ec] px-4 py-3 text-sm text-[#183324] dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100">{props.status}</p>}
            {props.offPlatformWarning && <p role="alert" className="mx-auto mt-4 max-w-4xl rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:border-amber-800 dark:bg-amber-300/10 dark:text-amber-100">This message contains a request to move outside TaskMate or skip its steps. Be careful, keep agreements and communications on record, and report anything that makes you uncomfortable.</p>}
            {props.problemReport && <div className="mx-auto mt-4 max-w-4xl px-4"><ProblemReportForm {...props.problemReport} /></div>}
        </div>
        <AgreementDetails {...props} />
    </>;
}
