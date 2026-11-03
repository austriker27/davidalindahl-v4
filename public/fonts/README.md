# Fonts

The design calls for **MD Thermochrome** (Mass-Driver). It is a commercial typeface, so
font files are **not committed** to this public repository: `*.woff`/`*.woff2` here are
git-ignored.

To use it:

1. Buy a web license from the foundry and check what it permits for self-hosting.
2. Drop the files in this folder with "thermochrome" in the name, for example
   `MDThermochrome-Regular.woff2`, `MDThermochrome-Medium.woff2`, `MDThermochrome-Bold.woff2`.
3. Run `npm run build`. The build detects them and writes `dist/fonts.css` with
   `@font-face` rules (weight is inferred from the filename: Bold 700, Semibold 600,
   Medium 500, everything else 400).

Without the files, the site falls back to IBM Plex Mono (Google Fonts, OFL licensed).

Because the files are not in git, a Cloudflare build that runs from the repository will not
have them. Either deploy from a machine that has them (`npm run deploy`), or host them
somewhere private and update `scripts/build.mjs` to point at that location.
