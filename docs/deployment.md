# Deployment

The site deploys to **Cloudflare Workers** as a static-assets-only Worker named
`davidalindahl` (see `wrangler.jsonc`). GitHub Actions does it on every push
(`.github/workflows/deploy.yml`):

| Event | What happens | URL |
| --- | --- | --- |
| Push to `main` | Tests, build, `wrangler deploy` | Production: `davidalindahl.<subdomain>.workers.dev` (or your custom domain) |
| Push to any other branch | Tests, build, `wrangler preview --name <branch>` | A Preview URL, shown on the run, in the PR's deployments, and in the job summary |
| Branch deleted (e.g. after merging a PR) | `wrangler preview delete --name <branch>` | n/a |

Preview names are the branch name in lowercase with anything other than `a–z` and `0–9`
turned into dashes, capped at 40 characters (`.github/scripts/preview-name.sh`). For
example, `claude/sharp-goodall-np09kg` becomes `claude-sharp-goodall-np09kg`.

Until the two secrets below exist, the deploy jobs are skipped with a warning, so the
workflow never fails just because Cloudflare isn't set up yet.

## One-time setup

The account ID and API token are secrets: they go in GitHub's secret store, never in this
repository (it's public).

### 1. Cloudflare account

1. Sign in at <https://dash.cloudflare.com> with the account you want the site to live in.
2. Open **Workers & Pages**. If it asks you to choose a `workers.dev` subdomain, pick one.
   This is a one-time step per account, and deploys from CI can't do it for you.
3. Copy your **Account ID**. It's shown on the Workers & Pages overview and on the account
   home page.

### 2. API token

1. Go to **My Profile → API Tokens → Create Token**.
2. Use the **Edit Cloudflare Workers** template. If it's missing, create a custom token
   with at least **Account → Workers Scripts → Edit**.
3. Under **Account Resources**, select only your account. Under **Zone Resources**, select
   only the zone(s) you'll attach a custom domain to (or leave all zones if you haven't
   decided).
4. Create the token and copy it. Cloudflare shows it once.

### 3. GitHub secrets

In the repository: **Settings → Secrets and variables → Actions → New repository secret**.

| Name | Value |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | the token from step 2 |
| `CLOUDFLARE_ACCOUNT_ID` | the account ID from step 1 |

### 4. GitHub repository settings

- **Settings → General → Default branch:** set to `main`. Required because GitHub runs
  branch-deletion workflows from the default branch, so preview cleanup only works once
  `deploy.yml` is on the default branch.
- **Settings → General → Pull Requests:** turn on **Automatically delete head branches**,
  so merging a PR deletes its branch and therefore its preview.
- **Settings → Environments → production** (created by the first production deploy):
  under **Deployment branches and tags**, allow only `main`. Optionally add yourself as a
  required reviewer to approve each production deploy.

### 5. First deploy

Re-run the latest **Deploy** workflow (Actions tab → Deploy → Re-run jobs), or push a
commit. A branch push creates the Worker automatically if it doesn't exist yet. Merging to
`main` deploys production.

## Custom domain

Production is served on `workers.dev` until a domain is attached. To serve
`davidalindahl.com` from this Worker:

1. The domain's DNS must be managed by Cloudflare (add it as a zone in the same account).
2. Either attach it in the dashboard (**Workers & Pages → davidalindahl → Settings →
   Domains & Routes → Add → Custom domain**), or add it to `wrangler.jsonc` so it's
   versioned:

   ```jsonc
   "routes": [{ "pattern": "davidalindahl.com", "custom_domain": true }]
   ```

Moving the domain switches traffic away from wherever it's hosted today, so do it once
you're happy with production on `workers.dev`.

## Deploying by hand

```bash
npm run deploy
```

This builds and runs `wrangler deploy` with the same pinned Wrangler version as CI. It
needs `npx wrangler login` first, or `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in
your shell. Licensed MD Thermochrome fonts in `src/fonts/licensed/` are only included in
deploys made from a machine that has them (they're not in git, so CI never sees them).

## Things to know

- **Worker Previews are an open-beta Wrangler feature** (`wrangler preview`, Wrangler
  4.136.3 or newer; CI pins 4.157.0). `wrangler.jsonc` must keep its `"previews": {}`
  block, or `wrangler preview` refuses to run in CI.
- **Preview URLs are public**: anyone with the link can open them. Don't push anything to a
  branch that you wouldn't want seen.
- **Deleted previews may keep serving for a while.** Open Wrangler issues report deleted
  previews' URLs still responding (cloudflare/workers-sdk#15945, #16170, #16495). If one
  lingers, delete it in the dashboard.
- **Upgrading Wrangler:** change `WRANGLER_VERSION` in `deploy.yml` and the version in
  the `deploy` script in `package.json` together.
- **Rollback:** Cloudflare keeps previous versions. Use **Workers & Pages → davidalindahl →
  Deployments** in the dashboard, or `npx wrangler rollback`.
