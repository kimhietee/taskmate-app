import { PAYMENT_BOUNDARY_NOTICE, SAFETY_NOTICE } from '@/constants/notices';
import { Link } from '@inertiajs/react';

const links = [
    ['/how-it-works', 'How TaskMate works'],
    ['/task-guidelines', 'Task Guidelines'],
    ['/safety-and-limits', 'Safety and Limits'],
    ['/privacy', 'Privacy Notice'],
] as const;

export default function SiteFooter() {
    return <footer className="mt-auto border-t bg-muted/30 px-4 py-8 text-sm md:px-6 print:hidden">
        <nav aria-label="Information" className="mx-auto flex max-w-6xl flex-wrap gap-x-5 gap-y-1">
            {links.map(([href, label]) => <Link key={href} href={href} className="focus-ring inline-flex min-h-11 items-center rounded-sm underline underline-offset-4 hover:text-brand md:min-h-8">{label}</Link>)}
        </nav>
        <div className="mx-auto mt-4 max-w-6xl space-y-2 text-muted-foreground">
            <p>{PAYMENT_BOUNDARY_NOTICE}</p>
            <p>{SAFETY_NOTICE}</p>
        </div>
    </footer>;
}
