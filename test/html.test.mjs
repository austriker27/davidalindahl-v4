import { test } from 'node:test';
import assert from 'node:assert/strict';
import { html, raw, render, attrs, cx } from '../src/lib/html.mjs';

test('html escapes interpolations', () => {
  assert.equal(render(html`<p>${'<script>"&\''}</p>`), '<p>&lt;script&gt;&quot;&amp;&#39;</p>');
});

test('html composes nested templates, arrays and raw without double-escaping', () => {
  const items = ['a', 'b'].map((x) => html`<li>${x}</li>`);
  assert.equal(render(html`<ul>${items}${raw('<hr>')}</ul>`), '<ul><li>a</li><li>b</li><hr></ul>');
});

test('html skips null, undefined and false but keeps 0', () => {
  assert.equal(render(html`${null}${undefined}${false}${0}`), '0');
});

test('attrs drops empty values and escapes the rest', () => {
  assert.equal(render(attrs({ class: '', href: '/?a="b"', rel: null, hidden: true })), ' href="/?a=&quot;b&quot;" hidden');
});

test('cx joins truthy class names', () => {
  assert.equal(cx('a', false && 'b', null, ['c', 'd']), 'a c d');
});
