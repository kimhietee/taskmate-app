import assert from 'node:assert/strict';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { readFileSync } from 'node:fs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(import.meta.url);

function element(tag, { children, ...props } = {}) {
    return React.createElement(tag, props, typeof children === 'function' ? children({ errors: {}, processing: false }) : children);
}

function loadTaskForm() {
    const source = readFileSync(resolve(root, 'resources/js/components/task-form.tsx'), 'utf8');
    const compiled = ts.transpileModule(source, {
        compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    const loaded = { exports: {} };
    const Form = ({ children, ...props }) => element('form', { ...props, children });
    const passthrough = (tag) => (props) => element(tag, props);
    const modules = {
        '@/constants/notices': { PAYMENT_BOUNDARY_NOTICE: 'TaskMate records agreements and payment status only.' },
        '@inertiajs/react': { Form },
        '@/components/input-error': () => null,
        '@/components/ui/button': { Button: passthrough('button') },
        '@/components/ui/input': { Input: passthrough('input') },
        '@/components/ui/label': { Label: passthrough('label') },
        '@/components/ui/textarea': { Textarea: passthrough('textarea') },
    };
    const mockRequire = (name) => {
        if (name === 'react/jsx-runtime') return require('react/jsx-runtime');
        if (name === 'react') return React;
        if (!(name in modules)) throw new Error(`Unexpected module in task form render test: ${name}`);
        const value = modules[name];
        return typeof value === 'function' ? value : { __esModule: true, ...value };
    };
    new Function('require', 'module', 'exports', compiled)(mockRequire, loaded, loaded.exports);
    return loaded.exports.default;
}

test('task form keeps only the essentials and required workplace details', () => {
    const TaskForm = loadTaskForm();
    const markup = renderToStaticMarkup(React.createElement(TaskForm, {
        action: { action: '/tasks', method: 'post' },
        options: {
            categories: [{ value: 'other', label: 'Other' }],
            workModes: [{ value: 'remote', label: 'Remote' }, { value: 'onsite', label: 'On-site' }],
            payTimings: [{ value: 'upon_completion', label: 'Upon completion' }, { value: 'to_be_discussed', label: 'To be discussed' }],
            daysOfWeek: [{ value: 'mon', label: 'Mon' }, { value: 'sat', label: 'Sat' }],
            guidelines: ['Follow the platform rules.'],
        },
        task: null,
        resetWarning: false,
    }));

    for (const text of [
        'Task title',
        'Category',
        'Work type',
        'What needs to be done?',
        'Estimated budget (PHP)',
        'Pay amount is to be discussed',
        'When is pay given? (Pay timing)',
        'Work schedule / hours',
        'Flexible / self-paced before deadline',
        'Work hours are to be discussed',
        'Can hours change?',
        'Work mode',
        'Deadline (optional)',
        'I confirm that this task follows the platform rules.',
    ]) {
        assert.match(markup, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
    for (const field of ['complexity', 'required_activities', 'deliverables', 'estimated_duration_hours', 'skill_requirements', 'physical_demand', 'academic_involvement', 'hazard_exposure', 'private_meeting_required', 'workplace_setting']) {
        assert.doesNotMatch(markup, new RegExp(`name="${field}"`), `The simplified form should not ask for ${field}.`);
    }
});
