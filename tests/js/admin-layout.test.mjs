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
    return React.createElement(tag, props, children);
}

function loadComponent(path, modules, label, exportName = 'default') {
    const source = readFileSync(resolve(root, path), 'utf8');
    const compiled = ts.transpileModule(source, {
        compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    const loaded = { exports: {} };
    const mockRequire = (name) => {
        if (name === 'react/jsx-runtime') return require('react/jsx-runtime');
        if (name === 'react') return React;
        if (!(name in modules)) throw new Error(`Unexpected module in ${label} render test: ${name}`);
        const value = modules[name];
        return typeof value === 'function' ? value : { __esModule: true, ...value };
    };
    new Function('require', 'module', 'exports', compiled)(mockRequire, loaded, loaded.exports);
    return loaded.exports[exportName];
}

const adminRoutes = { default: {
    dashboard: () => ({ url: '/admin' }),
    users: { index: () => ({ url: '/admin/users' }) },
    tasks: { index: (options) => ({ url: options?.query?.status ? `/admin/tasks?status=${options.query.status}` : '/admin/tasks' }), show: (id) => ({ url: `/admin/tasks/${id}` }) },
    reports: { index: () => ({ url: '/admin/reports' }) },
    ratings: { index: () => ({ url: '/admin/ratings' }) },
} };

const Link = ({ href, children, prefetch: _prefetch, ...props }) => element('a', { ...props, href: typeof href === 'string' ? href : href?.url ?? '#', children });
const AdminSidebar = loadComponent('resources/js/components/admin-sidebar.tsx', {
    '@inertiajs/react': { Link },
    'lucide-react': { BriefcaseBusiness: () => null, Flag: () => null, LayoutDashboard: () => null, ShieldCheck: () => null, Star: () => null, Users: () => null },
    '@/components/app-logo': () => element('span', { children: 'TaskMate' }),
    '@/components/nav-main': { NavMain: ({ items, groupLabel }) => element('nav', { 'aria-label': groupLabel, children: items.map((item) => React.createElement('a', { key: item.title, href: item.href, children: item.title })) }) },
    '@/components/nav-user': { NavUser: () => element('div', { children: 'Profile settings Log out' }) },
    '@/components/ui/sidebar': {
        Sidebar: ({ children }) => element('aside', { children }),
        SidebarContent: ({ children }) => element('div', { children }),
        SidebarFooter: ({ children }) => element('div', { children }),
        SidebarHeader: ({ children }) => element('div', { children }),
        SidebarMenu: ({ children }) => element('div', { children }),
        SidebarMenuButton: ({ children }) => element('div', { children }),
        SidebarMenuItem: ({ children }) => element('div', { children }),
    },
    '@/routes/admin': adminRoutes,
}, 'admin sidebar', 'AdminSidebar');

const AdminLayout = loadComponent('resources/js/layouts/admin-layout.tsx', {
    '@/components/app-content': { AppContent: ({ children }) => element('section', { 'data-part': 'content', children }) },
    '@/components/admin-sidebar': { AdminSidebar: () => element('aside', { children: 'Admin sidebar' }) },
    '@/components/app-shell': { AppShell: ({ children }) => element('div', { 'data-part': 'shell', children }) },
    '@/components/app-sidebar-header': { AppSidebarHeader: ({ showMessages }) => element('header', { children: showMessages ? 'Header with messages' : 'Admin alerts only' }) },
    '@/components/prototype-banner': () => null,
    '@/components/site-footer': () => element('footer', { children: 'Footer' }),
}, 'admin layout');

const AdminDashboard = loadComponent('resources/js/pages/admin/dashboard.tsx', {
    '@inertiajs/react': { Head: () => null, Link },
    '@/layouts/admin-layout': { default: ({ children }) => element('div', { children }) },
    '@/components/verification-status-badge': { VerificationStatusBadge: ({ status }) => element('span', { children: status }) },
    '@/routes/admin': adminRoutes,
}, 'admin dashboard');

test('admin sidebar lists admin destinations and includes profile and logout controls', () => {
    const markup = renderToStaticMarkup(React.createElement(AdminSidebar));

    assert.match(markup, /aria-label="Administration"/);
    for (const label of ['Dashboard', 'Users', 'Tasks', 'Reports', 'Flags', 'Ratings', 'Profile settings', 'Log out']) {
        assert.match(markup, new RegExp(label));
    }
    assert.doesNotMatch(markup, /Browse Tasks|My Applications/);
});

test('admin pages use the sidebar shell and show admin alerts in the header', () => {
    const markup = renderToStaticMarkup(React.createElement(AdminLayout, { children: element('div', { children: 'Admin page' }) }));

    assert.match(markup, /data-part="shell"/);
    assert.match(markup, /Admin sidebar/);
    assert.match(markup, /Admin alerts only/);
    assert.match(markup, /Admin page/);
    assert.doesNotMatch(markup, /Footer/);
});

test('admin dashboard highlights the latest pending task and links to the review queue', () => {
    const markup = renderToStaticMarkup(React.createElement(AdminDashboard, {
        counts: { pending: 0, moreInfoRequested: 0, verified: 0, rejected: 0, tasksAwaitingReview: 1, openReports: 0, reportsUnderReview: 0, highPriorityReports: 0, escalatedReports: 0, openFlags: 0, activeSuspensions: 0 },
        recentActions: [],
        latestPendingTasks: [{ id: 17, title: 'Newest synthetic task', posterName: 'Synthetic Poster', submittedAt: '2026-11-23 10:00:00' }],
    }));

    assert.match(markup, /Latest tasks awaiting review/);
    assert.match(markup, /Newest synthetic task/);
    assert.match(markup, /href="\/admin\/tasks\/17"/);
    assert.match(markup, /href="\/admin\/tasks\?status=pending_review"/);
});
