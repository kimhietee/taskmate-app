import { useState } from 'react';
import { usePage } from '@inertiajs/react';

export default function PrototypeBanner({
    prominent = false,
}: {
    prominent?: boolean;
}) {
    const { prototypeMode } = usePage<{ prototypeMode?: boolean }>().props;
    const enabled = prototypeMode === true;
    const [dismissed, setDismissed] = useState(
        () =>
            typeof window !== 'undefined' &&
            window.sessionStorage.getItem('taskmate-prototype-dismissed') ===
                '1',
    );
    if (!enabled || dismissed) return null;
    return (
        <aside
            className={`border-b border-amber-700 bg-amber-100 px-4 py-3 text-sm text-amber-950 ${prominent ? 'text-base font-semibold' : ''}`}
            role="status"
        >
            <div className="mx-auto flex max-w-6xl items-start justify-between gap-4">
                <span>
                    Prototype for testing. Use synthetic accounts and sample
                    data only. Do not enter real ID numbers, addresses, phone
                    numbers, or documents.
                </span>
                <button
                    type="button"
                    className="shrink-0 underline focus-visible:outline focus-visible:outline-2"
                    onClick={() => {
                        window.sessionStorage.setItem(
                            'taskmate-prototype-dismissed',
                            '1',
                        );
                        setDismissed(true);
                    }}
                >
                    Dismiss
                </button>
            </div>
        </aside>
    );
}
