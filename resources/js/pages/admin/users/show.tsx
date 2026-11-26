import { Form, Head, Link } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import InputError from '@/components/input-error';
import { VerificationStatusBadge } from '@/components/verification-status-badge';
import { Textarea } from '@/components/ui/textarea';
import { ratingNotice } from '@/components/rating-summary';
import admin from '@/routes/admin';

type Account = {
    id: number;
    name: string;
    email: string;
    userType: string;
    userTypeLabel: string;
    verificationStatus:
        | 'pending'
        | 'verified'
        | 'rejected'
        | 'more_info_requested';
    idNumber: string | null;
    affiliation: string | null;
    organizationName: string | null;
    position: string | null;
    supportingInfo: string | null;
    verificationNote: string | null;
    registeredAt: string | null;
    verifiedAt: string | null;
    verifiedBy: string | null;
    isSelf: boolean;
};

type HistoryItem = {
    id: number;
    action: string;
    actorName: string | null;
    note: string | null;
    createdAt: string | null;
};
type UserRating = {
    id: number;
    direction: string;
    overall: number;
    comment: string | null;
    taskTitle: string;
    otherParty: string;
    hidden: boolean;
    hiddenReason: string | null;
    scores: { dimension: string; score: number }[];
    date: string | null;
};
type UserSanction = {
    id: number;
    type: string;
    reason: string;
    internalNote: string | null;
    endsAt: string | null;
    liftedAt: string | null;
    liftNote: string | null;
    reportId: number | null;
};

function DecisionForm({
    userId,
    decision,
    label,
    needsNote = false,
}: {
    userId: number;
    decision: string;
    label: string;
    needsNote?: boolean;
}) {
    return (
        <Form
            {...admin.users.verification.form(userId)}
            className={`admin-decision-card admin-decision-card--${decision} space-y-2 rounded-lg border p-4`}
        >
            {({ processing, errors }) => (
                <>
                    <input type="hidden" name="decision" value={decision} />
                    {!needsNote && (
                        <p className="admin-decision-caption">
                            Confirm this account&apos;s submitted details and
                            enable verified account features.
                        </p>
                    )}
                    {needsNote && (
                        <>
                            <label
                                className="block text-sm font-medium"
                                htmlFor={`note-${decision}`}
                            >
                                Note for the account holder
                            </label>
                            <Textarea
                                id={`note-${decision}`}
                                name="note"
                                required
                                maxLength={2000}
                                placeholder="Explain the decision in clear terms."
                            />
                            <InputError message={errors.note} />
                        </>
                    )}
                    <button
                        disabled={processing}
                        className="admin-decision-button disabled:cursor-not-allowed disabled:opacity-50"
                        type="submit"
                    >
                        {label}
                    </button>
                </>
            )}
        </Form>
    );
}

export default function AdminUserShow({
    user,
    history,
    ratingsReceived = [],
    ratingsGiven = [],
    sanctions = [],
    postedTasks = [],
}: {
    user: Account;
    history: HistoryItem[];
    ratingsReceived?: UserRating[];
    ratingsGiven?: UserRating[];
    sanctions?: UserSanction[];
    postedTasks?: { id: number; title: string; status: string }[];
}) {
    return (
        <>
            <Head title={`Review ${user.name}`} />
            <div
                className="admin-page admin-user-detail space-y-4"
                data-tone="users"
            >
                <Link href={admin.users.index()} className="admin-back-link">
                    ← Back to users
                </Link>
                <div className="admin-page-heading flex-wrap">
                    <div className="admin-account-identity">
                        <div
                            className="admin-account-avatar"
                            aria-hidden="true"
                        >
                            {user.name.trim().charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                            <p className="admin-page-eyebrow">Account review</p>
                            <h1>{user.name}</h1>
                            <p className="admin-page-description break-all">
                                {user.email}
                            </p>
                            <div className="admin-account-meta">
                                <span className="admin-pill">
                                    {user.userTypeLabel}
                                </span>
                                {user.registeredAt && (
                                    <span>Joined {user.registeredAt}</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <VerificationStatusBadge status={user.verificationStatus} />
                </div>

                <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
                    These checks are based on information the user submitted.
                    They do not guarantee the person&apos;s future behavior or
                    the safety of a task.
                </div>

                <section className="admin-detail-card admin-user-section space-y-3">
                    <h2 className="text-lg font-semibold">Submitted details</h2>
                    <dl className="admin-detail-grid">
                        <Detail
                            label="Account type"
                            value={user.userTypeLabel}
                        />
                        <Detail label="Email" value={user.email} />
                        {user.userType !== 'organization' && (
                            <Detail
                                label={
                                    user.userType === 'student'
                                        ? 'Student ID number'
                                        : 'Employee ID number'
                                }
                                value={user.idNumber}
                            />
                        )}
                        {user.userType !== 'organization' && (
                            <Detail
                                label="Affiliation"
                                value={user.affiliation}
                            />
                        )}
                        {user.userType === 'organization' && (
                            <Detail
                                label="Organization name"
                                value={user.organizationName}
                            />
                        )}
                        {user.userType === 'organization' && (
                            <Detail
                                label="Representative position"
                                value={user.position}
                            />
                        )}
                        {user.userType === 'organization' && (
                            <Detail
                                label="Organization description"
                                value={user.supportingInfo}
                                wide
                            />
                        )}
                        <Detail label="Registered" value={user.registeredAt} />
                        <Detail
                            label="Verified"
                            value={
                                user.verifiedAt
                                    ? `${user.verifiedAt}${user.verifiedBy ? ` by ${user.verifiedBy}` : ''}`
                                    : null
                            }
                        />
                        <Detail
                            label="Current verification note"
                            value={user.verificationNote}
                            wide
                        />
                    </dl>
                </section>

                {user.isSelf ? (
                    <p className="rounded-lg border p-4 text-sm">
                        You cannot change your own account verification.
                    </p>
                ) : (
                    <section className="admin-detail-card admin-user-section space-y-3">
                        <h2 className="text-lg font-semibold">
                            Review decision
                        </h2>
                        <div className="admin-decision-grid">
                            <DecisionForm
                                userId={user.id}
                                decision="verified"
                                label="Approve account"
                            />
                            <DecisionForm
                                userId={user.id}
                                decision="rejected"
                                label="Reject account"
                                needsNote
                            />
                            <DecisionForm
                                userId={user.id}
                                decision="more_info_requested"
                                label="Request more information"
                                needsNote
                            />
                        </div>
                    </section>
                )}

                <section className="admin-detail-card admin-user-section space-y-2">
                    <h2 className="text-lg font-semibold">Account history</h2>
                    {history.length ? (
                        history.map((item) => (
                            <article
                                key={item.id}
                                className="rounded-lg border p-4 text-sm"
                            >
                                <div className="flex flex-wrap justify-between gap-2">
                                    <p className="font-medium">
                                        {item.action.replaceAll('_', ' ')}
                                    </p>
                                    <p className="text-muted-foreground">
                                        {item.createdAt ?? '—'}
                                    </p>
                                </div>
                                <p className="mt-1 text-muted-foreground">
                                    By {item.actorName ?? 'an administrator'}
                                </p>
                                {item.note && (
                                    <p className="mt-2 whitespace-pre-wrap">
                                        {item.note}
                                    </p>
                                )}
                            </article>
                        ))
                    ) : (
                        <p className="rounded-lg border p-4 text-sm text-muted-foreground">
                            No account actions have been recorded.
                        </p>
                    )}
                </section>
                <section className="admin-detail-card admin-user-section space-y-3">
                    <h2 className="text-lg font-semibold">
                        Ratings received and given
                    </h2>
                    <p className="rounded-lg border p-4 text-sm">
                        {ratingNotice}
                    </p>
                    {[
                        { title: 'Received', records: ratingsReceived },
                        { title: 'Given', records: ratingsGiven },
                    ].map(({ title, records }) => (
                        <div key={title} className="space-y-2">
                            <h3 className="font-medium">{title}</h3>
                            {(records as UserRating[]).length ? (
                                (records as UserRating[]).map((rating) => (
                                    <article
                                        key={rating.id}
                                        className="rounded-lg border p-4 text-sm"
                                    >
                                        <p className="font-medium">
                                            {rating.taskTitle} ·{' '}
                                            {rating.overall}/5 ·{' '}
                                            {rating.direction.replaceAll(
                                                '_',
                                                ' ',
                                            )}
                                        </p>
                                        <p>
                                            {title === 'Received'
                                                ? 'From'
                                                : 'To'}{' '}
                                            {rating.otherParty} ·{' '}
                                            {rating.date ?? '—'}
                                            {rating.hidden ? ' · Hidden' : ''}
                                        </p>
                                        {rating.comment && (
                                            <p className="mt-2 whitespace-pre-wrap">
                                                {rating.comment}
                                            </p>
                                        )}
                                        {rating.hiddenReason && (
                                            <p className="mt-1 text-muted-foreground">
                                                Hide reason:{' '}
                                                {rating.hiddenReason}
                                            </p>
                                        )}
                                        <p className="mt-2">
                                            {rating.scores
                                                .map(
                                                    (score) =>
                                                        `${score.dimension}: ${score.score}/5`,
                                                )
                                                .join(' · ')}
                                        </p>
                                    </article>
                                ))
                            ) : (
                                <p className="rounded border p-3 text-sm text-muted-foreground">
                                    No ratings {title.toLowerCase()}.
                                </p>
                            )}
                        </div>
                    ))}
                </section>
                <section className="admin-detail-card admin-user-section space-y-2">
                    <h2 className="text-lg font-semibold">
                        Sanctions and platform actions
                    </h2>
                    {!user.isSelf && (
                        <Form
                            action={`/admin/users/${user.id}/sanctions`}
                            method="post"
                            className="admin-sanction-form"
                        >
                            {({ processing }) => (
                                <>
                                    <p className="admin-sanction-help">
                                        Choose an action, provide the reason the
                                        user will see, and add an internal note
                                        for administrators.
                                    </p>
                                    <label className="grid gap-1 text-sm font-medium">
                                        Platform action
                                        <select
                                            name="action"
                                            className="admin-sanction-control"
                                        >
                                            <option value="warning">
                                                Issue warning
                                            </option>
                                            <option value="require_verification">
                                                Require additional verification
                                            </option>
                                            <option value="suspend">
                                                Suspend user
                                            </option>
                                            <option value="ban">
                                                Ban user
                                            </option>
                                            <option value="remove_post">
                                                Remove post
                                            </option>
                                        </select>
                                    </label>
                                    <label className="grid gap-1 text-sm font-medium">
                                        Post to remove (if applicable)
                                        <select
                                            name="task_id"
                                            className="admin-sanction-control"
                                        >
                                            <option value="">
                                                Choose a post to remove
                                            </option>
                                            {postedTasks.map((task) => (
                                                <option
                                                    key={task.id}
                                                    value={task.id}
                                                >
                                                    {task.title} · {task.status}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="grid gap-1 text-sm font-medium">
                                        Suspension end date (if applicable)
                                        <input
                                            name="ends_at"
                                            type="datetime-local"
                                            className="admin-sanction-control"
                                        />
                                    </label>
                                    <label className="grid gap-1 text-sm font-medium">
                                        Reason shown to the user
                                        <textarea
                                            name="reason"
                                            required
                                            minLength={5}
                                            maxLength={2000}
                                            placeholder="Explain the reason for this action."
                                            className="admin-sanction-textarea"
                                        />
                                    </label>
                                    <label className="grid gap-1 text-sm font-medium">
                                        Internal admin note
                                        <textarea
                                            name="internal_note"
                                            required
                                            minLength={3}
                                            maxLength={3000}
                                            placeholder="Add context for the admin record."
                                            className="admin-sanction-textarea"
                                        />
                                    </label>
                                    <button
                                        disabled={processing}
                                        className="admin-sanction-submit"
                                    >
                                        Record action
                                    </button>
                                </>
                            )}
                        </Form>
                    )}
                    {sanctions.length ? (
                        sanctions.map((item) => (
                            <article
                                key={item.id}
                                className="rounded-lg border p-4 text-sm"
                            >
                                <p className="font-medium">
                                    {item.type} · {item.reason}
                                </p>
                                <p>
                                    Internal note: {item.internalNote ?? '—'} ·{' '}
                                    {item.endsAt
                                        ? `Ends ${item.endsAt}`
                                        : 'No end date'}
                                    {item.liftedAt
                                        ? ` · Lifted ${item.liftedAt}`
                                        : ''}
                                </p>
                                {item.liftedAt === null && (
                                    <Form
                                        action={`/admin/sanctions/${item.id}/lift`}
                                        method="post"
                                        className="mt-2 flex gap-2"
                                    >
                                        {({ processing }) => (
                                            <>
                                                <input
                                                    name="note"
                                                    required
                                                    minLength={3}
                                                    maxLength={2000}
                                                    className="h-9 rounded border bg-background px-2"
                                                    placeholder="Required lift note"
                                                />
                                                <button
                                                    disabled={processing}
                                                    className="underline"
                                                >
                                                    Lift sanction
                                                </button>
                                            </>
                                        )}
                                    </Form>
                                )}
                            </article>
                        ))
                    ) : (
                        <p className="rounded border p-3 text-sm">
                            No sanctions on record.
                        </p>
                    )}
                </section>
            </div>
        </>
    );
}

function Detail({
    label,
    value,
    wide = false,
}: {
    label: string;
    value: string | null;
    wide?: boolean;
}) {
    return (
        <div className={wide ? 'admin-detail-wide' : 'admin-detail-item'}>
            <dt>{label}</dt>
            <dd className="break-words whitespace-pre-wrap">
                {value || 'Not provided'}
            </dd>
        </div>
    );
}

AdminUserShow.layout = (page: React.ReactNode) => (
    <AdminLayout>{page}</AdminLayout>
);
