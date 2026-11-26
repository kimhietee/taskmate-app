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
    '@inertiajs/react': {
        Head: () => null,
        useForm: (initial) => ({
            data: initial,
            errors: {},
            processing: false,
            setData: () => {},
            post: () => {},
            reset: () => {},
            transform: () => {},
        }),
    },
    '@/components/input-error': () => null,
    '@/components/password-input': (props) => element('input', props),
    '@/components/password-requirements-checklist': { PasswordRequirementsChecklist: () => null },
    '@/components/safety-notice': { SafetyNotice: () => element('p', { children: 'Safety notice' }) },
    '@/components/text-link': (props) => element('a', props),
    '@/components/ui/button': { Button: (props) => element('button', props) },
    '@/components/ui/input': { Input: (props) => element('input', props) },
    '@/components/ui/label': { Label: (props) => element('label', props) },
    '@/components/ui/spinner': { Spinner: () => null },
    '@/components/ui/textarea': { Textarea: (props) => element('textarea', props) },
    '@/lib/password-requirements': {
        DEFAULT_PASSWORD_REQUIREMENTS: { min: 8, mixedCase: false, letters: false, numbers: false, symbols: false, uncompromised: false },
        arePasswordRequirementsMet: () => true,
    },
    '@/routes': { login: () => '/login' },
    '@/routes/register': { store: { url: () => '/register', form: () => ({ action: '/register', method: 'post' }) } },
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

test('progressive registration explains roles, 6-digit email verification, and no ID photo uploads', () => {
    const markup = renderToStaticMarkup(React.createElement(Register, {
        passwordRules: '',
        institutionalEmailDomains: ['cmu.edu.ph'],
        requireInstitutionalEmail: false,
        autoVerifyInstitutionalStudent: true,
        unverifiedStudentsCanBrowse: true,
        affiliationOptions: {
            student: ['College of Information Sciences and Computing — BSIT'],
            faculty_staff: ['College of Information Sciences and Computing'],
        },
    }));

    assert.match(markup, /Step 1 of 2/);
    assert.match(markup, /How will you use TaskMate\?/);
    assert.match(markup, /CMU Student/);
    assert.match(markup, /CMU Faculty \/ Staff/);
    assert.match(markup, /Office or Organization Representative/);
    assert.match(markup, /How verification works/);
    assert.match(markup, /6-digit code/);
    assert.match(markup, /TaskMate does not ask for ID photos or identity document uploads/);
    assert.match(markup, /Continue as CMU Student/);
});
