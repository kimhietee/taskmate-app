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

function element(tag, { children, ...props } = {}) {
    return React.createElement(tag, props, typeof children === 'function' ? children({ errors: {}, processing: false }) : children);
}

function loadPage(path, modules, label, exportName = 'default') {
    const source = readFileSync(resolve(root, path), 'utf8');
    const compiled = ts.transpileModule(source, {
        compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    const loaded = { exports: {} };
    const mockRequire = (name) => {
        if (name === 'react/jsx-runtime') return require('react/jsx-runtime');
        if (name === 'react') return React;
        if (!(name in modules)) throw new Error(`Unexpected module in ${label} render test: ${name}`);
        if (name === 'lucide-react') {
            return new Proxy({ __esModule: true }, {
                get: (target, key) => key in target ? target[key] : () => null,
            });
        }
        const value = modules[name];
        return typeof value === 'function' ? value : { __esModule: true, ...value };
    };
    new Function('require', 'module', 'exports', compiled)(mockRequire, loaded, loaded.exports);
    return loaded.exports[exportName];
}

const Link = ({ href, children, ...props }) => element('a', { ...props, href: typeof href === 'string' ? href : href?.url ?? '#', children });
const Button = ({ asChild, ...props }) => element('button', props);
const Form = ({ onSubmit, ...props }) => element('form', props);

const MyApplications = loadPage('resources/js/pages/applications/index.tsx', {
    '@inertiajs/react': { Form, Head: () => null, Link },
    'lucide-react': {},
    '@/lib/format': { formatDate: (value) => value ?? '—', formatAmount: (value) => String(value) },
    '@/components/ui/button': { Button },
    '@/components/application-status-badge': { ApplicationStatusBadge: ({ label }) => element('span', { children: label }) },
    '@/routes/applications': { default: { task: (id) => ({ url: `/my-applications/${id}/task` }), withdraw: { form: (id) => ({ action: `/my-applications/${id}/withdraw`, method: 'post' }) } } },
    '@/routes/browse': { default: { index: () => ({ url: '/browse' }) } },
    '@/routes/agreements': { default: { rate: (id) => ({ url: `/agreements/${id}/rate` }), show: (id) => ({ url: `/agreements/${id}` }) } },
    '@/components/payment-status-badge': { PaymentStatusBadge: () => null },
    '@/components/terms-status-badge': { ToBeDiscussedBadge: ({ label = 'To be discussed' } = {}) => element('span', { children: label }) },
}, 'my applications');

const AgreementDetails = loadPage('resources/js/components/agreement-details.tsx', {
    '@inertiajs/react': { Form, Link },
    'lucide-react': { Printer: () => null },
    '@/lib/format': { formatDate: (value) => value ?? '—', formatDateTime: (value) => value ?? '—', formatAmount: (value) => String(value) },
    '@/components/ui/button': { Button },
    '@/components/ui/input': { Input: (props) => element('input', props) },
    '@/components/ui/textarea': { Textarea: (props) => element('textarea', props) },
    '@/components/input-error': () => null,
    '@/components/agreement-status-badge': { AgreementStatusBadge: () => element('span', { children: 'Negotiating' }) },
    '@/routes/agreements': { default: { confirm: { form: () => ({ action: '/agreements/1/confirm', method: 'post' }) }, revise: { form: () => ({ action: '/agreements/1/versions', method: 'post' }) }, sendBack: { form: () => ({ action: '/agreements/1/send-back', method: 'post' }) }, cancel: { form: () => ({ action: '/agreements/1/cancel', method: 'post' }) } } },
    '@/components/completion-payment-panel': { CompletionPaymentPanel: () => null },
    '@/components/star-rating': { StarRating: () => null },
    '@/components/rating-summary': { ratingNotice: 'Rating notice' },
}, 'agreement details', 'AgreementDetails');

test('my applications explains the status and next step for pending and accepted applications', () => {
    const markup = renderToStaticMarkup(React.createElement(MyApplications, {
        applications: { links: [], data: [
            { id: 1, taskId: 1, taskTitle: 'Synthetic pending task', posterName: 'Synthetic Poster', budget: '500.00', status: 'pending', statusLabel: 'Pending', taskStatus: 'Approved', taskApproved: true, otherApplicantAccepted: true, agreementId: null, agreementStatus: null, agreementStatusLabel: null, paymentStatus: null, paymentStatusLabel: null, appliedAt: null, needsRating: false, conversationId: null, messageBlockedReason: null },
            { id: 2, taskId: 2, taskTitle: 'Synthetic accepted task', posterName: 'Synthetic Poster', budget: '700.00', status: 'accepted', statusLabel: 'Accepted', taskStatus: 'Assigned', taskApproved: false, otherApplicantAccepted: false, agreementId: 3, agreementStatus: 'negotiating', agreementStatusLabel: 'Negotiating', paymentStatus: null, paymentStatusLabel: null, appliedAt: null, needsRating: false, conversationId: null, messageBlockedReason: null },
        ] },
    }));

    assert.match(markup, /Your application stays active until an agreement is confirmed/);
    assert.match(markup, /Review the agreement and confirm the same version before work begins/);
    assert.match(markup, /View agreement/);
});

test('agreement page clearly states that both people must confirm the same version before work begins', () => {
    const markup = renderToStaticMarkup(React.createElement(AgreementDetails, {
        agreement: {
            id: 1, status: 'negotiating', statusLabel: 'Negotiating', lockedAt: null, cancelledAt: null, cancelledBy: null, cancellationReason: null, recordReference: null,
            task: { id: 1, title: 'Synthetic task', budget: '500.00', status: 'Assigned' },
            poster: { id: 2, name: 'Synthetic Poster' }, student: { id: 3, name: 'Synthetic Worker' },
            currentVersion: { id: 1, versionNumber: 1, proposerId: 2, proposerName: 'Synthetic Poster', deliverables: 'A synthetic result', terms: 'Complete the task as discussed.', finalAmount: '500.00', startDate: null, dueDate: '2026-12-01', workMode: 'Remote', workplaceName: null, workplaceAddress: null, paymentArrangement: 'Direct payment after completion.', comment: null, createdAt: null, confirmations: [] },
            versions: [], messages: [],
        },
        completionPayment: {}, viewerId: 3, actionsAllowed: true, notice: 'Agreement notice', termsMaxLength: 3000,
    }));

    assert.match(markup, /Review the work, amount, dates, and payment arrangement/);
    assert.match(markup, /both people confirm the same version/);
    assert.match(markup, /I agree to these terms/);
    assert.match(markup, /Propose different terms/);
    assert.match(markup, /Ask for a change/);
    for (const id of ['revise-deliverables', 'revise-terms', 'revise-final-amount', 'revise-start-date', 'revise-due-date', 'revise-payment-arrangement', 'revise-comment', 'send-back-body', 'cancel-reason']) {
        assert.match(markup, new RegExp(`for=\\"${id}\\"`), `Expected a visible or screen-reader label for ${id}.`);
        assert.match(markup, new RegExp(`id=\\"${id}\\"`), `Expected the field ${id} to match its label.`);
    }
});
