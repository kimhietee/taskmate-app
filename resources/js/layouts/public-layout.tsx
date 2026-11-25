import type { PropsWithChildren } from 'react';
import { Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import PrototypeBanner from '@/components/prototype-banner';
import SiteFooter from '@/components/site-footer';
import { Button } from '@/components/ui/button';
import { login, register } from '@/routes';

export default function PublicLayout({ children }: PropsWithChildren) {
    const { auth } = usePage<{ auth?: { user?: unknown } }>().props;
    const user = auth?.user;

    return (
        <div className="flex min-h-svh flex-col bg-background text-foreground">
            <PrototypeBanner />
            <header className="sticky top-[var(--banner-h,0px)] z-30 border-b border-border bg-background/95 backdrop-blur-xs print:hidden">
                <div className="mx-auto flex h-14 w-full max-w-[64rem] items-center justify-between gap-2 px-4 md:px-6 lg:px-8">
                    <Link
                        href="/"
                        className="focus-ring flex shrink-0 items-center gap-2 rounded-md text-sm font-semibold text-foreground"
                    >
                        <AppLogoIcon className="size-6 fill-current" />
                        <span>TaskMate</span>
                    </Link>

                    <nav aria-label="Primary" className="flex items-center gap-1 sm:gap-2">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/how-it-works">How it works</Link>
                        </Button>
                        {user ? (
                            <Button size="sm" variant="outline" asChild>
                                <Link href="/dashboard">Dashboard</Link>
                            </Button>
                        ) : (
                            <>
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={login()}>Log in</Link>
                                </Button>
                                <Button size="sm" asChild>
                                    <Link href={register()}>Register</Link>
                                </Button>
                            </>
                        )}
                    </nav>
                </div>
            </header>
            <main className="flex-1">{children}</main>
            <SiteFooter />
        </div>
    );
}
