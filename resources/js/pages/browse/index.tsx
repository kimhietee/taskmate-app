import { Head, Link, router } from '@inertiajs/react';
import { Calendar, ChevronDown, Clock, MapPin, Search, SlidersHorizontal, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { ApplicationStatusBadge } from '@/components/application-status-badge';
import { ToBeDiscussedBadge } from '@/components/terms-status-badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VerificationStatusBadge } from '@/components/verification-status-badge';
import AppLayout from '@/layouts/app-layout';
import { formatAmount, formatDate } from '@/lib/format';
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

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Props = {
    tasks: {
        data: Listing[];
        links: PaginationLink[];
        from?: number | null;
        to?: number | null;
        total?: number;
    };
    filters:
        | {
              search?: string | null;
              category?: string | null;
              work_type?: string | null;
              work_mode?: string | null;
              min_budget?: string | number | null;
              max_budget?: string | number | null;
              sort?: string | null;
          }
        | never[];
    options: {
        categories: Option[];
        workTypes?: Option[];
        workModes: Option[];
        sorts: Option[];
    };
    isVerifiedStudent?: boolean;
    studentVerificationUrl?: string | null;
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

export default function BrowseTasks({
    tasks,
    filters,
    options,
    isVerifiedStudent = true,
    studentVerificationUrl = null,
}: Props) {
    const safeFilters = Array.isArray(filters) || !filters ? {} : filters;
    const defaultSort = options.sorts[0]?.value ?? 'newest';
    const initialSearch = typeof safeFilters.search === 'string' ? safeFilters.search : '';
    const initialCategory = typeof safeFilters.category === 'string' ? safeFilters.category : '';
    const initialWorkType = typeof safeFilters.work_type === 'string' ? safeFilters.work_type : '';
    const initialWorkMode = typeof safeFilters.work_mode === 'string' ? safeFilters.work_mode : '';
    const initialMinBudget =
        safeFilters.min_budget != null && String(safeFilters.min_budget) !== ''
            ? String(safeFilters.min_budget)
            : '';
    const initialMaxBudget =
        safeFilters.max_budget != null && String(safeFilters.max_budget) !== ''
            ? String(safeFilters.max_budget)
            : '';
    const initialSort =
        typeof safeFilters.sort === 'string' && safeFilters.sort !== '' ? safeFilters.sort : defaultSort;

    const advancedFilterCount =
        (initialWorkType ? 1 : 0) + (initialMinBudget ? 1 : 0) + (initialMaxBudget ? 1 : 0);
    const mobileFilterCount =
        (initialCategory ? 1 : 0) +
        (initialWorkMode ? 1 : 0) +
        (initialSort !== defaultSort ? 1 : 0) +
        advancedFilterCount;
    const hasAnyActiveFilter = Boolean(initialSearch || mobileFilterCount > 0);

    const [values, setValues] = useState({
        search: initialSearch,
        category: initialCategory,
        work_type: initialWorkType,
        work_mode: initialWorkMode,
        min_budget: initialMinBudget,
        max_budget: initialMaxBudget,
        sort: initialSort,
    });
    const [moreFiltersOpen, setMoreFiltersOpen] = useState(advancedFilterCount > 0);
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

    const resetFilterValues = () => {
        setValues({
            search: '',
            category: '',
            work_type: '',
            work_mode: '',
            min_budget: '',
            max_budget: '',
            sort: defaultSort,
        });
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        const query: Record<string, string> = {};
        if (values.search.trim()) query.search = values.search.trim();
        if (values.category) query.category = values.category;
        if (values.work_type) query.work_type = values.work_type;
        if (values.work_mode) query.work_mode = values.work_mode;
        if (values.min_budget) query.min_budget = values.min_budget;
        if (values.max_budget) query.max_budget = values.max_budget;
        if (values.sort && values.sort !== defaultSort) query.sort = values.sort;
        router.get(browse.index().url, query, { preserveState: true, replace: true });
    };

    return (
        <>
            <Head title="Browse tasks" />
            <div className="page-wide space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Browse tasks</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Search approved tasks and review the work details before you apply.
                    </p>
                </div>

                {!isVerifiedStudent && (
                    <Alert variant="warning">
                        <TriangleAlert aria-hidden="true" />
                        <AlertTitle>Preview mode — Not verified as a CMU student yet</AlertTitle>
                        <AlertDescription className="mt-1 flex flex-wrap items-center justify-between gap-3">
                            <span>
                                You can browse approved tasks and check schedules right now. Verify your CMU student
                                status to apply, message posters, or post tasks.
                            </span>
                            <Button size="sm" variant="outline" asChild>
                                <Link href={studentVerificationUrl ?? '/verification/student'}>
                                    Verify as CMU Student
                                </Link>
                            </Button>
                        </AlertDescription>
                    </Alert>
                )}

                <form
                    onSubmit={submit}
                    className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-xs"
                >
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="min-w-0 flex-1 space-y-1.5">
                            <Label htmlFor="search-tasks">Search tasks</Label>
                            <div className="relative">
                                <Search
                                    aria-hidden="true"
                                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                                />
                                <Input
                                    id="search-tasks"
                                    name="search"
                                    placeholder="Try tutoring, design, or an activity"
                                    value={values.search}
                                    onChange={(event) => setValues({ ...values, search: event.target.value })}
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <div className="hidden gap-1.5 md:grid md:w-44">
                            <Label htmlFor="filter-category">Category</Label>
                            <select
                                id="filter-category"
                                name="category"
                                value={values.category}
                                onChange={(event) => setValues({ ...values, category: event.target.value })}
                                className={NATIVE_SELECT_CLASS}
                            >
                                <option value="">All categories</option>
                                {options.categories.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="hidden gap-1.5 md:grid md:w-40">
                            <Label htmlFor="filter-work-mode">Work mode</Label>
                            <select
                                id="filter-work-mode"
                                name="work_mode"
                                value={values.work_mode}
                                onChange={(event) => setValues({ ...values, work_mode: event.target.value })}
                                className={NATIVE_SELECT_CLASS}
                            >
                                <option value="">All work modes</option>
                                {options.workModes.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="hidden gap-1.5 md:grid md:w-44">
                            <Label htmlFor="sort-tasks">Sort by</Label>
                            <select
                                id="sort-tasks"
                                name="sort"
                                value={values.sort}
                                onChange={(event) => setValues({ ...values, sort: event.target.value })}
                                className={NATIVE_SELECT_CLASS}
                            >
                                {options.sorts.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <Button type="submit">Show tasks</Button>

                        {hasAnyActiveFilter && (
                            <Button variant="ghost" asChild className="hidden md:inline-flex">
                                <Link href={browse.index().url} onClick={resetFilterValues}>
                                    Clear filters
                                </Link>
                            </Button>
                        )}
                    </div>

                    {/* Mobile compact Filters disclosure */}
                    <details
                        open={mobileFiltersOpen}
                        onToggle={(event) => setMobileFiltersOpen(event.currentTarget.open)}
                        className="group rounded-lg border border-border bg-muted/30 px-3.5 py-2 md:hidden"
                    >
                        <summary className="focus-ring flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-md text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                            <span className="inline-flex items-center gap-2">
                                <SlidersHorizontal className="size-4 text-muted-foreground" aria-hidden="true" />
                                <span>Filters</span>
                                {mobileFilterCount > 0 && (
                                    <Badge variant="info" className="tabular-nums">
                                        {mobileFilterCount} active
                                    </Badge>
                                )}
                            </span>
                            <ChevronDown
                                className="size-4 text-muted-foreground transition-transform group-open:rotate-180"
                                aria-hidden="true"
                            />
                        </summary>
                        <div className="mt-3 grid gap-3 border-t border-border pt-3">
                            <div className="grid gap-1.5">
                                <Label htmlFor="mobile-filter-category">Category</Label>
                                <select
                                    id="mobile-filter-category"
                                    value={values.category}
                                    onChange={(event) => setValues({ ...values, category: event.target.value })}
                                    className={NATIVE_SELECT_CLASS}
                                >
                                    <option value="">All categories</option>
                                    {options.categories.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="mobile-filter-work-mode">Work mode</Label>
                                <select
                                    id="mobile-filter-work-mode"
                                    value={values.work_mode}
                                    onChange={(event) => setValues({ ...values, work_mode: event.target.value })}
                                    className={NATIVE_SELECT_CLASS}
                                >
                                    <option value="">All work modes</option>
                                    {options.workModes.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="mobile-sort-tasks">Sort by</Label>
                                <select
                                    id="mobile-sort-tasks"
                                    value={values.sort}
                                    onChange={(event) => setValues({ ...values, sort: event.target.value })}
                                    className={NATIVE_SELECT_CLASS}
                                >
                                    {options.sorts.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {(options.workTypes?.length ?? 0) > 0 && (
                                <div className="grid gap-1.5">
                                    <Label htmlFor="mobile-filter-work-type">Work type</Label>
                                    <select
                                        id="mobile-filter-work-type"
                                        value={values.work_type}
                                        onChange={(event) => setValues({ ...values, work_type: event.target.value })}
                                        className={NATIVE_SELECT_CLASS}
                                    >
                                        <option value="">All work types</option>
                                        {options.workTypes!.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="mobile-min-budget">Min budget (PHP)</Label>
                                    <Input
                                        id="mobile-min-budget"
                                        type="number"
                                        min="0"
                                        max="1000000"
                                        step="0.01"
                                        value={values.min_budget}
                                        onChange={(event) => setValues({ ...values, min_budget: event.target.value })}
                                        className="tabular-nums"
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="mobile-max-budget">Max budget (PHP)</Label>
                                    <Input
                                        id="mobile-max-budget"
                                        type="number"
                                        min="0"
                                        max="1000000"
                                        step="0.01"
                                        value={values.max_budget}
                                        onChange={(event) => setValues({ ...values, max_budget: event.target.value })}
                                        className="tabular-nums"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-1">
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={browse.index().url} onClick={resetFilterValues}>
                                        Clear filters
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </details>

                    {/* Desktop secondary filters disclosure */}
                    <details
                        open={moreFiltersOpen}
                        onToggle={(event) => setMoreFiltersOpen(event.currentTarget.open)}
                        className="group hidden rounded-lg border border-border bg-muted/30 px-4 py-2.5 md:block"
                    >
                        <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-2 rounded-md text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                            <span className="inline-flex items-center gap-2">
                                <SlidersHorizontal className="size-4 text-muted-foreground" aria-hidden="true" />
                                <span>More filters</span>
                                {advancedFilterCount > 0 && (
                                    <Badge variant="info" className="tabular-nums">
                                        {advancedFilterCount} active
                                    </Badge>
                                )}
                            </span>
                            <ChevronDown
                                className="size-4 text-muted-foreground transition-transform group-open:rotate-180"
                                aria-hidden="true"
                            />
                        </summary>
                        <div className="mt-3 grid gap-3 border-t border-border pt-3 sm:grid-cols-3">
                            {(options.workTypes?.length ?? 0) > 0 && (
                                <div className="grid gap-1.5">
                                    <Label htmlFor="filter-work-type">Work type</Label>
                                    <select
                                        id="filter-work-type"
                                        name="work_type"
                                        value={values.work_type}
                                        onChange={(event) => setValues({ ...values, work_type: event.target.value })}
                                        className={NATIVE_SELECT_CLASS}
                                    >
                                        <option value="">All work types</option>
                                        {options.workTypes!.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="grid gap-1.5">
                                <Label htmlFor="min-budget">Minimum budget (PHP)</Label>
                                <Input
                                    id="min-budget"
                                    name="min_budget"
                                    type="number"
                                    min="0"
                                    max="1000000"
                                    step="0.01"
                                    value={values.min_budget}
                                    onChange={(event) => setValues({ ...values, min_budget: event.target.value })}
                                    className="tabular-nums"
                                />
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="max-budget">Maximum budget (PHP)</Label>
                                <Input
                                    id="max-budget"
                                    name="max_budget"
                                    type="number"
                                    min="0"
                                    max="1000000"
                                    step="0.01"
                                    value={values.max_budget}
                                    onChange={(event) => setValues({ ...values, max_budget: event.target.value })}
                                    className="tabular-nums"
                                />
                            </div>
                        </div>
                    </details>
                </form>

                {tasks.data.length ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {tasks.data.map((task) => {
                            const workplaceSummary = [task.workplaceName, task.workplaceAddress]
                                .filter(Boolean)
                                .join(' · ');

                            return (
                                <article
                                    key={task.id}
                                    className="group relative flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-xs transition-colors hover:border-brand/50"
                                >
                                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                                        <p className="truncate">
                                            {task.category}
                                            {task.workTypeLabel ? ` · ${task.workTypeLabel}` : ''}
                                        </p>
                                        {task.hasApplied && <ApplicationStatusBadge status="pending" label="Applied" />}
                                    </div>

                                    <h2 className="md:min-h-[3.25rem]">
                                        <Link
                                            href={browse.show(task.id)}
                                            className="focus-ring line-clamp-2 rounded-sm text-lg font-semibold text-foreground transition-colors after:absolute after:inset-0 group-hover:text-brand"
                                        >
                                            {task.title}
                                        </Link>
                                    </h2>

                                    <p className="line-clamp-2 text-sm text-muted-foreground">
                                        {task.descriptionPreview}
                                    </p>

                                    <div className="flex min-h-[3.5rem] flex-wrap items-baseline justify-between gap-2 rounded-lg border border-border bg-muted/40 p-3">
                                        {task.budgetToBeDiscussed || task.budget === null ? (
                                            <ToBeDiscussedBadge label="Pay: To be discussed" />
                                        ) : (
                                            <p className="text-xl font-semibold tabular-nums text-foreground">
                                                ₱{formatAmount(task.budget)}
                                            </p>
                                        )}

                                        {task.payTimingToBeDiscussed ? (
                                            <ToBeDiscussedBadge label="Timing: To be discussed" />
                                        ) : task.payTimingLabel ? (
                                            <Badge variant="neutral">{task.payTimingLabel}</Badge>
                                        ) : null}
                                    </div>

                                    <div className="space-y-1.5 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Clock className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                                            {task.scheduleToBeDiscussed || !task.scheduleSummary ? (
                                                <ToBeDiscussedBadge />
                                            ) : (
                                                <span className="truncate tabular-nums text-foreground">
                                                    {task.scheduleSummary}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <MapPin className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                                            <span className="truncate">
                                                {task.workMode}
                                                {workplaceSummary ? ` · ${workplaceSummary}` : ''}
                                            </span>
                                        </div>

                                        {task.deadline && (
                                            <div className="flex items-center gap-2">
                                                <Calendar
                                                    className="size-3.5 shrink-0 text-muted-foreground"
                                                    aria-hidden="true"
                                                />
                                                <span className="tabular-nums">
                                                    Deadline: {formatDate(task.deadline)}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-foreground">
                                                {task.posterName}
                                            </p>
                                            <p className="truncate text-xs text-muted-foreground">{task.posterType}</p>
                                        </div>
                                        <VerificationStatusBadge status={task.posterVerificationStatus} />
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                ) : (
                    <Card className="items-center p-10 text-center">
                        <div className="space-y-1.5">
                            <h2 className="text-base font-semibold text-foreground">No tasks match your search</h2>
                            <p className="text-sm text-muted-foreground">Try changing or clearing your filters.</p>
                        </div>
                        <Button variant="outline" asChild>
                            <Link href={browse.index().url} onClick={resetFilterValues}>
                                Clear filters
                            </Link>
                        </Button>
                    </Card>
                )}

                {tasks.links.length > 3 && (
                    <nav aria-label="Task pages" className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        {tasks.from != null && tasks.to != null && tasks.total != null ? (
                            <p className="text-xs tabular-nums text-muted-foreground">
                                Showing {tasks.from}–{tasks.to} of {tasks.total} tasks
                            </p>
                        ) : (
                            <span />
                        )}
                        <div className="flex flex-wrap items-center gap-1.5">
                            {tasks.links.map((link, index) => {
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

BrowseTasks.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'Browse tasks', href: '/browse' }]}>{page}</AppLayout>
);
