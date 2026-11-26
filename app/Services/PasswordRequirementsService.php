<?php

namespace App\Services;

use Illuminate\Validation\Rules\Password;

class PasswordRequirementsService
{
    public function rulesString(): string
    {
        return Password::default()->toPasswordRulesString();
    }

    /**
     * @return array{
     *     min: int,
     *     mixedCase: bool,
     *     letters: bool,
     *     numbers: bool,
     *     symbols: bool,
     *     uncompromised: bool
     * }
     */
    public function forFrontend(): array
    {
        $rules = Password::default()->appliedRules();

        return [
            'min' => (int) ($rules['min'] ?? 8),
            'mixedCase' => (bool) ($rules['mixedCase'] ?? false),
            'letters' => (bool) ($rules['letters'] ?? false),
            'numbers' => (bool) ($rules['numbers'] ?? false),
            'symbols' => (bool) ($rules['symbols'] ?? false),
            'uncompromised' => (bool) ($rules['uncompromised'] ?? false),
        ];
    }
}
