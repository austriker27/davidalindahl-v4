import { html, attrs, raw } from '../lib/html.mjs';
import { isExternal } from '../lib/format.mjs';
import { MenuBar } from './MenuBar.mjs';
import { Footer } from './Footer.mjs';

// JSON inside <script> must not be HTML-escaped; "<" is escaped so content can't close the tag.
const rawJson = (value) => raw(JSON.stringify(value).replace(/</g, '\\u003c'));

/**
 * Document shell shared by every page: <head> metadata, preloads, skip link, menu bar,
 * <main>, footer and scripts. Pages only supply their sections as `children`.
 *
 * @param {{
 *   site: object,                 // content/site.json
 *   assets: { styles: string, script?: string, preloadFonts: string[], modulePreloads: string[] },
 *   theme: { bg: string },        // read from tokens.css at build time
 *   year: number,
 *   path?: string,                // canonical path, e.g. "/"
 *   title?: string,               // defaults to site.title
 *   description?: string,
 *   nav?: { href: string, label: string }[],
 *   indexable?: boolean,
 *   children: any,
 * }} props
 */
export const Layout = ({ site, assets, theme, year, path = '/', title, description, nav = [], indexable = true, children }) => {
  const pageTitle = title ? `${title} | ${site.name}` : site.title;
  const desc = description ?? site.description;
  const canonical = new URL(path, site.url).href;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: site.name,
    url: new URL('/', site.url).href,
    description: site.description,
    sameAs: site.links.filter((l) => isExternal(l.url)).map((l) => l.url),
  };

  return html`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${pageTitle}</title>
  <meta name="description" content="${desc}">
  ${indexable ? html`<link rel="canonical" href="${canonical}">` : html`<meta name="robots" content="noindex">`}
  <meta name="theme-color" content="${theme.bg}">
  <meta name="color-scheme" content="dark">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${site.name}">
  <meta property="og:title" content="${pageTitle}">
  <meta property="og:description" content="${desc}">
  <meta property="og:url" content="${canonical}">
  <meta name="twitter:card" content="summary">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  ${assets.preloadFonts.map((href) => html`<link rel="preload" href="${href}" as="font" type="font/woff2" crossorigin>`)}
  <link rel="stylesheet" href="${assets.styles}">
  ${assets.modulePreloads.map((href) => html`<link rel="modulepreload" href="${href}">`)}
  <link rel="alternate" type="text/plain" href="/llms.txt" title="Plain-text summary for LLMs">
  <script type="application/ld+json">${rawJson(jsonLd)}</script>
  ${assets.script ? html`<script type="module"${attrs({ src: assets.script })}></script>` : ''}
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  ${MenuBar({ name: site.name, home: '/', nav })}
  <main id="main" class="page">
    ${children}
  </main>
  ${Footer({ name: site.name, text: site.footer, year })}
</body>
</html>
`;
};
