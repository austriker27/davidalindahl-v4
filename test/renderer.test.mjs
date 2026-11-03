import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sdf, textBitmap } from '../src/client/ascii-renderer.js';

test('model: the front face is solid and the outside is empty', () => {
  assert.ok(sdf(0, -0.3, 0) < 0, 'inside the case');
  assert.ok(sdf(0, -0.3, 1) > 0, 'in front of the case');
  assert.ok(Math.abs(sdf(0, -0.3, 0.6)) < 1e-3, 'on the front face');
});

test('textBitmap: 3x5 glyphs with 1px spacing; unknown chars become ?', () => {
  const bm = textBitmap('HI');
  assert.equal(bm.w, 7);
  assert.equal(bm.h, 5);
  assert.deepEqual(textBitmap('~').bits, textBitmap('?').bits);
});
