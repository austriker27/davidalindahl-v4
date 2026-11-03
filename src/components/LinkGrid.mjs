import { html } from '../lib/html.mjs';
import { Section } from './Section.mjs';
import { Link } from './Link.mjs';

/**
 * Grid of outbound profile links. rel="me" lets IndieWeb tools verify the profiles.
 *
 * @param {{ id?: string, title?: string, links: { label: string, url: string }[] }} props
 */
export const LinkGrid = ({ id = 'elsewhere', title = 'Elsewhere', links }) =>
  Section({
    id,
    title,
    children: html`
      <ul class="link-grid" role="list">
        ${links.map(
          (l) => html`<li>${Link({
            href: l.url,
            rel: 'me',
            className: 'link-grid__link',
            invert: true,
            children: html`<span>${l.label}</span><span aria-hidden="true">↗</span>`,
          })}</li>`
        )}
      </ul>`,
  });
