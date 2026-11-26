import { PAYMENT_BOUNDARY_NOTICE } from '@/constants/notices';
import { Head, Link } from '@inertiajs/react';
import { register, login } from '@/routes';

type Props = {
    page: string;
    title: string;
    guidelines: string[];
    privacyDraft: string | null;
};

const taskSteps = [
    {
        label: 'ACCOUNT',
        title: 'Create your account and get verified',
        description:
            'Submit your account details for administrator review. Students can browse approved tasks while verification is pending, but need a verified account to apply.',
    },
    {
        label: 'POST A TASK',
        title: 'Describe the work clearly',
        description:
            'Verified faculty and staff, approved organizations, and students when posting is enabled can provide the work details, duration, budget, and work mode. In-person tasks include a work location. Every new or edited task goes to an administrator for review.',
    },
    {
        label: 'FIND WORK',
        title: 'Browse approved tasks and apply',
        description:
            'Students can browse approved tasks. Verified students can apply; faculty, staff, and organization accounts cannot apply. Students may also post when student posting is enabled.',
    },
    {
        label: 'AGREE',
        title: 'Confirm the agreement before work begins',
        description:
            'When a poster accepts an applicant, TaskMate prepares an agreement draft. The poster sends it, the applicant can agree or request a change, and both confirm the same version before it locks.',
    },
    {
        label: 'COMPLETE AND RECORD',
        title: 'Record completion and payment status',
        description:
            'The poster records when the task is complete and may record a payment. The student separately confirms whether the agreed amount was received. Payment is made directly between the two people.',
    },
    {
        label: 'FEEDBACK',
        title: 'Rate the experience or report a problem',
        description:
            'After completion, both people can leave feedback about that task. Use the report tools for serious concerns; ratings are not a substitute for reporting.',
    },
] as const;

export default function Information({
    page,
    title,
    guidelines,
    privacyDraft,
}: Props) {
    return (
        <>
            <Head title={title} />
            <header className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-6">
                <Link
                    href="/"
                    className="flex items-center gap-2 text-2xl font-bold tracking-tight"
                >
                    <img src="/favicon.svg" width="36" height="36" alt="" />
                    TaskMate
                </Link>
                <nav
                    aria-label="Main navigation"
                    className="flex items-center gap-4 text-sm font-semibold"
                >
                    <Link href={login()}>Log in</Link>
                    <Link href={register()} className="brand-nav-action">
                        Register
                    </Link>
                </nav>
            </header>
            <article className="mx-auto max-w-4xl px-4 pt-6 pb-16">
                <h1
                    className={
                        page === 'how-it-works'
                            ? 'workflow-title'
                            : 'text-3xl font-bold'
                    }
                >
                    {title}
                </h1>
                {page === 'how-it-works' && (
                    <div className="how-it-works-content mt-5">
                        <p className="how-it-works-lead">
                            TaskMate helps the CMU community find and post side
                            jobs with clear work details and agreed terms. Here’s
                            how a task moves from posting to feedback.
                        </p>
                        <ol className="how-it-works-steps">
                            {taskSteps.map((step, index) => (
                                <li key={step.title}>
                                    <span
                                        className="how-it-works-step-number"
                                        aria-hidden="true"
                                    >
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                    <div>
                                        <p className="how-it-works-step-label">
                                            {step.label}
                                        </p>
                                        <h2>{step.title}</h2>
                                        <p className="how-it-works-step-description">
                                            {step.description}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                        <p className="how-it-works-payment-note">
                            {PAYMENT_BOUNDARY_NOTICE}
                        </p>
                    </div>
                )}
                {page === 'task-guidelines' && (
                    <>
                        <p className="mt-4 rounded border border-amber-500 bg-amber-50 p-4 text-amber-950">
                            These guidelines are provisional and must be
                            reviewed by the team and university.
                        </p>
                        <p className="mt-5 max-w-3xl text-muted-foreground">
                            Use these guidelines to describe tasks clearly and
                            help people decide whether the work suits them.
                        </p>
                        <ol className="mt-6 space-y-3">
                            {guidelines.map((rule, index) => (
                                <li
                                    key={rule}
                                    className="flex gap-4 rounded-xl border bg-card p-4"
                                >
                                    <span
                                        aria-hidden="true"
                                        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground"
                                    >
                                        {index + 1}
                                    </span>
                                    <p className="pt-1 text-sm leading-relaxed">
                                        {rule}
                                    </p>
                                </li>
                            ))}
                        </ol>
                    </>
                )}
                {page === 'safety-and-limits' && (
                    <div className="mt-6 space-y-4">
                        <p>
                            Verification, administrator review, and ratings help
                            inform decisions but do not guarantee a person’s
                            future behavior or the safety of a task.
                        </p>
                        <p>
                            Review the disclosed work location and conditions.
                            Do not agree to anything that makes you
                            uncomfortable. Use the report tools to raise
                            concerns.
                        </p>
                        <p>{PAYMENT_BOUNDARY_NOTICE}</p>
                    </div>
                )}
                {page === 'privacy' && (
                    <>
                        <p className="mt-4 rounded border border-amber-500 bg-amber-50 p-4 text-amber-950">
                            DRAFT PRIVACY NOTICE — not approved. Retention,
                            deletion, consent, and protected-storage rules are
                            still to be decided.
                        </p>
                        <pre className="mt-5 rounded border p-4 text-sm break-words whitespace-pre-wrap">
                            {privacyDraft}
                        </pre>
                    </>
                )}
            </article>
        </>
    );
}
