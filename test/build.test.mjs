import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from '../scripts/build.mjs';

const outDir = await mkdtemp(join(tmpdir(), 'site-build-'));
await build({ outDir, log: () => {} });
const page = await readFile(join(outDir, 'index.html'), 'utf8');
const notFound = await readFile(join(outDir, '404.html'), 'utf8');

test.after(() => rm(outDir, { recursive: true, force: true }));

test('every local href/src in the pages exists in the output', () => {
  for (const doc of [page, notFound]) {
    for (const [, url] of doc.matchAll(/(?:href|src|data-font-url)="(\/[^"#]*)"/g)) {
      if (url === '/') continue;
      assert.ok(existsSync(join(outDir, url)), `missing ${url}`);
    }
  }
});

test('assets are content-hashed and JS imports point at hashed files', async () => {
  const scripts = [...page.matchAll(/\/assets\/([\w-]+\.[0-9a-f]{10}\.js)/g)].map((m) => m[1]);
  assert.ok(scripts.length >= 2, 'entry + preloaded module');
  const main = await readFile(join(outDir, 'assets', scripts.find((s) => s.startsWith('main.'))), 'utf8');
  assert.match(main, /\.\/ascii-computer\.[0-9a-f]{10}\.js/);
});

test('CSP-friendly: no inline styles, event handlers or executable inline scripts', () => {
  for (const doc of [page, notFound]) {
    assert.doesNotMatch(doc, /\sstyle=/);
    assert.doesNotMatch(doc, /\son[a-z]+=/i);
    const inline = [...doc.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>/g)].map((m) => m[1]);
    assert.ok(inline.every((a) => /application\/ld\+json/.test(a)), 'only JSON-LD may be inline');
  }
});

test('one h1 per page, sections are labelled, 404 is noindex', () => {
  assert.equal(page.match(/<h1\b/g).length, 1);
  assert.equal(notFound.match(/<h1\b/g).length, 1);
  for (const [, id] of page.matchAll(/aria-labelledby="([^"]+)"/g)) assert.match(page, new RegExp(`id="${id}"`));
  assert.match(notFound, /<meta name="robots" content="noindex">/);
});

test('content from JSON reaches the page and is escaped', () => {
  assert.match(page, /ShopHero/);
  assert.match(page, /<a class="invertible" href="https:\/\/rainierwatch\.com" rel="noopener">Rainier Watch<\/a>/);
  assert.doesNotMatch(page, /target="_blank"/);
});
