<?php

namespace App\Concerns;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Unique;

trait ProfileValidationRules
{
    /**
     * Get the validation rules used to validate user profiles.
     *
     * @return array<string, array<int, Unique|ValidationRule|array<mixed>|string>>
     */
    protected function profileRules(?int $userId = null): array
    {
        return [
            'name' => $this->nameRules(),
            'email' => $this->emailRules($userId),
        ];
    }

    /**
     * Get the validation rules used to validate user names.
     *
     * @return array<int, Unique|ValidationRule|array<mixed>|string>
     */
    protected function nameRules(): array
    {
        return ['required', 'string', 'min:2', 'max:255', 'regex:/\p{L}/u', 'regex:/^[\p{L}\p{N}\s\'.-]+$/u'];
    }

    /** @return array<int, string> */
    protected function firstNameRules(): array
    {
        return ['required', 'string', 'min:1', 'max:100', 'regex:/\p{L}/u', 'regex:/^[\p{L}\s\'.-]+$/u'];
    }

    /** @return array<int, string> */
    protected function middleInitialRules(): array
    {
        return ['nullable', 'string', 'max:5', 'regex:/^[\p{L}.]+$/u'];
    }

    /** @return array<int, string> */
    protected function lastNameRules(): array
    {
        return ['required', 'string', 'min:1', 'max:100', 'regex:/\p{L}/u', 'regex:/^[\p{L}\s\'.-]+$/u'];
    }

    protected function normalizeMiddleInitial(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $cleaned = preg_replace('/[\s.]+/u', '', trim($value)) ?? '';
        if ($cleaned === '') {
            return null;
        }

        return mb_strtoupper($cleaned, 'UTF-8').'.';
    }

    protected function composeFullName(string $firstName, ?string $middleInitial, string $lastName): string
    {
        $parts = array_filter([
            $this->cleanText($firstName),
            $this->normalizeMiddleInitial($middleInitial),
            $this->cleanText($lastName),
        ], fn ($part) => is_string($part) && $part !== '');

        return implode(' ', $parts);
    }

    protected function cleanText(mixed $value): mixed
    {
        if (! is_string($value)) {
            return $value;
        }

        return preg_replace('/\s+/u', ' ', trim($value)) ?? trim($value);
    }

    /**
     * Get the validation rules used to validate user emails.
     *
     * @return array<int, Unique|ValidationRule|array<mixed>|string>
     */
    protected function emailRules(?int $userId = null): array
    {
        return [
            'required',
            'string',
            'email',
            'max:255',
            $userId === null
                ? Rule::unique(User::class)
                : Rule::unique(User::class)->ignore($userId),
        ];
    }
}
