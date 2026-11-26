import { Badge } from '@/components/ui/badge';

const statusStyles = {
    unverified:
        'border-neutral-border bg-neutral-bg text-neutral-fg',
    pending:
        'border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200',
    verified:
        'border-green-300 bg-green-100 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-200',
    rejected:
        'border-red-300 bg-red-100 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200',
    more_info_requested:
        'border-blue-300 bg-blue-100 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200',
} as const;

const statusLabels = {
    unverified: 'Not verified',
    pending: 'Pending verification',
    verified: 'Verified',
    rejected: 'Verification rejected',
    more_info_requested: 'More information requested',
} as const;

type Props = {
    status: keyof typeof statusStyles;
};

export function VerificationStatusBadge({ status }: Props) {
    return (
        <Badge variant="outline" className={statusStyles[status]}>
            {statusLabels[status]}
        </Badge>
    );
}
