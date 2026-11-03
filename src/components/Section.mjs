import { html, cx } from '../lib/html.mjs';

/**
 * Layout primitive for every top-level block on a page. It owns vertical rhythm, the
 * heading and its id/aria wiring, so all sections stay consistent.
 *
 * @param {{
 *   id: string,
 *   title: any,
 *   level?: 1 | 2,                 // heading level (1 only for the page's main heading)
 *   variant?: 'label' | 'display', // label: small caps "// TITLE"; display: big headline
 *   className?: string,
 *   children: any,
 * }} props
 */
export const Section = ({ id, title, level = 2, variant = 'label', className, children }) => {
  const headingId = `${id}-title`;
  const heading =
    variant === 'display'
      ? html`<span>${title}</span>`
      : html`<span class="section__prefix" aria-hidden="true">// </span>${title}`;
  return html`
    <section class="${cx('section', className)}" id="${id}" aria-labelledby="${headingId}">
      ${level === 1
        ? html`<h1 class="section__title section__title--${variant}" id="${headingId}">${heading}</h1>`
        : html`<h2 class="section__title section__title--${variant}" id="${headingId}">${heading}</h2>`}
      ${children}
    </section>`;
};
