import { Link } from '@inertiajs/react';
import { Palette, Shield, User } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import Heading from '@/components/heading';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import type { NavItem } from '@/types';

const sidebarNavItems: NavItem[] = [
    {
        title: 'Profile',
        href: edit(),
        icon: User,
    },
    {
        title: 'Security',
        href: editSecurity(),
        icon: Shield,
    },
    {
        title: 'Appearance',
        href: editAppearance(),
        icon: Palette,
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <div className="page space-y-6">
            <Heading
                as="h1"
                title="Settings"
                description="Manage your profile and account settings"
            />

            <nav
                className="flex gap-1 overflow-x-auto border-b border-border pb-2 lg:hidden"
                aria-label="Settings"
            >
                {sidebarNavItems.map((item, index) => {
                    const active = isCurrentOrParentUrl(item.href);
                    const Icon = item.icon;
                    return (
                        <Link
                            key={`${toUrl(item.href)}-${index}`}
                            href={item.href}
                            aria-current={active ? 'page' : undefined}
                            className={cn(
                                'focus-ring inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors',
                                active
                                    ? 'bg-accent text-foreground'
                                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                            )}
                        >
                            {Icon && <Icon className="size-4" aria-hidden="true" />}
                            <span>{item.title}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="grid gap-8 lg:grid-cols-[13rem_minmax(0,1fr)]">
                <aside className="hidden lg:block">
                    <nav className="space-y-1" aria-label="Settings">
                        {sidebarNavItems.map((item, index) => {
                            const active = isCurrentOrParentUrl(item.href);
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={`${toUrl(item.href)}-${index}`}
                                    href={item.href}
                                    aria-current={active ? 'page' : undefined}
                                    className={cn(
                                        'focus-ring flex min-h-9 items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
                                        active
                                            ? 'border-l-2 border-brand bg-accent font-semibold text-foreground'
                                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                                    )}
                                >
                                    {Icon && <Icon className="size-4 shrink-0" aria-hidden="true" />}
                                    <span>{item.title}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                <section className="max-w-2xl space-y-8">
                    {children}
                </section>
            </div>
        </div>
    );
}
