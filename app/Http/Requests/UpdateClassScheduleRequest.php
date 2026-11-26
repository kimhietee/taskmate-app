<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateClassScheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        if (! $this->user()?->canApply()) {
            abort(403, 'Only verified students can save a class schedule.');
        }

        return true;
    }

    protected function prepareForValidation(): void
    {
        $blocks = $this->input('blocks');
        if (! is_array($blocks)) {
            return;
        }

        $normalized = array_map(function ($block) {
            if (! is_array($block)) {
                return $block;
            }

            foreach (['start_time', 'end_time'] as $field) {
                if (isset($block[$field]) && is_string($block[$field])) {
                    $trimmed = trim($block[$field]);
                    $block[$field] = preg_match('/^\d{2}:\d{2}:\d{2}$/', $trimmed) === 1
                        ? substr($trimmed, 0, 5)
                        : $trimmed;
                }
            }

            return $block;
        }, $blocks);

        $this->merge(['blocks' => $normalized]);
    }

    public function rules(): array
    {
        $maxBlocks = (int) config('taskmate.class_schedule.max_blocks', 25);
        $validDays = array_keys(config('taskmate.days_of_week', []));

        return [
            'blocks' => ['present', 'array', 'max:'.$maxBlocks],
            'blocks.*.day' => ['required', 'string', Rule::in($validDays)],
            'blocks.*.start_time' => ['required', 'date_format:H:i'],
            'blocks.*.end_time' => ['required', 'date_format:H:i', 'after:blocks.*.start_time'],
            'blocks.*.label' => ['nullable', 'string', 'max:80'],
        ];
    }

    public function messages(): array
    {
        return [
            'blocks.*.day.in' => 'Choose a valid day of the week for each class block.',
            'blocks.*.end_time.after' => 'Each class block end time must be later than its start time.',
        ];
    }
}
