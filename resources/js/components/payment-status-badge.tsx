import { STATUS, StatusFromMap } from '@/components/status-badge';
import type { StatusConfig } from '@/components/status-badge';

const config: Record<string, StatusConfig> = {
    unpaid: STATUS.neutral,
    marked_paid: STATUS.pending,
    confirmed_received: STATUS.success,
    not_received: STATUS.danger,
};

export function PaymentStatusBadge({ status, label }: { status: string; label: string }) {
    return <StatusFromMap map={config} status={status}>{label}</StatusFromMap>;
}
