// Content formatting helpers shared by components, pages and llms.txt.

import { html } from './html.mjs';

export const isExternal = (url) => /^https?:\/\//.test(url);

const LINK = /\[([^\]]+)\]\(((?:https:\/\/|mailto:)[^)\s]+)\)/g;

/**
 * Inline markdown, links only: "Hi [there](https://x.y)". Anything else is escaped text,
 * and links with other schemes (javascript:, data:, …) are left as literal text.
 * `renderLink(text, href)` lets callers render links through the Link component.
 */
export function inlineMarkdown(text, renderLink = (label, href) => html`<a href="${href}">${label}</a>`) {
  const parts = [];
  let last = 0;
  for (const m of text.matchAll(LINK)) {
    parts.push(text.slice(last, m.index), renderLink(m[1], m[2]));
    last = m.index + m[0].length;
  }
  parts.push(text.slice(last));
  return html`${parts}`; // plain strings are escaped, links are already safe HTML
}

const yearOf = (d) => (d ? d.slice(0, 4) : null);

/** "2018–2020", "2017–now", or "2021" when a role started and ended the same year. */
export const formatRange = ({ start, end }) => {
  const s = yearOf(start);
  const e = end ? yearOf(end) : 'now';
  return s === e ? s : `${s}–${e}`;
};

/** Newest first. Ongoing roles sort above finished ones that started the same month. */
export const sortExperience = (items) =>
  [...items].sort((a, b) => b.start.localeCompare(a.start) || (a.end === null ? -1 : b.end === null ? 1 : 0));
