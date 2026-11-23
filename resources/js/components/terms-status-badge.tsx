import { AlertCircle, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

export function ToBeDiscussedBadge({ label = 'To be discussed' }: { label?: string }) {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-950">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{label}</span>
        </span>
    );
}

export function ScheduleFitBadge({ status }: { status: 'fits' | 'clashes' | 'cannot_check' }) {
    if (status === 'fits') {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-950">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Fits your classes</span>
            </span>
        );
    }

    if (status === 'clashes') {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-400 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-950">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Clashes with your classes</span>
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-900">
            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Cannot check yet</span>
        </span>
    );
}
