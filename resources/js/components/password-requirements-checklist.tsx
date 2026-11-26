import { Check } from 'lucide-react';
import {
    DEFAULT_PASSWORD_REQUIREMENTS,
    evaluatePasswordRequirements,
    type PasswordRequirements,
} from '@/lib/password-requirements';

type Props = {
    password: string;
    confirmation?: string;
    requirements?: PasswordRequirements;
};

export function PasswordRequirementsChecklist({
    password,
    confirmation,
    requirements = DEFAULT_PASSWORD_REQUIREMENTS,
}: Props) {
    const items = evaluatePasswordRequirements(password, requirements, confirmation);
    const metCount = items.filter((item) => item.met).length;
    const allMet = metCount === items.length;

    return (
        <div
            aria-live="polite"
            className={
                allMet
                    ? 'space-y-2 rounded-lg border border-success-border bg-success-bg/50 px-3.5 py-3 text-xs transition-colors'
                    : 'space-y-2 rounded-lg border border-border bg-muted/40 px-3.5 py-3 text-xs transition-colors'
            }
        >
            <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-foreground">Password requirements</p>
                <span
                    className={
                        allMet
                            ? 'font-semibold tabular-nums text-success-fg'
                            : 'font-medium tabular-nums text-muted-foreground'
                    }
                >
                    {allMet ? 'All requirements met' : `${metCount}/${items.length} met`}
                </span>
            </div>

            <ul className="space-y-1.5">
                {items.map((item) => (
                    <li
                        key={item.key}
                        className={
                            item.met
                                ? 'flex items-center gap-2 font-medium text-success-fg transition-colors'
                                : 'flex items-center gap-2 text-muted-foreground transition-colors'
                        }
                    >
                        <span
                            aria-hidden="true"
                            className={
                                item.met
                                    ? 'inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-success-border bg-success-bg text-success-fg'
                                    : 'inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-input bg-background'
                            }
                        >
                            {item.met && <Check className="size-3 stroke-[2.5]" />}
                        </span>
                        <span>{item.label}</span>
                    </li>
                ))}
            </ul>

            {requirements.uncompromised && (
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                    Avoid common or previously leaked passwords.
                </p>
            )}
        </div>
    );
}
