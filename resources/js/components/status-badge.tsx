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
        <Badge variant={tone} className={className}>
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
