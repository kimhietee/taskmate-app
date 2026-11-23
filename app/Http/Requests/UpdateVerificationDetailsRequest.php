<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateVerificationDetailsRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $cleaned = [];
        foreach (['id_number', 'affiliation', 'organization_name', 'position', 'supporting_info'] as $field) {
            if ($this->exists($field) && is_string($this->input($field))) {
                $normalized = preg_replace('/\s+/u', ' ', trim($this->input($field))) ?? trim($this->input($field));
                $cleaned[$field] = $normalized === '' ? null : $normalized;
            }
        }
        if ($cleaned !== []) {
            $this->merge($cleaned);
        }
    }

    public function authorize(): bool
    {
        return $this->user() !== null
            && in_array($this->user()->verification_status?->value, ['rejected', 'more_info_requested'], true);
    }

    public function rules(): array
    {
        $user = $this->user();

        if ($user->isOrganization()) {
            return [
                'organization_name' => ['required', 'string', 'max:255'],
                'position' => ['required', 'string', 'max:255'],
                'supporting_info' => ['required', 'string', 'max:1000'],
                'id_number' => ['prohibited'],
                'affiliation' => ['prohibited'],
            ];
        }

        return [
            'id_number' => ['required', 'string', 'max:255'],
            'affiliation' => ['required', 'string', 'max:255'],
            'organization_name' => ['prohibited'],
            'position' => ['prohibited'],
            'supporting_info' => ['prohibited'],
        ];
    }
}
