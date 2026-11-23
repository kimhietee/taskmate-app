<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateClassScheduleRequest;
use Illuminate\Http\RedirectResponse;

class ClassScheduleController extends Controller
{
    public function update(UpdateClassScheduleRequest $request): RedirectResponse
    {
        $dayOrder = array_flip(array_keys(config('taskmate.days_of_week', [])));

        $blocks = collect($request->validated('blocks'))
            ->map(fn (array $block): array => [
                'day' => $block['day'],
                'start_time' => $block['start_time'],
                'end_time' => $block['end_time'],
                'label' => isset($block['label']) && trim((string) $block['label']) !== ''
                    ? trim((string) $block['label'])
                    : null,
            ])
            ->sortBy(fn (array $block): string => sprintf('%02d-%s-%s', $dayOrder[$block['day']] ?? 99, $block['start_time'], $block['end_time']))
            ->values()
            ->all();

        $user = $request->user();
        $user->class_schedule = $blocks;
        $user->save();

        return back()->with('status', 'Your class schedule was saved.');
    }
}
