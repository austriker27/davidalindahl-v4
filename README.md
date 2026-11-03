# davidalindahl.com (v4)

Personal site of David A. Lindahl: a single page with a retro green-phosphor look and an
interactive ASCII computer in the hero.

- **Content** lives in JSON (`content/site.json`, `content/experience.json`), validated
  against JSON Schemas in `content/schema/`. Editors with JSON Schema support get
  autocomplete and inline errors via the `$schema` key.
- **Components**: plain JS functions returning auto-escaped `html\`\`` templates
  (`src/components/`), styled with per-component CSS on a shared token system
  (`src/styles/tokens.css`).
- **Build** is dependency-free Node. It renders static HTML into `dist/` with
  content-hashed, immutably cached assets, plus `llms.txt`, `sitemap.xml` and
  `robots.txt`.
- **Hero**: a 3D model drawn in text. Each character cell is raymarched against a signed
  distance field, shaded, and mapped to ASCII, in a Web Worker on an OffscreenCanvas so
  the page stays responsive. The pointer tilts the machine and drags a lens that
  magnifies, ripples and glitches the characters. Click, tap or press Enter to change
  the words on its screen.
- **Agent-friendly**: see [`AGENTS.md`](./AGENTS.md) for the repo map, component rules and
  what must never be committed.

## Develop

Requires Node 22 (`.nvmrc`). Nothing to install.

```bash
npm run dev
```

Then open http://localhost:8787. The page rebuilds on every reload, and the dev server
applies the production security headers from `public/_headers`.

```bash
npm test
```

## Deploy to Cloudflare

`wrangler.jsonc` configures a static-assets-only Worker that serves `dist/`, with
`404.html` for unknown paths.

**From your machine:**

```bash
npm run deploy
```

This runs `npx wrangler deploy`, which asks you to log in to Cloudflare the first time.

**From Git (Workers Builds):** connect the repo in the Cloudflare dashboard and set:

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`

Cloudflare Pages also works: build command `npm run build`, output directory `dist`.
`public/_headers` (CSP, HSTS, immutable caching for `/assets/*`) is honoured by both.

## Fonts

The design uses **MD Thermochrome** (Mass-Driver), a commercial typeface that is not
committed to this public repo. Until it's added, the site uses self-hosted IBM Plex Mono
(OFL). See [`src/fonts/README.md`](./src/fonts/README.md).
