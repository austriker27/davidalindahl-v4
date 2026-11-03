import { mountAsciiComputer } from './ascii-computer.js';

// Menu-bar clock (visitor's local time).
const clock = document.querySelector('[data-clock]');
if (clock) {
  const fmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
  const tick = () => {
    const now = new Date();
    clock.textContent = fmt.format(now);
    clock.dateTime = now.toISOString();
  };
  tick();
  setInterval(tick, 15_000);
}

// Wait (briefly) for the monospace web font so the ASCII grid measures correctly.
const canvas = document.querySelector('[data-ascii]');
if (canvas) {
  const fontReady = document.fonts?.load('500 10px "IBM Plex Mono"') ?? Promise.resolve();
  const timeout = new Promise((resolve) => setTimeout(resolve, 1200));
  Promise.race([fontReady, timeout]).finally(() => mountAsciiComputer(canvas));
}
