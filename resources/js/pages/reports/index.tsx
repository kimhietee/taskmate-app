import { formatDate } from '@/lib/format';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { ReportStatusBadge } from '@/components/report-status-badge';
import reports from '@/routes/reports';
import { COMPLETION_PAYMENT_NOTICE } from '@/constants/notices';
import { ArrowRight, FileText, FolderOpen, Info } from 'lucide-react';

type Item = { id: number; typeLabel: string; status: string; statusLabel: string; taskTitle: string; otherParty: string; createdAt: string | null };
type Props = { reports: { data: Item[]; links: { url: string | null; label: string; active: boolean }[] }; status?: string | null };

export default function MyReports({ reports: page, status }: Props) {
    return <>
        <Head title="My reports" />
        <main className="min-h-full bg-[#f7f8f2] px-4 py-8 text-[#183324] dark:bg-[#101b15] dark:text-[#EDF4EC] sm:px-6 sm:py-10">
            <div className="mx-auto max-w-5xl space-y-6">
                <header className="rounded-2xl border border-[#dce8dd] bg-white p-5 shadow-sm dark:border-[#263c2e] dark:bg-[#17251c] sm:p-7">
                    <div className="flex items-start gap-4">
                        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#e7f0e9] text-[#065F46] dark:bg-amber-300/10 dark:text-amber-300"><FolderOpen className="size-6" aria-hidden="true" /></span>
                        <div><p className="text-sm font-semibold text-[#065F46] dark:text-amber-300">Your account</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">My reports</h1><p className="mt-2 text-sm leading-6 text-[#526458] dark:text-[#bdcbbf]">Review reports you filed or received and check their current status.</p></div>
                    </div>
                    <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#dce9df] bg-[#f5f8f2] px-4 py-3 text-sm leading-5 text-[#526458] dark:border-[#31483a] dark:bg-[#101b15] dark:text-[#bdcbbf]"><Info className="mt-0.5 size-5 shrink-0 text-[#065F46] dark:text-amber-300" aria-hidden="true" /><p>{COMPLETION_PAYMENT_NOTICE}</p></div>
                </header>

                {status && <div role="status" className="rounded-xl border border-[#9dc8aa] bg-[#eaf4ec] px-4 py-3 text-sm text-[#183324] dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100">{status}</div>}

                <section aria-labelledby="report-list-heading">
                    <div className="mb-3 flex flex-wrap items-end justify-between gap-2"><div><h2 id="report-list-heading" className="text-lg font-semibold">Report history</h2><p className="mt-1 text-sm text-[#617166] dark:text-[#afc2b4]">Updates and responses for your reports appear here.</p></div></div>

                    {page.data.length ? <div className="space-y-3">{page.data.map((item) => <article key={item.id} className="rounded-2xl border border-[#e1e8df] bg-white p-5 shadow-sm transition hover:border-[#b8cebc] dark:border-[#263c2e] dark:bg-[#17251c] dark:hover:border-[#42614b] sm:p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 items-start gap-3">
                                <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f5f8f2] text-[#526458] dark:bg-[#101b15] dark:text-[#bdcbbf]"><FileText className="size-5" aria-hidden="true" /></span>
                                <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-[#617166] dark:text-[#afc2b4]">{item.typeLabel}</p><h3 className="mt-1 break-words font-semibold text-[#183324] dark:text-[#EDF4EC]">{item.taskTitle}</h3><p className="mt-2 text-sm text-[#526458] dark:text-[#bdcbbf]">With {item.otherParty}</p><p className="mt-1 text-xs text-[#617166] dark:text-[#afc2b4]">Filed {item.createdAt ? formatDate(item.createdAt) : '—'} <span aria-hidden="true">·</span> Report #{item.id}</p></div>
                            </div>
                            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[#edf1eb] pt-3 dark:border-[#263c2e] sm:justify-end sm:border-0 sm:pt-0"><ReportStatusBadge status={item.status} label={item.statusLabel} /><Button className="h-9 rounded-lg border-[#d8e2d9] text-[#183324] hover:border-[#065F46] hover:bg-[#f5f8f2] dark:border-[#31483a] dark:text-[#EDF4EC] dark:hover:bg-[#203329]" variant="outline" size="sm" asChild><Link href={reports.show(item.id)}>View report <ArrowRight className="ml-1 size-4" aria-hidden="true" /></Link></Button></div>
                        </div>
                    </article>)}</div> : <div className="rounded-2xl border border-dashed border-[#cbd9cc] bg-white px-5 py-12 text-center dark:border-[#31483a] dark:bg-[#17251c]"><span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-[#f5f8f2] text-[#617166] dark:bg-[#101b15] dark:text-[#afc2b4]"><FolderOpen className="size-6" aria-hidden="true" /></span><h3 className="mt-4 font-semibold">No reports yet</h3><p className="mx-auto mt-1 max-w-md text-sm leading-6 text-[#617166] dark:text-[#afc2b4]">You have not filed or received any reports. If you need help with a task or agreement, you can submit a report from its details page.</p></div>}
                </section>

                {page.links.length > 3 && <nav aria-label="Report pages" className="flex flex-wrap items-center gap-2 pt-1">{page.links.map((link, index) => link.url ? <Link key={index} href={link.url} aria-current={link.active ? 'page' : undefined} className={`rounded-lg border px-3 py-2 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#065F46] dark:focus-visible:outline-amber-300 ${link.active ? 'border-[#065F46] bg-[#065F46] font-semibold text-white dark:border-amber-300 dark:bg-amber-300 dark:text-[#183324]' : 'border-[#d8e2d9] bg-white text-[#183324] hover:bg-[#f5f8f2] dark:border-[#31483a] dark:bg-[#17251c] dark:text-[#EDF4EC] dark:hover:bg-[#203329]'}`} dangerouslySetInnerHTML={{ __html: link.label }} /> : <span key={index} aria-disabled="true" className="rounded-lg border border-[#e1e8df] px-3 py-2 text-sm text-[#9aa79c] dark:border-[#263c2e] dark:text-[#748276]" dangerouslySetInnerHTML={{ __html: link.label }} />)}</nav>}
            </div>
        </main>
    </>;
}
