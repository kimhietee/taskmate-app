import { PAYMENT_BOUNDARY_NOTICE } from '@/constants/notices';
import { Head, Link } from '@inertiajs/react';

type Props = {
    page: string;
    title: string;
    guidelines: string[];
    privacyDraft: string | null;
};

export default function Information({ page, title, guidelines, privacyDraft }: Props) {
    return (
        <>
            <Head title={title} />
            <div className="page-narrow space-y-6">
                <div className="space-y-2">
                    <Link
                        href="/"
                        className="focus-ring inline-block rounded-sm text-sm text-brand underline-offset-4 hover:underline"
                    >
                        Back to home
                    </Link>
                    <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
                </div>

                {page === 'how-it-works' && (
                    <div className="space-y-6">
                        <p className="prose-width text-base text-muted-foreground">
                            TaskMate&apos;s main purpose is to help CMU students find individual side jobs with clear work, budget, and workplace details.
                        </p>
                        <ol className="space-y-3">
                            <li className="rounded-xl border border-border bg-card p-4 shadow-xs md:p-5">
                                <h2 className="text-base font-semibold">1. Create an account and verify it</h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    An administrator reviews the information you submit. Students and faculty/staff use CMU institutional email addresses. Task access begins after account approval.
                                </p>
                            </li>
                            <li className="rounded-xl border border-border bg-card p-4 shadow-xs md:p-5">
                                <h2 className="text-base font-semibold">2. Post a task for review</h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Eligible verified posters describe the work, budget, and work mode. Onsite and hybrid tasks include the place of work. New tasks are reviewed before students can see them.
                                </p>
                            </li>
                            <li className="rounded-xl border border-border bg-card p-4 shadow-xs md:p-5">
                                <h2 className="text-base font-semibold">3. Students review and apply</h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Verified students can browse approved tasks, check the disclosed conditions, and send one application message. Only students can apply.
                                </p>
                            </li>
                            <li className="rounded-xl border border-border bg-card p-4 shadow-xs md:p-5">
                                <h2 className="text-base font-semibold">4. Agree before work begins</h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    The poster proposes deliverables, terms, dates, and an amount. Both people review and confirm the same version before work begins.
                                </p>
                            </li>
                            <li className="rounded-xl border border-border bg-card p-4 shadow-xs md:p-5">
                                <h2 className="text-base font-semibold">5. Record completion and payment status</h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    The parties record completion and payment status in TaskMate. Payment is made directly between them.
                                </p>
                            </li>
                            <li className="rounded-xl border border-border bg-card p-4 shadow-xs md:p-5">
                                <h2 className="text-base font-semibold">6. Share feedback or report a concern</h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    After a completed task, the parties may leave contextual ratings. Use the report tools for serious problems; ratings are not a substitute for reports.
                                </p>
                            </li>
                        </ol>
                        <div className="rounded-lg border border-info-border bg-info-bg p-4 text-sm text-info-fg">
                            Students may post when student posting is enabled. Faculty/staff and approved organization representatives may post. Faculty/staff and organizations cannot apply.
                        </div>
                    </div>
                )}

                {page === 'task-guidelines' && (
                    <div className="space-y-4">
                        <div
                            role="status"
                            className="rounded-lg border border-warning-border bg-warning-bg p-4 text-sm text-warning-fg"
                        >
                            These guidelines are provisional and must be reviewed by the team and university.
                        </div>
                        <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
                            {guidelines.length > 0 ? (
                                <ul className="prose-width list-disc space-y-2.5 pl-5 text-sm text-foreground">
                                    {guidelines.map((rule) => (
                                        <li key={rule}>{rule}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground">No guidelines are published yet.</p>
                            )}
                        </div>
                    </div>
                )}

                {page === 'safety-and-limits' && (
                    <div className="prose-width space-y-4">
                        <div className="rounded-xl border border-border bg-card p-5 text-sm text-foreground shadow-xs">
                            Verification, administrator review, and ratings help inform decisions but do not guarantee a person’s future behavior or the safety of a task.
                        </div>
                        <div className="rounded-xl border border-border bg-card p-5 text-sm text-foreground shadow-xs">
                            Review the disclosed work location and conditions. Do not agree to anything that makes you uncomfortable. Use the report tools to raise concerns.
                        </div>
                        <div className="rounded-xl border border-border bg-card p-5 text-sm text-foreground shadow-xs">
                            {PAYMENT_BOUNDARY_NOTICE}
                        </div>
                    </div>
                )}

                {page === 'privacy' && (
                    <div className="space-y-4">
                        <div
                            role="status"
                            className="rounded-lg border border-warning-border bg-warning-bg p-4 text-sm text-warning-fg"
                        >
                            DRAFT PRIVACY NOTICE — not approved. Retention, deletion, consent, and protected-storage rules are still to be decided.
                        </div>
                        <div className="rounded-xl border border-border bg-card p-5 shadow-xs md:p-6">
                            <div className="prose-width whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-foreground">
                                {privacyDraft ?? 'Privacy notice draft is not available.'}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
