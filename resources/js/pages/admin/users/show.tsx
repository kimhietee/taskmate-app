import { Form, Head } from '@inertiajs/react';
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
    institutionalEmail?: string | null;
    institutionalEmailVerifiedAt?: string | null;
    verificationMethod?: string | null;
    userType: string;
    userTypeLabel: string;
    verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected' | 'more_info_requested';
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

type HistoryItem = { id: number; action: string; actorName: string | null; note: string | null; createdAt: string | null };
type UserRating = { id: number; direction: string; overall: number; comment: string | null; taskTitle: string; otherParty: string; hidden: boolean; hiddenReason: string | null; scores: { dimension: string; score: number }[]; date: string | null };
type UserSanction = { id: number; type: string; reason: string; internalNote: string | null; endsAt: string | null; liftedAt: string | null; liftNote: string | null; reportId: number | null };

function DecisionForm({ userId, decision, label, needsNote = false }: { userId: number; decision: string; label: string; needsNote?: boolean }) {
    return (
        <Form {...admin.users.verification.form(userId)} className="space-y-2 rounded-lg border p-4">
            {({ processing, errors }) => (
                <>
                    <input type="hidden" name="decision" value={decision} />
                    {needsNote && (
                        <>
                            <label className="block text-sm font-medium" htmlFor={`note-${decision}`}>Note for the account holder</label>
                            <Textarea id={`note-${decision}`} name="note" required maxLength={2000} placeholder="Explain the decision in clear terms." />
                            <InputError message={errors.note} />
                        </>
                    )}
                    <InputError message={errors.decision} />
                    <button disabled={processing} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50" type="submit">{label}</button>
                </>
            )}
        </Form>
    );
}

export default function AdminUserShow({ user, history, ratingsReceived = [], ratingsGiven = [], sanctions = [], postedTasks = [] }: { user: Account; history: HistoryItem[]; ratingsReceived?: UserRating[]; ratingsGiven?: UserRating[]; sanctions?: UserSanction[]; postedTasks?: { id: number; title: string; status: string }[] }) {
    return (
        <>
            <Head title={`Review ${user.name}`} />
            <div className="space-y-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Account review</p>
                        <h1 className="mt-1 text-2xl font-semibold">{user.name}</h1>
                        <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <VerificationStatusBadge status={user.verificationStatus} />
                </div>

                <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
                    These checks are based on information the user submitted. They do not guarantee the person&apos;s future behavior or the safety of a task.
                </div>

                <section className="space-y-4">
                    <h2 className="text-lg font-semibold">Submitted details</h2>
                    <dl className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
                        <Detail label="Account type" value={user.userTypeLabel} />
                        <Detail label="Email" value={user.email} />
                        {user.userType === 'student' && (
                            <Detail
                                label="CMU institutional email"
                                value={
                                    user.institutionalEmail
                                        ? `${user.institutionalEmail}${user.institutionalEmailVerifiedAt ? ` (confirmed ${user.institutionalEmailVerifiedAt})` : ''}`
                                        : null
                                }
                            />
                        )}
                        {user.verificationMethod && (
                            <Detail
                                label="Verification method"
                                value={user.verificationMethod === 'institutional_email' ? 'CMU institutional email code' : 'Administrator review'}
                            />
                        )}
                        {user.userType !== 'organization' && <Detail label={user.userType === 'student' ? 'Student ID number' : 'Employee ID number'} value={user.idNumber} />}
                        {user.userType !== 'organization' && <Detail label="Affiliation" value={user.affiliation} />}
                        {user.userType === 'organization' && <Detail label="Organization name" value={user.organizationName} />}
                        {user.userType === 'organization' && <Detail label="Representative position" value={user.position} />}
                        {user.userType === 'organization' && <div className="sm:col-span-2"><Detail label="Organization description" value={user.supportingInfo} /></div>}
                        <Detail label="Registered" value={user.registeredAt} />
                        <Detail label="Verified" value={user.verifiedAt ? `${user.verifiedAt}${user.verifiedBy ? ` by ${user.verifiedBy}` : ''}` : null} />
                        <div className="sm:col-span-2"><Detail label="Current verification note" value={user.verificationNote} /></div>
                    </dl>
                </section>

                {user.isSelf ? (
                    <p className="rounded-lg border p-4 text-sm">You cannot change your own account verification.</p>
                ) : (
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold">Review decision</h2>
                        <div className="grid gap-3 md:grid-cols-3">
                            <DecisionForm userId={user.id} decision="verified" label="Approve account" />
                            <DecisionForm userId={user.id} decision="rejected" label="Reject account" needsNote />
                            <DecisionForm userId={user.id} decision="more_info_requested" label="Request more information" needsNote />
                        </div>
                    </section>
                )}

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold">Account history</h2>
                    {history.length ? history.map((item) => (
                        <article key={item.id} className="rounded-lg border p-4 text-sm">
                            <div className="flex flex-wrap justify-between gap-2">
                                <p className="font-medium">{item.action.replaceAll('_', ' ')}</p>
                                <p className="text-muted-foreground">{item.createdAt ?? '—'}</p>
                            </div>
                            <p className="mt-1 text-muted-foreground">By {item.actorName ?? 'an administrator'}</p>
                            {item.note && <p className="mt-2 whitespace-pre-wrap">{item.note}</p>}
                        </article>
                    )) : <p className="rounded-lg border p-4 text-sm text-muted-foreground">No account actions have been recorded.</p>}
                </section>
                <section className="space-y-4"><h2 className="text-lg font-semibold">Ratings received and given</h2><p className="rounded-lg border p-4 text-sm">{ratingNotice}</p>{[['Received', ratingsReceived], ['Given', ratingsGiven]].map(([title, records]) => <div key={title as string} className="space-y-2"><h3 className="font-medium">{title as string}</h3>{(records as UserRating[]).length ? (records as UserRating[]).map((rating) => <article key={rating.id} className="rounded-lg border p-4 text-sm"><p className="font-medium">{rating.taskTitle} · {rating.overall}/5 · {rating.direction.replaceAll('_', ' ')}</p><p>{title === 'Received' ? 'From' : 'To'} {rating.otherParty} · {rating.date ?? '—'}{rating.hidden ? ' · Hidden' : ''}</p>{rating.comment && <p className="mt-2 whitespace-pre-wrap">{rating.comment}</p>}{rating.hiddenReason && <p className="mt-1 text-muted-foreground">Hide reason: {rating.hiddenReason}</p>}<p className="mt-2">{rating.scores.map((score) => `${score.dimension}: ${score.score}/5`).join(' · ')}</p></article>) : <p className="rounded border p-3 text-sm text-muted-foreground">No ratings {String(title).toLowerCase()}.</p>}</div>)}</section>
                <section className="space-y-3"><h2 className="text-lg font-semibold">Sanctions and platform actions</h2>{!user.isSelf && <Form action={`/admin/users/${user.id}/sanctions`} method="post" className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">{({ processing }) => <><select name="action" className="h-10 rounded border bg-background px-3"><option value="warning">Issue warning</option><option value="require_verification">Require additional verification</option><option value="suspend">Suspend user</option><option value="ban">Ban user</option><option value="remove_post">Remove post</option></select><select name="task_id" className="h-10 rounded border bg-background px-3"><option value="">Choose a post to remove</option>{postedTasks.map((task) => <option key={task.id} value={task.id}>{task.title} · {task.status}</option>)}</select><input name="ends_at" type="datetime-local" className="h-10 rounded border bg-background px-3" /><textarea name="reason" required minLength={5} maxLength={2000} placeholder="Reason shown to the user" className="min-h-20 rounded border bg-background p-3" /><textarea name="internal_note" required minLength={3} maxLength={3000} placeholder="Internal admin note" className="min-h-20 rounded border bg-background p-3" /><button disabled={processing} className="rounded bg-primary px-4 py-2 text-primary-foreground">Record action</button></>}</Form>}{sanctions.length ? sanctions.map((item) => <article key={item.id} className="rounded-lg border p-4 text-sm"><p className="font-medium">{item.type} · {item.reason}</p><p>Internal note: {item.internalNote ?? '—'} · {item.endsAt ? `Ends ${item.endsAt}` : 'No end date'}{item.liftedAt ? ` · Lifted ${item.liftedAt}` : ''}</p>{item.liftedAt === null && <Form action={`/admin/sanctions/${item.id}/lift`} method="post" className="mt-2 flex gap-2">{({ processing }) => <><input name="note" required minLength={3} maxLength={2000} className="h-9 rounded border bg-background px-2" placeholder="Required lift note" /><button disabled={processing} className="underline">Lift sanction</button></>}</Form>}</article>) : <p className="rounded border p-3 text-sm">No sanctions on record.</p>}</section>
            </div>
        </>
    );
}

function Detail({ label, value }: { label: string; value: string | null }) {
    return (
        <div>
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="mt-1 whitespace-pre-wrap break-words text-sm">{value || 'Not provided'}</dd>
        </div>
    );
}

AdminUserShow.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
