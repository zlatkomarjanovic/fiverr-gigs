# Zlatko Marjanović — Fiverr gigs

Public, crawlable index of live Fiverr services. Each page uses a clean gig URL (no tracking parameters) and a single search lane so the gigs do not compete with each other.

- Live hub: https://zlatkomarjanovic.github.io/fiverr-gigs/
- Seller profile: https://www.fiverr.com/zlatkomarjanovi
- Source of truth: [`data/gigs.json`](data/gigs.json) ([JSON Schema](data/gigs.schema.json))
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
- `sitemap.xml`, `rss.xml`, `robots.txt`, `llms.txt` (includes `Updated` date)
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
| `npm run validate:verbose` | Same as validate (alias for CI/local scripts) |
| `npm run generate` | Rebuild the static hub |
| `npm run build` | Validate, then generate |
| `npm run test` | Run unit tests under `scripts/lib/` |
| `npm run check` | Node version check, validate, test, generate |
| `npm run verify` | Alias for `npm run check` |
| `npm run backlog` | Regenerate `data/improvement-backlog.json` |
| `npm run submit` | Ping archives / sitemaps / IndexNow |
| `npm run index` | Generate, then submit |
| `npm run pingomatic` | Legacy Ping-O-Matic full check list |

Static assets: [`favicon.svg`](favicon.svg) and [`styles.css`](styles.css) are hand-maintained (not generated).

Do not hand-edit generated files (`index.html`, `services/*.html`, `404.html`, `sitemap.xml`, `rss.xml`, `robots.txt`, `llms.txt`, `{key}.txt`). Run `npm run generate` after changing `data/gigs.json`.

## CI

GitHub Actions workflow [`.github/workflows/hub.yml`](.github/workflows/hub.yml) runs on push and pull request to `main`:

1. `npm run check` (validate → test → generate)
2. Fails if generation would change tracked files (commit the regenerated output)

Set `SITE_ORIGIN` in the workflow env to match the live GitHub Pages host.

## Add a gig

1. Edit [`data/gigs.json`](data/gigs.json) (see [`data/gigs.schema.json`](data/gigs.schema.json) for the expected shape): add an object with a unique kebab-case `id`, matching `slug` and Fiverr `url`, lane, category, search terms, tags (≤5), and FAQ (≤5).
2. Run `npm run check` locally with `SITE_ORIGIN` set.
3. Commit `data/gigs.json` plus regenerated HTML/XML files.

Optional: `npm run pingomatic` runs the legacy Ping-O-Matic full check list (`scripts/pingomatic-full.mjs`).

## Related gigs

Related links on each service page come from keyword overlap (`scripts/lib/gigs.mjs`): primary keyword, category, subcategory, search terms, and tags are lowercased and scored; the top matches (excluding the current gig) are shown.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `validate` fails after editing gigs | Read the error line — ids must be kebab-case, URLs must match slugs, and `primaryKeyword` must appear in `searchTerms`. |
| `check` fails on git diff | Run `npm run generate` with `SITE_ORIGIN` set and commit regenerated HTML/XML. |
| IndexNow skipped on submit | Set `SITE_ORIGIN` and `INDEXNOW_KEY` (or publish `{key}.txt` on the live host). |
| Canonicals point at example.com | Export `SITE_ORIGIN` before `npm run generate`. |

Validate exits **0** on success and **1** on any validation error.

## Changelog

- **1.2.0** — Incremental polish: design tokens, validation, feeds, 100 micro-improvements.
- **1.1.0** — Hub builders refactor, expanded validation/security rules, favicon, RSS atom self link, 300-task backlog completed.
- **1.0.x** — Initial static hub generator, CI, layout extraction, improvement sprint.

Improvement sprint tasks are tracked in [`data/improvement-backlog.json`](data/improvement-backlog.json) (**300/300 complete**). Regenerate with `npm run backlog`.

Incremental improvements are logged in [`data/incremental-100-log.json`](data/incremental-100-log.json).

## Analytics (optional)

The shared layout ends with an HTML comment hook before `</body>`. To add privacy-friendly analytics (Plausible, Fathom, etc.), edit `scripts/lib/layout.mjs` and insert your script tag there, then run `npm run generate`.

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the contributor workflow.
