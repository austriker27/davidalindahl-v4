// Page entry. Kept tiny: the ASCII computer is loaded only on pages that have one.

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

const canvas = document.querySelector('[data-ascii]');
if (canvas) {
  import('./ascii-computer.js').then(({ mountAsciiComputer }) => mountAsciiComputer(canvas));
}
