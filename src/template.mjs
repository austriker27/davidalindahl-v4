// Renders the single page from content/*.json. Pure function: data in, HTML out.

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const isExternal = (url) => /^https?:\/\//.test(url);

const linkAttrs = (url) =>
  isExternal(url) ? ` href="${esc(url)}" target="_blank" rel="noopener noreferrer"` : ` href="${esc(url)}"`;

// Inline markdown: only [text](https://... | mailto:...) links. Everything else is escaped text.
export const inlineMarkdown = (text) => {
  const out = [];
  const re = /\[([^\]]+)\]\(((?:https:\/\/|mailto:)[^)\s]+)\)/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    out.push(esc(text.slice(last, m.index)));
    out.push(`<a${linkAttrs(m[2])}>${esc(m[1])}</a>`);
    last = m.index + m[0].length;
  }
  out.push(esc(text.slice(last)));
  return out.join('');
};

const year = (d) => (d ? d.slice(0, 4) : null);

export const formatRange = ({ start, end }) => {
  const s = year(start);
  const e = end ? year(end) : 'now';
  return s === e ? s : `${s}–${e}`;
};

// Newest first. Ongoing roles sort above finished ones that started the same month.
export const sortExperience = (items) =>
  [...items].sort((a, b) => b.start.localeCompare(a.start) || (a.end === null ? -1 : b.end === null ? 1 : 0));

// Generic all-in-one computer drawn in text, used when JavaScript is off.
const FALLBACK_ASCII = String.raw`
     .-------------------------.
     |  .-------------------.  |
     |  |                   |  |
     |  |   > HELLO_        |  |
     |  |                   |  |
     |  |                   |  |
     |  '-------------------'  |
     |                         |
     |              ======     |
     |                         |
     '-------------------------'
       '---------------------'
`;

export function renderPage({ site, experience, fonts = [], year: thisYear }) {
  const rows = sortExperience(experience)
    .map((job) => {
      const inner = `
          <span class="row__years">${esc(formatRange(job))}</span>
          <span class="row__company">${esc(job.company)}</span>
          <span class="row__role">${esc(job.role)}${job.note ? `<span class="row__note">${esc(job.note)}</span>` : ''}</span>
          <span class="row__arrow" aria-hidden="true">${job.url ? '↗' : ''}</span>`;
      return job.url
        ? `<li class="row"><a class="row__link"${linkAttrs(job.url)}>${inner}</a></li>`
        : `<li class="row"><div class="row__link">${inner}</div></li>`;
    })
    .join('\n');

  const links = site.links
    .map((l) => `<li><a class="elsewhere__link"${linkAttrs(l.url)}><span>${esc(l.label)}</span><span aria-hidden="true">↗</span></a></li>`)
    .join('\n');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: site.name,
    url: site.url,
    description: site.description,
    sameAs: site.links.filter((l) => isExternal(l.url)).map((l) => l.url),
  };

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(site.title)}</title>
  <meta name="description" content="${esc(site.description)}">
  <link rel="canonical" href="${esc(site.url)}/">
  <meta name="theme-color" content="#0c100d">
  <meta name="color-scheme" content="dark">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(site.title)}">
  <meta property="og:description" content="${esc(site.description)}">
  <meta property="og:url" content="${esc(site.url)}/">
  <meta name="twitter:card" content="summary">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap">
  ${fonts.length ? '<link rel="stylesheet" href="/fonts.css">' : ''}
  <link rel="stylesheet" href="/styles.css">
  <link rel="alternate" type="text/plain" href="/llms.txt" title="Plain-text summary for LLMs">
  <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>

  <header class="menubar">
    <a class="menubar__brand" href="#top" aria-label="Back to top">
      <span class="menubar__glyph" aria-hidden="true">▚</span> ${esc(site.name)}
    </a>
    <nav class="menubar__nav" aria-label="Sections">
      <a href="#about">About</a>
      <a href="#experience">Experience</a>
      <a href="#elsewhere">Elsewhere</a>
    </nav>
    <time class="menubar__clock" data-clock aria-hidden="true"></time>
  </header>

  <main id="main">
    <section class="hero" id="top" aria-label="Interactive ASCII computer">
      <div class="window">
        <div class="window__title" aria-hidden="true">
          <span class="window__box"></span>
          <span class="window__name">machine.txt</span>
        </div>
        <div class="window__body">
          <canvas class="hero__canvas" data-ascii
            data-messages="${esc(JSON.stringify(site.hero.screenMessages))}"
            role="img"
            aria-label="An ASCII-art drawing of a late-1980s all-in-one computer that tilts and glitches as you move your pointer."></canvas>
          <noscript><pre class="hero__fallback" aria-hidden="true">${esc(FALLBACK_ASCII)}</pre></noscript>
        </div>
      </div>
      ${site.hero.hint ? `<p class="hero__hint">${esc(site.hero.hint)}</p>` : ''}
    </section>

    <section class="section intro" id="about" aria-labelledby="about-title">
      <h1 class="intro__name" id="about-title">${esc(site.name)}</h1>
      <p class="intro__tagline">${esc(site.tagline)}</p>
      <div class="intro__body">
        ${site.intro.map((p) => `<p>${inlineMarkdown(p)}</p>`).join('\n        ')}
      </div>
    </section>

    <section class="section" id="experience" aria-labelledby="experience-title">
      <h2 class="section__title" id="experience-title"><span aria-hidden="true">// </span>Experience</h2>
      <div class="rows__head" aria-hidden="true">
        <span>Years</span><span>Company</span><span>Role</span><span></span>
      </div>
      <ol class="rows">
${rows}
      </ol>
    </section>

    <section class="section" id="elsewhere" aria-labelledby="elsewhere-title">
      <h2 class="section__title" id="elsewhere-title"><span aria-hidden="true">// </span>Elsewhere</h2>
      <ul class="elsewhere">
${links}
      </ul>
    </section>
  </main>

  <footer class="footer">
    <span>&copy; ${esc(thisYear)} ${esc(site.name)}</span>
    ${site.footer ? `<span>${esc(site.footer)}</span>` : ''}
    <span class="footer__cursor" aria-hidden="true">_</span>
  </footer>

  <script type="module" src="/main.js"></script>
</body>
</html>
`;
}

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
