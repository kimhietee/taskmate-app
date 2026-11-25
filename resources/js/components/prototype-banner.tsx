import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { TriangleAlert, X } from 'lucide-react';

const DISMISS_KEY = 'taskmate-prototype-dismissed';
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// Tracks the currently mounted banner node so an unmounting layout's cleanup
// never clears --banner-h while a newly mounted layout's banner is active.
let activeBannerNode: HTMLElement | null = null;

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
    const ref = useRef<HTMLDivElement>(null);
    const visible = enabled && !dismissed;

    // Publish the banner height as --banner-h so sticky sidebars and headers sit cleanly
    // right below this top bar and snap back to top: 0 the moment it collapses.
    useIsomorphicLayoutEffect(() => {
        const root = document.documentElement;
        const node = ref.current;
        if (!visible || !node) {
            if (!activeBannerNode || activeBannerNode === node) {
                activeBannerNode = null;
                root.style.removeProperty('--banner-h');
            }
            return;
        }

        activeBannerNode = node;
        const update = () => {
            if (activeBannerNode === node) {
                root.style.setProperty('--banner-h', `${Math.ceil(node.getBoundingClientRect().height)}px`);
            }
        };
        update();
        const observer = new ResizeObserver(update);
        observer.observe(node);

        return () => {
            observer.disconnect();
            if (activeBannerNode === node) {
                activeBannerNode = null;
                root.style.removeProperty('--banner-h');
            }
        };
    }, [visible]);

    if (!visible) return null;

    const handleCollapse = () => {
        try {
            window.sessionStorage.setItem(DISMISS_KEY, '1');
        } catch {
            // Storage can be blocked; the banner still collapses for this page view.
        }
        if (activeBannerNode === ref.current) {
            activeBannerNode = null;
            document.documentElement.style.removeProperty('--banner-h');
        }
        setDismissed(true);
    };

    return (
        <div
            ref={ref}
            data-slot="prototype-banner"
            role="status"
            className={`sticky top-0 z-40 w-full shrink-0 border-b border-warning-border bg-warning-bg px-4 py-2 text-warning-fg print:hidden ${prominent ? 'text-base font-semibold' : 'text-sm'}`}
        >
            <div className="mx-auto flex w-full max-w-7xl items-center gap-3">
                <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
                <span className="min-w-0 flex-1 leading-snug">
                    Prototype for testing. Use synthetic accounts and sample data only. Do not enter real ID numbers, addresses, phone numbers, or documents.
                </span>
                <button
                    type="button"
                    aria-label="Collapse prototype notice"
                    title="Collapse notice"
                    className="focus-ring relative z-10 -my-1 -mr-1.5 flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-warning-fg/15 md:-my-0.5 md:size-8"
                    onClick={handleCollapse}
                >
                    <X className="size-4" aria-hidden="true" />
                    <span className="sr-only">Collapse</span>
                </button>
            </div>
        </div>
    );
}
