import { formatRange, sortExperience } from './format.mjs';

/** Plain-markdown summary of the site for LLMs and agents (served at /llms.txt). */
export function renderLlmsTxt({ site, experience }) {
  const jobs = sortExperience(experience)
    .map((j) => `- ${formatRange(j)}: ${j.role} at ${j.company}${j.url ? ` (${j.url})` : ''}`)
    .join('\n');
  const links = site.links.map((l) => `- [${l.label}](${l.url})`).join('\n');
  return `# ${site.name}

> ${site.description}

${site.intro.join('\n\n')}

## Experience

${jobs}

## Links

${links}
`;
}
