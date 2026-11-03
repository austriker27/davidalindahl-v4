import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validate } from '../scripts/validate.mjs';

const schema = JSON.parse(await readFile(new URL('../content/schema/experience.schema.json', import.meta.url)));
const job = { company: 'Co', role: 'Dev', start: '2020-01', end: null };

test('accepts valid experience', () => {
  assert.deepEqual(validate(schema, { experience: [job] }), []);
});

test('rejects bad dates, unknown fields and missing fields', () => {
  const errors = validate(schema, {
    experience: [{ ...job, start: 'Jan 2020' }, { ...job, extra: 1 }, { company: 'X', role: 'Y', start: '2020' }],
  });
  assert.equal(errors.length, 3, errors.join('\n'));
  assert.match(errors[0], /does not match/);
  assert.match(errors[1], /unknown field "extra"/);
  assert.match(errors[2], /missing required field "end"/);
});

test('rejects non-https urls', () => {
  assert.equal(validate(schema, { experience: [{ ...job, url: 'http://x.com' }] }).length, 1);
});
