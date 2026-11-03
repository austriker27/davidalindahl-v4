// Host for the ASCII computer: reads design tokens, wires pointer/keyboard events, and
// runs the renderer in a Worker (OffscreenCanvas) when possible, inline otherwise.
// Framework-agnostic: AsciiComputer.vue calls mountAsciiComputer() from onMounted.

const readTheme = () => {
  const css = getComputedStyle(document.documentElement);
  const token = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
  return {
    bg: token('--color-bg', '#0c100d'),
    shades: [0, 1, 2, 3, 4].map((i) => token(`--color-ascii-${i}`, '#66f294')),
    fontFamily: token('--font-mono', 'monospace'),
    fontLoadFamily: 'IBM Plex Mono',
  };
};

/** Start the renderer inline on the main thread. Returns a port-like object. */
async function startInline(canvas, options) {
  const { createRenderer, createLoop } = await import('./ascii-renderer.js');
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return null;
  await Promise.race([
    document.fonts?.load(`500 10px "${options.theme.fontLoadFamily}"`),
    new Promise((resolve) => setTimeout(resolve, 1200)),
  ]).catch(() => {});
  const renderer = createRenderer(ctx, options);
  renderer.resize(options.width, options.height, options.dpr);
  const loop = createLoop(renderer, (cb) => requestAnimationFrame(cb));
  loop.request();
  return {
    post(msg) {
      if (msg.type === 'resize') renderer.resize(msg.width, msg.height, msg.dpr);
      if (msg.type === 'pointer') renderer.setPointer(msg.x, msg.y, msg.inside);
      if (msg.type === 'message') renderer.setMessage(msg.index);
      if (msg.type === 'active') return loop.setActive(msg.value);
      loop.request();
    },
  };
}

/** Start the renderer in a Worker. Resolves to null if workers/OffscreenCanvas are unavailable. */
function startWorker(canvas, options, onFail) {
  if (!('transferControlToOffscreen' in canvas) || typeof Worker !== 'function') return null;
  let worker;
  try {
    worker = new Worker(new URL('./ascii-worker.js', import.meta.url), { type: 'module' });
  } catch {
    return null;
  }
  const offscreen = canvas.transferControlToOffscreen();
  worker.addEventListener('message', ({ data }) => data?.type === 'error' && onFail());
  worker.addEventListener('error', onFail);
  worker.postMessage({ type: 'init', canvas: offscreen, ...options }, [offscreen]);
  return { post: (msg) => worker.postMessage(msg), terminate: () => worker.terminate() };
}

/**
 * @param {{
 *   button: HTMLElement,          // receives pointer + click events
 *   canvas: HTMLCanvasElement,
 *   messages: string[],
 *   fontUrl?: string,             // woff2 for the canvas font (loaded inside the worker)
 *   onMessage?: (word: string) => void,
 * }} options
 */
export async function mountAsciiComputer({ button, canvas, messages, fontUrl, onMessage }) {
  if (!messages?.length) messages = ['HELLO'];
  let index = 0;

  const size = () => {
    const rect = canvas.getBoundingClientRect();
    return { width: rect.width, height: rect.height, dpr: Math.min(window.devicePixelRatio || 1, 2) };
  };
  const options = {
    theme: readTheme(),
    messages,
    reduceMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    fontUrl,
    ...size(),
  };

  let port = null;
  const fallBack = async () => {
    // A transferred canvas can't be drawn on again, so swap in a fresh one.
    port?.terminate?.();
    const fresh = canvas.cloneNode(false);
    canvas.replaceWith(fresh);
    canvas = fresh;
    port = await startInline(canvas, { ...options, ...size() });
  };
  port = startWorker(canvas, options, fallBack) ?? (await startInline(canvas, options));
  if (!port) return;

  const post = (msg) => port?.post(msg);

  const setPointer = (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    post({ type: 'pointer', x, y, inside: x >= 0 && y >= 0 && x <= rect.width && y <= rect.height });
  };
  const leave = () => post({ type: 'pointer', x: 0, y: 0, inside: false });

  button.addEventListener('pointermove', setPointer, { passive: true });
  button.addEventListener('pointerdown', setPointer, { passive: true });
  button.addEventListener('pointerleave', leave);
  button.addEventListener('pointercancel', leave);
  button.addEventListener('click', () => {
    index = (index + 1) % messages.length;
    post({ type: 'message', index });
    onMessage?.(messages[index]);
  });

  let visible = true;
  const syncActive = () => post({ type: 'active', value: visible && !document.hidden });
  new ResizeObserver(() => post({ type: 'resize', ...size() })).observe(button);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    syncActive();
  }).observe(button);
  document.addEventListener('visibilitychange', syncActive);
}
