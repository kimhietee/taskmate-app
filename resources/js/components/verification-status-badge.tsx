import { STATUS, StatusFromMap } from '@/components/status-badge';
import type { StatusConfig } from '@/components/status-badge';

const statusConfig: Record<string, StatusConfig> = {
    unverified: STATUS.neutral,
    pending: STATUS.pending,
    verified: STATUS.success,
    rejected: STATUS.danger,
    more_info_requested: STATUS.info,
};

const statusLabels = {
    unverified: 'Not verified as student',
    pending: 'Pending verification',
    verified: 'Verified',
    rejected: 'Verification rejected',
    more_info_requested: 'More information requested',
} as const;

type Props = {
    status: keyof typeof statusLabels;
};

export function VerificationStatusBadge({ status }: Props) {
    return <StatusFromMap map={statusConfig} status={status}>{statusLabels[status]}</StatusFromMap>;
}
