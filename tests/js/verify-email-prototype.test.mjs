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
const source = readFileSync(resolve(root, 'resources/js/pages/auth/verify-email.tsx'), 'utf8');
const compiled = ts.transpileModule(source, {
    compilerOptions: {
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
    },
}).outputText;

function element(tag, { children, ...props } = {}) {
    return React.createElement(
        tag,
        props,
        typeof children === 'function' ? children({ errors: {}, processing: false }) : children,
    );
}

const modules = {
    '@inertiajs/react': {
        Form: (props) => element('form', props),
        Head: () => null,
        useForm: (initial) => ({
            data: initial,
            errors: {},
            processing: false,
            setData: () => {},
            post: () => {},
        }),
        usePage: () => ({ props: { prototypeMode: true } }),
    },
    'lucide-react': {
        ExternalLink: () => null,
        Mail: () => null,
        TriangleAlert: () => null,
    },
    '@/components/input-error': () => null,
    '@/components/text-link': (props) => element('a', props),
    '@/components/ui/alert': {
        Alert: (props) => element('div', props),
        AlertDescription: (props) => element('div', props),
    },
    '@/components/ui/button': {
        Button: ({ asChild, ...props }) => (asChild ? props.children : element('button', props)),
    },
    '@/components/ui/input': { Input: (props) => element('input', props) },
    '@/components/ui/label': { Label: (props) => element('label', props) },
    '@/components/ui/spinner': { Spinner: () => null },
    '@/routes': { logout: () => '/logout' },
    '@/routes/verification': {
        send: { form: () => ({ action: '/email/verification-notification', method: 'post' }) },
    },
};

const loaded = { exports: {} };
const mockRequire = (name) => {
    if (name === 'react/jsx-runtime') return require('react/jsx-runtime');
    if (name === 'react') return React;
    if (!(name in modules)) throw new Error(`Unexpected module in verify-email render test: ${name}`);
    const value = modules[name];
    return typeof value === 'function' ? value : { __esModule: true, ...value };
};
new Function('require', 'module', 'exports', compiled)(mockRequire, loaded, loaded.exports);
const VerifyEmail = loaded.exports.default;

test('verify-email renders 6-digit code input and prototype mailbox link when enabled', () => {
    const markup = renderToStaticMarkup(
        React.createElement(VerifyEmail, {
            prototypeMailboxEnabled: true,
            mailUsesLogDriver: true,
            maskedEmail: 'st***@gmail.com',
            codeExpiryMinutes: 15,
        }),
    );

    assert.match(markup, /id="code"/);
    assert.match(markup, /Confirm email &amp; continue to dashboard/);
    assert.match(markup, /Open Prototype Email Tab/);
    assert.match(markup, /href="\/prototype\/mailbox"/);
    assert.match(markup, /Resend verification code/);
});

test('verify-email omits prototype mailbox link when prototype mailbox is disabled', () => {
    const markup = renderToStaticMarkup(
        React.createElement(VerifyEmail, {
            prototypeMailboxEnabled: false,
            mailUsesLogDriver: true,
            maskedEmail: 'st***@gmail.com',
            codeExpiryMinutes: 15,
        }),
    );

    assert.match(markup, /id="code"/);
    assert.doesNotMatch(markup, /Open Prototype Email Tab/);
    assert.doesNotMatch(markup, /href="\/prototype\/mailbox"/);
});
