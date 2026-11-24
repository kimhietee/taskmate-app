import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { VerificationStatusBadge } from '@/components/verification-status-badge';
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

export default function AdminUsersIndex({ users, filters, userTypes, verificationStatuses }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [userType, setUserType] = useState(filters.user_type ?? '');
    const [verificationStatus, setVerificationStatus] = useState(filters.verification_status ?? '');

    const applyFilters = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(admin.users.index().url, {
            search: search || undefined,
            user_type: userType || undefined,
            verification_status: verificationStatus || undefined,
        }, { preserveState: true, preserveScroll: true });
    };

    return (
        <>
            <Head title="Users" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold">Users</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Search accounts and filter by account type or verification status.</p>
                </div>

                <form onSubmit={applyFilters} className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-4">
                      <input className="h-10 rounded-md border bg-background px-3 text-sm" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name" aria-label="Search by name" />
                    <select className="h-10 rounded-md border bg-background px-3 text-sm" value={userType} onChange={(event) => setUserType(event.target.value)} aria-label="Filter by account type">
                        <option value="">All account types</option>
                        {userTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                    </select>
                    <select className="h-10 rounded-md border bg-background px-3 text-sm" value={verificationStatus} onChange={(event) => setVerificationStatus(event.target.value)} aria-label="Filter by verification status">
                        <option value="">All statuses</option>
                        {verificationStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                    </select>
                    <button className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground" type="submit">Apply filters</button>
                </form>

                {users.data.length ? (
                    <div className="space-y-4">
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/50 text-muted-foreground">
                                    <tr><th className="p-3">Name</th><th className="p-3">Type</th><th className="p-3">Status</th><th className="p-3">Registered</th></tr>
                                </thead>
                                <tbody>
                                    {users.data.map((user) => (
                                        <tr key={user.id} className="border-t">
                                            <td className="p-3"><Link href={admin.users.show(user.id)} className="font-medium underline underline-offset-4">{user.name}</Link></td>
                                            <td className="p-3">{user.userTypeLabel}</td>
                                            <td className="p-3"><VerificationStatusBadge status={user.verificationStatus} /></td>
                                            <td className="whitespace-nowrap p-3">{user.registeredAt ?? '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm text-muted-foreground">Showing {users.from ?? 0}–{users.to ?? 0} of {users.total} accounts</p>
                            <nav aria-label="Users pages" className="flex flex-wrap gap-1">
                                {users.links.map((link, index) => (
                                    <Link key={`${link.label}-${index}`} href={link.url ?? '#'} aria-disabled={!link.url} className={`rounded border px-3 py-2 text-sm ${link.active ? 'bg-muted font-medium' : ''} ${link.url ? '' : 'pointer-events-none opacity-50'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                                ))}
                            </nav>
                        </div>
                    </div>
                ) : (
                    <p className="rounded-lg border p-6 text-sm text-muted-foreground">No accounts match these filters.</p>
                )}
            </div>
        </>
    );
}

AdminUsersIndex.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
