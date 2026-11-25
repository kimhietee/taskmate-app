<?php

namespace App\Http\Requests\Settings;

use App\Concerns\ProfileValidationRules;
use App\Enums\VerificationStatus;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ProfileUpdateRequest extends FormRequest
{
    use ProfileValidationRules;

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        $user = $this->user();
        $rules = $this->profileRules($user->id);
        $usesStructuredName = $this->exists('first_name') || $this->exists('last_name');
        if ($usesStructuredName) {
            unset($rules['name']);
            $rules['first_name'] = $this->firstNameRules();
            $rules['middle_initial'] = $this->middleInitialRules();
            $rules['last_name'] = $this->lastNameRules();
        }
        $rules['email'] = ['sometimes', 'nullable', 'string', 'lowercase', 'email', 'max:255', \Illuminate\Validation\Rule::unique('users')->ignore($user->id)];
        $rules['affiliation'] = $user->isOrganization()
            ? ['prohibited']
            : ($user->isStudent() && $user->verification_status === VerificationStatus::Unverified
                ? ['nullable', 'string', 'max:255']
                : ['required', 'string', 'max:255']);
        foreach (['organization_name', 'position', 'supporting_info'] as $field) {
            $rules[$field] = $user->isOrganization() ? ['required', 'string', 'max:'.($field === 'supporting_info' ? 1000 : 255)] : ['prohibited'];
        }
        return $rules;
    }

    protected function prepareForValidation(): void
    {
        foreach (['name', 'first_name', 'middle_initial', 'last_name'] as $field) {
            if ($this->exists($field) && is_string($this->input($field))) {
                $cleaned = $this->cleanText($this->input($field));
                $this->merge([$field => $cleaned === '' ? null : $cleaned]);
            }
        }
        if ($this->exists('middle_initial')) {
            $this->merge(['middle_initial' => $this->normalizeMiddleInitial($this->input('middle_initial'))]);
        }
        if ($this->input('email') === '') {
            $this->request->remove('email');
            return;
        }
        if (config('fortify.lowercase_usernames') && is_string($this->input('email'))) {
            $this->merge(['email' => Str::lower($this->input('email'))]);
        }
    }

    /** @return array<string, mixed> */
    public function validatedWithComposedName(): array
    {
        $validated = $this->validated();

        if (isset($validated['first_name'], $validated['last_name'])) {
            $validated['middle_initial'] = $this->normalizeMiddleInitial($validated['middle_initial'] ?? null);
            $validated['name'] = $this->composeFullName(
                $validated['first_name'],
                $validated['middle_initial'],
                $validated['last_name'],
            );
        }

        return $validated;
    }

    protected function passedValidation(): void
    {
        if ($this->allFiles() !== []) {
            throw ValidationException::withMessages(['profile' => 'Profile photo and identity document uploads are not accepted.']);
        }
    }
}
