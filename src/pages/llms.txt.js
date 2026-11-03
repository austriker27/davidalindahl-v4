// Plain-markdown summary of the site for LLMs and agents: /llms.txt
import { site, experience } from '../lib/content.mjs';
import { formatRange, sortExperience } from '../lib/format.mjs';

export function GET() {
  const jobs = sortExperience(experience)
    .map((j) => `- ${formatRange(j)}: ${j.role} at ${j.company}${j.url ? ` (${j.url})` : ''}`)
    .join('\n');
  const links = site.links.map((l) => `- [${l.label}](${l.url})`).join('\n');
  const body = `# ${site.name}\n\n> ${site.description}\n\n${site.intro.join('\n\n')}\n\n## Experience\n\n${jobs}\n\n## Links\n\n${links}\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
