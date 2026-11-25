import { STATUS, StatusFromMap } from '@/components/status-badge';
import type { StatusConfig } from '@/components/status-badge';

const config: Record<string, StatusConfig> = {
    pending_review: STATUS.pending,
    changes_requested: STATUS.attention,
    approved: STATUS.success,
    assigned: STATUS.info,
    in_progress: STATUS.active,
    completed: STATUS.success,
    rejected: STATUS.danger,
    cancelled: STATUS.closed,
};

export function TaskStatusBadge({ status, label }: { status: string; label: string }) {
    return <StatusFromMap map={config} status={status}>{label}</StatusFromMap>;
}
