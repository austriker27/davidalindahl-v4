import { html } from '../lib/html.mjs';
import { formatRange, sortExperience } from '../lib/format.mjs';
import { Section } from './Section.mjs';
import { Link } from './Link.mjs';

const COLUMNS = ['Years', 'Company', 'Role'];

/** One job. A whole row is the link target when the company has a URL. */
export const ExperienceRow = (job) => {
  const cells = html`
    <span class="xp__years"><time datetime="${job.start}">${formatRange(job)}</time></span>
    <span class="xp__company">${job.company}</span>
    <span class="xp__role">${job.role}${job.note ? html`<span class="xp__note">${job.note}</span>` : ''}</span>
    <span class="xp__arrow" aria-hidden="true">${job.url ? '↗' : ''}</span>`;
  return html`<li class="xp__item">${
    job.url
      ? Link({ href: job.url, className: 'xp__row', invert: true, children: cells })
      : html`<div class="xp__row">${cells}</div>`
  }</li>`;
};

/**
 * Jobs as full-width rows, newest first.
 *
 * @param {{ id?: string, title?: string, items: object[] }} props
 */
export const ExperienceList = ({ id = 'experience', title = 'Experience', items }) =>
  Section({
    id,
    title,
    children: html`
      <div class="xp__head" aria-hidden="true">${COLUMNS.map((c) => html`<span>${c}</span>`)}<span></span></div>
      <ol class="xp" role="list">
        ${sortExperience(items).map(ExperienceRow)}
      </ol>`,
  });
