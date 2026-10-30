import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { parseAst } from 'rolldown/parseAst';

test('production entry and Today page do not statically import the optional chart library', () => {
  const dist = new URL('../dist/', import.meta.url);
  const html = readFileSync(new URL('index.html', dist), 'utf8');
  const assets = readdirSync(new URL('assets/', dist));
  const chart = assets.find(name => /^vendor-charts-.*\.js$/.test(name));
  const dashboard = assets.find(name => /^Dashboard-.*\.js$/.test(name));
  assert.ok(chart && dashboard, 'Build the production frontend before this test.');
  const initial = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+\.js)"/g)].map(match => new URL(match[1].slice(1), dist));
  initial.push(new URL('assets/' + dashboard, dist));
  const visited = new Set();
  function visit(file) {
    if (visited.has(file.href)) return;
    visited.add(file.href);
    // Parse actual static imports; dynamic preload strings are not dependencies.
    for (const statement of parseAst(readFileSync(file, 'utf8')).body) {
      if (['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration'].includes(statement.type)
        && statement.source?.value.startsWith('.')) visit(new URL(statement.source.value, file));
    }
  }
  initial.forEach(visit);
  assert.equal(visited.has(new URL('assets/' + chart, dist).href), false);
});
