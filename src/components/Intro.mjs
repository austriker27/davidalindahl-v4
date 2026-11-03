import { html } from '../lib/html.mjs';
import { inlineMarkdown } from '../lib/format.mjs';
import { Section } from './Section.mjs';
import { Link } from './Link.mjs';

/**
 * The page's main heading, tagline and bio paragraphs.
 *
 * @param {{ name: string, tagline: string, paragraphs: string[] }} props
 */
export const Intro = ({ name, tagline, paragraphs }) =>
  Section({
    id: 'about',
    title: name,
    level: 1,
    variant: 'display',
    className: 'intro',
    children: html`
      <p class="intro__tagline">${tagline}</p>
      <div class="intro__body prose">
        ${paragraphs.map((p) => html`<p>${inlineMarkdown(p, (label, href) => Link({ href, children: label, invert: true }))}</p>`)}
      </div>`,
  });
