import { useFlashToast } from '@/hooks/use-flash-toast';
import { useAppearance } from '@/hooks/use-appearance';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

// Sonner reads its own --normal-*, --success-*, --error-*, --warning-* and --info-*
// variables. We point them at the app's tokens so toasts follow Light / Dark / System.
// richColors paints success, error, warning and info toasts with the status tokens;
// Sonner adds its own icon to each, so colour is never the only cue.
function Toaster({ ...props }: ToasterProps) {
    const { appearance } = useAppearance();

    useFlashToast();

    return (
        <Sonner
            theme={appearance}
            className="toaster group"
            position="bottom-right"
            richColors
            closeButton
            toastOptions={{
                classNames: {
                    toast: 'shadow-md',
                    title: 'font-semibold',
                },
            }}
            style={
                {
                    '--normal-bg': 'var(--popover)',
                    '--normal-text': 'var(--popover-foreground)',
                    '--normal-border': 'var(--border)',
                    '--success-bg': 'var(--status-success-bg)',
                    '--success-text': 'var(--status-success-fg)',
                    '--success-border': 'var(--status-success-border)',
                    '--error-bg': 'var(--status-danger-bg)',
                    '--error-text': 'var(--status-danger-fg)',
                    '--error-border': 'var(--status-danger-border)',
                    '--warning-bg': 'var(--status-warning-bg)',
                    '--warning-text': 'var(--status-warning-fg)',
                    '--warning-border': 'var(--status-warning-border)',
                    '--info-bg': 'var(--status-info-bg)',
                    '--info-text': 'var(--status-info-fg)',
                    '--info-border': 'var(--status-info-border)',
                    '--border-radius': 'var(--radius)',
                } as React.CSSProperties
            }
            {...props}
        />
    );
}

export { Toaster };
