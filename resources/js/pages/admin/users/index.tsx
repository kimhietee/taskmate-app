import { Head, Link, router } from '@inertiajs/react';
import { Users } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VerificationStatusBadge } from '@/components/verification-status-badge';
import AdminLayout from '@/layouts/admin-layout';
import admin from '@/routes/admin';

type UserRow = {
    id: number;
    name: string;
    userType: string;
    userTypeLabel: string;
    verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected' | 'more_info_requested';
    registeredAt: string | null;
};

type PageLink = { url: string | null; label: string; active: boolean };

type Props = {
    users: { data: UserRow[]; links: PageLink[]; from: number | null; to: number | null; total: number };
    filters: { search?: string; user_type?: string; verification_status?: string };
    userTypes: { value: string; label: string }[];
    verificationStatuses: { value: string; label: string }[];
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

export default function AdminUsersIndex({ users, filters, userTypes, verificationStatuses }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [userType, setUserType] = useState(filters.user_type ?? '');
    const [verificationStatus, setVerificationStatus] = useState(filters.verification_status ?? '');

    const applyFilters = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            admin.users.index().url,
            {
                search: search || undefined,
                user_type: userType || undefined,
                verification_status: verificationStatus || undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <>
            <Head title="Users" />
            <div className="space-y-6">
                <header>
                    <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Users</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Search accounts and filter by account type or verification status.
                    </p>
                </header>

                <Card className="p-4 shadow-xs">
                    <form onSubmit={applyFilters} className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="users-search">Search</Label>
                            <Input
                                id="users-search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search by name"
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="users-type">Account type</Label>
                            <select
                                id="users-type"
                                className={NATIVE_SELECT_CLASS}
                                value={userType}
                                onChange={(event) => setUserType(event.target.value)}
                            >
                                <option value="">All account types</option>
                                {userTypes.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="users-status">Verification status</Label>
                            <select
                                id="users-status"
                                className={NATIVE_SELECT_CLASS}
                                value={verificationStatus}
                                onChange={(event) => setVerificationStatus(event.target.value)}
                            >
                                <option value="">All statuses</option>
                                {verificationStatuses.map((status) => (
                                    <option key={status.value} value={status.value}>
                                        {status.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <Button type="submit" className="w-full lg:w-auto">
                                Apply filters
                            </Button>
                        </div>
                    </form>
                </Card>

                {users.data.length ? (
                    <div className="space-y-4">
                        <div className="hidden overflow-x-auto rounded-xl border border-border bg-card shadow-xs md:block">
                            <table className="w-full border-collapse text-left text-sm">
                                <thead className="sticky top-0 z-10 border-b border-border bg-muted/60 text-xs font-semibold text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3">Name</th>
                                        <th className="px-4 py-3">Type</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Registered</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {users.data.map((user) => (
                                        <tr key={user.id} className="transition-colors hover:bg-muted/30">
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={admin.users.show(user.id)}
                                                    className="focus-ring rounded-sm font-semibold text-brand underline-offset-4 hover:underline"
                                                >
                                                    {user.name}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-foreground">{user.userTypeLabel}</td>
                                            <td className="px-4 py-3">
                                                <VerificationStatusBadge status={user.verificationStatus} />
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap tabular-nums text-muted-foreground">
                                                {user.registeredAt ?? '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="grid gap-3 md:hidden">
                            {users.data.map((user) => (
                                <Card key={user.id} className="space-y-2.5 p-4 shadow-xs">
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <Link
                                            href={admin.users.show(user.id)}
                                            className="focus-ring rounded-sm font-semibold text-brand underline-offset-4 hover:underline"
                                        >
                                            {user.name}
                                        </Link>
                                        <VerificationStatusBadge status={user.verificationStatus} />
                                    </div>
                                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                                        <span>{user.userTypeLabel}</span>
                                        <span className="tabular-nums">{user.registeredAt ?? '—'}</span>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        <div className="space-y-2 pt-2">
                            <p className="text-xs tabular-nums text-muted-foreground">
                                Showing {users.from ?? 0}–{users.to ?? 0} of {users.total} accounts
                            </p>
                            {users.links.length > 3 && (
                                <nav aria-label="Users pages" className="flex flex-wrap items-center gap-1.5">
                                    {users.links.map((link, index) => {
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
                                </nav>
                            )}
                        </div>
                    </div>
                ) : (
                    <Card className="space-y-2 p-10 text-center">
                        <Users className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
                        <p className="text-sm text-muted-foreground">No accounts match these filters.</p>
                    </Card>
                )}
            </div>
        </>
    );
}

AdminUsersIndex.layout = (page: ReactNode) => <AdminLayout>{page}</AdminLayout>;
