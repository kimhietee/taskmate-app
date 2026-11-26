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
let pageProps = { auth: { user: null } };

function loadPage(path, modules, exportName = 'default') {
    const source = readFileSync(resolve(root, path), 'utf8');
    const compiled = ts.transpileModule(source, {
        compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    const loaded = { exports: {} };
    const mockRequire = (name) => {
        if (name === 'react/jsx-runtime') return require('react/jsx-runtime');
        if (name === 'react') return React;
        if (!(name in modules)) throw new Error(`Unexpected module in first-version scope render test: ${name}`);
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

const Link = ({ href, children, ...props }) => React.createElement('a', { ...props, href: typeof href === 'string' ? href : href?.url ?? '#', children });
const routes = {
    '@/routes': { register: () => ({ url: '/register' }), login: () => ({ url: '/login' }) },
    '@/routes/browse': { default: { index: () => ({ url: '/browse' }) } },
    '@/routes/tasks': { default: { create: () => ({ url: '/tasks/create' }) }, create: () => ({ url: '/tasks/create' }) },
};
const Welcome = loadPage('resources/js/pages/welcome.tsx', {
    ...routes,
    'lucide-react': {},
    '@inertiajs/react': { Head: () => null, Link, usePage: () => ({ props: pageProps }) },
    '@/constants/notices': { PAYMENT_BOUNDARY_NOTICE: 'Payment boundary notice.', SAFETY_NOTICE: 'Safety notice.' },
});
const Information = loadPage('resources/js/pages/public/info.tsx', {
    ...routes,
    '@inertiajs/react': { Head: () => null, Link },
    '@/constants/notices': { PAYMENT_BOUNDARY_NOTICE: 'Payment boundary notice.' },
});

test('landing page only shows actions available for the signed-in role', () => {
    pageProps = { auth: { user: { is_admin: false, can_browse_tasks: true, can_apply_tasks: true, can_post_tasks: true } } };
    const student = renderToStaticMarkup(React.createElement(Welcome));
    assert.match(student, /href="\/browse"[^>]*>Browse tasks/);
    assert.match(student, /href="\/tasks\/create"[^>]*>Post a task/);

    pageProps = { auth: { user: { is_admin: false, can_browse_tasks: true, can_apply_tasks: false, can_post_tasks: false } } };
    const unverified = renderToStaticMarkup(React.createElement(Welcome));
    assert.match(unverified, /href="\/browse"[^>]*>Browse tasks/);
    assert.doesNotMatch(unverified, /href="\/tasks\/create"/);
});

test('how-it-works page describes the main task flow and role limits', () => {
    const markup = renderToStaticMarkup(React.createElement(Information, {
        page: 'how-it-works', title: 'How TaskMate works', guidelines: [], privacyDraft: null,
    }));

    assert.match(markup, /Create your account and get verified/);
    assert.match(markup, /both confirm the same version before it locks/);
    assert.match(markup, /Verified students can apply; faculty, staff, and organization accounts cannot apply/);
    assert.match(markup, /Payment is made directly between the two people/);
});

test('task detail pages omit uncollected work-condition fields but keep workplace information', () => {
    const ownerTask = readFileSync(resolve(root, 'resources/js/pages/tasks/show.tsx'), 'utf8');
    const studentTask = readFileSync(resolve(root, 'resources/js/pages/browse/show.tsx'), 'utf8');
    const adminTask = readFileSync(resolve(root, 'resources/js/pages/admin/tasks/show.tsx'), 'utf8');

    for (const source of [ownerTask, studentTask, adminTask]) {
        assert.doesNotMatch(source, /Work conditions|Safety answers|Physical demand|Academic involvement|Hazards involved|Private or isolated one-on-one meeting required/);
        assert.match(source, /Workplace/);
    }
});
