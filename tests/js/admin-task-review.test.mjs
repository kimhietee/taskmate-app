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
const source = readFileSync(resolve(root, 'resources/js/pages/admin/tasks/show.tsx'), 'utf8');
const compiled = ts.transpileModule(source, {
    compilerOptions: {
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
    },
}).outputText;

function element(tag, { children, ...props } = {}) {
    return React.createElement(tag, props, typeof children === 'function' ? children({ errors: {}, processing: false }) : children);
}

const route = (url) => () => ({ url });
const modules = {
    '@inertiajs/react': {
        Form: (props) => element('form', props),
        Head: () => null,
        Link: ({ href, children, ...props }) => element('a', { ...props, href: typeof href === 'string' ? href : href?.url ?? '#', children }),
    },
    '@/layouts/admin-layout': (props) => element('main', props),
    '@/components/task-status-badge': { TaskStatusBadge: () => element('span', { children: 'Task status' }) },
    '@/components/verification-status-badge': { VerificationStatusBadge: () => element('span', { children: 'Verification status' }) },
    '@/components/safety-notice': { SafetyNotice: () => element('p', { children: 'Safety notice' }) },
    '@/components/terms-status-badge': { ToBeDiscussedBadge: ({ label = 'To be discussed' } = {}) => element('span', { children: label }) },
    '@/components/ui/button': { Button: (props) => element('button', props) },
    '@/components/ui/textarea': { Textarea: (props) => element('textarea', props) },
    '@/components/input-error': () => null,
    '@/routes/admin': { default: { tasks: { index: route('/admin/tasks'), decision: { form: () => ({ action: '/admin/tasks/1/decision', method: 'post' }) } }, agreements: { show: route('/admin/agreements/1') } } },
    '@/routes/admin/users': { default: { show: route('/admin/users/1') } },
    '@/components/completion-payment-panel': { CompletionPaymentPanel: () => element('section', { children: 'Completion and payment' }) },
    '@/lib/format': {
        formatAmount: (value) => String(value),
        formatDateTime: (value) => value ?? '—',
        formatHoursFlexibility: (value) => (value === true ? 'Yes — hours can change around classes' : value === false ? 'No — fixed schedule' : 'Not specified'),
    },
    '@/constants/notices': { PAYMENT_BOUNDARY_NOTICE: 'Payment notice' },
};

const module = { exports: {} };
const mockRequire = (name) => {
    if (name === 'react/jsx-runtime') return require('react/jsx-runtime');
    if (name === 'react') return React;
    if (!(name in modules)) throw new Error(`Unexpected module in admin task review render test: ${name}`);
    const value = modules[name];
    if (typeof value === 'function') return value;
    return { __esModule: true, ...value };
};
new Function('require', 'module', 'exports', compiled)(mockRequire, module, module.exports);
const AdminTaskReview = module.exports.default;

const task = {
    id: 1,
    title: 'Synthetic pending task',
    category: 'Other',
    categoryKey: 'other',
    description: 'Synthetic task description.',
    requiredActivities: 'Review details.',
    deliverables: 'A clear summary.',
    estimatedDurationHours: '2.0',
    skillRequirements: null,
    complexity: 'Low',
    budget: '500.00',
    workMode: 'Remote',
    workplaceName: null,
    workplaceAddress: null,
    workplaceSetting: null,
    deadline: null,
    physicalDemand: 'None',
    academicInvolvement: 'None',
    hazardExposure: false,
    hazardDescription: null,
    privateMeetingRequired: false,
    status: 'pending_review',
    statusLabel: 'Pending review',
    reviewNote: null,
    submittedAt: null,
    poster: { id: 2, name: 'Synthetic Poster', type: 'Faculty / Staff', verificationStatus: 'verified', otherTasksCount: 1 },
};

test('admin task review renders a task for manual review without automated screening data', () => {
    const markup = renderToStaticMarkup(React.createElement(AdminTaskReview, {
        task,
        canReview: false,
    }));

    assert.match(markup, /Synthetic pending task/);
    assert.match(markup, /Every submitted task is reviewed by an administrator/);
    assert.doesNotMatch(markup, /Risk level|Screening breakdown|Score:/);
    assert.match(markup, /No applications have been submitted/);
    assert.match(markup, /No off-platform content flags have been recorded/);
    assert.doesNotMatch(markup, />Agreement</);
});
