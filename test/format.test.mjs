import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseInlineLinks, formatRange, sortExperience } from '../src/lib/format.mjs';

test('parseInlineLinks splits text and https/mailto links', () => {
  assert.deepEqual(parseInlineLinks('a [x](https://e.com/?q=1&r=2) and [m](mailto:a@b.c).'), [
    { text: 'a ' },
    { text: 'x', href: 'https://e.com/?q=1&r=2' },
    { text: ' and ' },
    { text: 'm', href: 'mailto:a@b.c' },
    { text: '.' },
  ]);
});

test('parseInlineLinks leaves unsafe schemes as plain text', () => {
  for (const text of ['[x](javascript:alert(1))', '[x](http://insecure.example)', '[x](data:text/html,hi)']) {
    assert.ok(parseInlineLinks(text).every((s) => !s.href), text);
  }
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
