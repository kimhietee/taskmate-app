import { useEffect, useRef, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { TriangleAlert, X } from 'lucide-react';

const DISMISS_KEY = 'taskmate-prototype-dismissed';

export default function PrototypeBanner({ prominent = false }: { prominent?: boolean }) {
    const { prototypeMode } = usePage<{ prototypeMode?: boolean }>().props;
    const enabled = prototypeMode === true;
    const [dismissed, setDismissed] = useState(() => {
        try {
            return typeof window !== 'undefined' && window.sessionStorage.getItem(DISMISS_KEY) === '1';
        } catch {
            return false;
        }
    });
    const ref = useRef<HTMLElement>(null);
    const visible = enabled && !dismissed;

    // Publish the banner height as --banner-h so the fixed desktop sidebar and the sticky
    // header can sit below it instead of being covered by it. Removed when hidden.
    useEffect(() => {
        const root = document.documentElement;
        const node = ref.current;
        if (!visible || !node) {
            root.style.removeProperty('--banner-h');
            return;
        }
        const update = () => root.style.setProperty('--banner-h', `${node.offsetHeight}px`);
        update();
        const observer = new ResizeObserver(update);
        observer.observe(node);
        return () => {
            observer.disconnect();
            root.style.removeProperty('--banner-h');
        };
    }, [visible]);

    if (!visible) return null;

    return (
        <aside
            ref={ref}
            role="status"
            className={`border-warning-border bg-warning-bg text-warning-fg z-40 border-b px-4 py-2 md:sticky md:top-0 print:hidden ${prominent ? 'text-base font-semibold' : 'text-sm'}`}
        >
            <div className="mx-auto flex max-w-6xl items-start gap-3">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span className="flex-1">Prototype for testing. Use synthetic accounts and sample data only. Do not enter real ID numbers, addresses, phone numbers, or documents.</span>
                <button
                    type="button"
                    aria-label="Dismiss prototype notice"
                    className="focus-ring -my-1 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-md hover:bg-warning-fg/10 md:-my-0.5 md:size-8"
                    onClick={() => {
                        try {
                            window.sessionStorage.setItem(DISMISS_KEY, '1');
                        } catch {
                            // Storage can be blocked; the banner still hides for this page view.
                        }
                        setDismissed(true);
                    }}
                >
                    <X className="size-4" aria-hidden="true" />
                    <span className="sr-only">Dismiss</span>
                </button>
            </div>
        </aside>
    );
}
