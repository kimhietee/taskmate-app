import { Alert, AlertDescription } from '@/components/ui/alert';
import { SAFETY_NOTICE } from '@/constants/notices';

export function SafetyNotice({ compact = false }: { compact?: boolean }) {
    return (
        <Alert className={compact ? 'px-3 py-2' : undefined}>
            <AlertDescription
                className={compact ? 'text-xs leading-snug' : undefined}
            >
                {SAFETY_NOTICE}
            </AlertDescription>
        </Alert>
    );
}
