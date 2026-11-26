export type PasswordRequirements = {
    min: number;
    mixedCase: boolean;
    letters: boolean;
    numbers: boolean;
    symbols: boolean;
    uncompromised: boolean;
};

export type PasswordCheckItem = {
    key: 'min' | 'uppercase' | 'lowercase' | 'letters' | 'numbers' | 'symbols' | 'match';
    label: string;
    met: boolean;
};

export const DEFAULT_PASSWORD_REQUIREMENTS: PasswordRequirements = {
    min: 8,
    mixedCase: false,
    letters: false,
    numbers: false,
    symbols: false,
    uncompromised: false,
};

export function evaluatePasswordRequirements(
    password: string,
    requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS,
    confirmation?: string,
): PasswordCheckItem[] {
    const items: PasswordCheckItem[] = [
        {
            key: 'min',
            label: `At least ${requirements.min} characters`,
            met: Array.from(password).length >= requirements.min,
        },
    ];

    if (requirements.mixedCase) {
        items.push(
            {
                key: 'uppercase',
                label: 'At least one uppercase letter (A–Z)',
                met: /\p{Lu}/u.test(password),
            },
            {
                key: 'lowercase',
                label: 'At least one lowercase letter (a–z)',
                met: /\p{Ll}/u.test(password),
            },
        );
    } else if (requirements.letters) {
        items.push({
            key: 'letters',
            label: 'At least one letter (A–Z or a–z)',
            met: /\p{L}/u.test(password),
        });
    }

    if (requirements.numbers) {
        items.push({
            key: 'numbers',
            label: 'At least one number (0–9)',
            met: /\p{N}/u.test(password),
        });
    }

    if (requirements.symbols) {
        items.push({
            key: 'symbols',
            label: 'At least one symbol (e.g. ! @ # $ %)',
            met: /[\p{Z}\p{S}\p{P}]/u.test(password),
        });
    }

    if (confirmation !== undefined) {
        items.push({
            key: 'match',
            label: 'Passwords match',
            met: password.length > 0 && password === confirmation,
        });
    }

    return items;
}

export function arePasswordRequirementsMet(
    password: string,
    requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS,
): boolean {
    return evaluatePasswordRequirements(password, requirements).every((item) => item.met);
}
