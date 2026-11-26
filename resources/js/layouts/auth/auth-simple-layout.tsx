import { Link } from "@inertiajs/react";
import AppLogoIcon from "@/components/app-logo-icon";
import PrototypeBanner from "@/components/prototype-banner";
import { home } from "@/routes";
import type { AuthLayoutProps } from "@/types";

function BrandIntro() {
    return (
        <aside className="order-2 mx-auto w-full max-w-lg px-3 py-8 sm:px-6 lg:order-1 lg:self-center lg:px-0">
            <p className="flex items-center gap-3 text-xs font-bold tracking-[0.14em] text-muted-foreground uppercase">
                <span className="h-1 w-8 rounded-full bg-brand-gold" aria-hidden="true" />
                Central Mindanao University
            </p>
            <h2 className="mt-7 text-[clamp(2.9rem,5vw,4.5rem)] leading-[1.05] font-semibold tracking-[-0.06em]">
                Campus tasks,
                <br />
                <em className="welcome-title-accent">clear terms.</em>
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground lg:text-lg">
                Find a side job or post a task for the CMU community.
                <br />
                Review the work, time, and pay before you agree.
            </p>
        </aside>
    );
}

export default function AuthSimpleLayout({ children, title, description }: AuthLayoutProps) {
    const isEntryPage = title === "Log in" || title === "Create an account";

    if (isEntryPage) {
        return (
            <>
                <PrototypeBanner prominent />
                <main className="cmu-photo-auth grid w-full items-start gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,32rem)_minmax(0,34rem)] lg:items-stretch lg:justify-center lg:gap-8 lg:py-9">
                    <BrandIntro />
                    <section className="order-1 flex items-start justify-center lg:order-2 lg:items-center">
                        <div
                            className={`w-full max-w-[34rem] rounded-2xl border bg-card p-5 shadow-sm sm:p-7 ${title === "Log in" ? "border-t-4 border-t-brand-gold lg:p-8" : ""}`}
                        >
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-5">
                                <Link
                                    href={home()}
                                    className="inline-flex items-center gap-2 text-lg font-bold tracking-tight"
                                >
                                    <AppLogoIcon className="size-8" alt="" />
                                    TaskMate
                                </Link>
                                <Link
                                    href={home()}
                                    className="auth-back-link rounded-md text-sm font-medium text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                >
                                    <span aria-hidden="true">← </span>
                                    Back to home
                                </Link>
                            </div>
                            <div className={title === "Log in" ? "mt-6 mb-6" : "mt-5 mb-4"}>
                                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                                    {title === "Log in" ? "Welcome back" : "Create your account"}
                                </h1>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {description ||
                                        (title === "Log in"
                                            ? "Log in to continue."
                                            : "Join the CMU task community.")}
                                </p>
                            </div>
                            {children}
                        </div>
                    </section>
                </main>
            </>
        );
    }

    return (
        <>
            <PrototypeBanner prominent />
            <main className="mx-auto w-full px-3 py-4 sm:px-5 sm:py-6">
                <div className="mx-auto w-full max-w-[22rem] rounded-xl border border-t-4 border-t-brand-gold bg-card p-4 shadow-sm sm:p-5">
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b pb-3">
                            <Link
                                href={home()}
                                className="inline-flex items-center gap-2 text-lg font-bold tracking-tight"
                            >
                                <AppLogoIcon className="size-7" alt="" />
                                TaskMate
                            </Link>
                            <div className="space-y-0.5 text-center">
                                <h1 className="text-base leading-tight font-semibold">{title}</h1>
                                {description && (
                                    <p className="text-center text-sm text-muted-foreground">
                                        {description}
                                    </p>
                                )}
                            </div>
                        </div>
                        <Link
                            href={home()}
                            className="inline-flex w-fit items-center gap-2 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                        >
                            <span aria-hidden="true">←</span>
                            Back to home
                        </Link>
                        {children}
                    </div>
                </div>
            </main>
        </>
    );
}
