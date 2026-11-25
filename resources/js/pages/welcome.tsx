import { PAYMENT_BOUNDARY_NOTICE, SAFETY_NOTICE } from '@/constants/notices';
import { Head, Link, usePage } from '@inertiajs/react';
import { register, login } from '@/routes';
import browse from '@/routes/browse';
import tasks from '@/routes/tasks';

const primaryLinkClass =
    'focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 md:h-10';
const outlineLinkClass =
    'focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-card px-5 text-sm font-semibold text-foreground shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground md:h-10';

const FLOW_STEPS = [
    'Create an account and complete administrator verification',
    'Eligible posters submit a clear task for review',
    'Verified students review approved tasks and apply',
    'The poster and selected student agree on the work and amount',
    'Both people confirm the same agreement before work begins',
    'Record completion and payment status, then rate or report if needed',
];

export default function Welcome() {
    const { auth } = usePage<any>().props;
    const user = auth?.user;
    const actions = user?.is_admin
        ? [{ label: 'Open admin dashboard', href: '/admin', primary: true }]
        : user
            ? [
                ...(user.can_apply_tasks ? [{ label: 'Browse tasks', href: browse.index().url, primary: true }] : []),
                ...(user.can_post_tasks ? [{ label: 'Post a task', href: tasks.create().url, primary: !user.can_apply_tasks }] : []),
                ...(!user.can_apply_tasks && !user.can_post_tasks ? [{ label: 'Open dashboard', href: '/dashboard', primary: true }] : []),
            ]
            : [
                { label: 'Create an account', href: register().url, primary: true },
                { label: 'Log in', href: login().url, primary: false },
            ];

    return (
        <>
            <Head title="Campus tasks with clearer details" />

            <section className="page py-12 md:py-20">
                <div className="max-w-3xl space-y-5">
                    <p className="text-sm font-semibold text-brand">
                        For the Central Mindanao University community
                    </p>
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                        Find campus tasks with the details you need before you agree.
                    </h1>
                    <p className="prose-width text-base text-muted-foreground">
                        TaskMate helps students find side jobs and helps eligible posters share clear work details, review applicants, and agree on the work before it begins.
                    </p>
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                        {actions.map((action) => (
                            <Link
                                key={action.label}
                                className={action.primary ? primaryLinkClass : outlineLinkClass}
                                href={action.href}
                            >
                                {action.label}
                            </Link>
                        ))}
                    </div>
                    {!user && (
                        <p className="text-sm text-muted-foreground">
                            Browse and posting require a verified account. Create an account to start the review process.
                        </p>
                    )}
                </div>
            </section>

            <section className="border-y border-border bg-muted/35">
                <div className="page space-y-6">
                    <div className="space-y-1.5">
                        <h2 className="text-xl font-semibold md:text-2xl">The main TaskMate flow</h2>
                        <p className="prose-width text-sm text-muted-foreground">
                            TaskMate focuses on helping students and posters reach clear, recorded agreements for individual side jobs.
                        </p>
                    </div>
                    <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {FLOW_STEPS.map((step, i) => (
                            <li
                                key={step}
                                className="space-y-2 rounded-xl border border-border bg-card p-5 shadow-xs"
                            >
                                <span className="inline-flex size-7 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums text-foreground">
                                    {i + 1}
                                </span>
                                <p className="text-sm text-foreground">{step}</p>
                            </li>
                        ))}
                    </ol>
                    <p className="text-sm text-muted-foreground">
                        Only verified students can apply. Verified faculty/staff and approved organizations can post; student posting depends on the current configuration.
                    </p>
                </div>
            </section>

            <section className="page space-y-5">
                <h2 className="text-xl font-semibold md:text-2xl">Clear limits</h2>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5 rounded-xl border border-border bg-card p-5 shadow-xs">
                        <h3 className="text-base font-semibold">Direct payments only</h3>
                        <p className="text-sm text-muted-foreground">{PAYMENT_BOUNDARY_NOTICE}</p>
                    </div>
                    <div className="space-y-1.5 rounded-xl border border-border bg-card p-5 shadow-xs">
                        <h3 className="text-base font-semibold">Informed decisions, not guarantees</h3>
                        <p className="text-sm text-muted-foreground">{SAFETY_NOTICE}</p>
                    </div>
                </div>
            </section>
        </>
    );
}
