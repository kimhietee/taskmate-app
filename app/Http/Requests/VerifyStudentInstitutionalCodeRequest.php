<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\ValidationException;

class VerifyStudentInstitutionalCodeRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && $user->canRequestStudentVerification();
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('code'))) {
            $this->merge(['code' => preg_replace('/\s+/', '', $this->input('code')) ?? '']);
        }
    }

    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        return [
            'code' => ['required', 'digits:6'],
        ];
    }

    protected function passedValidation(): void
    {
        if ($this->allFiles() !== []) {
            throw ValidationException::withMessages(['documents' => 'Identity document and face photo uploads are not accepted.']);
        }
    }
}
