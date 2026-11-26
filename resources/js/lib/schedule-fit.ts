import { formatTime12Hour } from '@/lib/format';

export type ClassBlock = {
    day: string;
    start_time: string;
    end_time: string;
    label?: string | null;
};

export type TimeOption = {
    value: string;
    label: string;
};

export function buildScheduleTimeOptions(extraValues: Array<string | null | undefined> = []): TimeOption[] {
    const values = new Set<string>();

    for (let minutes = 6 * 60; minutes <= 22 * 60; minutes += 15) {
        const hoursPart = String(Math.floor(minutes / 60)).padStart(2, '0');
        const minutesPart = String(minutes % 60).padStart(2, '0');
        values.add(`${hoursPart}:${minutesPart}`);
    }

    for (const rawValue of extraValues) {
        if (!rawValue) continue;
        const normalized = rawValue.trim().slice(0, 5);
        if (/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(normalized)) {
            values.add(normalized);
        }
    }

    return Array.from(values)
        .sort()
        .map((value) => ({
            value,
            label: formatTime12Hour(value),
        }));
}

export type TaskScheduleInput = {
    scheduleToBeDiscussed?: boolean;
    scheduleFlexible?: boolean;
    scheduleDays?: string[];
    scheduleStartTime?: string | null;
    scheduleEndTime?: string | null;
    canHoursChange?: boolean | null;
};

export type ScheduleConflict = {
    day: string;
    dayLabel: string;
    blockRange: string;
    taskRange: string;
    label: string | null;
};

export type ScheduleFitResult = {
    status: 'fits' | 'clashes' | 'cannot_check';
    reason: string;
    conflicts: ScheduleConflict[];
    negotiabilityNote: string;
};

const DEFAULT_DAY_LABELS: Record<string, string> = {
    mon: 'Mon',
    tue: 'Tue',
    wed: 'Wed',
    thu: 'Thu',
    fri: 'Fri',
    sat: 'Sat',
    sun: 'Sun',
};

function toMinutes(hhmm: string | null | undefined): number | null {
    if (!hhmm) return null;
    const match = /^(\d{2}):(\d{2})$/.exec(hhmm.trim());
    if (!match) return null;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

    return hours * 60 + minutes;
}

export function evaluateScheduleFit(
    task: TaskScheduleInput,
    classBlocks: ClassBlock[],
    dayLabels: Record<string, string> = DEFAULT_DAY_LABELS,
): ScheduleFitResult {
    if (task.scheduleFlexible) {
        return {
            status: 'fits',
            reason: 'This task has flexible, self-paced hours before the deadline, so it does not clash with fixed class times.',
            conflicts: [],
            negotiabilityNote: 'Flexible / self-paced around your class schedule.',
        };
    }

    const negotiabilityNote =
        task.canHoursChange === true
            ? 'The poster indicated hours can adjust around classes.'
            : task.canHoursChange === false
              ? 'The poster marked this schedule as fixed.'
              : 'The poster did not specify whether hours can change.';

    const taskDays = Array.isArray(task.scheduleDays) ? task.scheduleDays : [];
    const taskStart = toMinutes(task.scheduleStartTime);
    const taskEnd = toMinutes(task.scheduleEndTime);

    if (task.scheduleToBeDiscussed || taskDays.length === 0 || taskStart === null || taskEnd === null || taskEnd <= taskStart) {
        return {
            status: 'cannot_check',
            reason: 'Work hours are marked “To be discussed”, so class fit cannot be checked yet. Ask the poster for the schedule before committing.',
            conflicts: [],
            negotiabilityNote,
        };
    }

    if (classBlocks.length === 0) {
        return {
            status: 'cannot_check',
            reason: 'Add your weekly class times below to check whether these work hours fit your classes.',
            conflicts: [],
            negotiabilityNote,
        };
    }

    const taskRange = `${formatTime12Hour(task.scheduleStartTime)}–${formatTime12Hour(task.scheduleEndTime)}`;
    const conflicts: ScheduleConflict[] = [];

    for (const block of classBlocks) {
        if (!taskDays.includes(block.day)) continue;
        const blockStart = toMinutes(block.start_time);
        const blockEnd = toMinutes(block.end_time);
        if (blockStart === null || blockEnd === null || blockEnd <= blockStart) continue;

        if (taskStart < blockEnd && blockStart < taskEnd) {
            conflicts.push({
                day: block.day,
                dayLabel: dayLabels[block.day] ?? block.day,
                blockRange: `${formatTime12Hour(block.start_time)}–${formatTime12Hour(block.end_time)}`,
                taskRange,
                label: block.label ?? null,
            });
        }
    }

    if (conflicts.length > 0) {
        return {
            status: 'clashes',
            reason:
                task.canHoursChange === true
                    ? `These hours overlap with ${conflicts.length} of your saved class block${conflicts.length === 1 ? '' : 's'}. Because the poster noted hours can change, ask whether shifts can move around your classes.`
                    : task.canHoursChange === false
                      ? `These fixed hours overlap with ${conflicts.length} of your saved class block${conflicts.length === 1 ? '' : 's'}. Consider declining if this will affect your classes.`
                      : `These hours overlap with ${conflicts.length} of your saved class block${conflicts.length === 1 ? '' : 's'}. Ask the poster whether the work hours can be adjusted.`,
            conflicts,
            negotiabilityNote,
        };
    }

    return {
        status: 'fits',
        reason: 'No overlap found between the listed work hours and your saved class blocks.',
        conflicts: [],
        negotiabilityNote,
    };
}

export function buildAskPosterMessage(params: {
    taskTitle: string;
    missingTerms: string[];
    conflicts: ScheduleConflict[];
}): string {
    const parts: string[] = [`Hi! I am interested in "${params.taskTitle}". Before we agree, could you clarify a few details?`];

    if (params.missingTerms.length > 0) {
        parts.push(`• Terms marked "To be discussed": ${params.missingTerms.join(', ')}.`);
    }

    if (params.conflicts.length > 0) {
        const clashText = params.conflicts
            .map((conflict) => `${conflict.dayLabel} ${conflict.blockRange}${conflict.label ? ` (${conflict.label})` : ''}`)
            .join('; ');
        parts.push(`• Class schedule overlap: I have class during ${clashText}. Can the work hours be adjusted around these times?`);
    }

    if (params.missingTerms.length === 0 && params.conflicts.length === 0) {
        parts.push('• Could you confirm the exact duties, hours, and payment timing?');
    }

    return parts.join('\n');
}
