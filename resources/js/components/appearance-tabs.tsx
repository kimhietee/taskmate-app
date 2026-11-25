import type { LucideIcon } from 'lucide-react';
import { Monitor, Moon, Sun } from 'lucide-react';
import type { HTMLAttributes, KeyboardEvent } from 'react';
import type { Appearance } from '@/hooks/use-appearance';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';

type ThemeOption = {
    value: Appearance;
    icon: LucideIcon;
    label: string;
    description: string;
};

const THEME_OPTIONS: ThemeOption[] = [
    {
        value: 'light',
        icon: Sun,
        label: 'Light',
        description: 'Warm off-white surface',
    },
    {
        value: 'dark',
        icon: Moon,
        label: 'Dark',
        description: 'Low-glare dark surface',
    },
    {
        value: 'system',
        icon: Monitor,
        label: 'System',
        description: 'Matches device theme',
    },
];

function ThemeSwatch({ value }: { value: Appearance }) {
    if (value === 'light') {
        return (
            <div
                aria-hidden="true"
                className="flex h-12 w-full items-center gap-2 rounded-lg border border-border p-2"
                style={{ backgroundColor: 'oklch(0.978 0.004 95)' }}
            >
                <span
                    className="h-full w-1/3 rounded-sm"
                    style={{ backgroundColor: 'oklch(1 0 0)' }}
                />
                <div className="flex flex-1 flex-col gap-1.5">
                    <span
                        className="h-2 w-3/4 rounded-full"
                        style={{ backgroundColor: 'oklch(0.19 0.01 95)' }}
                    />
                    <span
                        className="h-2 w-1/2 rounded-full"
                        style={{ backgroundColor: 'oklch(0.52 0.19 262)' }}
                    />
                </div>
            </div>
        );
    }

    if (value === 'dark') {
        return (
            <div
                aria-hidden="true"
                className="flex h-12 w-full items-center gap-2 rounded-lg border border-border p-2"
                style={{ backgroundColor: 'oklch(0.16 0.005 260)' }}
            >
                <span
                    className="h-full w-1/3 rounded-sm"
                    style={{ backgroundColor: 'oklch(0.205 0.006 260)' }}
                />
                <div className="flex flex-1 flex-col gap-1.5">
                    <span
                        className="h-2 w-3/4 rounded-full"
                        style={{ backgroundColor: 'oklch(0.965 0.004 260)' }}
                    />
                    <span
                        className="h-2 w-1/2 rounded-full"
                        style={{ backgroundColor: 'oklch(0.74 0.13 262)' }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div
            aria-hidden="true"
            className="grid h-12 w-full grid-cols-2 overflow-hidden rounded-lg border border-border"
        >
            <div
                className="flex flex-col justify-center gap-1.5 p-2"
                style={{ backgroundColor: 'oklch(0.978 0.004 95)' }}
            >
                <span
                    className="h-2 w-4/5 rounded-full"
                    style={{ backgroundColor: 'oklch(0.19 0.01 95)' }}
                />
                <span
                    className="h-2 w-1/2 rounded-full"
                    style={{ backgroundColor: 'oklch(0.52 0.19 262)' }}
                />
            </div>
            <div
                className="flex flex-col justify-center gap-1.5 p-2"
                style={{ backgroundColor: 'oklch(0.16 0.005 260)' }}
            >
                <span
                    className="h-2 w-4/5 rounded-full"
                    style={{ backgroundColor: 'oklch(0.965 0.004 260)' }}
                />
                <span
                    className="h-2 w-1/2 rounded-full"
                    style={{ backgroundColor: 'oklch(0.74 0.13 262)' }}
                />
            </div>
        </div>
    );
}

export default function AppearanceToggleTab({
    className = '',
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    const { appearance, updateAppearance } = useAppearance();

    const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            event.preventDefault();
            updateAppearance(THEME_OPTIONS[(index + 1) % THEME_OPTIONS.length].value);
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            event.preventDefault();
            updateAppearance(
                THEME_OPTIONS[(index - 1 + THEME_OPTIONS.length) % THEME_OPTIONS.length].value,
            );
        }
    };

    return (
        <div
            role="radiogroup"
            aria-label="Appearance theme"
            className={cn('grid gap-3 sm:grid-cols-3', className)}
            {...props}
        >
            {THEME_OPTIONS.map(({ value, icon: Icon, label, description }, index) => {
                const active = appearance === value;
                return (
                    <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => updateAppearance(value)}
                        onKeyDown={(event) => handleKeyDown(event, index)}
                        className={cn(
                            'focus-ring flex flex-col gap-3 rounded-xl border p-4 text-left transition-colors',
                            active
                                ? 'border-2 border-brand bg-info-bg/30 shadow-xs'
                                : 'border-border bg-card hover:bg-muted/40',
                        )}
                    >
                        <ThemeSwatch value={value} />
                        <div className="flex items-center gap-2">
                            <Icon
                                className={cn(
                                    'size-4 shrink-0',
                                    active ? 'text-brand' : 'text-muted-foreground',
                                )}
                                aria-hidden="true"
                            />
                            <span className="text-sm font-semibold text-foreground">{label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{description}</p>
                    </button>
                );
            })}
        </div>
    );
}
