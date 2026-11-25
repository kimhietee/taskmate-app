import { STATUS, StatusFromMap } from '@/components/status-badge';
import type { StatusConfig } from '@/components/status-badge';

const config: Record<string, StatusConfig> = {
    pending: STATUS.pending,
    accepted: STATUS.success,
    declined: STATUS.danger,
    withdrawn: STATUS.closed,
    cancelled: STATUS.closed,
};

export function ApplicationStatusBadge({ status, label }: { status: string; label: string }) {
    return <StatusFromMap map={config} status={status}>{label}</StatusFromMap>;
}
