import { Badge } from '@/components/ui/badge';

const styles: Record<string, string> = {
    open: 'border-amber-300 bg-amber-50 text-amber-900',
    under_review: 'border-blue-300 bg-blue-50 text-blue-900',
    resolved: 'border-green-300 bg-green-50 text-green-900',
    dismissed: 'border-slate-300 bg-slate-100 text-slate-700',
};

export function ReportStatusBadge({
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
