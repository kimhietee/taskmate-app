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
const source = readFileSync(resolve(root, 'resources/js/pages/auth/register.tsx'), 'utf8');
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

const modules = {
    '@inertiajs/react': { Form: ({ resetOnSuccess, disableWhileProcessing, ...props }) => element('form', props), Head: () => null },
    '@/components/input-error': () => null,
    '@/components/password-input': (props) => element('input', props),
    '@/components/safety-notice': { SafetyNotice: () => element('p', { children: 'Safety notice' }) },
    '@/components/text-link': (props) => element('a', props),
    '@/components/ui/button': { Button: (props) => element('button', props) },
    '@/components/ui/input': { Input: (props) => element('input', props) },
    '@/components/ui/label': { Label: (props) => element('label', props) },
    '@/components/ui/spinner': { Spinner: () => null },
    '@/components/ui/textarea': { Textarea: (props) => element('textarea', props) },
    '@/routes': { login: () => '/login' },
    '@/routes/register': { store: { form: () => ({ action: '/register', method: 'post' }) } },
};

const module = { exports: {} };
const mockRequire = (name) => {
    if (name === 'react/jsx-runtime') return require('react/jsx-runtime');
    if (name === 'react') return React;
    if (!(name in modules)) throw new Error(`Unexpected module in registration guidance render test: ${name}`);
    const value = modules[name];
    if (typeof value === 'function') return value;
    return { __esModule: true, ...value };
};
new Function('require', 'module', 'exports', compiled)(mockRequire, module, module.exports);
const Register = module.exports.default;

test('registration explains account review and why requested student details are collected', () => {
    const markup = renderToStaticMarkup(React.createElement(Register, {
        passwordRules: '',
        institutionalEmailDomains: ['cmu.edu.ph'],
        requireInstitutionalEmail: true,
        affiliationOptions: {
            student: ['College of Information Sciences and Computing — BSIT'],
            faculty_staff: ['College of Information Sciences and Computing'],
        },
    }));

    assert.match(markup, /How account review works/);
    assert.match(markup, /Email confirmation and TaskMate account review are separate steps/);
    assert.match(markup, /Step 1 — Confirm your email/);
    assert.match(markup, /Step 2 — Administrator approval/);
    assert.match(markup, /browse, post, or apply/);
    assert.match(markup, /Student ID number/);
    assert.match(markup, /College of Information Sciences and Computing — BSIT/);
    assert.match(markup, /Other \(specify below\)/);
    assert.match(markup, /Your ID number is visible only to you and administrators/);
    assert.match(markup, /may appear on your profile/);
});
