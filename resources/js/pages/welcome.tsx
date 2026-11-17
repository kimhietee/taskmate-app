import { PAYMENT_BOUNDARY_NOTICE, SAFETY_NOTICE } from '@/constants/notices';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowDown, ArrowRight, BadgeCheck, ClipboardCheck, Handshake, Leaf, Search, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { register, login } from '@/routes';
import browse from '@/routes/browse';
import tasks from '@/routes/tasks';

const steps = [
    {
        number: '01',
        title: 'Verify your account',
        description: 'Build trust with a reviewed account before taking part.',
        icon: BadgeCheck,
    },
    {
        number: '02',
        title: 'Review or post a task',
        description: 'See the work details up front, or submit a task for review.',
        icon: Search,
    },
    {
        number: '03',
        title: 'Agree and keep a record',
        description: 'Confirm the terms together and record completion and payment status.',
        icon: Handshake,
    },
];

export default function Welcome() {
    const { auth } = usePage<any>().props;
    const user = auth?.user;
    const [activeNav, setActiveNav] = useState<'how' | 'dashboard' | null>(() =>
        typeof window !== 'undefined' && window.location.hash === '#how-it-works' ? 'how' : null,
    );
    const primaryHref = user?.is_admin ? '/admin' : user?.can_apply_tasks ? browse.index().url : user?.can_post_tasks ? tasks.create().url : user ? '/dashboard' : register().url;
    const primaryLabel = user?.is_admin || user ? (user?.can_apply_tasks ? 'Browse tasks' : user?.can_post_tasks ? 'Post a task' : 'Go to dashboard') : 'Create an account';

    return (
        <>
            <Head title="Campus tasks with clearer details" />
            <div className="bg-[#f7f8f2] text-[#183324] dark:bg-[#101b15] dark:text-[#edf4ec]">
                <header className="sticky top-0 z-50 border-b border-emerald-900/10 bg-[#F5F8F2] dark:border-emerald-100/10 dark:bg-[#17251c]">
                    <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
                        <Link href="/" onClick={() => setActiveNav(null)} className="flex items-center gap-2.5 rounded-lg font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700">
                            <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-800 text-amber-300 dark:bg-emerald-700">
                                <Leaf aria-hidden="true" className="size-5" />
                            </span>
                            <span className="text-lg">TaskMate</span>
                        </Link>
                        <nav aria-label="Main navigation" className="flex items-center gap-1">
                            <a
                                href="#how-it-works"
                                aria-current={activeNav === 'how' ? 'location' : undefined}
                                onClick={() => setActiveNav('how')}
                                className={`hidden rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 sm:inline ${activeNav === 'how' ? 'bg-[#E4EDDF] text-emerald-900 dark:bg-emerald-800 dark:text-amber-200' : 'text-[#526458] hover:bg-[#EAF0E6] hover:text-emerald-900 active:bg-[#E4EDDF] dark:text-[#bdcbbf] dark:hover:bg-emerald-900/50 dark:hover:text-amber-200'}`}
                            >
                                How it works
                            </a>
                            {user && (
                                <Link
                                    href="/dashboard"
                                    aria-current={activeNav === 'dashboard' ? 'page' : undefined}
                                    onClick={() => setActiveNav('dashboard')}
                                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${activeNav === 'dashboard' ? 'bg-[#E4EDDF] text-emerald-900 dark:bg-emerald-800 dark:text-amber-200' : 'text-[#526458] hover:bg-[#EAF0E6] hover:text-emerald-900 active:bg-[#E4EDDF] dark:text-[#bdcbbf] dark:hover:bg-emerald-900/50 dark:hover:text-amber-200'}`}
                                >
                                    Dashboard
                                </Link>
                            )}
                            <Link href={login()} className="rounded-lg px-3 py-2 text-sm font-semibold text-[#526458] transition-colors hover:bg-[#EAF0E6] hover:text-emerald-900 active:bg-[#E4EDDF] dark:text-[#bdcbbf] dark:hover:bg-emerald-900/50 dark:hover:text-amber-200">
                                Log in
                            </Link>
                            <Link href={register()} className="rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 dark:bg-amber-300 dark:text-emerald-950 dark:hover:bg-amber-200">
                                Register
                            </Link>
                        </nav>
                    </div>
                </header>

                <main>
                    <section className="relative isolate overflow-hidden">
                        <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-32 -z-10 size-[30rem] rounded-full bg-amber-200/50 blur-3xl dark:bg-emerald-800/20" />
                        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-28">
                            <div>
                                <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-3.5 py-1.5 text-sm font-medium text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-100">
                                    <span className="size-2 rounded-full bg-amber-400" />
                                    For the CMU community
                                </p>
                                <h1 className="mt-6 max-w-2xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
                                    Campus work, with the details clear from the start.
                                </h1>
                                <p className="mt-6 max-w-xl text-base leading-7 text-[#526458] dark:text-[#bdcbbf] sm:text-lg">
                                    Find tasks, review what the work involves, and agree on terms before getting started.
                                </p>
                                <div className="mt-8 flex flex-wrap items-center gap-3">
                                    <Link href={primaryHref} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-emerald-800 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 dark:bg-amber-300 dark:text-emerald-950 dark:hover:bg-amber-200">
                                        {primaryLabel}
                                        <ArrowRight aria-hidden="true" className="size-4" />
                                    </Link>
                                    {!user && (
                                        <Link href={login()} className="inline-flex min-h-12 items-center rounded-xl border border-emerald-200 bg-white/60 px-5 py-3 text-sm font-semibold text-emerald-900 transition hover:bg-white dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100 dark:hover:bg-emerald-900/60">
                                            Log in
                                        </Link>
                                    )}
                                </div>
                                <a href="#how-it-works" className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-[#526458] transition hover:text-emerald-800 dark:text-[#bdcbbf] dark:hover:text-amber-300">
                                    Learn how it works
                                    <ArrowDown aria-hidden="true" className="size-4" />
                                </a>
                            </div>

                            <div className="relative mx-auto w-full max-w-lg">
                                <div aria-hidden="true" className="absolute -left-5 -top-5 size-24 rounded-3xl bg-amber-300/80 dark:bg-amber-400/20" />
                                <div aria-hidden="true" className="absolute -bottom-5 -right-5 size-32 rounded-full bg-emerald-200/80 dark:bg-emerald-700/25" />
                                <div className="relative rounded-3xl border border-emerald-100 bg-white p-6 shadow-[0_24px_70px_-35px_rgba(20,65,41,0.35)] dark:border-emerald-900 dark:bg-[#17251c] sm:p-8">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-semibold text-emerald-800 dark:text-amber-300">A clearer way to agree</p>
                                            <h2 className="mt-1 text-xl font-semibold tracking-tight">Know what to expect</h2>
                                        </div>
                                        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-emerald-900 dark:bg-amber-300/15 dark:text-amber-300">
                                            <ShieldCheck aria-hidden="true" className="size-6" />
                                        </span>
                                    </div>
                                    <p className="mt-3 text-sm leading-6 text-[#617166] dark:text-[#bdcbbf]">
                                        Review important information before deciding whether a task is right for you.
                                    </p>
                                    <ul className="mt-6 space-y-3">
                                        {[
                                            'Activities and deliverables',
                                            'Time commitment and requirements',
                                            'Work mode and location details',
                                            'Agreed terms and completion record',
                                        ].map((item) => (
                                            <li key={item} className="flex items-center gap-3 rounded-xl bg-[#f5f8f2] px-3.5 py-3 text-sm font-medium dark:bg-[#203329]">
                                                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-200/80 text-emerald-900 dark:bg-amber-300/15 dark:text-amber-300">
                                                    <ClipboardCheck aria-hidden="true" className="size-4" />
                                                </span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section id="how-it-works" className="scroll-mt-20 border-y border-emerald-100 bg-white/70 dark:border-emerald-900 dark:bg-[#142119]">
                        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
                            <div className="max-w-2xl">
                                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-800 dark:text-amber-300">Simple, transparent steps</p>
                                <h2 className="mt-2 text-3xl font-semibold tracking-tight">How TaskMate works</h2>
                                <p className="mt-3 leading-7 text-[#617166] dark:text-[#bdcbbf]">A straightforward process for students and eligible task posters.</p>
                            </div>
                            <ol className="mt-9 grid gap-4 md:grid-cols-3">
                                {steps.map(({ number, title, description, icon: Icon }) => (
                                    <li key={number} className="rounded-2xl border border-emerald-100 bg-[#fbfcf8] p-5 dark:border-emerald-900 dark:bg-[#17251c] sm:p-6">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold tabular-nums text-emerald-800 dark:text-amber-300">{number}</span>
                                            <span className="flex size-10 items-center justify-center rounded-xl bg-amber-100 text-emerald-900 dark:bg-amber-300/15 dark:text-amber-300">
                                                <Icon aria-hidden="true" className="size-5" />
                                            </span>
                                        </div>
                                        <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                                        <p className="mt-2 text-sm leading-6 text-[#617166] dark:text-[#bdcbbf]">{description}</p>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </section>

                    <section id="safety" className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-16">
                        <div className="grid gap-5 rounded-2xl border border-amber-300/80 bg-amber-100/70 p-6 dark:border-amber-800 dark:bg-amber-300/10 sm:grid-cols-[auto_1fr] sm:gap-6 sm:p-8">
                            <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-800 text-amber-200 dark:bg-emerald-700">
                                <ShieldCheck aria-hidden="true" className="size-6" />
                            </span>
                            <div>
                                <h2 className="text-xl font-semibold">Clear expectations. Your decision.</h2>
                                <p className="mt-3 text-sm leading-6 text-[#465c4c] dark:text-[#d3dfd1]">{PAYMENT_BOUNDARY_NOTICE}</p>
                                <p className="mt-2 text-sm leading-6 text-[#465c4c] dark:text-[#d3dfd1]">{SAFETY_NOTICE}</p>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </>
    );
}
