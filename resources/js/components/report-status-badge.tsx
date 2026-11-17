import { Badge } from '@/components/ui/badge';

const styles: Record<string, string> = {
    open: 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100',
    under_review: 'border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100',
    resolved: 'border-green-300 bg-green-50 text-green-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100',
    dismissed: 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200',
};

export function ReportStatusBadge({ status, label }: { status: string; label: string }) {
    return <Badge variant="outline" className={styles[status] ?? ''}>{label}</Badge>;
}
