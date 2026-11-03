// Content formatting helpers shared by components, pages and llms.txt. No framework code.

export const isExternal = (url) => /^https?:\/\//.test(url);

const LINK = /\[([^\]]+)\]\(((?:https:\/\/|mailto:)[^)\s]+)\)/g;

/**
 * Split text with inline markdown links into segments:
 *   "Hi [there](https://x.y)!" → [{ text: 'Hi ' }, { text: 'there', href: 'https://x.y' }, { text: '!' }]
 * Only https: and mailto: links are recognised; anything else stays literal text.
 * Components render the segments, so no HTML string is ever injected.
 */
export function parseInlineLinks(text) {
  const segments = [];
  let last = 0;
  for (const m of text.matchAll(LINK)) {
    if (m.index > last) segments.push({ text: text.slice(last, m.index) });
    segments.push({ text: m[1], href: m[2] });
    last = m.index + m[0].length;
  }
  if (last < text.length) segments.push({ text: text.slice(last) });
  return segments;
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
