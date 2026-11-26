import { Form, Head, Link } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';

export default function ShowFlag({ flag }: { flag: any }) {
    return (
        <>
            <Head title="Review content flag" />
            <main className="admin-page max-w-4xl space-y-5" data-tone="flags">
                <Link href="/admin/flags" className="admin-back-link">
                    ← Back to flags
                </Link>
                <header className="admin-page-heading flex-wrap">
                    <div>
                        <p className="admin-page-eyebrow">Flag review</p>
                        <h1>{flag.categoryLabel}</h1>
                        <p className="admin-page-description">
                            {flag.author.name} · {flag.field} · {flag.createdAt}
                        </p>
                    </div>
                    <span
                        className="admin-pill"
                        data-variant={
                            flag.status === 'open' ? 'urgent' : 'quiet'
                        }
                    >
                        {flag.status}
                    </span>
                </header>
                {flag.task && (
                    <p className="admin-notice">Task: {flag.task.title}</p>
                )}
                <section className="admin-detail-card">
                    <h2 className="mb-3 text-lg font-semibold">
                        Flagged content
                    </h2>
                    <p className="break-words whitespace-pre-wrap">
                        {flag.content}
                    </p>
                </section>
                {flag.relatedReportUrl && (
                    <Link
                        className="admin-back-link"
                        href={flag.relatedReportUrl}
                    >
                        Open related report
                    </Link>
                )}
                <p className="admin-notice">
                    Matched labels: {(flag.matched ?? []).join(', ')}
                </p>
                <section className="admin-detail-card">
                    <h2 className="text-lg font-semibold">
                        Author account actions
                    </h2>
                    {flag.sanctions.map((item: any, i: number) => (
                        <p key={i} className="mt-2 text-sm">
                            {item.type}: {item.reason}
                            {item.active ? ' (active)' : ''}
                        </p>
                    ))}
                    <Form
                        action={`/admin/users/${flag.author.id}/sanctions`}
                        method="post"
                        className="mt-4 grid gap-3 rounded-lg border p-4 sm:grid-cols-2"
                    >
                        {({ processing }) => (
                            <>
                                <label className="grid gap-1 text-sm font-medium">
                                    Platform action
                                    <select
                                        name="action"
                                        className="h-10 rounded border bg-background px-3"
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
                                        <option value="ban">Ban user</option>
                                    </select>
                                </label>
                                <label className="grid gap-1 text-sm font-medium">
                                    Suspension ends (if suspending)
                                    <input
                                        name="ends_at"
                                        type="datetime-local"
                                        className="h-10 rounded border bg-background px-3"
                                    />
                                </label>
                                <label className="grid gap-1 text-sm font-medium sm:col-span-2">
                                    Reason shown to the user
                                    <textarea
                                        name="reason"
                                        required
                                        minLength={5}
                                        maxLength={2000}
                                        className="min-h-20 rounded border bg-background p-3"
                                        placeholder="Reason shown to the user"
                                    />
                                </label>
                                <label className="grid gap-1 text-sm font-medium sm:col-span-2">
                                    Internal admin note
                                    <textarea
                                        name="internal_note"
                                        required
                                        minLength={3}
                                        maxLength={3000}
                                        className="min-h-20 rounded border bg-background p-3"
                                        placeholder="Internal admin note"
                                    />
                                </label>
                                <button
                                    disabled={processing}
                                    className="admin-filter-submit sm:col-span-2"
                                >
                                    Record platform action
                                </button>
                            </>
                        )}
                    </Form>
                </section>
                {flag.status === 'open' && (
                    <Form
                        action={`/admin/flags/${flag.id}/decision`}
                        method="post"
                        className="admin-detail-card space-y-3"
                    >
                        {({ processing }) => (
                            <>
                                <label className="block text-sm">
                                    Decision
                                    <select
                                        name="decision"
                                        className="mt-1 h-10 w-full rounded border bg-background px-3"
                                    >
                                        <option value="reviewed">
                                            Mark reviewed
                                        </option>
                                        <option value="dismissed">
                                            Dismiss
                                        </option>
                                    </select>
                                </label>
                                <label className="grid gap-1 text-sm font-medium">
                                    Review note
                                    <textarea
                                        name="note"
                                        required
                                        minLength={3}
                                        maxLength={2000}
                                        className="min-h-24 w-full rounded border bg-background p-3"
                                        placeholder="Required review note"
                                    />
                                </label>
                                <button
                                    disabled={processing}
                                    className="admin-filter-submit"
                                >
                                    Save review
                                </button>
                            </>
                        )}
                    </Form>
                )}
            </main>
        </>
    );
}
ShowFlag.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
