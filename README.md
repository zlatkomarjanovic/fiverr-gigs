# Zlatko Marjanović — Fiverr gigs

Public, crawlable index of live Fiverr services. Each page uses a clean gig URL (no tracking parameters) and a single search lane so the gigs do not compete with each other.

- Live hub: https://zlatkomarjanovic.github.io/fiverr-gigs/
- Seller profile: https://www.fiverr.com/zlatkomarjanovi
- Source of truth: [`data/gigs.json`](data/gigs.json)
- Pages, sitemap, RSS, robots, and `llms.txt` are generated. Do not hand-edit `index.html` or `services/*.html`.

## Local setup

Needs Node 20+. No `npm install` — the scripts use only the Node standard library.

```bash
git clone https://github.com/zlatkomarjanovic/fiverr-gigs.git
cd fiverr-gigs
```

Set the public origin before generating so canonicals, sitemap, RSS, and IndexNow stay on the real host:

```bash
# PowerShell
$env:SITE_ORIGIN="https://zlatkomarjanovic.github.io/fiverr-gigs"

# bash
export SITE_ORIGIN="https://zlatkomarjanovic.github.io/fiverr-gigs"
```

```bash
npm run validate
npm run generate
```

`generate` reads `data/gigs.json` and writes:

- `index.html`, `services/*.html`, `404.html`
- `sitemap.xml`, `rss.xml`, `robots.txt`, `llms.txt`
- the public IndexNow verification file `{key}.txt` if a key already exists

`styles.css` is **not** generated. Edit that file directly.

## IndexNow

The generator will not mint a new key. It resolves one from, in order:

1. `INDEXNOW_KEY`
2. gitignored `data/indexnow-key.txt`
3. an existing `{32-hex}.txt` file at the repo root whose body matches the filename

`data/indexnow-key.txt` and `data/submission-log.json` are local-only.

## Submit discovery pings

After the hub is live:

```bash
$env:SITE_ORIGIN="https://zlatkomarjanovic.github.io/fiverr-gigs"
npm run submit
```

Use `npm run submit -- --hub-only` to skip Fiverr URL pings.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run validate` | Check `gigs.json` required fields and uniqueness |
| `npm run generate` | Rebuild the static hub |
| `npm run build` | Validate, then generate |
| `npm run test` | Run unit tests under `scripts/lib/` |
| `npm run check` | Validate, test, and regenerate the hub |
| `npm run submit` | Ping archives / sitemaps / IndexNow |
| `npm run index` | Generate, then submit |

Do not hand-edit generated files (`index.html`, `services/*.html`, `404.html`, `sitemap.xml`, `rss.xml`, `robots.txt`, `llms.txt`, `{key}.txt`). Run `npm run generate` after changing `data/gigs.json`.

## CI

GitHub Actions workflow [`.github/workflows/hub.yml`](.github/workflows/hub.yml) runs on push and pull request to `main`:

1. `npm run check` (validate → test → generate)
2. Fails if generation would change tracked files (commit the regenerated output)

Set `SITE_ORIGIN` in the workflow env to match the live GitHub Pages host.

## Add a gig

1. Edit [`data/gigs.json`](data/gigs.json): add an object with a unique kebab-case `id`, matching `slug` and Fiverr `url`, lane, category, search terms, tags (≤5), and FAQ (≤5).
2. Run `npm run check` locally with `SITE_ORIGIN` set.
3. Commit `data/gigs.json` plus regenerated HTML/XML files.

Optional manual script: `scripts/pingomatic-full.mjs` is not wired to npm — run with Node only if you need legacy Ping-O-Matic pings.

## Analytics (optional)

The shared layout ends with an HTML comment hook before `</body>`. To add privacy-friendly analytics (Plausible, Fathom, etc.), edit `scripts/lib/layout.mjs` and insert your script tag there, then run `npm run generate`.

Improvement sprint tasks are tracked in [`data/improvement-backlog.json`](data/improvement-backlog.json). Regenerate the list with `node scripts/generate-backlog.mjs`.
