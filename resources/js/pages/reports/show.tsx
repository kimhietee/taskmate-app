import { Head } from '@inertiajs/react';
import { Clock3, Info } from 'lucide-react';
import { ReportDetails } from '@/components/report-details';
import { COMPLETION_PAYMENT_NOTICE } from '@/constants/notices';

export default function ShowReport({ report, canReply, status, statementMaxLength, responseTargetDays, contactLine }: { report: any; canReply: boolean; status?: string | null; statementMaxLength: number; responseTargetDays?: number | null; contactLine?: string }) {
    return <>
        <Head title={`Report #${report.id}`} />
        <main className="min-h-full bg-[#f7f8f2] px-4 py-7 text-[#183324] dark:bg-[#101b15] dark:text-[#EDF4EC] sm:px-6 sm:py-9">
            <div className="mx-auto max-w-4xl space-y-4">
                <div className="flex items-start gap-3 rounded-2xl border border-[#dce9df] bg-white p-4 text-sm leading-6 text-[#526458] shadow-sm dark:border-[#31483a] dark:bg-[#17251c] dark:text-[#bdcbbf]"><Info className="mt-0.5 size-5 shrink-0 text-[#065F46] dark:text-amber-300" aria-hidden="true" /><p>{COMPLETION_PAYMENT_NOTICE}</p></div>
                {responseTargetDays && <p className="inline-flex items-center gap-2 rounded-full border border-[#dce8dd] bg-white px-3 py-1.5 text-xs font-medium text-[#526458] dark:border-[#31483a] dark:bg-[#17251c] dark:text-[#bdcbbf]"><Clock3 className="size-3.5 text-[#065F46] dark:text-amber-300" aria-hidden="true" />Target review time: {responseTargetDays} days</p>}
                {status && <div role="status" className="rounded-xl border border-[#9dc8aa] bg-[#eaf4ec] px-4 py-3 text-sm text-[#183324] dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100">{status}</div>}
                <ReportDetails report={report} canReply={canReply} statementMaxLength={statementMaxLength} />
                {report.status === 'open' && contactLine && <p className="rounded-xl border border-[#dce8dd] bg-white px-4 py-3 text-xs text-[#617166] dark:border-[#263c2e] dark:bg-[#17251c] dark:text-[#afc2b4]">{contactLine}</p>}
            </div>
        </main>
    </>;
}
