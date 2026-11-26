import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import {
    CalendarDays,
    ClipboardCheck,
    ClipboardList,
    Clock3,
    CreditCard,
    Handshake,
    MapPin,
    ShieldCheck,
    UserRoundPlus,
} from 'lucide-react';
import { register, login } from '@/routes';
import browse from '@/routes/browse';
import tasks from '@/routes/tasks';

type SampleTask = {
    category: string;
    workType: string;
    title: string;
    description: string;
    workMode: string;
    location?: string;
    poster: string;
    posterMark: string;
    posterType: string;
    duration: string;
    schedule: string;
    payTiming: string;
    budget: string;
};

const sampleTasks: SampleTask[] = [
    {
        category: 'Design and creative work',
        workType: 'One-time task',
        title: 'Design a campus event poster',
        description:
            'Create a poster for a campus event and deliver a print-ready file.',
        workMode: 'Remote',
        poster: 'CMU Student Affairs',
        posterMark: 'SA',
        posterType: 'Organization',
        duration: '3 hours',
        schedule: 'Flexible',
        payTiming: 'Upon completion',
        budget: '₱600',
    },
    {
        category: 'Event support',
        workType: 'One-time task',
        title: 'Help organize a reading event',
        description:
            'Arrange event materials and help guests find their seats.',
        workMode: 'Onsite',
        location: 'CMU Main Library',
        poster: 'CMU Library Services',
        posterMark: 'LB',
        posterType: 'Faculty / Staff',
        duration: '4 hours',
        schedule: 'Mon & Wed · 1–3 PM',
        payTiming: 'Daily',
        budget: '₱450',
    },
    {
        category: 'Errands and delivery',
        workType: 'One-time task',
        title: 'Deliver printed event materials',
        description:
            'Pick up and deliver prepared event materials to the campus activity venue.',
        workMode: 'Onsite',
        location: 'CMU Activities Center',
        poster: 'CMU Events Office',
        posterMark: 'EO',
        posterType: 'Organization',
        duration: '2 hours',
        schedule: 'To be discussed',
        payTiming: 'To be discussed',
        budget: 'To be discussed',
    },
    {
        category: 'Data entry and clerical work',
        workType: 'Short-term part-time',
        title: 'Update the student club event calendar',
        description:
            'Keep event listings organized and check submitted updates twice a week.',
        workMode: 'Remote',
        poster: 'Student Media Club',
        posterMark: 'SM',
        posterType: 'Student',
        duration: '2 hours',
        schedule: 'Flexible',
        payTiming: 'Weekly',
        budget: '₱350',
    },
];

export default function Welcome() {
    const [introComplete, setIntroComplete] = useState(false);
    const [introRun, setIntroRun] = useState(0);
    const [activeSampleIndex, setActiveSampleIndex] = useState(0);
    const [workflowVisible, setWorkflowVisible] = useState(false);
    const workflowSectionRef = useRef<HTMLElement | null>(null);
    const activeSampleIndexRef = useRef(0);
    const sampleChangesRef = useRef(0);
    const { auth } = usePage().props;
    const user = auth?.user;
    const actions = user?.is_admin
        ? [{ label: 'Open admin dashboard', href: '/admin', primary: true }]
        : user
          ? [
                ...(user.can_browse_tasks
                    ? [
                          {
                              label: 'Browse tasks',
                              href: browse.index().url,
                              primary: true,
                          },
                      ]
                    : []),
                ...(user.can_post_tasks
                    ? [
                          {
                              label: 'Post a task',
                              href: tasks.create().url,
                              primary: !user.can_apply_tasks,
                          },
                      ]
                    : []),
                ...(!user.can_browse_tasks && !user.can_post_tasks
                    ? [
                          {
                              label: 'Open dashboard',
                              href: '/dashboard',
                              primary: true,
                          },
                      ]
                    : []),
            ]
          : [
                {
                    label: 'Create an account',
                    href: register().url,
                    primary: true,
                },
                { label: 'Log in', href: login().url, primary: false },
            ];
    const introSteps = [
        { label: 'Post a task', Icon: ClipboardList },
        { label: 'Admin reviews', Icon: ShieldCheck },
        { label: 'Student applies', Icon: UserRoundPlus },
        { label: 'Agree before work', Icon: Handshake },
        { label: 'Record outcome', Icon: ClipboardCheck },
    ];
    const activeSample = sampleTasks[activeSampleIndex];

    useEffect(() => {
        const reducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;

        if (reducedMotion) {
            setIntroComplete(true);

            return;
        }

        const timeout = window.setTimeout(() => {
            setIntroComplete(true);
        }, 5600);

        return () => window.clearTimeout(timeout);
    }, [introRun]);

    useEffect(() => {
        if (!introComplete) {
            return;
        }

        let restartIntroTimeout: number | undefined;
        const rotationInterval = window.setInterval(() => {
            const nextIndex =
                (activeSampleIndexRef.current + 1) % sampleTasks.length;

            activeSampleIndexRef.current = nextIndex;
            setActiveSampleIndex(nextIndex);
            sampleChangesRef.current += 1;

            if (sampleChangesRef.current < 10) {
                return;
            }

            sampleChangesRef.current = 0;

            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                return;
            }

            window.clearInterval(rotationInterval);
            restartIntroTimeout = window.setTimeout(() => {
                activeSampleIndexRef.current = 0;
                setActiveSampleIndex(0);
                setIntroRun((run) => run + 1);
                setIntroComplete(false);
            }, 5000);
        }, 5000);

        return () => {
            window.clearInterval(rotationInterval);

            if (restartIntroTimeout !== undefined) {
                window.clearTimeout(restartIntroTimeout);
            }
        };
    }, [introComplete]);

    useEffect(() => {
        if (!introComplete) {
            return;
        }

        const section = workflowSectionRef.current;

        if (!section) {
            return;
        }

        if (!('IntersectionObserver' in window)) {
            setWorkflowVisible(true);

            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry?.isIntersecting) {
                    setWorkflowVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.12 },
        );

        observer.observe(section);

        return () => observer.disconnect();
    }, [introComplete]);

    return (
        <>
            <Head title="Campus tasks with clearer details" />
            <div
                className="landing-page-content"
                data-intro-complete={introComplete}
                aria-hidden={!introComplete}
                inert={!introComplete}
            >
                <header className="welcome-header reveal">
                    <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-2.5 sm:px-8">
                        <Link
                            href="/"
                            className="welcome-brand inline-flex items-center gap-2 rounded-lg text-2xl font-bold tracking-tight"
                        >
                            <img
                                src="/favicon.svg"
                                width="36"
                                height="36"
                                alt=""
                            />
                            TaskMate
                        </Link>
                        <nav
                            aria-label="Main navigation"
                            className="welcome-nav flex items-center gap-1 text-sm font-semibold sm:gap-1.5"
                        >
                            <Link
                                href="/how-it-works"
                                className="welcome-nav-link hidden sm:inline-flex"
                            >
                                How it works
                            </Link>
                            {user ? (
                                <Link
                                    className="brand-nav-action"
                                    href="/dashboard"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="welcome-nav-link"
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        href={register()}
                                        className="brand-nav-action"
                                    >
                                        Register
                                    </Link>
                                </>
                            )}
                        </nav>
                    </div>
                </header>
                <div className="cmu-photo-hero">
                    <section
                        aria-labelledby="welcome-title"
                        className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1.12fr_1fr] lg:gap-16 lg:py-10"
                    >
                        <div className="welcome-intro reveal">
                            <p className="flex items-center gap-2.5 text-xs font-bold tracking-[0.13em] text-muted-foreground uppercase">
                                <span
                                    aria-hidden="true"
                                    className="h-1 w-7 rounded-full bg-brand-gold"
                                />
                                Central Mindanao University
                            </p>
                            <h1
                                id="welcome-title"
                                className="mt-5 text-[clamp(3.3rem,6.1vw,5.3rem)] leading-[0.98] font-semibold tracking-[-0.065em]"
                            >
                                Campus tasks,
                                <br />
                                <em className="welcome-title-accent">
                                    clear terms.
                                </em>
                            </h1>
                            <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
                                Find a side job or post a task for the CMU
                                community. Review the work, time, and pay before
                                you agree.
                            </p>
                            <div className="mt-7 flex flex-wrap gap-3">
                                {actions.map((action) => (
                                    <Link
                                        key={action.label}
                                        className={
                                            action.primary
                                                ? 'welcome-action welcome-action-primary'
                                                : 'welcome-action welcome-action-secondary'
                                        }
                                        href={action.href}
                                    >
                                        {action.label}
                                        {action.primary && (
                                            <span
                                                aria-hidden="true"
                                                className="text-lg leading-none"
                                            >
                                                →
                                            </span>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        </div>
                        <aside
                            className="task-board reveal"
                            aria-label="Animated example TaskMate task"
                        >
                            <div
                                key={activeSampleIndex}
                                className="task-paper task-paper-animated"
                                aria-hidden="true"
                            >
                                <div className="task-paper-header">
                                    <p className="task-paper-label">
                                        <span /> Sample task
                                    </p>
                                    <span className="task-paper-mode">
                                        {activeSample.workMode}
                                    </span>
                                </div>
                                <div className="task-paper-category-row">
                                    <span className="task-paper-category">
                                        {activeSample.category}
                                    </span>
                                    <span className="task-paper-work-type">
                                        {activeSample.workType}
                                    </span>
                                </div>
                                <h2
                                    className="task-paper-title"
                                    id="sample-task-title"
                                >
                                    {activeSample.title}
                                </h2>
                                <p className="task-paper-summary">
                                    {activeSample.description}
                                </p>
                                <div className="task-paper-poster">
                                    <span className="task-paper-avatar">
                                        {activeSample.posterMark}
                                    </span>
                                    <span>
                                        <span className="task-paper-poster-label">
                                            Posted by
                                        </span>
                                        {activeSample.poster}
                                    </span>
                                    <span className="task-paper-poster-type">
                                        {activeSample.posterType}
                                    </span>
                                </div>
                                {activeSample.location && (
                                    <p className="task-paper-location">
                                        <MapPin aria-hidden="true" size={15} />
                                        {activeSample.location}
                                    </p>
                                )}
                                <dl className="task-paper-facts">
                                    <div>
                                        <dt><Clock3 aria-hidden="true" size={14} /> Duration</dt>
                                        <dd>{activeSample.duration}</dd>
                                    </div>
                                    <div>
                                        <dt>Budget</dt>
                                        <dd className="task-budget">
                                            {activeSample.budget}
                                        </dd>
                                    </div>
                                </dl>
                                <div className="task-paper-schedule">
                                    <p>
                                        <CalendarDays aria-hidden="true" size={14} />
                                        <span><strong>Schedule</strong>{activeSample.schedule}</span>
                                    </p>
                                    <p>
                                        <CreditCard aria-hidden="true" size={14} />
                                        <span><strong>Pay timing</strong>{activeSample.payTiming}</span>
                                    </p>
                                </div>
                            </div>
                            <p className="sr-only">
                                Sample {activeSample.category.toLowerCase()} task:
                                {` ${activeSample.title} for ${activeSample.poster}.`}{' '}
                                Work mode: {activeSample.workMode}. Estimated
                                duration: {activeSample.duration}. Schedule:{' '}
                                {activeSample.schedule}. Pay timing:{' '}
                                {activeSample.payTiming}. Budget: {activeSample.budget}.
                            </p>
                        </aside>
                    </section>
                </div>
                <section
                    ref={workflowSectionRef}
                    aria-labelledby="flow-title"
                    className="workflow-section"
                    data-visible={workflowVisible}
                >
                    <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
                        <h2
                            id="flow-title"
                            className="workflow-title reveal"
                            data-reveal="title"
                        >
                            How TaskMate works
                        </h2>
                        <ol className="workflow-grid">
                            {[
                                [
                                    'Post a task',
                                    'Share the work, location, time, and pay details students need to decide.',
                                ],
                                [
                                    'Admin reviews',
                                    'An administrator reviews every new or updated task before it appears in Browse.',
                                ],
                                [
                                    'Student applies',
                                    'Verified students review approved tasks and send an application to the poster.',
                                ],
                                [
                                    'Agree before work',
                                    'The poster and selected applicant confirm the same agreement before work begins.',
                                ],
                                [
                                    'Record the outcome',
                                    'Record completion and payment status. Payment happens directly between users; ratings and reports are available afterward.',
                                ],
                            ].map(([title, detail], index) => (
                                <li
                                    key={title}
                                    className="workflow-card reveal"
                                    data-reveal="card"
                                >
                                    <span
                                        className="workflow-number"
                                        aria-hidden="true"
                                    >
                                        0{index + 1}
                                    </span>
                                    <h3>{title}</h3>
                                    <p>{detail}</p>
                                </li>
                            ))}
                        </ol>
                    </div>
                </section>
            </div>
            {!introComplete && (
                <p className="sr-only" role="status" aria-live="polite">
                    A task is posted, an administrator reviews it, a verified
                    student applies, both parties agree on the terms, and the
                    outcome and payment status are recorded.
                </p>
            )}
            <div
                key={introRun}
                className="landing-intro-overlay"
                aria-hidden="true"
            >
                <div className="landing-intro-content">
                    <h1 className="landing-intro-headline">
                        <span className="landing-intro-headline-line">
                            <span>Find</span>
                            <span>campus</span>
                            <span>work.</span>
                        </span>
                        <span className="landing-intro-headline-line landing-intro-accent">
                            <span>Agree</span>
                            <span>on</span>
                            <span>clear</span>
                            <span>terms.</span>
                        </span>
                    </h1>
                    <p className="landing-intro-copy">
                        Every task is reviewed. Verified students apply, agree
                        on the terms, then record the outcome.
                    </p>
                    <div className="landing-intro-workflow">
                        <span className="landing-intro-travel-dot" />
                        <ol>
                            {introSteps.map(({ label, Icon }, index) => (
                                <li
                                    key={label}
                                    style={
                                        {
                                            '--check-delay': `${850 + index * 800}ms`,
                                        } as CSSProperties
                                    }
                                >
                                    <span className="landing-intro-step-icon">
                                        <Icon
                                            aria-hidden="true"
                                            size={30}
                                            strokeWidth={1.8}
                                        />
                                        <span className="landing-intro-check">
                                            ✓
                                        </span>
                                    </span>
                                    <span>{label}</span>
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>
            </div>
        </>
    );
}
