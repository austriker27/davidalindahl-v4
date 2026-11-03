# AGENTS.md

Guide for AI agents (and humans) working on this repo. It's a single static page with
no runtime dependencies and no npm packages.

## This repository is PUBLIC

Never commit:
- secrets, API keys, tokens, `.env` files, Cloudflare account IDs
- personal data beyond what is already public on the site: no home address, phone
  number, personal email, family details, client or financial details
- licensed font files (`public/fonts/*.woff2` etc. are git-ignored on purpose)

If a change seems to need one of these, stop and ask the owner.

## Where things live

| Want to change…                         | Edit                                  |
| --------------------------------------- | ------------------------------------- |
| Name, tagline, intro copy, social links | `content/site.json`                   |
| Jobs / companies                        | `content/experience.json`             |
| Words on the ASCII computer's screen    | `content/site.json` → `hero.screenMessages` |
| Colours, spacing, type                  | `src/styles.css` (tokens at the top)  |
| Page markup                             | `src/template.mjs`                    |
| ASCII computer (model, shading, lens)   | `src/ascii-computer.js`               |
| Security headers                        | `public/_headers`                     |
| Build                                   | `scripts/build.mjs`                   |

Content rules (enforced by `content/schema/*.schema.json` at build time):
- Intro paragraphs are plain text plus inline links only: `[text](https://...)`.
- Experience dates are `YYYY` or `YYYY-MM`; `"end": null` means "now". Order in the file
  does not matter; the page sorts newest first.
- Screen messages are 6 characters max and use A–Z, 0–9 and `> _ ! ? . - : ( )`.
  Other characters render as `?`.
- Unknown fields fail the build. Add a field to the schema before using it.

## Commands

```bash
npm run check    # validate content only
npm run build    # validate + render into dist/
npm run dev      # http://localhost:8787, rebuilds on every page load
npm run deploy   # build + wrangler deploy (needs Cloudflare login)
```

There is nothing to install: Node 20+ is enough.

## Verifying a change

1. `npm run build` must pass.
2. For visual changes, load the page at 1280px and 390px wide and check there's no
   horizontal scroll. Chromium + Playwright work well for screenshots.
3. The ASCII canvas should hold ~45fps; it pauses when off-screen or the tab is hidden.
   Respect `prefers-reduced-motion` (no idle animation, no boot noise, no ripple).

## Conventions

- No inline `<style>` or `style=""` and no inline scripts other than JSON-LD: the CSP in
  `public/_headers` blocks them.
- External scripts are not allowed. External styles/fonts only from Google Fonts.
- Keep the build dependency-free unless there's a strong reason.
- The computer in the hero is a generic late-80s all-in-one. Don't add a real brand's
  logo or trademarks to it.
