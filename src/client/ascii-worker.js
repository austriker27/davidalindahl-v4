// Worker entry: renders the ASCII computer on an OffscreenCanvas so the raymarching never
// blocks the main thread. Protocol (host → worker):
//   { type: 'init', canvas, theme, messages, reduceMotion, fontUrl, width, height, dpr }
//   { type: 'resize', width, height, dpr }
//   { type: 'pointer', x, y, inside }
//   { type: 'message', index }
//   { type: 'active', value }
// Worker → host: { type: 'error', message } if it cannot render (host falls back to inline).

import { createRenderer, createLoop } from './ascii-renderer.js';

const requestFrame =
  typeof self.requestAnimationFrame === 'function'
    ? (cb) => self.requestAnimationFrame(cb)
    : (cb) => setTimeout(() => cb(performance.now()), 1000 / 60);

let renderer = null;
let loop = null;

async function loadFont(url, family) {
  if (!url || !self.fonts || typeof FontFace !== 'function') return;
  try {
    const face = new FontFace(family, `url(${url})`, { weight: '500' });
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('font timeout')), 1500));
    self.fonts.add(await Promise.race([face.load(), timeout]));
  } catch {
    // Fall back to the next family in the stack; the grid is measured at runtime.
  }
}

self.onmessage = async ({ data }) => {
  switch (data.type) {
    case 'init': {
      const ctx = data.canvas.getContext('2d', { alpha: false });
      if (!ctx) return self.postMessage({ type: 'error', message: 'no 2d context' });
      await loadFont(data.fontUrl, data.theme.fontLoadFamily);
      renderer = createRenderer(ctx, data);
      renderer.resize(data.width, data.height, data.dpr);
      loop = createLoop(renderer, requestFrame);
      loop.request();
      break;
    }
    case 'resize':
      renderer?.resize(data.width, data.height, data.dpr);
      loop?.request();
      break;
    case 'pointer':
      renderer?.setPointer(data.x, data.y, data.inside);
      loop?.request();
      break;
    case 'message':
      renderer?.setMessage(data.index);
      loop?.request();
      break;
    case 'active':
      loop?.setActive(data.value);
      break;
  }
};
