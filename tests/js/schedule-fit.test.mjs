import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(import.meta.url);

function loadModule(relPath, mocks = {}) {
    const source = readFileSync(resolve(root, relPath), 'utf8');
    const compiled = ts.transpileModule(source, {
        compilerOptions: {
            jsx: ts.JsxEmit.ReactJSX,
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2022,
            esModuleInterop: true,
        },
    }).outputText;
    const loaded = { exports: {} };
    const mockRequire = (name) => {
        if (name === 'react/jsx-runtime') return require('react/jsx-runtime');
        if (name === 'react') return React;
        if (!(name in mocks)) throw new Error(`Unexpected module in schedule-fit test (${relPath}): ${name}`);
        const value = mocks[name];
        return typeof value === 'function' ? value : { __esModule: true, ...value };
    };
    new Function('require', 'module', 'exports', compiled)(mockRequire, loaded, loaded.exports);
    return loaded.exports;
}

const formatMod = loadModule('resources/js/lib/format.ts');
const scheduleFitMod = loadModule('resources/js/lib/schedule-fit.ts', {
    '@/lib/format': formatMod,
});

test('evaluateScheduleFit detects fits, clashes, boundary non-overlap, and to-be-discussed cases', () => {
    const { evaluateScheduleFit, buildAskPosterMessage } = scheduleFitMod;
    const classes = [
        { day: 'mon', start_time: '08:00', end_time: '12:00', label: 'IT57' },
        { day: 'wed', start_time: '08:00', end_time: '12:00', label: 'IT57' },
    ];

    const fits = evaluateScheduleFit(
        { scheduleToBeDiscussed: false, scheduleDays: ['sat'], scheduleStartTime: '09:00', scheduleEndTime: '12:00', canHoursChange: true },
        classes,
    );
    assert.equal(fits.status, 'fits');
    assert.equal(fits.conflicts.length, 0);

    const adjacentNoOverlap = evaluateScheduleFit(
        { scheduleToBeDiscussed: false, scheduleDays: ['mon'], scheduleStartTime: '12:00', scheduleEndTime: '15:00', canHoursChange: false },
        classes,
    );
    assert.equal(adjacentNoOverlap.status, 'fits');

    const clashes = evaluateScheduleFit(
        { scheduleToBeDiscussed: false, scheduleDays: ['mon', 'wed'], scheduleStartTime: '09:00', scheduleEndTime: '11:30', canHoursChange: false },
        classes,
    );
    assert.equal(clashes.status, 'clashes');
    assert.equal(clashes.conflicts.length, 2);
    assert.match(clashes.reason, /fixed hours overlap/i);

    const tbd = evaluateScheduleFit({ scheduleToBeDiscussed: true, scheduleDays: [] }, classes);
    assert.equal(tbd.status, 'cannot_check');
    assert.match(tbd.reason, /To be discussed/);

    const noClasses = evaluateScheduleFit(
        { scheduleToBeDiscussed: false, scheduleDays: ['mon'], scheduleStartTime: '09:00', scheduleEndTime: '11:00' },
        [],
    );
    assert.equal(noClasses.status, 'cannot_check');

    const flexibleGig = evaluateScheduleFit({ scheduleFlexible: true }, classes);
    assert.equal(flexibleGig.status, 'fits');
    assert.match(flexibleGig.reason, /flexible, self-paced/i);

    const msg = buildAskPosterMessage({
        taskTitle: 'Synthetic Shop Helper',
        missingTerms: ['Pay amount', 'When paid (pay timing)'],
        conflicts: clashes.conflicts,
    });
    assert.match(msg, /Pay amount, When paid \(pay timing\)/);
    assert.match(msg, /Mon 8:00 AM–12:00 PM \(IT57\)/);

    const { buildScheduleTimeOptions } = scheduleFitMod;
    const standardTimes = buildScheduleTimeOptions();
    assert.equal(standardTimes.length, 65);
    assert.deepEqual(standardTimes[0], { value: '06:00', label: '6:00 AM' });
    assert.deepEqual(standardTimes[8], { value: '08:00', label: '8:00 AM' });
    assert.deepEqual(standardTimes[26], { value: '12:30', label: '12:30 PM' });
    assert.deepEqual(standardTimes[30], { value: '13:30', label: '1:30 PM' });
    assert.deepEqual(standardTimes[33], { value: '14:15', label: '2:15 PM' });
    assert.deepEqual(standardTimes.at(-1), { value: '22:00', label: '10:00 PM' });

    const withCustomTime = buildScheduleTimeOptions(['14:10', '14:15', 'invalid']);
    assert.equal(withCustomTime.length, 66);
    const customIndex = withCustomTime.findIndex((item) => item.value === '14:10');
    assert.ok(customIndex > -1);
    assert.deepEqual(withCustomTime[customIndex], { value: '14:10', label: '2:10 PM' });
    assert.equal(withCustomTime[customIndex + 1].value, '14:15');
});

test('browse task detail renders Alternative A four-group order, checklist, and schedule clash', () => {
    const passthrough = (tag) => (props) => React.createElement(tag, props, props.children);
    const Link = ({ href, children, ...props }) => React.createElement('a', { ...props, href: typeof href === 'string' ? href : href?.url ?? '#' }, children);
    const BrowseTaskDetail = loadModule('resources/js/pages/browse/show.tsx', {
        '@/lib/format': formatMod,
        '@/lib/schedule-fit': scheduleFitMod,
        '@/constants/notices': { PAYMENT_BOUNDARY_NOTICE: 'Payment boundary notice.', STUDENT_TASK_SAFETY_NOTICE: 'Safety notice.' },
        '@inertiajs/react': {
            Head: () => null,
            Link,
            router: { put: () => {} },
            useForm: (initial) => ({ data: initial, setData: () => {}, errors: {}, processing: false, post: () => {} }),
        },
        '@/components/ui/button': { Button: ({ asChild: _asChild, ...props }) => React.createElement('button', props, props.children) },
        '@/components/ui/input': { Input: passthrough('input') },
        '@/components/ui/label': { Label: passthrough('label') },
        '@/components/ui/textarea': { Textarea: passthrough('textarea') },
        '@/components/input-error': () => null,
        '@/components/verification-status-badge': { VerificationStatusBadge: () => React.createElement('span', null, 'Verified') },
        '@/components/application-status-badge': { ApplicationStatusBadge: () => React.createElement('span', null, 'Pending') },
        '@/components/terms-status-badge': {
            ToBeDiscussedBadge: ({ label = 'To be discussed' } = {}) => React.createElement('span', null, label),
            ScheduleFitBadge: ({ status }) => React.createElement('span', null, status === 'fits' ? 'Fits your classes' : status === 'clashes' ? 'Clashes with your classes' : 'Cannot check yet'),
        },
        '@/routes/browse': { default: { index: () => ({ url: '/browse' }) } },
        '@/routes/applications': { default: { store: { url: () => '/browse/1/apply' } } },
        '@/components/rating-summary': { RatingSummary: () => React.createElement('div', null, 'Ratings') },
        '@/components/problem-report-form': { ProblemReportForm: () => React.createElement('div', null, 'Report') },
    }).default;

    const markup = renderToStaticMarkup(React.createElement(BrowseTaskDetail, {
        task: {
            id: 1,
            title: 'Synthetic Shop Helper',
            category: 'Other',
            description: 'Assist with synthetic inventory checks.',
            requiredActivities: null,
            deliverables: null,
            estimatedDurationHours: null,
            skillRequirements: null,
            budget: null,
            budgetToBeDiscussed: true,
            payTiming: 'bi_weekly',
            payTimingLabel: 'Bi-weekly (every 2 weeks)',
            payTimingToBeDiscussed: false,
            payTimingNote: 'Paid every other Saturday.',
            scheduleDays: ['mon'],
            scheduleStartTime: '09:00',
            scheduleEndTime: '11:00',
            scheduleNote: null,
            scheduleToBeDiscussed: false,
            scheduleSummary: 'Mon · 9:00 AM–11:00 AM',
            canHoursChange: true,
            workMode: 'Onsite',
            workplaceName: 'Synthetic Campus Shop',
            workplaceAddress: 'Synthetic Street',
            deadline: null,
        },
        poster: {
            displayName: 'Synthetic Poster',
            accountType: 'Organization',
            affiliation: 'Synthetic Org',
            verificationStatus: 'verified',
            memberSince: '2026-10-01',
            profileUrl: '/users/2',
            ratingSummary: { average: null, count: 0 },
        },
        application: null,
        canApply: true,
        messageMaxLength: 1000,
        studentClassSchedule: [{ day: 'mon', start_time: '08:00', end_time: '12:00', label: 'IT57' }],
    }));

    const offerIdx = markup.indexOf('1. The offer');
    const posterIdx = markup.indexOf('2. The poster');
    const classesIdx = markup.indexOf('3. My classes');
    const decisionIdx = markup.indexOf('4. My decision');
    assert.ok(offerIdx > -1 && offerIdx < posterIdx && posterIdx < classesIdx && classesIdx < decisionIdx, 'Alternative A groups must appear in fixed order 1 -> 2 -> 3 -> 4');
    assert.match(markup, /Bi-weekly \(every 2 weeks\)/);
    assert.match(markup, /To be discussed/);
    assert.match(markup, /Pre-acceptance checklist \(3 quick checks\)/);
    assert.match(markup, /0 of 3 checked/);
    assert.match(markup, /Clashes with your classes/);
    assert.match(markup, /Ask poster/);
    assert.match(markup, /Review &amp; apply/);
    assert.match(markup, /Decline \(back to tasks\)/);

    const openEditorMarkup = renderToStaticMarkup(React.createElement(BrowseTaskDetail, {
        task: {
            id: 2,
            title: 'Synthetic Shop Helper',
            category: 'Other',
            description: 'Assist with synthetic inventory checks.',
            requiredActivities: null,
            deliverables: null,
            estimatedDurationHours: null,
            skillRequirements: null,
            budget: null,
            budgetToBeDiscussed: true,
            payTiming: 'bi_weekly',
            payTimingLabel: 'Bi-weekly (every 2 weeks)',
            payTimingToBeDiscussed: false,
            payTimingNote: 'Paid every other Saturday.',
            scheduleDays: ['mon'],
            scheduleStartTime: '09:00',
            scheduleEndTime: '11:00',
            scheduleNote: null,
            scheduleToBeDiscussed: false,
            scheduleSummary: 'Mon · 9:00 AM–11:00 AM',
            canHoursChange: true,
            workMode: 'Onsite',
            workplaceName: 'Synthetic Campus Shop',
            workplaceAddress: 'Synthetic Street',
            deadline: null,
        },
        poster: {
            displayName: 'Synthetic Poster',
            accountType: 'Organization',
            affiliation: 'Synthetic Org',
            verificationStatus: 'verified',
            memberSince: '2026-10-01',
            profileUrl: '/users/2',
            ratingSummary: { average: null, count: 0 },
        },
        application: null,
        canApply: true,
        messageMaxLength: 1000,
        studentClassSchedule: [],
    }));

    assert.match(openEditorMarkup, /<select[^>]+id="class_start_time"/);
    assert.match(openEditorMarkup, /<select[^>]+id="class_end_time"/);
    assert.match(openEditorMarkup, /8:00 AM/);
    assert.match(openEditorMarkup, /1:30 PM/);
});
