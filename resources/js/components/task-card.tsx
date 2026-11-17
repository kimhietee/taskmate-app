import { useReducedMotion, motion } from 'motion/react';
import type { ReactNode } from 'react';
import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';

type TaskCardProps = {
    title: string;
    description: string;
    category: string;
    href: string;
    actionLabel?: string;
    badge?: ReactNode;
    children?: ReactNode;
};

export function TaskCard({ title, description, category, href, actionLabel = 'View task details', badge, children }: TaskCardProps) {
    const reduceMotion = useReducedMotion();

    return (
        <motion.article
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={reduceMotion ? undefined : { y: -3 }}
            whileTap={reduceMotion ? undefined : { scale: 0.99 }}
            transition={{ duration: reduceMotion ? 0 : 0.2, ease: 'easeOut' }}
            className="flex h-full flex-col rounded-2xl border border-[#e1e8df] bg-white p-5 shadow-sm dark:border-[#263c2e] dark:bg-[#17251c] sm:p-6"
        >
            <div className="flex items-start justify-between gap-3">
                <span className="inline-flex max-w-full items-center rounded-full border border-[#dce9df] bg-[#f5f8f2] px-3 py-1 text-xs font-semibold text-[#065F46] dark:border-[#31483a] dark:bg-[#101b15] dark:text-amber-300">{category}</span>
                {badge}
            </div>

            <h2 className="mt-4 text-lg font-semibold leading-6 tracking-tight text-[#183324] dark:text-[#EDF4EC]">{title}</h2>
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#526458] dark:text-[#bdcbbf]">{description}</p>

            {children && <div className="mt-5 border-t border-[#edf1eb] pt-4 dark:border-[#263c2e]">{children}</div>}

            <div className="mt-auto pt-5">
                <Link
                    href={href}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#065F46] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#064E3B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#065F46]/25 dark:bg-amber-300 dark:text-[#183324] dark:hover:bg-amber-200 dark:focus-visible:ring-amber-300/30 sm:w-auto"
                >
                    {actionLabel}
                    <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
            </div>
        </motion.article>
    );
}
