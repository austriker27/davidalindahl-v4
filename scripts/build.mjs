#!/usr/bin/env node
// Build: validate content/*.json → bundle + hash assets → render pages into dist/.
//
//   node scripts/build.mjs           build into dist/
//   node scripts/build.mjs --check   validate content only
//
// Assets are content-hashed (styles.3f2a9c1e.css) and served from /assets/ with
// immutable caching (see public/_headers). Pages are plain HTML from src/pages/.

import { readFile, writeFile, mkdir, rm, cp, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname, basename, extname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validate } from './validate.mjs';
import { render } from '../src/lib/html.mjs';
import { renderLlmsTxt } from '../src/lib/llms.mjs';
import { HomePage } from '../src/pages/home.mjs';
import { NotFoundPage } from '../src/pages/not-found.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = (...p) => join(root, 'src', ...p);

// ---- Content -----------------------------------------------------------------

const readJson = async (rel) => {
  try {
    return JSON.parse(await readFile(join(root, rel), 'utf8'));
  } catch (err) {
    throw new Error(`${rel}: ${err.message}`);
  }
};

export async function loadContent() {
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
  if (errors.length) throw new Error('Content validation failed:\n  ' + errors.join('\n  '));
  return { site: data['content/site.json'], experience: data['content/experience.json'].experience };
}

// ---- Assets ------------------------------------------------------------------

const hashOf = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 10);
const hashedName = (file, buf) => `${basename(file, extname(file))}.${hashOf(buf)}${extname(file)}`;

// Fonts. IBM Plex Mono (OFL) is committed. MD Thermochrome is licensed and git-ignored:
// if its files exist in src/fonts/licensed/, they are included automatically.
const PLEX = [
  { file: 'ibm-plex-mono-latin-400-normal.woff2', weight: 400, preload: true },
  { file: 'ibm-plex-mono-latin-500-normal.woff2', weight: 500, preload: false, ascii: true },
  { file: 'ibm-plex-mono-latin-600-normal.woff2', weight: 600, preload: false },
];

const weightFromName = (name) => {
  const n = name.toLowerCase();
  if (/semi|smb/.test(n)) return 600;
  if (/bold|bd/.test(n)) return 700;
  if (/medium|med/.test(n)) return 500;
  return 400;
};

async function buildFonts(out) {
  const faces = PLEX.map((f) => ({ ...f, family: 'IBM Plex Mono', path: src('fonts/ibm-plex-mono', f.file) }));
  const licensedDir = src('fonts/licensed');
  if (existsSync(licensedDir)) {
    for (const file of (await readdir(licensedDir)).filter((f) => /thermochrome.*\.woff2?$/i.test(f)).sort()) {
      faces.push({
        family: 'MD Thermochrome',
        file,
        path: join(licensedDir, file),
        weight: weightFromName(file),
        style: /italic/i.test(file) ? 'italic' : 'normal',
      });
    }
  }

  await mkdir(join(out, 'assets/fonts'), { recursive: true });
  const css = [];
  const preload = [];
  let asciiFont;
  for (const face of faces) {
    const buf = await readFile(face.path);
    const url = `/assets/fonts/${hashedName(face.file, buf)}`;
    await writeFile(join(out, url), buf);
    css.push(
      `@font-face{font-family:"${face.family}";src:url("${url}") format("${face.file.endsWith('2') ? 'woff2' : 'woff'}");` +
        `font-weight:${face.weight};font-style:${face.style ?? 'normal'};font-display:swap}`
    );
    if (face.preload) preload.push(url);
    if (face.ascii) asciiFont = url;
  }
  return { css: css.join('\n'), preload, asciiFont, licensed: faces.filter((f) => f.family !== 'IBM Plex Mono').length };
}

// Order matters: tokens → base → utilities → components (alphabetical) → print.
async function buildStyles(out, fontCss) {
  const components = (await readdir(src('styles/components'))).filter((f) => f.endsWith('.css')).sort();
  const files = ['tokens.css', 'base.css', 'utilities.css', ...components.map((f) => `components/${f}`), 'print.css'];
  const parts = await Promise.all(files.map((f) => readFile(src('styles', f), 'utf8')));
  const tokens = parts[0];
  const css = [fontCss, ...parts]
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '') // comments
    .replace(/\n\s*\n+/g, '\n') // blank lines
    .replace(/^\s+/gm, ''); // indentation
  const name = hashedName('styles.css', css);
  await writeFile(join(out, 'assets', name), css);
  const bg = tokens.match(/--color-bg:\s*(#[0-9a-f]{3,8})/i)?.[1] ?? '#000000';
  return { href: `/assets/${name}`, theme: { bg } };
}

// JS: hash each module after its dependencies, rewriting relative specifiers
// ('./x.js' in imports, dynamic imports and new URL(..., import.meta.url)) to hashed names.
async function buildScripts(out, entry) {
  const done = new Map(); // source file → hashed name
  const SPEC = /(['"])(\.\/[\w-]+\.js)\1/g;

  async function emit(file) {
    if (done.has(file)) return done.get(file);
    let code = await readFile(file, 'utf8');
    for (const [, , spec] of code.matchAll(SPEC)) await emit(join(dirname(file), spec));
    code = code.replace(SPEC, (m, q, spec) => `${q}./${done.get(join(dirname(file), spec))}${q}`);
    const name = hashedName(file, code);
    await writeFile(join(out, 'assets', name), code);
    done.set(file, name);
    return name;
  }

  const main = await emit(entry);
  // Preload only modules the page itself imports. A worker's own fetches have a different
  // request destination, so preloading ascii-worker.js / ascii-renderer.js would double-fetch.
  return { entry: `/assets/${main}`, modulePreloads: [`/assets/${done.get(src('client/ascii-computer.js'))}`] };
}

// ---- Build -------------------------------------------------------------------

export async function build({ outDir = join(root, 'dist'), log = console.log } = {}) {
  const content = await loadContent();
  await rm(outDir, { recursive: true, force: true });
  await mkdir(join(outDir, 'assets'), { recursive: true });

  await cp(join(root, 'public'), outDir, { recursive: true });
  const fonts = await buildFonts(outDir);
  const styles = await buildStyles(outDir, fonts.css);
  const scripts = await buildScripts(outDir, src('client/main.js'));

  const ctx = {
    ...content,
    year: new Date().getFullYear(),
    theme: styles.theme,
    assets: {
      styles: styles.href,
      script: scripts.entry,
      preloadFonts: fonts.preload,
      modulePreloads: scripts.modulePreloads,
      asciiFont: fonts.asciiFont,
    },
  };

  const { site } = content;
  await writeFile(join(outDir, 'index.html'), render(HomePage(ctx)));
  await writeFile(join(outDir, '404.html'), render(NotFoundPage(ctx)));
  await writeFile(join(outDir, 'llms.txt'), renderLlmsTxt(content));
  await writeFile(
    join(outDir, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${new URL('/', site.url).href}</loc></url></urlset>\n`
  );
  await writeFile(join(outDir, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap.xml', site.url).href}\n`);

  log(`✓ content valid (${content.experience.length} experience entries)`);
  log(`✓ built ${outDir.replace(root + '/', '')}/ ${fonts.licensed ? `with ${fonts.licensed} MD Thermochrome file(s)` : '(MD Thermochrome not present: using IBM Plex Mono)'}`);
  return ctx;
}

// ---- CLI ---------------------------------------------------------------------

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv.includes('--check')) {
      const { experience } = await loadContent();
      console.log(`✓ content valid (${experience.length} experience entries)`);
    } else {
      await build();
    }
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
