import { Head, Link, usePage } from '@inertiajs/react';

const messages: Record<number, string> = {
    403: 'You do not have permission to view this page.',
    404: 'We could not find that page.',
    419: 'This page expired. Refresh it and try again.',
    429: 'Too many requests. Please wait before trying again.',
    500: 'Something went wrong. Please try again later.',
};

export default function ErrorStatus({ status }: { status: number }) {
    const { auth, currentTeam } = usePage<any>().props;
    const user = auth?.user;
    const dashboardHref = currentTeam?.slug
        ? `/${currentTeam.slug}/dashboard`
        : '/';
    return (
        <>
            <Head title={`${status} — TaskMate`} />
            <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col justify-center px-4 py-16">
                <p className="text-sm font-semibold text-primary">
                    TaskMate · {status}
                </p>
                <h1 className="mt-3 text-3xl font-bold">
                    {messages[status] ?? messages[500]}
                </h1>
                <p className="mt-3 text-muted-foreground">
                    You can return to the TaskMate home page or continue to your
                    dashboard.
                </p>
                <div className="mt-6 flex gap-3">
                    <Link
                        className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
                        href="/"
                    >
                        Home
                    </Link>
                    {user && (
                        <Link
                            className="rounded-md border px-4 py-2"
                            href={dashboardHref}
                        >
                            Dashboard
                        </Link>
                    )}
                </div>
            </main>
        </>
    );
}
