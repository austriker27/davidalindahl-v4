# AGENTS.md

Guide for AI agents (and humans) working on this repo: a single static page built from
JSON content by a small, dependency-free Node build. Node 22 (see `.nvmrc`), no npm
packages.

## This repository is PUBLIC

Never commit:
- secrets, API keys, tokens, `.env` files, Cloudflare account IDs
- personal data beyond what is already public on the site: no home address, phone
  number, personal email, family details, client or financial details
- licensed font files (`src/fonts/licensed/` is git-ignored on purpose)

If a change seems to need one of these, stop and ask the owner.

## Where things live

| Want to change…                         | Edit                                          |
| --------------------------------------- | --------------------------------------------- |
| Name, tagline, intro copy, social links | `content/site.json`                           |
| Jobs / companies                        | `content/experience.json`                     |
| Words on the ASCII computer's screen    | `content/site.json` → `hero.screenMessages`   |
| Colours, type, spacing, motion          | `src/styles/tokens.css`                       |
| A component's look                      | `src/styles/components/<component>.css`       |
| A component's markup                    | `src/components/<Component>.mjs`              |
| Which sections a page has, and nav      | `src/pages/home.mjs`                          |
| ASCII computer model / shading / lens   | `src/client/ascii-renderer.js`                |
| ASCII computer events, worker fallback  | `src/client/ascii-computer.js`                |
| Security & cache headers                | `public/_headers`                             |
| Build pipeline                          | `scripts/build.mjs`                           |

```
content/            JSON content + JSON Schemas (validated on every build)
src/lib/            html`` templating (auto-escaping), formatting, llms.txt
src/components/     Layout, MenuBar, Section, Window, Link, Hero, Intro, ExperienceList, LinkGrid, Footer
src/pages/          home.mjs, not-found.mjs: compose components into pages
src/styles/         tokens.css → base.css → utilities.css → components/*.css → print.css
src/client/         browser JS: main.js → ascii-computer.js → (worker) ascii-renderer.js
src/fonts/          IBM Plex Mono (OFL, committed); licensed/ (git-ignored)
public/             copied as-is (favicon, _headers)
scripts/            build, dev server, schema validator
test/               node:test unit + build tests
```

## Components

Components are plain functions in `src/components/` that take a props object and return
`html\`\`` (from `src/lib/html.mjs`). Rules:

- **Use `html\`\``** for all markup. It escapes every interpolation. Use `attrs({...})` for
  optional attributes and `cx()` for class lists. `raw()` is only for trusted build-time
  strings.
- **Every top-level block is a `Section`.** It owns spacing, the heading level, ids and
  `aria-labelledby`. Don't hand-roll `<section>` or `<h2>`.
- **Every link is a `Link`.** Pass `invert: true` for the shared hover/focus "selected"
  treatment. Links open in the same tab; external ones get `rel="noopener"`.
- One component = one `.mjs` file + (if it has styles) one `.css` file in
  `src/styles/components/`, named after the component's BEM block (`.xp`, `.window`, …).
- Document props with a JSDoc `@param` block at the top of the component.

To add a section: write `src/components/Thing.mjs` (wrapping `Section`), add
`src/styles/components/thing.css` if needed (picked up automatically), then add it and a
nav entry in `src/pages/home.mjs`.

## Styles

- Use **tokens only**: `var(--space-4)`, `var(--text-sm)`, `var(--color-text-muted)`, …
  No raw colours, font sizes or spacing in component CSS. Add a token if one is missing.
- Text colours must keep WCAG AA contrast on `--color-bg` (≥ 4.5:1). `--color-line` is
  decorative only; use `--color-border` (≥ 3:1) for control boundaries.
- Breakpoints: `40rem` and `45rem` (documented at the top of `tokens.css`).
- Units: `rem` for type and spacing so the page respects the visitor's font size.

## Content rules

Enforced by `content/schema/*.schema.json` at build time:
- Intro paragraphs are plain text plus inline links only: `[text](https://...)`.
- Experience dates are `YYYY` or `YYYY-MM`; `"end": null` means "now". Order in the file
  doesn't matter; the page sorts newest first.
- Screen messages are 6 characters max and use A–Z, 0–9 and `> _ ! ? . - : ( )`.
  Other characters render as `?`.
- Unknown fields fail the build. Add a field to the schema before using it.

## Commands

```bash
npm run dev      # http://localhost:8787: rebuilds per page load, applies _headers (CSP)
npm test         # unit tests + a full build into a temp dir
npm run build    # validate + render into dist/
npm run check    # validate content only
npm run deploy   # build + wrangler deploy (needs Cloudflare login)
```

## Verifying a change

1. `npm test` and `npm run build` pass (CI runs both on every PR).
2. For visual changes, check 1280px and 390px wide: no horizontal scroll, no console
   errors, no CSP violations (the dev server enforces the production CSP).
3. Keep the ASCII renderer off the main thread. It runs in a Worker via OffscreenCanvas,
   with an inline fallback. Respect `prefers-reduced-motion`.

## Conventions

- No inline `<style>`, `style=""`, `on*=` handlers or inline scripts other than JSON-LD:
  the CSP blocks them, and `test/build.test.mjs` checks for them.
- No third-party requests (scripts, styles or fonts). Everything is self-hosted.
- Keep the build dependency-free unless there's a strong reason.
- The computer in the hero is a generic late-80s all-in-one. Don't add a real brand's
  logo or trademarks to it.
