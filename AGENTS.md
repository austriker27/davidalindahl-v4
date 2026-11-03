# AGENTS.md

Guide for AI agents (and humans) working on this repo: a one-page static portfolio built
with **Astro 7**, **Vue 3** components and **Tailwind CSS 4**, deployed to **Cloudflare
Workers**. Node 22.23.4+ (see `.nvmrc`); dependencies are pinned exactly in
`package.json` with a committed lockfile.

## This repository is PUBLIC

Never commit:
- secrets, API keys, tokens, `.env` files, Cloudflare account IDs or account emails
- personal data beyond what is already public on the site: no home address, phone
  number, personal email, family details, client or financial details
- licensed font files (`src/fonts/licensed/` is git-ignored on purpose)

If a change seems to need one of these, stop and ask the owner.

## Where things live

| Want to change…                         | Edit                                            |
| --------------------------------------- | ----------------------------------------------- |
| Name, tagline, intro copy, social links | `content/site.json`                             |
| Jobs / companies                        | `content/experience.json`                       |
| Words on the ASCII computer's screen    | `content/site.json` → `hero.screenMessages`     |
| Colours, fonts, type scale, breakpoints | `@theme` in `src/styles/global.css`             |
| A component's markup or classes         | `src/components/**/*.vue`                       |
| Which sections the page has, and nav    | `src/pages/index.astro`                         |
| `<head>`, menu bar, footer              | `src/layouts/BaseLayout.astro`                  |
| ASCII computer model / shading / lens   | `src/client/ascii-renderer.js`                  |
| ASCII computer events, worker fallback  | `src/client/ascii-host.js`                      |
| CSP directives                          | `security.csp` in `astro.config.mjs`            |
| Other security & cache headers          | `public/_headers`                               |
| Cloudflare Worker config                | `wrangler.jsonc`                                |
| CI / CD workflows                       | `.github/workflows/` (see `docs/deployment.md`) |

```
content/                 JSON content + JSON Schemas (validated on every build)
src/pages/               index.astro, 404.astro, llms.txt.js, robots.txt.js, sitemap.xml.js
src/layouts/             BaseLayout.astro: document shell
src/components/ui/       primitives: AppLink, PageSection, RetroWindow, RichText
src/components/          sections: MenuBar, IntroSection, ExperienceList, LinkGrid, SiteFooter
src/components/islands/  interactive (hydrated) Vue: AsciiComputer, LiveClock
src/client/              framework-free renderer + Web Worker for the ASCII computer
src/lib/                 content loading/validation, formatting helpers
src/styles/global.css    Tailwind import, design tokens (@theme), base styles, custom utilities
src/fonts/               IBM Plex Mono (OFL, committed); licensed/ (git-ignored)
public/                  copied as-is (favicon, _headers)
test/                    node:test unit tests + checks on the built dist/
```

## Components

- **UI is Vue single-file components.** Astro renders them to static HTML at build time.
  A component only ships JavaScript when a page uses it with a `client:*` directive.
  Only `src/components/islands/` should be hydrated, so keep interactivity there.
- **Pages and layouts are `.astro`.** `client:*` directives only work in `.astro` files,
  so islands are placed from pages/layouts, never from inside another Vue component.
  Static Vue components can receive islands through slots (see `MenuBar` + `LiveClock`).
- **Every top-level block is a `PageSection`.** It owns spacing, the heading level, ids
  and `aria-labelledby`. Don't hand-roll `<section>` or `<h2>`.
- **Every link is an `AppLink`.** Pass `invert` for the shared hover/focus "selected"
  treatment. Links open in the same tab; external ones get `rel="noopener"`.
- **Never use `v-html` or `set:html` with content.** Inline links in copy go through
  `RichText`, which renders segments from `parseInlineLinks()`.
- Props are declared with `defineProps` and a short comment at the top of the file.

To add a section: create `src/components/Thing.vue` wrapping `PageSection`, render it in
`src/pages/index.astro`, and add a nav entry there.

## Styling (Tailwind)

- Use utilities generated from the tokens in `@theme`: `text-fg-muted`, `bg-bg`,
  `border-border`, `text-sm`, `max-w-page`, `shadow-window`, …
  Tailwind's default palette, fonts and type scale are reset, so `text-red-500` or
  `text-lg` don't exist. That's deliberate: add a token instead of a one-off value.
- Spacing uses Tailwind's default 4px scale (`p-4` = 16px). The page gutter is
  `px-(--gutter)`.
- Shared patterns are custom utilities in `global.css`: `invertible`, `focus-inset`,
  `window-stripes`, `blink`. Prefer adding one there over repeating long class lists.
- Breakpoints: `sm` = 40rem, `md` = 45rem (mobile-first; use `max-sm:` for small-only).
- Text colours must keep WCAG AA contrast on `--color-bg` (≥ 4.5:1). `--color-line` is
  decorative only; use `--color-border` (≥ 3:1) for control boundaries.
- No `style=""` attributes and no inline event handlers: the hashed CSP can't allow
  them, and `test/build.test.mjs` fails on them.

## Content rules

Enforced by `content/schema/*.schema.json` on every build (and `npm run check`):
- Intro paragraphs are plain text plus inline links only: `[text](https://...)`.
- Experience dates are `YYYY` or `YYYY-MM`; `"end": null` means "now". Order in the file
  doesn't matter; the page sorts newest first.
- Screen messages are 6 characters max and use A–Z, 0–9 and `> _ ! ? . - : ( )`.
  Other characters render as `?`.
- Unknown fields fail the build. Add a field to the schema before using it.

## Commands

```bash
npm ci           # install exactly what's in the lockfile
npm run dev      # Astro dev server with hot reload (no CSP in dev)
npm run preview  # production build served by `wrangler dev`, with _headers + CSP
npm run check    # validate content only
npm test         # astro build, then unit tests + checks on dist/
npm run deploy   # build + wrangler deploy (needs Cloudflare login)
```

Deploys normally happen in CI: push to `main` → production; push to another branch → a
Preview URL; delete the branch → the preview is removed. Keep `"previews": {}` in
`wrangler.jsonc` (`wrangler preview` requires it).

## Verifying a change

1. `npm test` passes (CI runs `npm run check` and `npm test` on every PR).
2. For visual or interactive changes, use `npm run preview` and check 1280px and 390px
   wide: no horizontal scroll, no console errors, no CSP violations.
3. Keep the ASCII renderer off the main thread. It runs in a Worker via OffscreenCanvas,
   with an inline fallback. Respect `prefers-reduced-motion`.

## Conventions

- No third-party requests (scripts, styles or fonts). Everything is self-hosted.
- Pin new dependencies to exact versions (`npm i --save-exact`).
- The computer in the hero is a generic late-80s all-in-one. Don't add a real brand's
  logo or trademarks to it.
