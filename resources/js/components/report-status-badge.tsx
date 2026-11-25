import { STATUS, StatusFromMap } from '@/components/status-badge';
import type { StatusConfig } from '@/components/status-badge';

const config: Record<string, StatusConfig> = {
    open: STATUS.pending,
    under_review: STATUS.active,
    resolved: STATUS.success,
    dismissed: STATUS.closed,
};

export function ReportStatusBadge({ status, label }: { status: string; label: string }) {
    return <StatusFromMap map={config} status={status}>{label}</StatusFromMap>;
}
