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
        if (!(name in mocks)) throw new Error(`Unexpected module in password-requirements test (${relPath}): ${name}`);
        const value = mocks[name];
        return typeof value === 'function' ? value : { __esModule: true, ...value };
    };
    new Function('require', 'module', 'exports', compiled)(mockRequire, loaded, loaded.exports);
    return loaded.exports;
}

const libMod = loadModule('resources/js/lib/password-requirements.ts');
const checklistMod = loadModule('resources/js/components/password-requirements-checklist.tsx', {
    'lucide-react': { Check: () => React.createElement('svg', { 'data-icon': 'check' }) },
    '@/lib/password-requirements': libMod,
});

const PRODUCTION_RULES = {
    min: 12,
    mixedCase: true,
    letters: true,
    numbers: true,
    symbols: true,
    uncompromised: true,
};

test('evaluatePasswordRequirements tracks production criteria, confirmation, and local fallback', () => {
    const { evaluatePasswordRequirements, arePasswordRequirementsMet } = libMod;

    const empty = evaluatePasswordRequirements('', PRODUCTION_RULES, '');
    assert.equal(empty.length, 6);
    assert.ok(empty.every((item) => item.met === false));
    assert.equal(arePasswordRequirementsMet('short', PRODUCTION_RULES), false);

    const partial = evaluatePasswordRequirements('Taskmate1234', PRODUCTION_RULES, 'Taskmate1234');
    assert.deepEqual(
        partial.map((item) => [item.key, item.met]),
        [
            ['min', true],
            ['uppercase', true],
            ['lowercase', true],
            ['numbers', true],
            ['symbols', false],
            ['match', true],
        ],
    );
    assert.equal(arePasswordRequirementsMet('Taskmate1234', PRODUCTION_RULES), false);

    const complete = evaluatePasswordRequirements('Taskmate#2026', PRODUCTION_RULES, 'Taskmate#2026');
    assert.ok(complete.every((item) => item.met === true));
    assert.equal(arePasswordRequirementsMet('Taskmate#2026', PRODUCTION_RULES), true);

    const localItems = evaluatePasswordRequirements('password', {
        min: 8,
        mixedCase: false,
        letters: false,
        numbers: false,
        symbols: false,
        uncompromised: false,
    });
    assert.deepEqual(
        localItems.map((item) => [item.key, item.met]),
        [['min', true]],
    );
});

test('PasswordRequirementsChecklist renders progress count and green success styling as rules pass', () => {
    const { PasswordRequirementsChecklist } = checklistMod;

    const partialMarkup = renderToStaticMarkup(React.createElement(PasswordRequirementsChecklist, {
        password: 'Abc',
        confirmation: 'Abc',
        requirements: PRODUCTION_RULES,
    }));
    assert.match(partialMarkup, /Password requirements/);
    assert.match(partialMarkup, /3\/6 met/);
    assert.match(partialMarkup, /At least 12 characters/);
    assert.match(partialMarkup, /At least one uppercase letter/);
    assert.match(partialMarkup, /At least one lowercase letter/);
    assert.match(partialMarkup, /At least one number/);
    assert.match(partialMarkup, /At least one symbol/);
    assert.match(partialMarkup, /Passwords match/);
    assert.match(partialMarkup, /Avoid common or previously leaked passwords/);
    assert.match(partialMarkup, /text-success-fg/);

    const fullMarkup = renderToStaticMarkup(React.createElement(PasswordRequirementsChecklist, {
        password: 'CmuTaskTest#2026',
        confirmation: 'CmuTaskTest#2026',
        requirements: PRODUCTION_RULES,
    }));
    assert.match(fullMarkup, /All requirements met/);
});
