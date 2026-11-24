<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\ValidationException;

class RequestManualStudentVerificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && $user->canRequestStudentVerification();
    }

    protected function prepareForValidation(): void
    {
        $cleaned = [];
        foreach (['id_number', 'affiliation'] as $field) {
            if ($this->exists($field) && is_string($this->input($field))) {
                $normalized = preg_replace('/\s+/u', ' ', trim($this->input($field))) ?? trim($this->input($field));
                $cleaned[$field] = $normalized === '' ? null : $normalized;
            }
        }
        if ($cleaned !== []) {
            $this->merge($cleaned);
        }
    }

    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        return [
            'id_number' => ['required', 'string', 'min:2', 'max:255'],
            'affiliation' => ['required', 'string', 'min:2', 'max:255'],
        ];
    }

    protected function passedValidation(): void
    {
        if ($this->allFiles() !== []) {
            throw ValidationException::withMessages(['documents' => 'Identity document and face photo uploads are not accepted.']);
        }
    }
}
