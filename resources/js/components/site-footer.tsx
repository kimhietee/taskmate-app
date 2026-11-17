import { PAYMENT_BOUNDARY_NOTICE, SAFETY_NOTICE } from '@/constants/notices';
import { Link } from '@inertiajs/react';

const links = [
    ['/how-it-works', 'How TaskMate works'],
    ['/task-guidelines', 'Task Guidelines'],
    ['/safety-and-limits', 'Safety and Limits'],
    ['/privacy', 'Privacy Notice'],
] as const;

export default function SiteFooter() {
    return <footer className="mt-10 border-t border-emerald-900/10 bg-muted/50 px-5 py-8 text-sm dark:border-emerald-100/10 sm:px-8">
        <div className="mx-auto max-w-7xl">
            <nav aria-label="Information" className="flex flex-wrap gap-x-6 gap-y-3">
                {links.map(([href, label]) => (
                    <Link key={href} href={href} className="font-medium text-foreground/80 underline-offset-4 transition hover:text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                        {label}
                    </Link>
                ))}
            </nav>
            <div className="mt-6 grid gap-2 border-t border-emerald-900/10 pt-5 text-xs leading-5 text-muted-foreground dark:border-emerald-100/10 sm:grid-cols-2 sm:gap-6">
                <p>{PAYMENT_BOUNDARY_NOTICE}</p>
                <p>{SAFETY_NOTICE}</p>
            </div>
        </div>
    </footer>;
}
