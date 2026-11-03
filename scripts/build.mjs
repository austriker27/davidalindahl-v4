#!/usr/bin/env node
// Build: validate content/*.json, render src/template.mjs, copy static files into dist/.
// Usage: node scripts/build.mjs [--check]   (--check validates only, writes nothing)

import { readFile, writeFile, mkdir, rm, cp, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validate } from './validate.mjs';
import { renderPage, renderLlmsTxt } from '../src/template.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const checkOnly = process.argv.includes('--check');

const readJson = async (rel) => {
  const file = join(root, rel);
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch (err) {
    throw new Error(`${rel}: ${err.message}`);
  }
};

async function loadContent() {
  const files = [
    ['content/site.json', 'content/schema/site.schema.json'],
    ['content/experience.json', 'content/schema/experience.schema.json'],
  ];
  const errors = [];
  const data = {};
  for (const [file, schemaFile] of files) {
    const [json, schema] = await Promise.all([readJson(file), readJson(schemaFile)]);
    errors.push(...validate(schema, json).map((e) => `${file} ${e}`));
    data[file] = json;
  }
  if (errors.length) {
    console.error('Content validation failed:\n  ' + errors.join('\n  '));
    process.exit(1);
  }
  return {
    site: data['content/site.json'],
    experience: data['content/experience.json'].experience,
  };
}

// Licensed fonts are NOT committed (see public/fonts/README.md). If font files are present
// locally, emit @font-face rules for them; otherwise the site falls back to IBM Plex Mono.
function fontFaceFor(file) {
  const name = file.toLowerCase();
  const weight = /bold|bd/.test(name) && !/semi|smb/.test(name) ? 700
    : /semi|smb/.test(name) ? 600
    : /medium|med/.test(name) ? 500
    : 400;
  const style = /italic/.test(name) ? 'italic' : 'normal';
  const format = name.endsWith('.woff2') ? 'woff2' : 'woff';
  return `@font-face {
  font-family: "MD Thermochrome";
  src: url("/fonts/${file}") format("${format}");
  font-weight: ${weight};
  font-style: ${style};
  font-display: swap;
}`;
}

async function findFonts() {
  const dir = join(root, 'public/fonts');
  if (!existsSync(dir)) return [];
  return (await readdir(dir)).filter((f) => /thermochrome.*\.woff2?$/i.test(f)).sort();
}

const content = await loadContent();
console.log(`✓ content valid (${content.experience.length} experience entries)`);
if (checkOnly) process.exit(0);

const fonts = await findFonts();
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(join(root, 'public'), dist, {
  recursive: true,
  filter: (src) => !src.endsWith('README.md') && !src.endsWith('.gitkeep'),
});
for (const f of ['styles.css', 'main.js', 'ascii-computer.js']) {
  await cp(join(root, 'src', f), join(dist, f));
}
if (fonts.length) await writeFile(join(dist, 'fonts.css'), fonts.map(fontFaceFor).join('\n\n') + '\n');

const year = new Date().getFullYear();
await writeFile(join(dist, 'index.html'), renderPage({ ...content, fonts, year }));
await writeFile(join(dist, 'llms.txt'), renderLlmsTxt(content));
await writeFile(
  join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${content.site.url}/</loc></url></urlset>\n`
);
await writeFile(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${content.site.url}/sitemap.xml\n`);

console.log(`✓ built dist/ ${fonts.length ? `(with ${fonts.length} MD Thermochrome file(s))` : '(fallback font: IBM Plex Mono)'}`);
