# Fonts

## IBM Plex Mono (committed)

`ibm-plex-mono/` holds the Latin subset of IBM Plex Mono in weights 400, 500 and 600,
taken from the `@fontsource/ibm-plex-mono` package. It is licensed under the SIL Open Font
License 1.1 (see `ibm-plex-mono/OFL.txt`), so it can live in this public repo. It's the
fallback UI font and the font the ASCII computer is drawn with.

## MD Thermochrome (not committed)

The design calls for **MD Thermochrome** (Mass-Driver). It is a commercial typeface, so
font files are **never committed**: everything in `licensed/` except `.gitkeep` is
git-ignored.

To use it:

1. Buy a web license from the foundry and check what it permits for self-hosting.
2. Put the `.woff2` files in `licensed/` with "thermochrome" in the name, for example
   `MDThermochrome-Regular.woff2`, `MDThermochrome-Medium.woff2`, `MDThermochrome-Bold.woff2`.
3. Run `npm run build` (or `npm run dev`). `astro.config.mjs` writes
   `licensed/fonts.generated.css` with `@font-face` rules for them, `global.css` imports it,
   and Vite hashes the files into `dist/_astro/`. Weight comes from the filename:
   Semibold 600, Bold 700, Medium 500, everything else 400.

Because the files aren't in git, a Cloudflare build that runs from the repository won't
have them. Deploy from a machine that has them (`npm run deploy`), or fetch them from
private storage in the build step.
