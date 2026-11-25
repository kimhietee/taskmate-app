import { formatDate, formatAmount } from '@/lib/format';
import { Form, Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { ApplicationStatusBadge } from '@/components/application-status-badge';
import applicationsRoutes from '@/routes/applications';
import browseRoutes from '@/routes/browse';
import agreementsRoutes from '@/routes/agreements';
import { PaymentStatusBadge } from '@/components/payment-status-badge';
import { ToBeDiscussedBadge } from '@/components/terms-status-badge';

type Item = {
    id: number;
    taskId: number;
    taskTitle: string;
    posterName: string;
    budget: string | null;
    budgetToBeDiscussed?: boolean;
    payTimingLabel?: string;
    payTimingToBeDiscussed?: boolean;
    scheduleSummary?: string | null;
    scheduleToBeDiscussed?: boolean;
    status: string;
    statusLabel: string;
    taskStatus: string;
    taskApproved: boolean;
    otherApplicantAccepted: boolean;
    agreementId: number | null;
    agreementStatus: string | null;
    agreementStatusLabel: string | null;
    paymentStatus: string | null;
    paymentStatusLabel: string | null;
    appliedAt: string | null;
    needsRating: boolean;
    conversationId: number | null;
    messageBlockedReason: string | null;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Props = {
    applications: {
        data: Item[];
        links: PaginationLink[];
        from?: number | null;
        to?: number | null;
        total?: number;
    };
    status?: string | null;
};

function getNextStepCopy(application: Item): string | null {
    if (application.status === 'pending') {
        return application.otherApplicantAccepted
            ? 'The poster is working out an agreement with another applicant. Your application stays active until an agreement is confirmed.'
            : 'Waiting for the poster to respond. You can withdraw while your application is pending.';
    }

    if (application.status === 'accepted') {
        if (application.agreementStatus === 'agreed') {
            return 'Both parties confirmed the agreement. Work may begin under the locked terms.';
        }
        if (application.agreementStatus === 'negotiating') {
            return 'Review the agreement and confirm the same version before work begins. You can ask the poster to change it.';
        }
        return 'You were accepted. The poster will propose an agreement before work begins.';
    }

    if (application.status === 'declined') {
        return 'The poster declined this application.';
    }

    if (application.status === 'withdrawn') {
        return 'You withdrew this application.';
    }

    if (application.status === 'cancelled' && application.agreementStatus === 'cancelled') {
        return 'The agreement was cancelled and your application is closed. The task is open again for other applicants.';
    }

    return null;
}

function formatPaginationLabel(label: string): string {
    return label
        .replaceAll('&laquo; Previous', 'Previous')
        .replaceAll('Next &raquo;', 'Next')
        .replaceAll('&laquo;', 'Previous')
        .replaceAll('&raquo;', 'Next')
        .trim();
}

export default function MyApplications({ applications, status }: Props) {
    return (
        <>
            <Head title="My applications" />
            <div className="page-wide space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">My applications</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        See each response and the next step for your task applications.
                    </p>
                </div>

                {status && (
                    <div
                        role="status"
                        className="rounded-lg border border-info-border bg-info-bg px-4 py-3 text-sm text-info-fg"
                    >
                        {status}
                    </div>
                )}

                {applications.data.length ? (
                    <>
                        {/* Desktop dense table */}
                        <div className="hidden overflow-x-auto rounded-xl border border-border bg-card shadow-xs md:block">
                            <table className="w-full border-collapse text-left text-sm">
                                <thead className="sticky top-0 z-10 border-b border-border bg-muted/60 text-xs font-semibold text-muted-foreground">
                                    <tr>
                                        <th scope="col" className="px-4 py-3">
                                            Task &amp; Poster
                                        </th>
                                        <th scope="col" className="px-4 py-3">
                                            Pay &amp; Hours
                                        </th>
                                        <th scope="col" className="px-4 py-3">
                                            Status &amp; Next step
                                        </th>
                                        <th scope="col" className="px-4 py-3">
                                            Applied
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-right">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {applications.data.map((application) => {
                                        const nextStep = getNextStepCopy(application);

                                        return (
                                            <tr
                                                key={application.id}
                                                className="align-top transition-colors hover:bg-muted/30"
                                            >
                                                <td className="px-4 py-3">
                                                    <p className="font-semibold text-foreground">
                                                        {application.taskTitle}
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                                        Poster: {application.posterName}
                                                    </p>
                                                    {!application.taskApproved && (
                                                        <p className="mt-1 text-xs text-muted-foreground">
                                                            Task status: {application.taskStatus}
                                                        </p>
                                                    )}
                                                </td>

                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        {application.budgetToBeDiscussed ||
                                                        application.budget === null ? (
                                                            <ToBeDiscussedBadge />
                                                        ) : (
                                                            <span className="font-semibold tabular-nums text-foreground">
                                                                ₱{formatAmount(application.budget)}
                                                            </span>
                                                        )}
                                                        {application.payTimingLabel && (
                                                            <span className="text-xs text-muted-foreground">
                                                                ({application.payTimingLabel})
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                                                        Hours:{' '}
                                                        {application.scheduleToBeDiscussed ||
                                                        !application.scheduleSummary
                                                            ? 'To be discussed'
                                                            : application.scheduleSummary}
                                                    </p>
                                                </td>

                                                <td className="max-w-sm space-y-2 px-4 py-3">
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        <ApplicationStatusBadge
                                                            status={application.status}
                                                            label={application.statusLabel}
                                                        />
                                                        {application.paymentStatus &&
                                                            application.paymentStatusLabel && (
                                                                <PaymentStatusBadge
                                                                    status={application.paymentStatus}
                                                                    label={application.paymentStatusLabel}
                                                                />
                                                            )}
                                                    </div>
                                                    {nextStep && (
                                                        <p className="text-xs leading-relaxed text-muted-foreground">
                                                            {nextStep}
                                                        </p>
                                                    )}
                                                    {application.messageBlockedReason && (
                                                        <p className="text-xs text-muted-foreground">
                                                            {application.messageBlockedReason}
                                                        </p>
                                                    )}
                                                </td>

                                                <td className="whitespace-nowrap px-4 py-3 text-xs tabular-nums text-muted-foreground">
                                                    {application.appliedAt ? formatDate(application.appliedAt) : '—'}
                                                </td>

                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap justify-end gap-1.5">
                                                        {application.agreementId && (
                                                            <Button size="sm" asChild>
                                                                <Link
                                                                    href={agreementsRoutes.show(
                                                                        application.agreementId,
                                                                    )}
                                                                >
                                                                    View agreement
                                                                </Link>
                                                            </Button>
                                                        )}
                                                        <Button variant="outline" size="sm" asChild>
                                                            <Link href={applicationsRoutes.task(application.id)}>
                                                                View task details
                                                            </Link>
                                                        </Button>
                                                        {application.conversationId && (
                                                            <Button size="sm" variant="outline" asChild>
                                                                <Link href={`/messages/${application.conversationId}`}>
                                                                    {application.messageBlockedReason
                                                                        ? 'View conversation'
                                                                        : 'Message poster'}
                                                                </Link>
                                                            </Button>
                                                        )}
                                                        {application.needsRating && application.agreementId && (
                                                            <Button size="sm" variant="outline" asChild>
                                                                <Link
                                                                    href={agreementsRoutes.rate(
                                                                        application.agreementId,
                                                                    )}
                                                                >
                                                                    Rate your experience
                                                                </Link>
                                                            </Button>
                                                        )}
                                                        {application.status === 'pending' && (
                                                            <Form
                                                                {...applicationsRoutes.withdraw.form(application.id)}
                                                                onSubmit={(event) => {
                                                                    if (!window.confirm('Withdraw this application?')) {
                                                                        event.preventDefault();
                                                                    }
                                                                }}
                                                            >
                                                                <Button
                                                                    size="sm"
                                                                    variant="destructive"
                                                                    type="submit"
                                                                >
                                                                    Withdraw
                                                                </Button>
                                                            </Form>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile card stack */}
                        <div className="grid gap-3 md:hidden">
                            {applications.data.map((application) => {
                                const nextStep = getNextStepCopy(application);

                                return (
                                    <article
                                        key={application.id}
                                        className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-xs"
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <div>
                                                <h2 className="text-base font-semibold text-foreground">
                                                    {application.taskTitle}
                                                </h2>
                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                    Poster: {application.posterName}
                                                </p>
                                            </div>
                                            <ApplicationStatusBadge
                                                status={application.status}
                                                label={application.statusLabel}
                                            />
                                        </div>

                                        <div className="space-y-1 rounded-lg border border-border bg-muted/40 p-3 text-sm">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <span className="text-muted-foreground">Pay:</span>
                                                {application.budgetToBeDiscussed || application.budget === null ? (
                                                    <ToBeDiscussedBadge />
                                                ) : (
                                                    <span className="font-semibold tabular-nums text-foreground">
                                                        ₱{formatAmount(application.budget)}
                                                    </span>
                                                )}
                                                {application.payTimingLabel && (
                                                    <span className="text-xs text-muted-foreground">
                                                        ({application.payTimingLabel})
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs tabular-nums text-muted-foreground">
                                                Hours:{' '}
                                                {application.scheduleToBeDiscussed || !application.scheduleSummary
                                                    ? 'To be discussed'
                                                    : application.scheduleSummary}
                                            </p>
                                            <p className="text-xs tabular-nums text-muted-foreground">
                                                Applied {application.appliedAt ? formatDate(application.appliedAt) : '—'}
                                            </p>
                                        </div>

                                        {nextStep && (
                                            <p className="rounded-lg border border-border bg-muted/30 p-3 text-xs leading-relaxed text-foreground">
                                                {nextStep}
                                            </p>
                                        )}

                                        {application.paymentStatus && application.paymentStatusLabel && (
                                            <div>
                                                <PaymentStatusBadge
                                                    status={application.paymentStatus}
                                                    label={application.paymentStatusLabel}
                                                />
                                            </div>
                                        )}

                                        {!application.taskApproved && (
                                            <p className="text-xs text-muted-foreground">
                                                Task status: {application.taskStatus}
                                            </p>
                                        )}

                                        <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                                            {application.agreementId && (
                                                <Button size="sm" asChild>
                                                    <Link href={agreementsRoutes.show(application.agreementId)}>
                                                        View agreement
                                                    </Link>
                                                </Button>
                                            )}
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={applicationsRoutes.task(application.id)}>
                                                    View task details
                                                </Link>
                                            </Button>
                                            {application.conversationId && (
                                                <Button size="sm" variant="outline" asChild>
                                                    <Link href={`/messages/${application.conversationId}`}>
                                                        {application.messageBlockedReason
                                                            ? 'View conversation'
                                                            : 'Message poster'}
                                                    </Link>
                                                </Button>
                                            )}
                                            {application.needsRating && application.agreementId && (
                                                <Button size="sm" variant="outline" asChild>
                                                    <Link href={agreementsRoutes.rate(application.agreementId)}>
                                                        Rate your experience
                                                    </Link>
                                                </Button>
                                            )}
                                            {application.status === 'pending' && (
                                                <Form
                                                    {...applicationsRoutes.withdraw.form(application.id)}
                                                    onSubmit={(event) => {
                                                        if (!window.confirm('Withdraw this application?')) {
                                                            event.preventDefault();
                                                        }
                                                    }}
                                                >
                                                    <Button size="sm" variant="destructive" type="submit">
                                                        Withdraw
                                                    </Button>
                                                </Form>
                                            )}
                                        </div>

                                        {application.messageBlockedReason && (
                                            <p className="text-xs text-muted-foreground">
                                                {application.messageBlockedReason}
                                            </p>
                                        )}
                                    </article>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div className="space-y-3 rounded-xl border border-border bg-card p-10 text-center shadow-xs">
                        <h2 className="text-base font-semibold text-foreground">You have not applied to any tasks</h2>
                        <p className="text-sm text-muted-foreground">
                            Browse approved tasks to find work that suits you.
                        </p>
                        <div className="pt-1">
                            <Button asChild>
                                <Link href={browseRoutes.index()}>Browse tasks</Link>
                            </Button>
                        </div>
                    </div>
                )}

                {applications.links.length > 3 && (
                    <nav
                        aria-label="Application pages"
                        className="flex flex-wrap items-center justify-between gap-3 pt-2"
                    >
                        {applications.from != null && applications.to != null && applications.total != null ? (
                            <p className="text-xs tabular-nums text-muted-foreground">
                                Showing {applications.from}–{applications.to} of {applications.total} applications
                            </p>
                        ) : (
                            <span />
                        )}
                        <div className="flex flex-wrap items-center gap-1.5">
                            {applications.links.map((link, index) => {
                                const text = formatPaginationLabel(link.label);
                                if (!link.url) {
                                    return (
                                        <span
                                            key={`${index}-${link.label}`}
                                            aria-disabled="true"
                                            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border/60 bg-muted/40 px-3 text-sm text-muted-foreground opacity-60 md:min-h-9 md:min-w-9"
                                        >
                                            {text}
                                        </span>
                                    );
                                }

                                return (
                                    <Link
                                        key={`${index}-${link.label}`}
                                        href={link.url}
                                        aria-current={link.active ? 'page' : undefined}
                                        className={
                                            link.active
                                                ? 'focus-ring inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-primary bg-primary px-3 text-sm font-semibold text-primary-foreground md:min-h-9 md:min-w-9'
                                                : 'focus-ring inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border bg-card px-3 text-sm text-foreground hover:bg-accent md:min-h-9 md:min-w-9'
                                        }
                                    >
                                        {text}
                                    </Link>
                                );
                            })}
                        </div>
                    </nav>
                )}
            </div>
        </>
    );
}
