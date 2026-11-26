<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateClassScheduleRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ClassScheduleController extends Controller
{
    public function edit(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user->isStudent() && ! $user->isAdmin(), 403, 'Only student accounts can manage a class schedule.');

        return Inertia::render('settings/schedule', [
            'studentClassSchedule' => $user->class_schedule ?? [],
            'daysOfWeek' => collect(config('taskmate.days_of_week', []))
                ->map(fn (string $label, string $value): array => compact('value', 'label'))
                ->values()
                ->all(),
            'maxClassBlocks' => (int) config('taskmate.class_schedule.max_blocks', 25),
            'canSaveSchedule' => $user->canApply(),
            'studentVerificationUrl' => $user->canRequestStudentVerification()
                ? route('verification.student.show', [], false)
                : null,
            'status' => $request->session()->get('status'),
        ]);
    }

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

        return back(fallback: route('class-schedule.edit'))->with('status', 'Your class schedule was saved.');
    }
}
