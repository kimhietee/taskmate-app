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
