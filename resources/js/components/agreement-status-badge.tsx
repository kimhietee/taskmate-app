import { STATUS, StatusFromMap } from '@/components/status-badge';
import type { StatusConfig } from '@/components/status-badge';

const config: Record<string, StatusConfig> = {
    negotiating: STATUS.pending,
    agreed: STATUS.success,
    cancelled: STATUS.closed,
};

export function AgreementStatusBadge({ status, label }: { status: string; label: string }) {
    return <StatusFromMap map={config} status={status}>{label}</StatusFromMap>;
}
