import { Badge } from '@/components/ui/badge';

const styles: Record<string, string> = {
    pending:
        'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100',
    accepted:
        'border-green-300 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100',
    declined:
        'border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100',
    withdrawn: 'border-muted-foreground/30 bg-muted text-muted-foreground',
    cancelled: 'border-muted-foreground/30 bg-muted text-muted-foreground',
};

export function ApplicationStatusBadge({
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
