import { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { ArrowUpRight, BriefcaseBusiness, CalendarDays, Clock3, CreditCard, MapPin, Search, TriangleAlert } from "lucide-react";
import { ApplicationStatusBadge } from "@/components/application-status-badge";
import { VerificationStatusBadge } from "@/components/verification-status-badge";
import { Button } from "@/components/ui/button";
import { formatAmount, formatDate } from "@/lib/format";
import browse from "@/routes/browse";

type Option = { value: string; label: string };
type Listing = {
    id: number;
    title: string;
    descriptionPreview: string;
    category: string;
    workTypeLabel: string;
    budget: string | null;
    budgetToBeDiscussed: boolean;
    payTimingLabel: string;
    payTimingToBeDiscussed: boolean;
    scheduleSummary: string | null;
    scheduleToBeDiscussed: boolean;
    workMode: string;
    deadline: string | null;
    workplaceName: string | null;
    workplaceAddress: string | null;
    posterName: string;
    posterType: string;
    posterVerificationStatus: "pending" | "verified" | "rejected" | "more_info_requested";
    hasApplied: boolean;
};
type Props = {
    tasks: {
        data: Listing[];
        links: { url: string | null; label: string; active: boolean }[];
        from?: number | null;
        to?: number | null;
        total?: number;
    };
    filters: {
        search?: string;
        category?: string;
        work_type?: string;
        work_mode?: string;
        min_budget?: string;
        max_budget?: string;
        sort?: string;
    };
    options: { categories: Option[]; workTypes?: Option[]; workModes: Option[]; sorts: Option[] };
    isVerifiedStudent?: boolean;
    studentVerificationUrl?: string | null;
};

export default function BrowseTasks({ tasks, filters, options, isVerifiedStudent = true, studentVerificationUrl }: Props) {
    const advancedFiltersActive = Boolean(filters.work_type || filters.min_budget || filters.max_budget);
    const [values, setValues] = useState({
        search: filters.search ?? "",
        category: filters.category ?? "",
        work_type: filters.work_type ?? "",
        work_mode: filters.work_mode ?? "",
        min_budget: filters.min_budget ?? "",
        max_budget: filters.max_budget ?? "",
        sort: filters.sort ?? "newest",
    });
    const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(advancedFiltersActive);
    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        const query = Object.fromEntries(Object.entries(values).filter(([, value]) => value !== ""));
        router.get(browse.index().url, query, {
            preserveState: true,
            replace: true,
        });
    };
    const hasActiveFilters = Boolean(values.search || values.category || values.work_type || values.work_mode || values.min_budget || values.max_budget || values.sort !== "newest");
    const clearFilters = () => {
        setValues({ search: "", category: "", work_type: "", work_mode: "", min_budget: "", max_budget: "", sort: "newest" });
        router.get(browse.index().url, {}, { preserveState: true, replace: true });
    };

    return (
        <>
            <Head title="Browse tasks" />
            <main className="browse-page">
                <header className="browse-hero">
                    <div className="browse-hero-copy">
                        <span className="browse-hero-icon">
                            <BriefcaseBusiness aria-hidden="true" />
                        </span>
                        <div>
                            <p className="browse-eyebrow">Find your next opportunity</p>
                            <h1>Browse tasks</h1>
                            <p className="browse-hero-description">
                                Explore tasks with clear details about the work, schedule, location,
                                and budget.
                            </p>
                        </div>
                    </div>
                    <p className="browse-count">
                        <strong>{tasks.total ?? tasks.data.length}</strong>
                        task{(tasks.total ?? tasks.data.length) === 1 ? "" : "s"} available
                    </p>
                </header>

                {!isVerifiedStudent && (
                    <section className="browse-verification-notice" role="status">
                        <TriangleAlert aria-hidden="true" />
                        <div>
                            <strong>Browse preview</strong>
                            <p>You can explore approved tasks now. Verify your student account before applying or posting.</p>
                        </div>
                        {studentVerificationUrl && <Button asChild size="sm"><Link href={studentVerificationUrl}>Verify account</Link></Button>}
                    </section>
                )}

                <form onSubmit={submit} className="browse-filters">
                    <div className="browse-filter-grid">
                        <label
                            className="browse-filter-field browse-filter-field--search"
                            htmlFor="search-tasks"
                        >
                            Search tasks
                            <input
                                id="search-tasks"
                                name="search"
                                placeholder="Try tutoring or spreadsheet skills"
                                value={values.search}
                                onChange={(event) =>
                                    setValues({
                                        ...values,
                                        search: event.target.value,
                                    })
                                }
                                className="browse-filter-control"
                            />
                        </label>
                        <label className="browse-filter-field" htmlFor="filter-category">
                            Category
                            <select
                                id="filter-category"
                                name="category"
                                value={values.category}
                                onChange={(event) =>
                                    setValues({
                                        ...values,
                                        category: event.target.value,
                                    })
                                }
                                className="browse-filter-control"
                            >
                                <option value="">All categories</option>
                                {options.categories.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="browse-filter-field" htmlFor="filter-work-mode">
                            Work mode
                            <select
                                id="filter-work-mode"
                                name="work_mode"
                                value={values.work_mode}
                                onChange={(event) =>
                                    setValues({
                                        ...values,
                                        work_mode: event.target.value,
                                    })
                                }
                                className="browse-filter-control"
                            >
                                <option value="">All work modes</option>
                                {options.workModes.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <details
                        open={advancedFiltersOpen}
                        onToggle={(event) => setAdvancedFiltersOpen(event.currentTarget.open)}
                        className="browse-budget-filters"
                    >
                        <summary>
                            More filters
                            {advancedFiltersActive ? " · active" : ""}
                        </summary>
                        <div className="browse-budget-fields">
                            {(options.workTypes?.length ?? 0) > 0 && <label className="browse-filter-field" htmlFor="filter-work-type">
                                Work type
                                <select id="filter-work-type" name="work_type" value={values.work_type} onChange={(event) => setValues({ ...values, work_type: event.target.value })} className="browse-filter-control">
                                    <option value="">All work types</option>
                                    {options.workTypes!.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                                </select>
                            </label>}
                            <label className="browse-filter-field" htmlFor="min-budget">
                                Minimum budget (PHP)
                                <input
                                    id="min-budget"
                                    name="min_budget"
                                    type="number"
                                    min="0"
                                    max="1000000"
                                    step="0.01"
                                    value={values.min_budget}
                                    onChange={(event) =>
                                        setValues({
                                            ...values,
                                            min_budget: event.target.value,
                                        })
                                    }
                                    className="browse-filter-control"
                                />
                            </label>
                            <label className="browse-filter-field" htmlFor="max-budget">
                                Maximum budget (PHP)
                                <input
                                    id="max-budget"
                                    name="max_budget"
                                    type="number"
                                    min="0"
                                    max="1000000"
                                    step="0.01"
                                    value={values.max_budget}
                                    onChange={(event) =>
                                        setValues({
                                            ...values,
                                            max_budget: event.target.value,
                                        })
                                    }
                                    className="browse-filter-control"
                                />
                            </label>
                        </div>
                    </details>

                    <div className="browse-filter-actions">
                        <button type="submit" className="browse-submit">
                            <Search aria-hidden="true" />
                            Find tasks
                        </button>
                        <button type="button" onClick={clearFilters} className="browse-clear">
                            Clear filters
                        </button>
                        <label className="browse-sort-field" htmlFor="sort-tasks">
                            Sort by
                            <select
                                id="sort-tasks"
                                name="sort"
                                value={values.sort}
                                onChange={(event) =>
                                    setValues({
                                        ...values,
                                        sort: event.target.value,
                                    })
                                }
                                className="browse-filter-control"
                            >
                                {options.sorts.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                </form>

                {tasks.data.length ? (
                    <section className="browse-results" aria-label="Available tasks">
                        {tasks.data.map((task) => (
                            <article key={task.id} className="browse-task-card">
                                <div className="browse-task-card-top">
                                    <div className="browse-task-heading">
                                        <p className="browse-task-category">
                                            {task.category} · {task.workTypeLabel}
                                        </p>
                                        <h2>{task.title}</h2>
                                    </div>
                                    <div className="browse-task-badges">
                                        <span className="browse-mode-badge">{task.workMode}</span>
                                        {task.hasApplied && (
                                            <ApplicationStatusBadge
                                                status="pending"
                                                label="Applied"
                                            />
                                        )}
                                    </div>
                                </div>
                                <div className="browse-poster-row">
                                    <span className="browse-poster-avatar" aria-hidden="true">
                                        {task.posterName.slice(0, 1).toUpperCase()}
                                    </span>
                                    <span className="browse-poster-name">{task.posterName}</span>
                                    <span className="browse-poster-type">{task.posterType}</span>
                                    <VerificationStatusBadge
                                        status={task.posterVerificationStatus}
                                    />
                                </div>
                                <p className="browse-task-description">{task.descriptionPreview}</p>
                                <div className="browse-task-facts">
                                    <span className="browse-task-fact">
                                        <Clock3 aria-hidden="true" />
                                        <span>
                                            <strong>Schedule:</strong>{" "}
                                            {task.scheduleToBeDiscussed || !task.scheduleSummary
                                                ? "To be discussed"
                                                : task.scheduleSummary}
                                        </span>
                                    </span>
                                    <span className="browse-task-fact">
                                        <CreditCard aria-hidden="true" />
                                        <span>
                                            <strong>Pay timing:</strong>{" "}
                                            {task.payTimingToBeDiscussed
                                                ? "To be discussed"
                                                : task.payTimingLabel}
                                        </span>
                                    </span>
                                    {(task.workplaceName || task.workplaceAddress) && (
                                        <span className="browse-task-fact">
                                            <MapPin aria-hidden="true" />
                                            <span>
                                                <strong>Work location:</strong>{" "}
                                                {[task.workplaceName, task.workplaceAddress]
                                                    .filter(Boolean)
                                                    .join(" · ")}
                                            </span>
                                        </span>
                                    )}
                                    {task.deadline && (
                                        <span className="browse-task-fact">
                                            <CalendarDays aria-hidden="true" />
                                            <span>
                                                <strong>Deadline:</strong> {formatDate(task.deadline)}
                                            </span>
                                        </span>
                                    )}
                                </div>
                                <div className="browse-task-card-footer">
                                    <div className="browse-task-budget">
                                        <span>Budget</span>
                                        <strong>
                                            {task.budgetToBeDiscussed || task.budget === null
                                                ? "To be discussed"
                                                : `₱${formatAmount(task.budget)}`}
                                        </strong>
                                    </div>
                                    <Link href={browse.show(task.id)} className="browse-task-cta">
                                        {task.hasApplied
                                            ? "View application"
                                            : "View task details"}
                                        <ArrowUpRight aria-hidden="true" />
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </section>
                ) : (
                    <div className="browse-empty-state">
                        <span>
                            <Search aria-hidden="true" />
                        </span>
                            <h2>{hasActiveFilters ? "No tasks match your search" : "No tasks available right now"}</h2>
                        <p>Try changing or clearing your filters.</p>
                        <button type="button" onClick={clearFilters} className="browse-clear browse-empty-clear">
                            Clear filters
                        </button>
                    </div>
                )}

                {tasks.from != null && tasks.to != null && tasks.total != null && (
                    <p className="browse-result-count">Showing {tasks.from}–{tasks.to} of {tasks.total} tasks</p>
                )}
                {tasks.links.length > 3 && (
                    <nav className="browse-pagination" aria-label="Task pages">
                        {tasks.links.map((link, index) =>
                            link.url ? (
                                <Link
                                    key={index}
                                    href={link.url}
                                    aria-current={link.active ? "page" : undefined}
                                    className={`browse-page-link ${link.active ? "is-active" : ""}`}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ) : (
                                <span
                                    key={index}
                                    aria-disabled="true"
                                    className="browse-page-link is-disabled"
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
