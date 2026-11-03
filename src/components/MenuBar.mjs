import { html } from '../lib/html.mjs';
import { Link } from './Link.mjs';

/**
 * Sticky top bar: site name, in-page navigation and a live clock.
 *
 * @param {{ name: string, home: string, nav: { href: string, label: string }[] }} props
 */
export const MenuBar = ({ name, home, nav }) => html`
  <header class="menubar">
    ${Link({ href: home, className: 'menubar__brand', children: html`<span class="menubar__glyph" aria-hidden="true">▚</span> ${name}` })}
    ${nav.length
      ? html`<nav class="menubar__nav" aria-label="Sections">
          ${nav.map((item) => Link({ href: item.href, className: 'menubar__link', invert: true, children: item.label }))}
        </nav>`
      : ''}
    <time class="menubar__clock" data-clock aria-hidden="true"></time>
  </header>`;
