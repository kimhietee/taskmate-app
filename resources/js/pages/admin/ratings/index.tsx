import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/layouts/admin-layout';
import { AdminPageHeading } from '@/components/admin-page-heading';
import { ratingNotice } from '@/components/rating-summary';

type Item = {
    id: number;
    taskTitle: string;
    raterName: string;
    rateeName: string;
    direction: string;
    overall: number;
    hidden: boolean;
    date: string | null;
};
type Props = {
    ratings: {
        data: Item[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: Record<string, string>;
};
function Page({ ratings, filters }: Props) {
    const [values, setValues] = useState({
        search: filters.search ?? '',
        direction: filters.direction ?? '',
        hidden: filters.hidden ?? '',
        rating_min: filters.rating_min ?? '',
        rating_max: filters.rating_max ?? '',
    });
    return (
        <>
            <Head title="Ratings" />
            <div className="admin-page space-y-5" data-tone="ratings">
                <AdminPageHeading
                    eyebrow="Feedback moderation"
                    title="Ratings"
                    description="Review task feedback and manage visibility when needed."
                    count={ratings.data.length}
                    countLabel="on this page"
                />
                <p className="admin-notice">{ratingNotice}</p>
                <form
                    className="admin-filter-panel"
                    onSubmit={(e) => {
                        e.preventDefault();
                        router.get('/admin/ratings', values);
                    }}
                >
                    <p className="admin-filter-heading">Find feedback</p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        <input
                            aria-label="Search user"
                            placeholder="Search user name"
                            value={values.search}
                            onChange={(e) =>
                                setValues({ ...values, search: e.target.value })
                            }
                            className="rounded border bg-background px-3"
                        />
                        <select
                            aria-label="Direction"
                            value={values.direction}
                            onChange={(e) =>
                                setValues({
                                    ...values,
                                    direction: e.target.value,
                                })
                            }
                            className="rounded border bg-background px-3"
                        >
                            <option value="">All directions</option>
                            <option value="poster_to_student">
                                Poster to student
                            </option>
                            <option value="student_to_poster">
                                Student to poster
                            </option>
                        </select>
                        <select
                            aria-label="Hidden"
                            value={values.hidden}
                            onChange={(e) =>
                                setValues({ ...values, hidden: e.target.value })
                            }
                            className="rounded border bg-background px-3"
                        >
                            <option value="">Visible and hidden</option>
                            <option value="0">Visible</option>
                            <option value="1">Hidden</option>
                        </select>
                        <input
                            aria-label="Minimum rating"
                            type="number"
                            min="1"
                            max="5"
                            placeholder="Min score"
                            value={values.rating_min}
                            onChange={(e) =>
                                setValues({
                                    ...values,
                                    rating_min: e.target.value,
                                })
                            }
                            className="rounded border px-3"
                        />
                        <input
                            aria-label="Maximum rating"
                            type="number"
                            min="1"
                            max="5"
                            placeholder="Max score"
                            value={values.rating_max}
                            onChange={(e) =>
                                setValues({
                                    ...values,
                                    rating_max: e.target.value,
                                })
                            }
                            className="rounded border px-3"
                        />
                        <button className="admin-filter-submit sm:col-span-2 lg:col-span-5">
                            Apply filters
                        </button>
                    </div>
                </form>
                <div className="admin-list-panel">
                    <div className="admin-list-heading">
                        <h2>Submitted ratings</h2>
                        <p>Open a task to review feedback</p>
                    </div>
                    {ratings.data.length > 0 && (
                        <table className="admin-table">
                            <thead>
                                <tr className="border-b">
                                    <th className="p-3">Task</th>
                                    <th className="p-3">Rater</th>
                                    <th className="p-3">Ratee</th>
                                    <th className="p-3">Direction</th>
                                    <th className="p-3">Score</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ratings.data.map((rating) => (
                                    <tr key={rating.id}>
                                        <td data-label="Task">
                                            <Link
                                                className="font-medium"
                                                href={`/admin/ratings/${rating.id}`}
                                            >
                                                {rating.taskTitle}
                                            </Link>
                                        </td>
                                        <td data-label="Rater">
                                            {rating.raterName}
                                        </td>
                                        <td data-label="Ratee">
                                            {rating.rateeName}
                                        </td>
                                        <td data-label="Direction">
                                            {rating.direction.replaceAll(
                                                '_',
                                                ' ',
                                            )}
                                        </td>
                                        <td data-label="Score">
                                            <strong>{rating.overall}/5</strong>
                                        </td>
                                        <td data-label="Status">
                                            <span
                                                className="admin-pill"
                                                data-variant={
                                                    rating.hidden
                                                        ? 'quiet'
                                                        : undefined
                                                }
                                            >
                                                {rating.hidden
                                                    ? 'Hidden'
                                                    : 'Visible'}
                                            </span>
                                        </td>
                                        <td data-label="Date">
                                            {rating.date ?? '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    {ratings.data.length === 0 && (
                        <p className="admin-empty">
                            No ratings match these filters.
                        </p>
                    )}
                </div>
                <nav className="admin-pagination" aria-label="Rating pages">
                    {ratings.links.map((link, i) =>
                        link.url ? (
                            <Link
                                key={i}
                                href={link.url}
                                aria-current={link.active ? 'page' : undefined}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ) : null,
                    )}
                </nav>
            </div>
        </>
    );
}
Page.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
export default Page;
