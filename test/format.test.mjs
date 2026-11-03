import { test } from 'node:test';
import assert from 'node:assert/strict';
import { render } from '../src/lib/html.mjs';
import { inlineMarkdown, formatRange, sortExperience } from '../src/lib/format.mjs';

test('inlineMarkdown renders https and mailto links and escapes text', () => {
  const out = render(inlineMarkdown('a < b [x](https://e.com/?q=1&r=2) [m](mailto:a@b.c)'));
  assert.equal(out, 'a &lt; b <a href="https://e.com/?q=1&amp;r=2">x</a> <a href="mailto:a@b.c">m</a>');
});

test('inlineMarkdown leaves unsafe schemes as text', () => {
  const out = render(inlineMarkdown('[x](javascript:alert(1))'));
  assert.ok(!out.includes('<a'), out);
});

test('formatRange', () => {
  assert.equal(formatRange({ start: '2018-09', end: '2020-05' }), '2018–2020');
  assert.equal(formatRange({ start: '2017', end: null }), '2017–now');
  assert.equal(formatRange({ start: '2021-01', end: '2021-06' }), '2021');
});

test('sortExperience: newest first, ongoing before finished on ties, input untouched', () => {
  const input = [
    { start: '2013-03', end: '2017-09', id: 'old' },
    { start: '2020-01', end: '2021-01', id: 'done' },
    { start: '2020-01', end: null, id: 'ongoing' },
  ];
  assert.deepEqual(sortExperience(input).map((j) => j.id), ['ongoing', 'done', 'old']);
  assert.equal(input[0].id, 'old');
});
