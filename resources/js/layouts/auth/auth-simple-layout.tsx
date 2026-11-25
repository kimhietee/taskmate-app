import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import PrototypeBanner from '@/components/prototype-banner';
import SiteFooter from '@/components/site-footer';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-svh flex-col bg-background text-foreground">
            <PrototypeBanner prominent />
            <main className="flex flex-1 items-center justify-center px-4 py-8 md:p-10">
                <div className="w-full max-w-lg space-y-6">
                    <Link
                        href={home()}
                        className="focus-ring mx-auto flex w-fit flex-col items-center gap-2 rounded-md font-semibold text-foreground"
                    >
                        <div className="flex size-10 items-center justify-center rounded-md">
                            <AppLogoIcon className="size-9 fill-current" />
                        </div>
                        <span className="sr-only">{title}</span>
                    </Link>

                    <div className="space-y-6 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-xs md:p-8">
                        <div className="space-y-1.5 text-center">
                            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                            {description && (
                                <p className="text-center text-sm text-muted-foreground">
                                    {description}
                                </p>
                            )}
                        </div>
                        {children}
                    </div>
                </div>
            </main>
            <SiteFooter />
        </div>
    );
}
