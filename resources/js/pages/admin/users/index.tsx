import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { AdminPageHeading } from '@/components/admin-page-heading';
import { VerificationStatusBadge } from '@/components/verification-status-badge';
import admin from '@/routes/admin';

type UserRow = {
    id: number;
    name: string;
    userType: string;
    userTypeLabel: string;
    verificationStatus:
        | 'pending'
        | 'verified'
        | 'rejected'
        | 'more_info_requested';
    registeredAt: string | null;
};

type PageLink = { url: string | null; label: string; active: boolean };

type Props = {
    users: {
        data: UserRow[];
        links: PageLink[];
        from: number | null;
        to: number | null;
        total: number;
    };
    filters: {
        search?: string;
        user_type?: string;
        verification_status?: string;
    };
    userTypes: { value: string; label: string }[];
    verificationStatuses: { value: string; label: string }[];
};

export default function AdminUsersIndex({
    users,
    filters,
    userTypes,
    verificationStatuses,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [userType, setUserType] = useState(filters.user_type ?? '');
    const [verificationStatus, setVerificationStatus] = useState(
        filters.verification_status ?? '',
    );

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
            <div className="admin-page space-y-5" data-tone="users">
                <AdminPageHeading
                    eyebrow="Account verification"
                    title="Users"
                    description="Review submitted accounts and follow up on verification."
                    count={users.total}
                    countLabel="accounts"
                />

                <form onSubmit={applyFilters} className="admin-filter-panel">
                    <p className="admin-filter-heading">Find an account</p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.5fr)_1fr_1fr_auto]">
                        <input
                            className="h-10 rounded-md border bg-background px-3 text-sm"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search by name"
                            aria-label="Search by name"
                        />
                        <select
                            className="h-10 rounded-md border bg-background px-3 text-sm"
                            value={userType}
                            onChange={(event) =>
                                setUserType(event.target.value)
                            }
                            aria-label="Filter by account type"
                        >
                            <option value="">All account types</option>
                            {userTypes.map((type) => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                        <select
                            className="h-10 rounded-md border bg-background px-3 text-sm"
                            value={verificationStatus}
                            onChange={(event) =>
                                setVerificationStatus(event.target.value)
                            }
                            aria-label="Filter by verification status"
                        >
                            <option value="">All statuses</option>
                            {verificationStatuses.map((status) => (
                                <option key={status.value} value={status.value}>
                                    {status.label}
                                </option>
                            ))}
                        </select>
                        <button className="admin-filter-submit" type="submit">
                            Apply filters
                        </button>
                    </div>
                </form>

                {users.data.length ? (
                    <div className="space-y-4">
                        <div className="admin-list-panel">
                            <div className="admin-list-heading">
                                <h2>Account results</h2>
                                <p>Open a name to review details</p>
                            </div>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th className="p-3">Name</th>
                                        <th className="p-3">Type</th>
                                        <th className="p-3">Status</th>
                                        <th className="p-3">Registered</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.data.map((user) => (
                                        <tr key={user.id}>
                                            <td data-label="Name">
                                                <Link
                                                    href={admin.users.show(
                                                        user.id,
                                                    )}
                                                    className="font-medium"
                                                >
                                                    {user.name}
                                                </Link>
                                            </td>
                                            <td data-label="Type">
                                                {user.userTypeLabel}
                                            </td>
                                            <td data-label="Status">
                                                <VerificationStatusBadge
                                                    status={
                                                        user.verificationStatus
                                                    }
                                                />
                                            </td>
                                            <td
                                                data-label="Registered"
                                                className="whitespace-nowrap"
                                            >
                                                {user.registeredAt ?? '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm text-muted-foreground">
                                Showing {users.from ?? 0}–{users.to ?? 0} of{' '}
                                {users.total} accounts
                            </p>
                            <nav
                                aria-label="Users pages"
                                className="admin-pagination"
                            >
                                {users.links.map((link, index) => (
                                    <Link
                                        key={`${link.label}-${index}`}
                                        href={link.url ?? '#'}
                                        aria-disabled={!link.url}
                                        aria-current={
                                            link.active ? 'page' : undefined
                                        }
                                        className={
                                            link.url
                                                ? ''
                                                : 'pointer-events-none opacity-50'
                                        }
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                ))}
                            </nav>
                        </div>
                    </div>
                ) : (
                    <div className="admin-list-panel admin-empty">
                        No accounts match these filters.
                    </div>
                )}
            </div>
        </>
    );
}

AdminUsersIndex.layout = (page: React.ReactNode) => (
    <AdminLayout>{page}</AdminLayout>
);
