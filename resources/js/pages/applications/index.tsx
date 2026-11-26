import { formatDate } from "@/lib/format";
import { Form, Head, Link } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { ApplicationStatusBadge } from "@/components/application-status-badge";
import applicationsRoutes from "@/routes/applications";
import browseRoutes from "@/routes/browse";
import agreementsRoutes from "@/routes/agreements";
import { PaymentStatusBadge } from "@/components/payment-status-badge";
import {
    ArrowUpRight,
    BriefcaseBusiness,
    CalendarDays,
    CircleDollarSign,
    FileText,
    MessageCircle,
    Star,
} from "lucide-react";

type Item = {
    id: number;
    taskId: number;
    taskTitle: string;
    posterName: string;
    budget: string | null;
    budgetDisplay: string;
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
type Props = {
    applications: {
        data: Item[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    status?: string | null;
};

export default function MyApplications({ applications, status }: Props) {
    return (
        <>
            <Head title="My applications" />
            <main className="my-applications-page">
                <header className="my-applications-hero">
                    <span className="my-applications-hero-icon">
                        <BriefcaseBusiness aria-hidden="true" />
                    </span>
                    <div>
                        <p className="my-applications-eyebrow">Your activity</p>
                        <h1>My applications</h1>
                        <p className="my-applications-description">
                            See each response and the next step for your task applications.
                        </p>
                    </div>
                    <div className="my-applications-count">
                        <strong>{applications.data.length}</strong>
                        <span>on this page</span>
                    </div>
                </header>
                {status && (
                    <div role="status" className="my-applications-status">
                        {status}
                    </div>
                )}
                {applications.data.length ? (
                    <section className="my-applications-list" aria-label="Your applications">
                        {applications.data.map((application) => {
                            const nextStep =
                                application.status === "pending"
                                    ? application.otherApplicantAccepted
                                        ? "The poster is working out an agreement with another applicant. Your application stays active until an agreement is confirmed."
                                        : "Waiting for the poster to respond. You can withdraw while your application is pending."
                                    : application.status === "accepted"
                                      ? application.agreementStatus === "agreed"
                                          ? "Both parties confirmed the agreement. Work may begin under the locked terms."
                                          : application.agreementStatus === "negotiating"
                                            ? "Review the agreement and confirm the same version before work begins. You can ask the poster to change it."
                                            : application.agreementStatus === "draft"
                                              ? "The poster is reviewing the prepared agreement. You will be able to review it after they send it."
                                              : "You were accepted. The poster will propose an agreement before work begins."
                                      : application.status === "declined"
                                        ? "The poster declined this application."
                                        : application.status === "withdrawn"
                                          ? "You withdrew this application."
                                          : application.status === "cancelled" &&
                                              application.agreementStatus === "cancelled"
                                            ? "The agreement was cancelled and your application is closed. The task is open again for other applicants."
                                            : null;

                            return (
                                <article key={application.id} className="my-application-card">
                                    <div className="my-application-card-header">
                                        <div className="my-application-title-group">
                                            <p>Task application</p>
                                            <h2>{application.taskTitle}</h2>
                                        </div>
                                        <ApplicationStatusBadge
                                            status={application.status}
                                            label={application.statusLabel}
                                        />
                                    </div>
                                    <div className="my-application-summary">
                                        <div>
                                            <span>
                                                <BriefcaseBusiness aria-hidden="true" /> Poster
                                            </span>
                                            <strong>{application.posterName}</strong>
                                        </div>
                                        <div>
                                            <span>
                                                <CircleDollarSign aria-hidden="true" /> Task budget
                                            </span>
                                            <strong>{application.budgetDisplay}</strong>
                                        </div>
                                        <div>
                                            <span>
                                                <CalendarDays aria-hidden="true" /> Applied
                                            </span>
                                            <strong>
                                                {application.appliedAt
                                                    ? formatDate(application.appliedAt)
                                                    : "—"}
                                            </strong>
                                        </div>
                                    </div>
                                    {nextStep && (
                                        <div className="my-application-next-step">
                                            <span>
                                                <FileText aria-hidden="true" />
                                            </span>
                                            <p>{nextStep}</p>
                                        </div>
                                    )}
                                    {application.paymentStatus &&
                                        application.paymentStatusLabel && (
                                            <div className="my-application-payment">
                                                <span>Payment status</span>
                                                <PaymentStatusBadge
                                                    status={application.paymentStatus}
                                                    label={application.paymentStatusLabel}
                                                />
                                            </div>
                                        )}
                                    {application.needsRating && application.agreementId && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            asChild
                                            className="my-application-rate"
                                        >
                                            <Link
                                                href={agreementsRoutes.rate(
                                                    application.agreementId,
                                                )}
                                            >
                                                <Star aria-hidden="true" />
                                                Rate your experience
                                            </Link>
                                        </Button>
                                    )}
                                    {!application.taskApproved && (
                                        <p className="my-application-task-status">
                                            Task status: {application.taskStatus}
                                        </p>
                                    )}
                                    <div className="my-application-actions">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={applicationsRoutes.task(application.id)}>
                                                <FileText aria-hidden="true" />
                                                View task details
                                            </Link>
                                        </Button>
                                        {application.conversationId && (
                                            <Button size="sm" variant="outline" asChild>
                                                <Link
                                                    href={`/messages/${application.conversationId}`}
                                                >
                                                    <MessageCircle aria-hidden="true" />
                                                    {application.messageBlockedReason
                                                        ? "View conversation"
                                                        : "Message poster"}
                                                </Link>
                                            </Button>
                                        )}
                                        {application.agreementId &&
                                            application.agreementStatus !== "draft" && (
                                                <Button size="sm" asChild>
                                                    <Link
                                                        href={agreementsRoutes.show(
                                                            application.agreementId,
                                                        )}
                                                    >
                                                        <FileText aria-hidden="true" />
                                                        View agreement
                                                    </Link>
                                                </Button>
                                            )}
                                        {application.status === "pending" && (
                                            <Form
                                                {...applicationsRoutes.withdraw.form(
                                                    application.id,
                                                )}
                                                onSubmit={(event) => {
                                                    if (
                                                        !window.confirm(
                                                            "Withdraw this application?",
                                                        )
                                                    )
                                                        event.preventDefault();
                                                }}
                                            >
                                                <Button size="sm" variant="outline" type="submit">
                                                    Withdraw
                                                </Button>
                                            </Form>
                                        )}
                                    </div>
                                    {application.messageBlockedReason && (
                                        <p className="my-application-message-note">
                                            {application.messageBlockedReason}
                                        </p>
                                    )}
                                </article>
                            );
                        })}
                    </section>
                ) : (
                    <div className="my-applications-empty">
                        <span>
                            <BriefcaseBusiness aria-hidden="true" />
                        </span>
                        <h2>You have not applied to any tasks</h2>
                        <p>Browse approved tasks to find work that suits you.</p>
                        <Button className="my-applications-empty-action" asChild>
                            <Link href={browseRoutes.index()}>
                                Browse tasks
                                <ArrowUpRight aria-hidden="true" />
                            </Link>
                        </Button>
                    </div>
                )}
                {applications.links.length > 3 && (
                    <nav className="my-applications-pagination" aria-label="Pagination">
                        {applications.links.map((link, index) =>
                            link.url ? (
                                <Link
                                    key={index}
                                    href={link.url}
                                    className={`my-applications-page-link ${link.active ? "is-active" : ""}`}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ) : (
                                <span
                                    key={index}
                                    className="my-applications-page-link is-disabled"
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ),
                        )}
                    </nav>
                )}
            </main>
        </>
    );
}
