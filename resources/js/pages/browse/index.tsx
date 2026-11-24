import { formatDate, formatAmount } from '@/lib/format';
import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ApplicationStatusBadge } from '@/components/application-status-badge';
import { VerificationStatusBadge } from '@/components/verification-status-badge';
import { ToBeDiscussedBadge } from '@/components/terms-status-badge';
import browse from '@/routes/browse';

type Option = { value: string; label: string };
type Listing = {
    id: number;
    title: string;
    descriptionPreview: string;
    category: string;
    workType?: string;
    workTypeLabel?: string;
    budget: string | null;
    budgetToBeDiscussed?: boolean;
    payTimingLabel?: string;
    payTimingToBeDiscussed?: boolean;
    scheduleSummary?: string | null;
    scheduleFlexible?: boolean;
    scheduleToBeDiscussed?: boolean;
    canHoursChange?: boolean | null;
    workMode: string;
    deadline: string | null;
    workplaceName: string | null;
    workplaceAddress: string | null;
    posterName: string;
    posterType: string;
    posterVerificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected' | 'more_info_requested';
    hasApplied: boolean;
};
type Props = {
    tasks: { data: Listing[]; links: { url: string | null; label: string; active: boolean }[] };
    filters: { search?: string; category?: string; work_type?: string; work_mode?: string; min_budget?: string; max_budget?: string; sort?: string };
    options: { categories: Option[]; workTypes?: Option[]; workModes: Option[]; sorts: Option[] };
    isVerifiedStudent?: boolean;
    studentVerificationUrl?: string | null;
};

export default function BrowseTasks({ tasks, filters, options, isVerifiedStudent = true, studentVerificationUrl = null }: Props) {
    const advancedFiltersActive = Boolean(filters.min_budget || filters.max_budget || filters.work_type);
    const [values, setValues] = useState({ search: filters.search ?? '', category: filters.category ?? '', work_type: filters.work_type ?? '', work_mode: filters.work_mode ?? '', min_budget: filters.min_budget ?? '', max_budget: filters.max_budget ?? '', sort: filters.sort ?? 'newest' });
    const [moreFiltersOpen, setMoreFiltersOpen] = useState(advancedFiltersActive);
    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        router.get(browse.index().url, values, { preserveState: true, replace: true });
    };

    return (
        <>
            <Head title="Browse tasks" />
            <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
                <div>
                    <h1 className="text-2xl font-semibold">Browse tasks</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Search approved tasks and review the work details before you apply.</p>
                </div>

                {!isVerifiedStudent && (
                    <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100">
                        <div>
                            <p className="font-semibold">Preview mode — Not verified as a CMU student yet</p>
                            <p className="mt-0.5 text-xs">You can browse approved tasks and check schedules right now. Verify your CMU student status to apply, message posters, or post tasks.</p>
                        </div>
                        <Link
                            href={studentVerificationUrl ?? '/verification/student'}
                            className="inline-flex min-h-9 items-center rounded-md bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground underline-offset-4 hover:underline"
                        >
                            Verify as CMU Student
                        </Link>
                    </div>
                )}

                <form onSubmit={submit} className="space-y-4 rounded-xl border p-4 sm:p-5">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <label className="grid gap-1.5 text-sm font-medium lg:col-span-2" htmlFor="search-tasks">
                            Search tasks
                            <input id="search-tasks" name="search" placeholder="Try tutoring, design, or an activity" value={values.search} onChange={(event) => setValues({ ...values, search: event.target.value })} className="h-10 rounded-md border bg-background px-3 font-normal" />
                        </label>
                        <label className="grid gap-1.5 text-sm font-medium" htmlFor="filter-category">
                            Category
                            <select id="filter-category" name="category" value={values.category} onChange={(event) => setValues({ ...values, category: event.target.value })} className="h-10 rounded-md border bg-background px-3 font-normal"><option value="">All categories</option>{options.categories.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                        </label>
                        <label className="grid gap-1.5 text-sm font-medium" htmlFor="filter-work-mode">
                            Work mode
                            <select id="filter-work-mode" name="work_mode" value={values.work_mode} onChange={(event) => setValues({ ...values, work_mode: event.target.value })} className="h-10 rounded-md border bg-background px-3 font-normal"><option value="">All work modes</option>{options.workModes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                        </label>
                        <label className="grid gap-1.5 text-sm font-medium sm:col-span-2 lg:col-span-2" htmlFor="sort-tasks">
                            Sort by
                            <select id="sort-tasks" name="sort" value={values.sort} onChange={(event) => setValues({ ...values, sort: event.target.value })} className="h-10 rounded-md border bg-background px-3 font-normal">{options.sorts.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                        </label>
                    </div>

                    <details open={moreFiltersOpen} onToggle={(event) => setMoreFiltersOpen(event.currentTarget.open)} className="rounded-lg border px-4 py-3">
                        <summary className="cursor-pointer text-sm font-medium">More filters{advancedFiltersActive ? ' · filters active' : ''}</summary>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {(options.workTypes?.length ?? 0) > 0 && (
                                <label className="grid gap-1.5 text-sm font-medium" htmlFor="filter-work-type">
                                    Work type
                                    <select id="filter-work-type" name="work_type" value={values.work_type} onChange={(event) => setValues({ ...values, work_type: event.target.value })} className="h-10 rounded-md border bg-background px-3 font-normal">
                                        <option value="">All work types</option>
                                        {options.workTypes!.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                                    </select>
                                </label>
                            )}
                            <label className="grid gap-1.5 text-sm font-medium" htmlFor="min-budget">
                                Minimum budget (PHP)
                                <input id="min-budget" name="min_budget" type="number" min="0" max="1000000" step="0.01" value={values.min_budget} onChange={(event) => setValues({ ...values, min_budget: event.target.value })} className="h-10 rounded-md border bg-background px-3 font-normal" />
                            </label>
                            <label className="grid gap-1.5 text-sm font-medium" htmlFor="max-budget">
                                Maximum budget (PHP)
                                <input id="max-budget" name="max_budget" type="number" min="0" max="1000000" step="0.01" value={values.max_budget} onChange={(event) => setValues({ ...values, max_budget: event.target.value })} className="h-10 rounded-md border bg-background px-3 font-normal" />
                            </label>
                        </div>
                    </details>

                    <div className="flex flex-wrap items-center gap-3">
                        <button type="submit" className="min-h-10 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Show tasks</button>
                        <Link href={browse.index().url} className="text-sm underline underline-offset-4">Clear filters</Link>
                    </div>
                </form>

                {tasks.data.length ? (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {tasks.data.map((task) => (
                            <article key={task.id} className="flex flex-col gap-3 rounded-xl border p-5">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            {task.category}{task.workTypeLabel ? ` · ${task.workTypeLabel}` : ''}
                                        </p>
                                        <h2 className="mt-1 text-lg font-semibold">{task.title}</h2>
                                    </div>
                                    {task.hasApplied && <ApplicationStatusBadge status="pending" label="Applied" />}
                                </div>

                                <p className="line-clamp-3 text-sm text-muted-foreground">{task.descriptionPreview}</p>

                                <div className="space-y-1.5 rounded-lg bg-muted/40 p-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        {task.budgetToBeDiscussed || task.budget === null ? (
                                            <ToBeDiscussedBadge label="Pay: To be discussed" />
                                        ) : (
                                            <p className="text-xl font-semibold">₱{formatAmount(task.budget)}</p>
                                        )}
                                        {task.payTimingToBeDiscussed ? (
                                            <ToBeDiscussedBadge label="Timing: To be discussed" />
                                        ) : task.payTimingLabel ? (
                                            <span className="rounded bg-background px-2 py-0.5 text-xs font-medium">{task.payTimingLabel}</span>
                                        ) : null}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1.5 text-sm">
                                        <span className="font-medium">Hours:</span>
                                        {task.scheduleToBeDiscussed || !task.scheduleSummary ? (
                                            <ToBeDiscussedBadge />
                                        ) : (
                                            <span>{task.scheduleSummary}</span>
                                        )}
                                    </div>
                                    <p className="text-sm">{task.workMode}</p>
                                    {task.deadline && <p className="text-sm">Deadline: {formatDate(task.deadline)}</p>}
                                    {(task.workplaceName || task.workplaceAddress) && <p className="text-sm">Workplace: {[task.workplaceName, task.workplaceAddress].filter(Boolean).join(' · ')}</p>}
                                </div>

                                <div className="mt-auto border-t pt-3">
                                    <p className="text-sm font-medium">{task.posterName}</p>
                                    <p className="text-xs text-muted-foreground">{task.posterType}</p>
                                    <div className="mt-1"><VerificationStatusBadge status={task.posterVerificationStatus} /></div>
                                </div>
                                <Link href={browse.show(task.id)} className="text-sm font-medium underline underline-offset-4">View task details</Link>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-xl border p-10 text-center">
                        <h2 className="font-semibold">No tasks match your search</h2>
                        <p className="mt-2 text-sm text-muted-foreground">Try changing or clearing your filters.</p>
                        <Link href={browse.index().url} className="mt-4 inline-block text-sm underline underline-offset-4">Clear filters</Link>
                    </div>
                )}

                {tasks.links.length > 3 && <nav className="flex flex-wrap gap-2" aria-label="Task pages">{tasks.links.map((link, index) => link.url ? <Link key={index} href={link.url} aria-current={link.active ? 'page' : undefined} className={`rounded border px-3 py-1 text-sm ${link.active ? 'bg-muted font-medium' : ''}`} dangerouslySetInnerHTML={{ __html: link.label }} /> : <span key={index} aria-disabled="true" className="rounded border px-3 py-1 text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: link.label }} />)}</nav>}
            </div>
        </>
    );
}
