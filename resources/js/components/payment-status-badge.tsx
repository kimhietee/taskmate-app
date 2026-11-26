import { Badge } from '@/components/ui/badge';

const styles: Record<string, string> = {
    unpaid: 'border-slate-300 bg-slate-100 text-slate-800',
    marked_paid: 'border-amber-300 bg-amber-50 text-amber-900',
    confirmed_received: 'border-green-300 bg-green-50 text-green-900',
    not_received: 'border-red-300 bg-red-50 text-red-900',
};

export function PaymentStatusBadge({
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
