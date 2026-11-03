// Checks the built site in dist/. `npm test` runs `astro build` first.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const dist = new URL('../dist/', import.meta.url).pathname;
assert.ok(existsSync(join(dist, 'index.html')), 'dist/ is missing: run `npm run build` (npm test does this)');
const page = await readFile(join(dist, 'index.html'), 'utf8');
const notFound = await readFile(join(dist, '404.html'), 'utf8');
const pages = { 'index.html': page, '404.html': notFound };

test('every local href/src exists in the output', () => {
  for (const [name, doc] of Object.entries(pages)) {
    for (const [, url] of doc.matchAll(/(?:href|src|component-url|renderer-url|before-hydration-url)="(\/[^"#?]*)"/g)) {
      if (url === '/') continue;
      assert.ok(existsSync(join(dist, url)), `${name}: missing ${url}`);
    }
  }
});

const sha256 = (text) => `'sha256-${createHash('sha256').update(text).digest('base64')}'`;

test('every inline script and style is allowed by an exact hash in the CSP meta tag', () => {
  for (const [name, doc] of Object.entries(pages)) {
    const csp = doc.match(/<meta http-equiv="content-security-policy" content="([^"]+)"/)?.[1];
    assert.ok(csp, `${name}: no CSP meta tag`);
    assert.match(csp, /default-src 'self'/);
    assert.doesNotMatch(csp, /unsafe-inline|unsafe-eval/);
    const scriptSrc = csp.match(/script-src([^;]*)/)?.[1] ?? '';
    const styleSrc = csp.match(/style-src([^;]*)/)?.[1] ?? '';
    for (const [, attrs, body] of doc.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g)) {
      if (/application\/ld\+json/.test(attrs)) continue; // data block, never executed
      assert.ok(scriptSrc.includes(sha256(body)), `${name}: inline script not in CSP: ${body.slice(0, 60)}…`);
    }
    for (const [, body] of doc.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
      assert.ok(styleSrc.includes(sha256(body)), `${name}: inline style not in CSP: ${body.slice(0, 60)}…`);
    }
  }
});

test('no style attributes or inline event handlers (a hashed CSP cannot allow them)', () => {
  for (const [name, doc] of Object.entries(pages)) {
    assert.doesNotMatch(doc, /\sstyle="/, `${name} has a style attribute`);
    assert.doesNotMatch(doc, /\son[a-z]+="/i, `${name} has an inline event handler`);
  }
});

test('one h1 per page, labelled sections, 404 is noindex', () => {
  for (const doc of Object.values(pages)) assert.equal(doc.match(/<h1\b/g)?.length, 1);
  for (const [, id] of page.matchAll(/aria-labelledby="([^"]+)"/g)) assert.match(page, new RegExp(`id="${id}"`));
  assert.match(notFound, /<meta name="robots" content="noindex">/);
});

test('content from JSON reaches the page; links are same-tab', () => {
  assert.match(page, /ShopHero/);
  assert.match(page, /href="https:\/\/rainierwatch\.com" rel="noopener" class="invertible/);
  assert.doesNotMatch(page, /target="_blank"/);
});

test('text endpoints are generated', async () => {
  assert.match(await readFile(join(dist, 'llms.txt'), 'utf8'), /^# David A\. Lindahl/);
  assert.match(await readFile(join(dist, 'robots.txt'), 'utf8'), /Sitemap: https:\/\/davidalindahl\.com\/sitemap\.xml/);
  assert.match(await readFile(join(dist, 'sitemap.xml'), 'utf8'), /<loc>https:\/\/davidalindahl\.com\/<\/loc>/);
});
