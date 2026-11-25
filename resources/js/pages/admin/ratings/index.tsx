import { Head, Link, router } from '@inertiajs/react';
import { Info, Star } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { ratingNotice } from '@/components/rating-summary';
import { STATUS, StatusBadge } from '@/components/status-badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminLayout from '@/layouts/admin-layout';

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

type PageLink = { url: string | null; label: string; active: boolean };

type Props = {
    ratings: {
        data: Item[];
        links: PageLink[];
        from?: number | null;
        to?: number | null;
        total?: number | null;
    };
    filters: Record<string, string>;
};

const NATIVE_SELECT_CLASS =
    'focus-ring h-11 w-full rounded-md border border-input bg-field px-3 text-sm text-foreground shadow-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 md:h-9';

function formatPaginationLabel(label: string): string {
    return label
        .replaceAll('&laquo; Previous', 'Previous')
        .replaceAll('Next &raquo;', 'Next')
        .replaceAll('&laquo;', 'Previous')
        .replaceAll('&raquo;', 'Next')
        .trim();
}

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
            <div className="space-y-6">
                <header>
                    <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Ratings</h1>
                </header>

                <Alert variant="info">
                    <Info aria-hidden="true" />
                    <AlertDescription>{ratingNotice}</AlertDescription>
                </Alert>

                <Card className="p-4 shadow-xs">
                    <form
                        className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-6"
                        onSubmit={(e) => {
                            e.preventDefault();
                            router.get(
                                '/admin/ratings',
                                {
                                    search: values.search || undefined,
                                    direction: values.direction || undefined,
                                    hidden: values.hidden || undefined,
                                    rating_min: values.rating_min || undefined,
                                    rating_max: values.rating_max || undefined,
                                },
                                { preserveState: true, replace: true },
                            );
                        }}
                    >
                        <div className="grid gap-1.5">
                            <Label htmlFor="ratings-search">Search user</Label>
                            <Input
                                id="ratings-search"
                                placeholder="Search user name"
                                value={values.search}
                                onChange={(e) => setValues({ ...values, search: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="ratings-direction">Direction</Label>
                            <select
                                id="ratings-direction"
                                value={values.direction}
                                onChange={(e) => setValues({ ...values, direction: e.target.value })}
                                className={NATIVE_SELECT_CLASS}
                            >
                                <option value="">All directions</option>
                                <option value="poster_to_student">Poster to student</option>
                                <option value="student_to_poster">Student to poster</option>
                            </select>
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="ratings-visibility">Visibility</Label>
                            <select
                                id="ratings-visibility"
                                value={values.hidden}
                                onChange={(e) => setValues({ ...values, hidden: e.target.value })}
                                className={NATIVE_SELECT_CLASS}
                            >
                                <option value="">Visible and hidden</option>
                                <option value="0">Visible</option>
                                <option value="1">Hidden</option>
                            </select>
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="ratings-min">Min score</Label>
                            <Input
                                id="ratings-min"
                                type="number"
                                min="1"
                                max="5"
                                placeholder="Min score"
                                className="tabular-nums"
                                value={values.rating_min}
                                onChange={(e) => setValues({ ...values, rating_min: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="ratings-max">Max score</Label>
                            <Input
                                id="ratings-max"
                                type="number"
                                min="1"
                                max="5"
                                placeholder="Max score"
                                className="tabular-nums"
                                value={values.rating_max}
                                onChange={(e) => setValues({ ...values, rating_max: e.target.value })}
                            />
                        </div>
                        <div>
                            <Button type="submit" className="w-full lg:w-auto">
                                Apply filters
                            </Button>
                        </div>
                    </form>
                </Card>

                {ratings.data.length ? (
                    <>
                        <div className="hidden overflow-x-auto rounded-xl border border-border bg-card shadow-xs md:block">
                            <table className="w-full border-collapse text-left text-sm">
                                <thead className="sticky top-0 z-10 border-b border-border bg-muted/60 text-xs font-semibold text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3">Task</th>
                                        <th className="px-4 py-3">Rater</th>
                                        <th className="px-4 py-3">Ratee</th>
                                        <th className="px-4 py-3">Direction</th>
                                        <th className="px-4 py-3">Score</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {ratings.data.map((rating) => (
                                        <tr key={rating.id} className="transition-colors hover:bg-muted/30">
                                            <td className="px-4 py-3">
                                                <Link
                                                    className="focus-ring rounded-sm font-semibold text-brand underline-offset-4 hover:underline"
                                                    href={`/admin/ratings/${rating.id}`}
                                                >
                                                    {rating.taskTitle}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-foreground">{rating.raterName}</td>
                                            <td className="px-4 py-3 text-foreground">{rating.rateeName}</td>
                                            <td className="px-4 py-3 capitalize text-muted-foreground">
                                                {rating.direction.replaceAll('_', ' ')}
                                            </td>
                                            <td className="px-4 py-3 font-semibold tabular-nums text-foreground">
                                                {rating.overall}/5
                                            </td>
                                            <td className="px-4 py-3">
                                                <StatusBadge
                                                    tone={rating.hidden ? STATUS.pending[0] : STATUS.success[0]}
                                                    icon={rating.hidden ? STATUS.pending[1] : STATUS.success[1]}
                                                >
                                                    {rating.hidden ? 'Hidden' : 'Visible'}
                                                </StatusBadge>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap tabular-nums text-muted-foreground">
                                                {rating.date ?? '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="grid gap-3 md:hidden">
                            {ratings.data.map((rating) => (
                                <Card key={rating.id} className="space-y-2.5 p-4 shadow-xs">
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <Link
                                            className="focus-ring rounded-sm font-semibold text-brand underline-offset-4 hover:underline"
                                            href={`/admin/ratings/${rating.id}`}
                                        >
                                            {rating.taskTitle}
                                        </Link>
                                        <StatusBadge
                                            tone={rating.hidden ? STATUS.pending[0] : STATUS.success[0]}
                                            icon={rating.hidden ? STATUS.pending[1] : STATUS.success[1]}
                                        >
                                            {rating.hidden ? 'Hidden' : 'Visible'}
                                        </StatusBadge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {rating.raterName} → {rating.rateeName} ({rating.direction.replaceAll('_', ' ')})
                                    </p>
                                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                        <span className="font-semibold tabular-nums text-foreground">
                                            Score: {rating.overall}/5
                                        </span>
                                        <span className="tabular-nums text-muted-foreground">
                                            {rating.date ?? '—'}
                                        </span>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </>
                ) : (
                    <Card className="space-y-2 p-10 text-center">
                        <Star className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
                        <p className="text-sm text-muted-foreground">No ratings match these filters.</p>
                    </Card>
                )}

                {ratings.links.length > 3 && (
                    <nav aria-label="Ratings pages" className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        {ratings.from != null && ratings.to != null && ratings.total != null ? (
                            <p className="text-xs tabular-nums text-muted-foreground">
                                Showing {ratings.from}–{ratings.to} of {ratings.total}
                            </p>
                        ) : (
                            <span />
                        )}
                        <div className="flex flex-wrap items-center gap-1.5">
                            {ratings.links.map((link, index) => {
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
                                        className={`focus-ring inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border px-3 text-sm transition-colors md:min-h-9 md:min-w-9 ${
                                            link.active
                                                ? 'border-primary bg-primary font-semibold text-primary-foreground'
                                                : 'border-border bg-card text-foreground hover:bg-accent'
                                        }`}
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

Page.layout = (page: ReactNode) => <AdminLayout>{page}</AdminLayout>;

export default Page;
