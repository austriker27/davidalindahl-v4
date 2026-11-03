import { html, cx } from '../lib/html.mjs';

/**
 * Retro desktop window chrome: striped title bar with a close box, framed body.
 * Decorative only; the title bar is hidden from assistive tech.
 *
 * @param {{ title: string, className?: string, children: any }} props
 */
export const Window = ({ title, className, children }) => html`
  <div class="${cx('window', className)}">
    <div class="window__titlebar" aria-hidden="true">
      <span class="window__close"></span>
      <span class="window__title">${title}</span>
    </div>
    <div class="window__body">${children}</div>
  </div>`;
