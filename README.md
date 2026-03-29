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
| `npm run submit` | Ping archives / sitemaps / IndexNow |
| `npm run index` | Generate, then submit |
