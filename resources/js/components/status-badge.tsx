import { Ban, Circle, CircleAlert, CircleCheck, CircleDot, CircleX, Clock, Info, TriangleAlert } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';

// One shared status badge. Every status is shown as icon + text, never colour alone.
// The tone picks the semantic status tokens defined in resources/css/app.css.
export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
export type StatusConfig = readonly [StatusTone, LucideIcon];

// Re-usable tone + icon pairs so every badge family stays consistent.
export const STATUS = {
    success: ['success', CircleCheck],
    pending: ['warning', Clock],
    attention: ['warning', CircleAlert],
    danger: ['danger', CircleX],
    warningTriangle: ['danger', TriangleAlert],
    info: ['info', Info],
    active: ['info', CircleDot],
    neutral: ['neutral', Circle],
    closed: ['neutral', Ban],
} as const satisfies Record<string, StatusConfig>;

export function StatusBadge({
    tone,
    icon: Icon,
    children,
    className,
}: {
    tone: StatusTone;
    icon: LucideIcon;
    children: ReactNode;
    className?: string;
}) {
    return (
        <Badge
            variant="outline"
            className={[
                'gap-1.5 border font-medium',
                tone === 'success' && 'border-success-border bg-success-bg text-success-fg',
                tone === 'warning' && 'border-warning-border bg-warning-bg text-warning-fg',
                tone === 'danger' && 'border-danger-border bg-danger-bg text-danger-fg',
                tone === 'info' && 'border-info-border bg-info-bg text-info-fg',
                tone === 'neutral' && 'border-neutral-border bg-neutral-bg text-neutral-fg',
                className,
            ]
                .filter(Boolean)
                .join(' ')}
        >
            <Icon aria-hidden="true" />
            <span>{children}</span>
        </Badge>
    );
}

// Helper for the thin wrappers: look up a status key, fall back to neutral.
export function StatusFromMap({ map, status, children }: { map: Record<string, StatusConfig>; status: string; children: ReactNode }) {
    const [tone, icon] = map[status] ?? STATUS.neutral;
    return <StatusBadge tone={tone} icon={icon}>{children}</StatusBadge>;
}
