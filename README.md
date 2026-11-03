# davidalindahl.com (v4)

Personal site of David A. Lindahl: a single page with a retro green-phosphor look and an
interactive ASCII computer in the hero.

- **Content** lives in JSON (`content/site.json`, `content/experience.json`), validated
  against JSON Schemas in `content/schema/`. Editors with JSON Schema support get
  autocomplete and inline errors via the `$schema` key.
- **Build** is a ~100-line Node script with zero dependencies. It renders static HTML into
  `dist/`, plus `llms.txt`, `sitemap.xml` and `robots.txt`.
- **Hero**: a 3D model drawn in text. Each character cell is raymarched against a signed
  distance field, shaded, and mapped to ASCII. The pointer tilts the machine and drags a
  lens that magnifies, ripples and glitches the characters. Click to change the words on
  its screen.
- **Agent-friendly**: see [`AGENTS.md`](./AGENTS.md) for the map of the repo and its rules.

## Develop

Requires Node 20+. Nothing to install.

```bash
npm run dev
```

Then open http://localhost:8787. The page rebuilds on every reload.

```bash
npm run build
```

## Deploy to Cloudflare

`wrangler.jsonc` configures a static-assets-only Worker that serves `dist/`.

**From your machine:**

```bash
npm run deploy
```

This runs `npx wrangler deploy`, which asks you to log in to Cloudflare the first time.

**From Git (Workers Builds):** connect the repo in the Cloudflare dashboard and set:

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`

Cloudflare Pages also works if you prefer it: build command `npm run build`, output
directory `dist`. `public/_headers` (security headers and CSP) is honoured by both.

## Fonts

The design uses **MD Thermochrome** (Mass-Driver), a commercial typeface. It is not
committed to this public repo. See [`public/fonts/README.md`](./public/fonts/README.md).
Until it's added, the site uses IBM Plex Mono.
