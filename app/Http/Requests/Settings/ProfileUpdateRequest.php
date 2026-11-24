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
        if ($this->input('email') === '') {
            $this->request->remove('email');
            return;
        }
        if (config('fortify.lowercase_usernames') && is_string($this->input('email'))) {
            $this->merge(['email' => Str::lower($this->input('email'))]);
        }
    }

    protected function passedValidation(): void
    {
        if ($this->allFiles() !== []) {
            throw ValidationException::withMessages(['profile' => 'Profile photo and identity document uploads are not accepted.']);
        }
    }
}
