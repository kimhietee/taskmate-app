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
const source = readFileSync(resolve(root, 'resources/js/components/rating-summary.tsx'), 'utf8');
const compiled = ts.transpileModule(source, {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;
const loaded = { exports: {} };
const mockRequire = (name) => {
    if (name === 'react/jsx-runtime') return require('react/jsx-runtime');
    if (name === 'react') return React;
    if (name === '@/components/star-rating') return { StarRating: ({ score, label }) => React.createElement('span', { 'aria-label': `${label}: ${score}` }, `${score}/5`) };
    if (name === '@/constants/notices') return { RATINGS_NOTICE: 'Ratings are contextual information.' };
    throw new Error(`Unexpected module in rating summary render test: ${name}`);
};
new Function('require', 'module', 'exports', compiled)(mockRequire, loaded, loaded.exports);
const RatingSummary = loaded.exports.RatingSummary;

test('public rating summary shows only the overall average and count', () => {
    const markup = renderToStaticMarkup(React.createElement(RatingSummary, {
        summary: { count: 4, average: 4.5, dimensions: { communication: { label: 'Communication', average: 3.5 } } },
    }));

    assert.match(markup, /4\.5 average · 4 ratings/);
    assert.doesNotMatch(markup, /Communication/);
    assert.match(markup, /Ratings are contextual information/);
});

test('public rating summary uses singular label for one rating', () => {
    const markup = renderToStaticMarkup(React.createElement(RatingSummary, {
        summary: { count: 1, average: 5 },
    }));

    assert.match(markup, /5 average · 1 rating(?!s)/);
});
