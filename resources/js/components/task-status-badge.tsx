import { Badge } from '@/components/ui/badge';

const styles: Record<string, string> = {
    pending_review:
        'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100',
    changes_requested:
        'border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100',
    approved:
        'border-green-300 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100',
    assigned:
        'border-indigo-300 bg-indigo-50 text-indigo-900 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-100',
    in_progress:
        'border-purple-300 bg-purple-50 text-purple-900 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-100',
    completed:
        'border-green-300 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100',
    rejected:
        'border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100',
    cancelled: 'border-muted-foreground/30 bg-muted text-muted-foreground',
};

export function TaskStatusBadge({
    status,
    label,
}: {
    status: string;
    label: string;
}) {
    return (
        <Badge variant="outline" className={styles[status] ?? ''}>
            {label}
        </Badge>
    );
}
