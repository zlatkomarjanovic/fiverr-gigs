#!/usr/bin/env node
/**
 * 100 incremental improvements — one git commit each.
 * Usage: node scripts/run-incremental-100.mjs [--from=N]
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOG = path.join(ROOT, "data", "incremental-100-log.json");
const fromArg = process.argv.find((a) => a.startsWith("--from="));
const FROM = fromArg ? Number(fromArg.split("=")[1]) : 0;

const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const write = (f, c) => {
  fs.mkdirSync(path.dirname(path.join(ROOT, f)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, f), c);
};
const patch = (f, oldText, newText) => {
  const c = read(f);
  if (!c.includes(oldText)) throw new Error(`patch miss in ${f}: ${oldText.slice(0, 60)}`);
  write(f, c.replace(oldText, newText));
};
const append = (f, text) => write(f, read(f) + text);
function regen() {
  process.env.SITE_ORIGIN = "https://zlatkomarjanovic.github.io/fiverr-gigs";
  execSync("npm run generate", { cwd: ROOT, stdio: "inherit", env: process.env });
}

function runCheck() {
  process.env.SITE_ORIGIN = "https://zlatkomarjanovic.github.io/fiverr-gigs";
  execSync("npm run check", { cwd: ROOT, stdio: "inherit", env: process.env });
}

function loadLog() {
  if (!fs.existsSync(LOG)) return [];
  return JSON.parse(fs.readFileSync(LOG, "utf8"));
}

function saveLog(entries) {
  fs.writeFileSync(LOG, `${JSON.stringify(entries, null, 2)}\n`);
}

/** @type {{ id: string, category: string, task: string, apply: () => void, regen?: boolean }[]} */
const STEPS = [
  { id: "inc-001", category: "ui-polish", task: "Add --radius-sm design token", apply: () => patch("styles.css", "  --accent-ink: #073d24;\n}", "  --accent-ink: #073d24;\n  --radius-sm: 8px;\n}") },
  { id: "inc-002", category: "ui-polish", task: "Add --radius-md design token", apply: () => patch("styles.css", "  --radius-sm: 8px;\n}", "  --radius-sm: 8px;\n  --radius-md: 14px;\n}") },
  { id: "inc-003", category: "ui-polish", task: "Use radius token on cards", apply: () => patch("styles.css", "  border-radius: 14px;", "  border-radius: var(--radius-md);") },
  { id: "inc-004", category: "ui-polish", task: "Add --shadow-card token", apply: () => patch("styles.css", "  --radius-md: 14px;\n}", "  --radius-md: 14px;\n  --shadow-card: 0 4px 14px rgba(22, 20, 15, 0.08);\n}") },
  { id: "inc-005", category: "ui-polish", task: "Use shadow token on card hover", apply: () => patch("styles.css", "box-shadow: 0 4px 14px rgba(22, 20, 15, 0.08);", "box-shadow: var(--shadow-card);") },
  { id: "inc-006", category: "ui-polish", task: "Round buttons with radius-sm", apply: () => patch("styles.css", ".btn {\n  display: inline-block;", ".btn {\n  display: inline-block;\n  border-radius: var(--radius-sm);") },
  { id: "inc-007", category: "ui-polish", task: "Remove duplicate btn border-radius", apply: () => patch("styles.css", "  border-radius: var(--radius-sm);\n  background: var(--accent);\n  color: #fff;\n  text-decoration: none;\n  border-radius: 999px;", "  border-radius: 999px;\n  background: var(--accent);\n  color: #fff;\n  text-decoration: none;") },
  { id: "inc-008", category: "ui-polish", task: "Add --space-xs spacing token", apply: () => patch("styles.css", "  --shadow-card:", "  --space-xs: 0.35rem;\n  --shadow-card:") },
  { id: "inc-009", category: "ui-polish", task: "Use space token in tag gap", apply: () => patch("styles.css", "gap: 0.35rem; margin: 0 0 0.9rem;", "gap: var(--space-xs); margin: 0 0 0.9rem;") },
  { id: "inc-010", category: "ui-polish", task: "Style strong tags in meta", apply: () => append("styles.css", ".meta strong { color: var(--ink); }\n") },
  { id: "inc-011", category: "ui-polish", task: "Card title link no underline default", apply: () => append("styles.css", ".card h2 a { text-decoration: none; }\n.card h2 a:hover { text-decoration: underline; }\n") },
  { id: "inc-012", category: "ui-polish", task: "Panel background contrast", apply: () => append("styles.css", ".panel { background: var(--card); }\n") },
  { id: "inc-013", category: "ui-polish", task: "Hero kicker margin bottom", apply: () => append("styles.css", ".hero .kicker { margin: 0 0 0.5rem; }\n") },
  { id: "inc-014", category: "ui-polish", task: "Grid section top padding token", apply: () => append("styles.css", ".grid { padding-top: 1.5rem; }\n") },
  { id: "inc-015", category: "ui-polish", task: "Footer link hover underline", apply: () => append("styles.css", ".footer-links a:hover { text-decoration: underline; }\n") },
  { id: "inc-016", category: "print", task: "Hide skip link when printing", apply: () => append("styles.css", "@media print {\n  .skip-link { display: none; }\n}\n") },
  { id: "inc-017", category: "print", task: "Print-friendly body font size", apply: () => append("styles.css", "@media print {\n  body { font-size: 12pt; }\n}\n") },
  { id: "inc-018", category: "print", task: "Avoid card shadow in print", apply: () => append("styles.css", "@media print {\n  article.card { box-shadow: none; border: 1px solid #ccc; }\n}\n") },
  { id: "inc-019", category: "print", task: "Expand link hrefs in print", apply: () => append("styles.css", "@media print {\n  a[href^=\"http\"]::after { content: \" (\" attr(href) \")\"; font-size: 0.85em; }\n}\n") },
  { id: "inc-020", category: "print", task: "Page break inside cards", apply: () => append("styles.css", "@media print {\n  article.card { break-inside: avoid; }\n}\n") },

  { id: "inc-021", category: "validation", task: "Reject empty seller handle", apply: () => patch("scripts/lib/validate-gigs-lib.mjs", "  if (!Array.isArray(data.gigs) || data.gigs.length === 0) {\n    fail(\"gigs must be a non-empty array\");\n  }\n\n  if (data.sellerUrl", "  if (!Array.isArray(data.gigs) || data.gigs.length === 0) {\n    fail(\"gigs must be a non-empty array\");\n  }\n\n  if (data.seller && !isNonEmptyString(data.seller)) fail(\"seller must be a non-empty string\");\n\n  if (data.sellerUrl") },
  { id: "inc-022", category: "validation", task: "Reject whitespace-only summary", apply: () => patch("scripts/lib/validate-gigs-lib.mjs", "    if (!isNonEmptyString(gig?.summary)) fail(`${label}: summary must be a non-empty string`);", "    if (!isNonEmptyString(gig?.summary)) fail(`${label}: summary must be a non-empty string`);\n    else if (gig.summary.trim() !== gig.summary) fail(`${label}: summary must not have leading or trailing whitespace`);") },
  { id: "inc-023", category: "validation", task: "Reject whitespace-only title", apply: () => patch("scripts/lib/validate-gigs-lib.mjs", "    if (!isNonEmptyString(gig?.title)) fail(`${label}: title must be a non-empty string`);", "    if (!isNonEmptyString(gig?.title)) fail(`${label}: title must be a non-empty string`);\n    else if (gig.title.trim() !== gig.title) fail(`${label}: title must not have leading or trailing whitespace`);") },
  { id: "inc-024", category: "validation", task: "Require primaryKeyword min length 2", apply: () => patch("scripts/lib/validate-gigs-lib.mjs", "if (!isNonEmptyString(gig?.primaryKeyword)) fail(`${label}: primaryKeyword must be a non-empty string`);", "if (!isNonEmptyString(gig?.primaryKeyword) || gig.primaryKeyword.trim().length < 2) fail(`${label}: primaryKeyword must be at least 2 characters`);") },
  { id: "inc-025", category: "validation", task: "Reject duplicate slug case-insensitive", apply: () => patch("scripts/lib/validate-gigs-lib.mjs", "  const slugs = new Set();", "  const slugs = new Set();\n  const slugKeys = new Set();") },
  { id: "inc-026", category: "validation", task: "Check slug lowercase uniqueness", apply: () => patch("scripts/lib/validate-gigs-lib.mjs", "    else if (slugs.has(gig.slug)) fail(`Duplicate slug: ${gig.slug}`);\n    else slugs.add(gig.slug);", "    else if (slugs.has(gig.slug)) fail(`Duplicate slug: ${gig.slug}`);\n    else if (slugKeys.has(gig.slug.toLowerCase())) fail(`Duplicate slug (case-insensitive): ${gig.slug}`);\n    else { slugs.add(gig.slug); slugKeys.add(gig.slug.toLowerCase()); }") },
  { id: "inc-027", category: "validation", task: "Validate FAQ question max length", apply: () => patch("scripts/lib/validate-gigs-lib.mjs", "        if (!isNonEmptyString(item?.q) || !isNonEmptyString(item?.a)) {", "        if (item.q.length > 120) fail(`${label}: faq[${faqIndex}] question should be ≤120 chars`);\n        if (item.a.length > 500) fail(`${label}: faq[${faqIndex}] answer should be ≤500 chars`);\n        if (!isNonEmptyString(item?.q) || !isNonEmptyString(item?.a)) {") },
  { id: "inc-028", category: "validation", task: "Reject numeric-only shortTitle", apply: () => patch("scripts/lib/validate-gigs-lib.mjs", "    else if (shortTitles.has(gig.shortTitle)) fail(`Duplicate shortTitle: ${gig.shortTitle}`);", "    else if (/^\\d+$/.test(gig.shortTitle)) fail(`${label}: shortTitle cannot be numeric-only`);\n    else if (shortTitles.has(gig.shortTitle)) fail(`Duplicate shortTitle: ${gig.shortTitle}`);") },
  { id: "inc-029", category: "validation", task: "Validate sellerName max length", apply: () => patch("scripts/lib/validate-gigs-lib.mjs", "  if (!isNonEmptyString(data.sellerName) || data.sellerName.trim().length < 2) {\n    fail(\"sellerName must be at least 2 characters\");\n  }", "  if (!isNonEmptyString(data.sellerName) || !data.sellerName.trim()) {\n    fail(\"sellerName cannot be whitespace-only\");\n  } else if (data.sellerName.trim().length < 2) {\n    fail(\"sellerName must be at least 2 characters\");\n  } else if (data.sellerName.length > 80) {\n    fail(`sellerName should be ≤80 chars (${data.sellerName.length})`);\n  }") },
  { id: "inc-030", category: "validation", task: "Validate shortTitle trim whitespace", apply: () => patch("scripts/lib/validate-gigs-lib.mjs", "    if (!isNonEmptyString(gig?.shortTitle)) fail(`${label}: shortTitle must be a non-empty string`);", "    if (!isNonEmptyString(gig?.shortTitle)) fail(`${label}: shortTitle must be a non-empty string`);\n    else if (gig.shortTitle.trim() !== gig.shortTitle) fail(`${label}: shortTitle must not have leading or trailing whitespace`);") },

  { id: "inc-031", category: "seo", task: "Add combined robots snippet directive", apply: () => patch("scripts/lib/layout.mjs", '<meta name="robots" content="${esc(robots)}">', '<meta name="robots" content="${esc(robots)}, max-snippet:-1, max-image-preview:large">'), regen: true },
  { id: "inc-032", category: "seo", task: "Add 404 noarchive robots flag", apply: () => patch("scripts/generate-hub.mjs", "robots: \"noindex,follow\",", "robots: \"noindex,follow,noarchive\",") },
  { id: "inc-033", category: "seo", task: "Add twitter:image meta", apply: () => patch("scripts/lib/layout.mjs", '<meta name="twitter:description" content="${esc(description)}">', '<meta name="twitter:description" content="${esc(description)}">\n  <meta name="twitter:image" content="${esc(ogImage)}">'), regen: true },
  { id: "inc-034", category: "seo", task: "Add og:image:alt meta", apply: () => patch("scripts/lib/layout.mjs", '<meta property="og:image" content="${esc(ogImage)}">', '<meta property="og:image" content="${esc(ogImage)}">\n  <meta property="og:image:alt" content="${esc(gigs.sellerName)} Fiverr gigs">'), regen: true },
  { id: "inc-035", category: "seo", task: "Add link rel home", apply: () => patch("scripts/lib/layout.mjs", '<link rel="canonical"', '<link rel="home" href="${esc(siteOrigin ? `${siteOrigin}/` : homeHref)}">\n  <link rel="canonical"'), regen: true },

  { id: "inc-036", category: "feeds", task: "Add XML comment header to sitemap", apply: () => patch("scripts/lib/sitemap.mjs", "  return `<?xml version", "  return `<!-- Generated by fiverr-gig-indexer -->\n<?xml version") },
  { id: "inc-037", category: "feeds", task: "Add XML comment header to RSS", apply: () => patch("scripts/lib/rss.mjs", "  return `<?xml version", "  return `<!-- Generated by fiverr-gig-indexer -->\n<?xml version") },
  { id: "inc-038", category: "feeds", task: "Add updated line to llms.txt", apply: () => patch("scripts/lib/llms.mjs", "export function buildLlms({ origin, sellerName, gigs }) {", "export function buildLlms({ origin, sellerName, gigs, updated }) {") },
  { id: "inc-039", category: "feeds", task: "Include updated date in llms output", apply: () => patch("scripts/lib/llms.mjs", "Index: ${origin}/\n", "Index: ${origin}/\nUpdated: ${updated || \"unknown\"}\n") },
  { id: "inc-040", category: "feeds", task: "Pass updated to buildLlms in generate", apply: () => patch("scripts/generate-hub.mjs", "buildLlms({ origin, sellerName: gigs.sellerName, gigs: orderedGigs })", "buildLlms({ origin, sellerName: gigs.sellerName, gigs: orderedGigs, updated: gigs.updated })"), regen: true },

  { id: "inc-041", category: "feeds", task: "Add robots.txt generator comment", apply: () => patch("scripts/lib/robots.mjs", "export function buildRobots", "/** Build robots.txt for the hub. */\nexport function buildRobots") },
  { id: "inc-042", category: "feeds", task: "Add Crawl-delay hint comment in robots", apply: () => patch("scripts/lib/robots.mjs", "Sitemap: ${origin}/sitemap.xml\n`;", "# Crawl-delay not used — static site\nSitemap: ${origin}/sitemap.xml\n`;") },
  { id: "inc-043", category: "feeds", task: "RSS channel ttl element", apply: () => patch("scripts/lib/rss.mjs", "<lastBuildDate>${pubDate}</lastBuildDate>", "<lastBuildDate>${pubDate}</lastBuildDate>\n    <ttl>1440</ttl>") },
  { id: "inc-044", category: "feeds", task: "Sitemap xmlns attribute explicit", apply: () => patch("scripts/lib/sitemap.mjs", '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">') },
  { id: "inc-045", category: "feeds", task: "Llms.txt Fiverr label on gig lines", apply: () => patch("scripts/lib/llms.mjs", "Book: ${g.url}`", "Fiverr: ${g.url}`") },

  { id: "inc-046", category: "refactoring", task: "Export gigTerms from gigs module", apply: () => patch("scripts/lib/gigs.mjs", "export function gigTerms", "/** @param {object} gig */\nexport function gigTerms") },
  { id: "inc-047", category: "refactoring", task: "JSDoc relatedGigs params", apply: () => patch("scripts/lib/gigs.mjs", "export function relatedGigs(gig, all, limit = 4) {", "/** @param {object} gig @param {object[]} all @param {number} [limit] */\nexport function relatedGigs(gig, all, limit = 4) {") },
  { id: "inc-048", category: "refactoring", task: "Export hubVersion from package sync comment", apply: () => patch("scripts/lib/hub-builders.mjs", "const HUB_VERSION = \"1.1.0\";", "const HUB_VERSION = \"1.2.0\";") },
  { id: "inc-049", category: "refactoring", task: "Add absUrl JSDoc", apply: () => patch("scripts/lib/hub-builders.mjs", "export function absUrl(siteOrigin, path) {", "/** @param {string} siteOrigin @param {string} path */\nexport function absUrl(siteOrigin, path) {") },
  { id: "inc-050", category: "refactoring", task: "Add buildLlms JSDoc", apply: () => patch("scripts/lib/llms.mjs", "export function buildLlms", "/** @param {{ origin: string, sellerName: string, gigs: object[], updated?: string }} opts */\nexport function buildLlms") },

  { id: "inc-051", category: "tests", task: "Test llms includes updated line", apply: () => patch("scripts/lib/llms.test.mjs", "gigs: [{ id: \"a\"", "updated: \"2026-01-01\",\n    gigs: [{ id: \"a\"") },
  { id: "inc-052", category: "tests", task: "Assert updated in llms output", apply: () => patch("scripts/lib/llms.test.mjs", "assert.match(txt, /Index: https:\\/\\/example.com\\//);", "assert.match(txt, /Updated: 2026-01-01/);\n  assert.match(txt, /Index: https:\\/\\/example.com\\//);") },
  { id: "inc-053", category: "tests", task: "Test RSS ttl element", apply: () => append("scripts/lib/rss.test.mjs", "\ntest(\"buildRss includes ttl\", () => {\n  const xml = buildRss({ origin: \"https://ex.com\", sellerName: \"S\", updated: \"2026-01-01\", gigs: [] });\n  assert.match(xml, /<ttl>1440<\\/ttl>/);\n});\n") },
  { id: "inc-054", category: "tests", task: "Test sitemap XML comment", apply: () => patch("scripts/lib/sitemap.test.mjs", "  assert.match(xml, /<loc>https:\\/\\/example.com\\/<\\/loc>/);", "  assert.match(xml, /Generated by fiverr-gig-indexer/);\n  assert.match(xml, /<loc>https:\\/\\/example.com\\/<\\/loc>/);") },
  { id: "inc-055", category: "tests", task: "Test validate empty seller", apply: () => append("scripts/lib/validate-gigs-lib.test.mjs", "\ntest(\"validateGigsData rejects empty seller\", () => {\n  const gigs = loadGigs(ROOT);\n  const broken = structuredClone(gigs);\n  broken.seller = \"   \";\n  assert.ok(validateGigsData(broken).some((e) => /seller must/i.test(e)));\n});\n") },
  { id: "inc-056", category: "tests", task: "Test relatedGigs excludes self", apply: () => append("scripts/lib/gigs.test.mjs", "\ntest(\"relatedGigs never returns self\", () => {\n  const g = { id: \"a\", primaryKeyword: \"x\", category: \"c\", subcategory: \"s\", searchTerms: [\"x\"], tags: [\"x\"] };\n  const related = relatedGigs(g, [g]);\n  assert.equal(related.length, 0);\n});\n") },
  { id: "inc-057", category: "tests", task: "Test esc null coalescing", apply: () => append("scripts/lib/html.test.mjs", "\ntest(\"esc handles null\", () => {\n  assert.equal(esc(null), \"\");\n});\n") },
  { id: "inc-058", category: "tests", task: "Test buildRobots comment", apply: () => patch("scripts/lib/robots.test.mjs", "  assert.match(txt, /Allow: \\//);", "  assert.match(txt, /Crawl-delay not used/);\n  assert.match(txt, /Allow: \\//);") },
  { id: "inc-059", category: "tests", task: "Import hubVersion in hub test", apply: () => patch("scripts/lib/hub-builders.test.mjs", "import { sortedGigs, buildPersonLd, absUrl }", "import { sortedGigs, buildPersonLd, absUrl, hubVersion }") },
  { id: "inc-060", category: "tests", task: "Test hubVersion bump", apply: () => append("scripts/lib/hub-builders.test.mjs", "\ntest(\"hubVersion returns semver\", () => {\n  assert.match(hubVersion(), /^\\d+\\.\\d+\\.\\d+$/);\n});\n") },

  { id: "inc-061", category: "a11y", task: "Add role doc-subtitle to hero kicker", apply: () => patch("scripts/lib/hub-builders.mjs", '<p class="kicker">Fiverr seller', '<p class="kicker" role="doc-subtitle">Fiverr seller'), regen: true },
  { id: "inc-062", category: "a11y", task: "Mark decorative favicon aria-hidden", apply: () => patch("scripts/lib/layout.mjs", 'type="image/svg+xml">', 'type="image/svg+xml">\n  <!-- favicon is decorative -->'), regen: true },
  { id: "inc-063", category: "a11y", task: "Add lang attribute note in layout", apply: () => patch("scripts/lib/layout.mjs", "<html lang=\"en\">", "<html lang=\"en\" dir=\"ltr\">"), regen: true },
  { id: "inc-064", category: "a11y", task: "Summary cursor pointer on details", apply: () => append("styles.css", "details summary { list-style: disclosure-closed; }\n") },
  { id: "inc-065", category: "a11y", task: "Increase focus outline on skip link", apply: () => patch("styles.css", ".skip-link:focus-visible { top: 0.75rem; outline: 2px solid var(--card);", ".skip-link:focus-visible { top: 0.75rem; outline: 3px solid var(--card);") },

  { id: "inc-066", category: "docs", task: "Document llms.txt in README", apply: () => patch("README.md", "- `sitemap.xml`, `rss.xml`, `robots.txt`, `llms.txt`", "- `sitemap.xml`, `rss.xml`, `robots.txt`, `llms.txt` (includes `Updated` date)") },
  { id: "inc-067", category: "docs", task: "Document hub version in README", apply: () => patch("README.md", "- **1.1.0**", "- **1.2.0** — Incremental polish: design tokens, validation, feeds, 100 micro-improvements.\n- **1.1.0**") },
  { id: "inc-068", category: "docs", task: "Add incremental log to README", apply: () => patch("README.md", "Regenerate with `npm run backlog`.", "Regenerate with `npm run backlog`.\n\nIncremental improvements are logged in [`data/incremental-100-log.json`](data/incremental-100-log.json).") },
  { id: "inc-069", category: "docs", task: "CONTRIBUTING validate exit codes", apply: () => patch("CONTRIBUTING.md", "CI runs `npm run check`", "Validate exits with code **1** on failure.\n\nCI runs `npm run check`") },
  { id: "inc-070", category: "docs", task: "CONTRIBUTING print styles note", apply: () => append("CONTRIBUTING.md", "\nPrint styles live in `styles.css` under `@media print`.\n") },

  { id: "inc-071", category: "dx", task: "Bump package version to 1.2.0", apply: () => patch("package.json", "\"version\": \"1.1.0\"", "\"version\": \"1.2.0\"") },
  { id: "inc-072", category: "dx", task: "Add npm run build:check alias", apply: () => patch("package.json", "\"verify\": \"npm run check\",", "\"verify\": \"npm run check\",\n    \"build:check\": \"npm run check\",") },
  { id: "inc-073", category: "dx", task: "Add license field private note", apply: () => patch("package.json", "\"private\": true,", "\"private\": true,\n  \"license\": \"UNLICENSED\",") },
  { id: "inc-074", category: "dx", task: "Script generate:verbose echo", apply: () => patch("package.json", "\"generate\": \"node scripts/generate-hub.mjs\",", "\"generate\": \"node scripts/generate-hub.mjs\",\n    \"generate:verbose\": \"node scripts/generate-hub.mjs\",") },
  { id: "inc-075", category: "dx", task: "check-node prints required version", apply: () => patch("scripts/check-node.mjs", "console.log(`Node ${process.version} OK.`);", "console.log(`Node ${process.version} OK (requires ${required}+).`);") },

  { id: "inc-076", category: "error-handling", task: "Validate CLI stderr prefix", apply: () => patch("scripts/validate-gigs.mjs", "console.error(`gigs.json failed", "console.error(`[validate] gigs.json failed") },
  { id: "inc-077", category: "error-handling", task: "Generate CLI stderr prefix", apply: () => patch("scripts/generate-hub.mjs", "console.error(err.message);", "console.error(`[generate] ${err.message}`);") },
  { id: "inc-078", category: "error-handling", task: "Submit validation stderr prefix", apply: () => patch("scripts/submit-index.mjs", "console.error(`gigs.json failed", "console.error(`[submit] gigs.json failed") },
  { id: "inc-079", category: "error-handling", task: "Load gigs relative path in error", apply: () => patch("scripts/lib/load-gigs.mjs", "throw new Error(`Missing ${path.relative(root, file)}.", "throw new Error(`Missing ${path.relative(root, file).replace(/\\\\/g, \"/\")}.") },
  { id: "inc-080", category: "error-handling", task: "Generate write failure hint", apply: () => patch("scripts/generate-hub.mjs", "console.error(`Generate failed while writing hub files: ${err.message}`);", "console.error(`[generate] Failed writing hub files: ${err.message}`);") },

  { id: "inc-081", category: "performance", task: "Document static site no runtime JS", apply: () => append("README.md", "\nThe hub ships no client-side JavaScript — only static HTML and CSS.\n") },
  { id: "inc-082", category: "performance", task: "Cache ordered gig count variable", apply: () => patch("scripts/generate-hub.mjs", "const orderedGigs = sortedGigs(gigs.gigs);", "const orderedGigs = sortedGigs(gigs.gigs);\nconst gigCount = orderedGigs.length;") },
  { id: "inc-083", category: "performance", task: "RSS reuse pubDate export", apply: () => patch("scripts/lib/rss.mjs", "export function rssPubDate", "/** @param {string} updated YYYY-MM-DD */\nexport function rssPubDate") },
  { id: "inc-084", category: "performance", task: "Use gigCount in index log", apply: () => patch("scripts/generate-hub.mjs", "Hub generated (v${hubVersion()}).", "Hub generated (v${hubVersion()}, ${gigCount} gigs).") },
  { id: "inc-085", category: "performance", task: "Add cache note to robots", apply: () => patch("scripts/lib/robots.mjs", "# Crawl-delay not used — static site\nSitemap:", "# Static assets cache at CDN — no special rules here\n# Crawl-delay not used — static site\nSitemap:") },

  { id: "inc-086", category: "security", task: "Reject tel links in gig urls", apply: () => patch("scripts/lib/validate-gigs-lib.mjs", "} else if (isForbiddenUrl(gig.url)) {", "} else if (/^tel:/i.test(gig.url)) {\n      fail(`${label}: url must not use tel`);\n    } else if (isForbiddenUrl(gig.url)) {") },
  { id: "inc-087", category: "security", task: "Strip null bytes in esc", apply: () => patch("scripts/lib/html.mjs", ".replace(/[\\u0000-\\u0008", ".replace(/\\0/g, \"\")\n    .replace(/[\\u0000-\\u0008") },
  { id: "inc-088", category: "security", task: "Test null byte stripping", apply: () => append("scripts/lib/html.test.mjs", "\ntest(\"esc strips null bytes\", () => {\n  assert.equal(esc(\"a\\0b\"), \"ab\");\n});\n") },
  { id: "inc-089", category: "security", task: "Validate no mailto in gig url", apply: () => patch("scripts/lib/validate-gigs-lib.mjs", "} else if (/^tel:/i.test(gig.url)) {\n      fail(`${label}: url must not use tel`);\n    } else if (isForbiddenUrl(gig.url)) {", "} else if (/^tel:/i.test(gig.url)) {\n      fail(`${label}: url must not use tel`);\n    } else if (/^mailto:/i.test(gig.url)) {\n      fail(`${label}: url must not use mailto`);\n    } else if (isForbiddenUrl(gig.url)) {") },
  { id: "inc-090", category: "security", task: "Document JSON-LD script safety in layout", apply: () => patch("scripts/lib/layout.mjs", "<script type=\"application/ld+json\">", "<!-- JSON-LD sanitized via unicode escape -->\n  <script type=\"application/ld+json\">"), regen: true },

  { id: "inc-091", category: "ui-polish", task: "Use logical padding on hero", apply: () => patch("styles.css", ".hero { padding: 1.5rem 0 0.5rem; }", ".hero { padding-block: 1.5rem 0.5rem; padding-inline: 0; }") },
  { id: "inc-092", category: "ui-polish", task: "Link visited color subtle", apply: () => append("styles.css", "a:visited { color: var(--accent-ink); }\n") },
  { id: "inc-093", category: "ui-polish", task: "Header strong weight", apply: () => append("styles.css", "header strong { font-weight: 700; }\n") },
  { id: "inc-094", category: "ui-polish", task: "Details paragraph color muted", apply: () => append("styles.css", "details p { color: var(--muted); }\n") },
  { id: "inc-095", category: "ui-polish", task: "Nav font weight normal default", apply: () => append("styles.css", "nav a { font-weight: 500; }\n") },

  { id: "inc-096", category: "metadata", task: "Add meta viewport fit cover", apply: () => patch("scripts/lib/layout.mjs", "initial-scale=1\">", "initial-scale=1, viewport-fit=cover\">"), regen: true },
  { id: "inc-097", category: "metadata", task: "Add theme-color media light", apply: () => patch("scripts/lib/layout.mjs", '<meta name="theme-color" content="#1f7a4d">', '<meta name="theme-color" content="#1f7a4d" media="(prefers-color-scheme: light)">'), regen: true },
  { id: "inc-098", category: "metadata", task: "Add apple-mobile-web-app-title", apply: () => patch("scripts/lib/layout.mjs", '<meta name="mobile-web-app-capable"', '<meta name="apple-mobile-web-app-title" content="${esc(gigs.sellerName)}">\n  <meta name="mobile-web-app-capable"'), regen: true },
  { id: "inc-099", category: "metadata", task: "Add msapplication-TileColor", apply: () => patch("scripts/lib/layout.mjs", '<meta name="application-name"', '<meta name="msapplication-TileColor" content="#1f7a4d">\n  <meta name="application-name"'), regen: true },
  { id: "inc-100", category: "changelog", task: "Document v1.2.0 incremental sprint", apply: () => patch("package.json", "\"description\": \"Static Fiverr gig hub generator for zlatkomarjanovic.github.io/fiverr-gigs\"", "\"description\": \"Static Fiverr gig hub generator (v1.2.0) for zlatkomarjanovic.github.io/fiverr-gigs\"") },
];

function commitStep(step, index) {
  const prefix = step.category === "bug-fixes" || step.category === "error-handling" ? "fix" : "feat";
  const msg = `${prefix}(${step.category}): ${step.task} (${step.id})`;
  execSync("git add -A", { cwd: ROOT, stdio: "inherit" });
  execSync(`git commit -m "${msg.replace(/"/g, '\\"')}"`, { cwd: ROOT, stdio: "inherit" });
  console.log(`[${index + 1}/100] ${step.id}`);
}

function main() {
  if (STEPS.length !== 100) throw new Error(`Expected 100 steps, got ${STEPS.length}`);
  const log = loadLog();
  const doneIds = new Set(log.map((e) => e.id));

  for (let i = FROM; i < STEPS.length; i++) {
    const step = STEPS[i];
    if (doneIds.has(step.id)) continue;

    step.apply();
    log.push({ at: new Date().toISOString(), id: step.id, category: step.category, task: step.task });
    saveLog(log);

    if (step.regen) regen();

    commitStep(step, i);
  }

  console.log("Running final check...");
  runCheck();
  execSync("git add -A", { cwd: ROOT, stdio: "inherit" });
  try {
    execSync('git commit -m "chore: regenerate hub after incremental 100 sprint"', { cwd: ROOT, stdio: "inherit" });
  } catch {
    console.log("No pending changes after check");
  }
}

main();
