import { Head, Link, router } from '@inertiajs/react';
import { Flag } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { STATUS, StatusFromMap } from '@/components/status-badge';
import type { StatusConfig } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import AdminLayout from '@/layouts/admin-layout';

type FlagRow = {
    id: number;
    categoryLabel: string;
    author: string;
    context: string;
    field: string;
    status: string;
};

type PageLink = { url: string | null; label: string; active: boolean };

type Props = {
    flags: {
        data: FlagRow[];
        links: PageLink[];
        from?: number | null;
        to?: number | null;
        total?: number | null;
    };
    filters: {
        category?: string;
        status?: string;
    };
};

const NATIVE_SELECT_CLASS =
    'focus-ring h-11 w-full rounded-md border border-input bg-field px-3 text-sm text-foreground shadow-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 md:h-9';

const FLAG_STATUS_MAP: Record<string, StatusConfig> = {
    open: STATUS.pending,
    reviewed: STATUS.success,
    dismissed: STATUS.neutral,
};

function formatPaginationLabel(label: string): string {
    return label
        .replaceAll('&laquo; Previous', 'Previous')
        .replaceAll('Next &raquo;', 'Next')
        .replaceAll('&laquo;', 'Previous')
        .replaceAll('&raquo;', 'Next')
        .trim();
}

export default function FlagQueue({ flags, filters }: Props) {
    const [category, setCategory] = useState(filters.category ?? '');
    const [status, setStatus] = useState(filters.status ?? '');

    const applyFilters = (event: React.FormEvent) => {
        event.preventDefault();
        router.get(
            '/admin/flags',
            {
                category: category || undefined,
                status: status || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    return (
        <>
            <Head title="Content flags" />
            <div className="space-y-6">
                <header>
                    <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Content flags</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Review off-platform content flags and record a decision.
                    </p>
                </header>

                <Card className="p-4 shadow-xs">
                    <form onSubmit={applyFilters} className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="grid gap-1.5">
                            <Label htmlFor="flags-category">Category</Label>
                            <select
                                id="flags-category"
                                name="category"
                                value={category}
                                onChange={(event) => setCategory(event.target.value)}
                                className={NATIVE_SELECT_CLASS}
                            >
                                <option value="">All categories</option>
                                {Object.entries({
                                    move_chat_outside: 'Move chat outside TaskMate',
                                    bypass_agreement: 'Bypass agreement',
                                    bypass_review: 'Bypass review',
                                    share_contact_details: 'Share contact details',
                                }).map(([key, label]) => (
                                    <option key={key} value={key}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="flags-status">Status</Label>
                            <select
                                id="flags-status"
                                name="status"
                                value={status}
                                onChange={(event) => setStatus(event.target.value)}
                                className={NATIVE_SELECT_CLASS}
                            >
                                <option value="">All statuses</option>
                                <option value="open">Open</option>
                                <option value="reviewed">Reviewed</option>
                                <option value="dismissed">Dismissed</option>
                            </select>
                        </div>
                        <div>
                            <Button type="submit" className="w-full lg:w-auto">
                                Apply filters
                            </Button>
                        </div>
                    </form>
                </Card>

                {flags.data.length ? (
                    <>
                        <div className="hidden overflow-x-auto rounded-xl border border-border bg-card shadow-xs md:block">
                            <table className="w-full border-collapse text-left text-sm">
                                <thead className="sticky top-0 z-10 border-b border-border bg-muted/60 text-xs font-semibold text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3">Category</th>
                                        <th className="px-4 py-3">Author</th>
                                        <th className="px-4 py-3">Content</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {flags.data.map((flag) => (
                                        <tr key={flag.id} className="transition-colors hover:bg-muted/30">
                                            <td className="px-4 py-3 font-medium text-foreground">
                                                {flag.categoryLabel}
                                            </td>
                                            <td className="px-4 py-3 text-foreground">{flag.author}</td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {flag.context} · {flag.field}
                                            </td>
                                            <td className="px-4 py-3">
                                                <StatusFromMap map={FLAG_STATUS_MAP} status={flag.status}>
                                                    <span className="capitalize">{flag.status}</span>
                                                </StatusFromMap>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/admin/flags/${flag.id}`}>Review</Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="grid gap-3 md:hidden">
                            {flags.data.map((flag) => (
                                <Card key={flag.id} className="space-y-2.5 p-4 shadow-xs">
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <span className="font-semibold text-foreground">{flag.categoryLabel}</span>
                                        <StatusFromMap map={FLAG_STATUS_MAP} status={flag.status}>
                                            <span className="capitalize">{flag.status}</span>
                                        </StatusFromMap>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {flag.author} · {flag.context} · {flag.field}
                                    </p>
                                    <div className="pt-1">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/admin/flags/${flag.id}`}>Review</Link>
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </>
                ) : (
                    <Card className="space-y-2 p-10 text-center">
                        <Flag className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
                        <p className="text-sm text-muted-foreground">No content flags match these filters.</p>
                    </Card>
                )}

                {flags.links && flags.links.length > 3 && (
                    <nav aria-label="Content flag pages" className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        {flags.from != null && flags.to != null && flags.total != null ? (
                            <p className="text-xs tabular-nums text-muted-foreground">
                                Showing {flags.from}–{flags.to} of {flags.total}
                            </p>
                        ) : (
                            <span />
                        )}
                        <div className="flex flex-wrap items-center gap-1.5">
                            {flags.links.map((link, index) => {
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

FlagQueue.layout = (page: ReactNode) => <AdminLayout>{page}</AdminLayout>;
