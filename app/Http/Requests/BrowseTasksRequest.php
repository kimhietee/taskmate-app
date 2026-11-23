<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BrowseTasksRequest extends FormRequest
{
    public function authorize(): bool
    {
        if (! $this->user()?->canApply()) {
            abort(403, 'Only verified students can browse and apply to tasks.');
        }

        return true;
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:150'],
            'category' => ['nullable', Rule::in(array_keys(config('taskmate.categories', [])))],
            'work_type' => ['nullable', Rule::in(array_keys(config('taskmate.work_types', [])))],
            'work_mode' => ['nullable', Rule::in(array_keys(config('taskmate.work_modes', [])))],
            'complexity' => ['nullable', Rule::in(array_keys(config('taskmate.complexity_levels', [])))],
            'min_budget' => ['nullable', 'numeric', 'min:0', 'max:1000000'],
            'max_budget' => ['nullable', 'numeric', 'min:0', 'max:1000000'],
            'sort' => ['nullable', Rule::in(array_keys(config('taskmate.browse.sort_options', [])))],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }

    public function after(): array
    {
        return [function ($validator): void {
            if ($this->filled('min_budget') && $this->filled('max_budget')
                && is_numeric($this->input('min_budget')) && is_numeric($this->input('max_budget'))
                && (float) $this->input('max_budget') < (float) $this->input('min_budget')) {
                $validator->errors()->add('max_budget', 'The maximum budget must be at least the minimum budget.');
            }
        }];
    }
}
