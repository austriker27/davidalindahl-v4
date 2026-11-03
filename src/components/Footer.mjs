import { html } from '../lib/html.mjs';

/** @param {{ name: string, text?: string, year: number }} props */
export const Footer = ({ name, text, year }) => html`
  <footer class="footer">
    <span>&copy; ${year} ${name}</span>
    ${text ? html`<span>${text}</span>` : ''}
    <span class="footer__cursor" aria-hidden="true">_</span>
  </footer>`;
