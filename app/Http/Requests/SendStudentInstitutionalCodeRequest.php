<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class SendStudentInstitutionalCodeRequest extends FormRequest
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
        if ($this->exists('institutional_email') && is_string($this->input('institutional_email'))) {
            $cleaned['institutional_email'] = Str::lower(trim($this->input('institutional_email')));
        }
        if ($cleaned !== []) {
            $this->merge($cleaned);
        }
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        $user = $this->user();
        $allowedDomains = array_map(
            fn (string $domain) => Str::lower(trim($domain)),
            config('taskmate.institutional_email_domains', []),
        );

        return [
            'id_number' => ['required', 'string', 'min:2', 'max:255'],
            'affiliation' => ['required', 'string', 'min:2', 'max:255'],
            'institutional_email' => [
                'required',
                'string',
                'email',
                'max:255',
                function (string $attribute, mixed $value, \Closure $fail) use ($allowedDomains, $user): void {
                    $normalized = Str::lower(trim((string) $value));
                    $domain = Str::afterLast($normalized, '@');
                    if (! in_array($domain, $allowedDomains, true)) {
                        $domainList = implode(', ', array_map(fn (string $d) => '@'.$d, $allowedDomains));
                        $fail("Enter a valid CMU institutional email address ({$domainList}).");

                        return;
                    }

                    $claimedByOther = User::query()
                        ->where('id', '!=', $user->id)
                        ->where(function ($query) use ($normalized) {
                            $query->whereRaw('LOWER(institutional_email) = ?', [$normalized])
                                ->orWhere(function ($sub) use ($normalized) {
                                    $sub->whereRaw('LOWER(email) = ?', [$normalized])
                                        ->whereNotNull('email_verified_at');
                                });
                        })
                        ->exists();

                    if ($claimedByOther) {
                        $fail('That CMU institutional email is already linked to another account.');
                    }
                },
            ],
        ];
    }

    protected function passedValidation(): void
    {
        if ($this->allFiles() !== []) {
            throw ValidationException::withMessages(['documents' => 'Identity document and face photo uploads are not accepted.']);
        }
    }
}
