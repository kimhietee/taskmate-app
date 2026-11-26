import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { AdminPageHeading } from '@/components/admin-page-heading';

type Flag = {
    id: number;
    categoryLabel: string;
    author: string;
    context: string;
    field: string;
    status: string;
};
type PageLink = { url: string | null; label: string; active: boolean };

export default function FlagQueue({
    flags,
    filters,
    categories,
    scanningEnabled,
}: {
    flags: { data: Flag[]; links: PageLink[] };
    filters: { category?: string; status?: string };
    categories: { value: string; label: string }[];
    scanningEnabled: boolean;
}) {
    return (
        <>
            <Head title="Content flags" />
            <main className="admin-page space-y-5" data-tone="flags">
                <AdminPageHeading
                    eyebrow="Content review"
                    title="Content flags"
                    description="Review messages and posts flagged for possible rule bypass requests."
                    count={flags.data.length}
                    countLabel="on this page"
                />
                {!scanningEnabled && (
                    <p className="admin-notice">
                        Automatic flagging is paused. Review past flags here and
                        open{' '}
                        <Link
                            href="/admin/reports"
                            className="font-semibold underline underline-offset-2"
                        >
                            Reports
                        </Link>{' '}
                        for concerns submitted by users.
                    </p>
                )}
                <form className="admin-filter-panel">
                    <p className="admin-filter-heading">Filter flags</p>
                    <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                        <select
                            name="category"
                            defaultValue={filters.category ?? ''}
                            aria-label="Filter category"
                        >
                            <option value="">All categories</option>
                            {categories.map(({ value, label }) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                        <select
                            name="status"
                            defaultValue={filters.status ?? ''}
                            aria-label="Filter status"
                        >
                            <option value="">All statuses</option>
                            <option value="open">Open</option>
                            <option value="reviewed">Reviewed</option>
                            <option value="dismissed">Dismissed</option>
                        </select>
                        <button className="admin-filter-submit">
                            Apply filters
                        </button>
                    </div>
                </form>
                {flags.data.length ? (
                    <div className="admin-list-panel">
                        <div className="admin-list-heading">
                            <h2>Flagged content</h2>
                            <p>Review each item in context</p>
                        </div>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th className="p-3">Category</th>
                                    <th className="p-3">Author</th>
                                    <th className="p-3">Content</th>
                                    <th className="p-3">Status</th>
                                    <th className="sr-only">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {flags.data.map((flag) => (
                                    <tr key={flag.id}>
                                        <td data-label="Category">
                                            {flag.categoryLabel}
                                        </td>
                                        <td data-label="Author">
                                            {flag.author}
                                        </td>
                                        <td data-label="Content">
                                            {flag.context} · {flag.field}
                                        </td>
                                        <td data-label="Status">
                                            <span
                                                className="admin-pill"
                                                data-variant={
                                                    flag.status === 'open'
                                                        ? 'urgent'
                                                        : 'quiet'
                                                }
                                            >
                                                {flag.status}
                                            </span>
                                        </td>
                                        <td data-label="Action">
                                            <Link
                                                className="font-medium"
                                                href={`/admin/flags/${flag.id}`}
                                            >
                                                Review
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="admin-list-panel admin-empty">
                        No content flags match these filters.
                    </p>
                )}
                {flags.links.length > 3 && (
                    <nav className="admin-pagination" aria-label="Flag pages">
                        {flags.links.map((link, index) =>
                            link.url ? (
                                <Link
                                    key={index}
                                    href={link.url}
                                    aria-current={
                                        link.active ? 'page' : undefined
                                    }
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ) : (
                                <span
                                    key={index}
                                    className="text-muted-foreground"
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
FlagQueue.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
