import { CircleAlert, CircleCheck, Clock, TriangleAlert } from 'lucide-react';
import { StatusBadge } from '@/components/status-badge';

export function ToBeDiscussedBadge({ label = 'To be discussed' }: { label?: string }) {
    return <StatusBadge tone="warning" icon={CircleAlert}>{label}</StatusBadge>;
}

export function ScheduleFitBadge({ status }: { status: 'fits' | 'clashes' | 'cannot_check' }) {
    if (status === 'fits') {
        return <StatusBadge tone="success" icon={CircleCheck}>Fits your classes</StatusBadge>;
    }

    if (status === 'clashes') {
        return <StatusBadge tone="danger" icon={TriangleAlert}>Clashes with your classes</StatusBadge>;
    }

    return <StatusBadge tone="neutral" icon={Clock}>Cannot check yet</StatusBadge>;
}
