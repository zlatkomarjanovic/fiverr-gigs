#!/usr/bin/env node
/**
 * Generates data/improvement-backlog.json — 300 atomic improvement tasks.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildBatchTasks } from "./lib/backlog-batch-tasks.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "data", "improvement-backlog.json");
const DONE_FILE = path.join(ROOT, "data", ".batch-done-keys.json");

const baseCompleted = [
  "build-npm-script",
  "extract-html-helpers",
  "validate-before-generate",
  "theme-color-meta",
  "author-meta",
  "sitemap-head-link",
  "website-schema",
  "landmark-roles",
  "html-unit-tests",
  "ci-unit-tests",
  "kebab-case-ids",
  "url-matches-slug",
  "seo-field-lengths",
  "rss-pubdate",
  "sitemap-priority",
  "link-hover-underline",
  "card-aria-labelledby",
  "validate-https-profile-urls",
  "rel-me-github",
  "extract-gigTerms-and-relatedGigs-to-lib",
  "test-related-gigs-scoring",
  "test-gigTerms-normalization",
  "rss-language-tag",
  "btn-active-state",
  "npm-run-check-alias",
  "pin-node-engine",
  "extract-layout-template",
  "extract-sitemap-builder",
  "extract-rss-builder",
  "share-gigs-json-loader",
  "validate-lane-non-empty",
  "validate-category-subcategory",
  "validate-searchTerms-unique",
  "validate-tags-unique",
  "validate-faq-max-count",
  "validate-id-filename-match",
  "validate-seller-handle",
  "service-page-og-type",
  "jsonld-context-on-nodes",
  "format-detection-meta",
  "referrer-policy-meta",
  "details-summary-focus-ring",
  "nav-current-page",
  "external-link-indicator",
  "lang-on-html",
  "hero-section-label",
  "related-list-semantics",
  "panel-heading-rhythm",
  "footer-link-spacing",
  "tag-contrast",
  "card-hover-border",
  "grid-min-column-narrow",
  "hero-lede-size",
  "btn-full-width-mobile",
  "safe-area-footer",
  "generator-single-read-gigs",
  "validate-no-http-urls",
  "sanitize-jsonld-output",
  "generate-missing-gigs-file",
  "generate-invalid-json",
  "focus-visible-fallback",
  "appearance-details-marker",
  "empty-faq-rejected",
  "duplicate-search-term",
  "document-backlog-workflow",
  "document-test-command",
  "document-ci-workflow",
  "contributing-gig",
  "prettier-ignore-generated",
  "remove-unused-pingomatic-script",
  "submit-missing-site-origin",
  "canonical-trailing-slash-index",
  "index-meta-keywords-remove",
  "preconnect-none-needed",
  "jsdoc-html-helpers",
  "jsdoc-validate-gigs",
  "readme-plausible-note",
  "n/a-static-site",
  "n/a-no-react",
  "n/a-no-react-hooks",
];

function loadBatchDone() {
  if (!fs.existsSync(DONE_FILE)) return [];
  return JSON.parse(fs.readFileSync(DONE_FILE, "utf8"));
}

const completed = new Set([...baseCompleted, ...loadBatchDone()]);

const historical = [
  ["dx", "build-npm-script", "Add npm run build as validate then generate", "XS"],
  ["refactoring", "extract-html-helpers", "Extract HTML helpers to scripts/lib/html.mjs", "S"],
  ["bug-fixes", "validate-before-generate", "Run gigs.json validation before generate", "XS"],
  ["seo", "theme-color-meta", "Add theme-color and color-scheme meta tags", "XS"],
  ["metadata", "author-meta", "Add author meta tag", "XS"],
  ["seo", "sitemap-head-link", "Link sitemap from document head", "XS"],
  ["seo", "website-schema", "Add WebSite schema on index", "S"],
  ["a11y", "landmark-roles", "Add banner and contentinfo landmark roles", "XS"],
  ["tests", "html-unit-tests", "Unit test HTML escape and Fiverr links", "S"],
  ["ci", "ci-unit-tests", "Run unit tests in hub workflow", "XS"],
  ["validation", "kebab-case-ids", "Require kebab-case gig ids", "XS"],
  ["validation", "url-matches-slug", "Require gig URL to end with slug", "XS"],
  ["validation", "seo-field-lengths", "Validate title summary description lengths", "S"],
  ["seo", "rss-pubdate", "Add pubDate to RSS items", "XS"],
  ["seo", "sitemap-priority", "Set sitemap priority values", "XS"],
  ["ui-polish", "link-hover-underline", "Underline body links on hover", "XS"],
  ["a11y", "card-aria-labelledby", "Label gig cards with aria-labelledby", "XS"],
  ["validation", "validate-https-profile-urls", "Validate sellerSite and githubUrl are https", "XS"],
  ["seo", "rel-me-github", "Add rel=me link to GitHub profile", "XS"],
];

const explicit = [
  ["refactoring", "extract-gigTerms-and-relatedGigs-to-lib", "Extract related gig scoring to scripts/lib/gigs.mjs", "S"],
  ["refactoring", "extract-layout-template", "Extract layout() to scripts/lib/layout.mjs", "M"],
  ["refactoring", "extract-sitemap-builder", "Extract sitemap XML builder to scripts/lib/sitemap.mjs", "S"],
  ["refactoring", "extract-rss-builder", "Extract RSS builder to scripts/lib/rss.mjs", "S"],
  ["refactoring", "share-gigs-json-loader", "Share gigs.json loader between scripts", "S"],
  ["tests", "test-related-gigs-scoring", "Unit test relatedGigs keyword overlap", "S"],
  ["tests", "test-gigTerms-normalization", "Unit test gigTerms lowercasing", "S"],
  ["validation", "validate-lane-non-empty", "Require non-empty lane on each gig", "XS"],
  ["validation", "validate-category-subcategory", "Require category and subcategory strings", "XS"],
  ["validation", "validate-searchTerms-unique", "Require unique searchTerms per gig", "XS"],
  ["validation", "validate-tags-unique", "Require unique tags per gig", "XS"],
  ["validation", "validate-faq-max-count", "Warn when FAQ count exceeds 5", "XS"],
  ["validation", "validate-id-filename-match", "Ensure services/{id}.html will be unique", "XS"],
  ["validation", "validate-seller-handle", "Validate seller handle matches Fiverr URL", "S"],
  ["seo", "rss-language-tag", "Add xml:lang en to RSS channel", "XS"],
  ["seo", "index-meta-keywords-remove", "Avoid deprecated meta keywords tag", "XS"],
  ["seo", "service-page-og-type", "Use og:type article on service pages", "S"],
  ["seo", "jsonld-context-on-nodes", "Ensure @context on all JSON-LD nodes", "S"],
  ["seo", "canonical-trailing-slash-index", "Normalize index canonical trailing slash", "XS"],
  ["metadata", "format-detection-meta", "Add format-detection telephone=no", "XS"],
  ["metadata", "referrer-policy-meta", "Add referrer policy for outbound links", "XS"],
  ["a11y", "details-summary-focus-ring", "Style details summary focus-visible", "XS"],
  ["a11y", "nav-current-page", "Mark current nav item on service pages", "S"],
  ["a11y", "external-link-indicator", "Visually indicate outbound Fiverr links", "S"],
  ["a11y", "lang-on-html", "Verify lang=en on all generated pages", "XS"],
  ["a11y", "hero-section-label", "Add aria-labelledby on hero sections", "S"],
  ["a11y", "related-list-semantics", "Use nav for related gigs list", "S"],
  ["ui-polish", "btn-active-state", "Add :active state for buttons", "XS"],
  ["ui-polish", "panel-heading-rhythm", "Normalize panel h2/h3 spacing", "XS"],
  ["ui-polish", "footer-link-spacing", "Improve footer link spacing", "XS"],
  ["ui-polish", "tag-contrast", "Improve tag pill contrast", "XS"],
  ["ui-polish", "card-hover-border", "Subtle card hover border", "XS"],
  ["mobile", "grid-min-column-narrow", "Lower grid min width on very small screens", "S"],
  ["mobile", "hero-lede-size", "Tune lede font-size on mobile", "XS"],
  ["mobile", "btn-full-width-mobile", "Optional full-width CTAs under 400px", "S"],
  ["mobile", "safe-area-footer", "Add safe-area-inset padding", "XS"],
  ["performance", "generator-single-read-gigs", "Avoid double gigs.json parse in generate", "XS"],
  ["performance", "preconnect-none-needed", "Skip unnecessary preconnect hints", "XS"],
  ["security", "validate-no-http-urls", "Reject http URLs in gigs.json", "XS"],
  ["security", "sanitize-jsonld-output", "Ensure JSON-LD cannot break script tag", "S"],
  ["error-handling", "generate-missing-gigs-file", "Clear error when gigs.json missing", "XS"],
  ["error-handling", "generate-invalid-json", "Clear error on malformed gigs.json", "XS"],
  ["error-handling", "submit-missing-site-origin", "Document SITE_ORIGIN requirement in submit", "XS"],
  ["docs", "document-backlog-workflow", "Document improvement backlog in README", "S"],
  ["docs", "document-test-command", "Document npm test in README", "XS"],
  ["docs", "document-ci-workflow", "Document GitHub Actions hub workflow", "XS"],
  ["docs", "contributing-gig", "Document how to add a new gig", "S"],
  ["dx", "npm-run-check-alias", "Add npm run check as validate+test+generate", "XS"],
  ["dx", "prettier-ignore-generated", "Document do-not-edit generated files", "XS"],
  ["edge-cases", "empty-faq-rejected", "Validator rejects empty FAQ answers", "XS"],
  ["edge-cases", "duplicate-search-term", "Validator rejects duplicate search terms", "XS"],
  ["browser-compat", "appearance-details-marker", "Normalize details marker styling", "XS"],
  ["browser-compat", "focus-visible-fallback", "Ensure focus styles without :focus-visible", "S"],
  ["analytics", "readme-plausible-note", "Document optional analytics hook point", "XS"],
  ["dead-code", "remove-unused-pingomatic-script", "Audit pingomatic-full.mjs usage", "S"],
  ["dependency-cleanup", "pin-node-engine", "Add engines.node to package.json", "XS"],
  ["loading-states", "n/a-static-site", "N/A — static site has no async UI", "XS"],
  ["typescript", "jsdoc-html-helpers", "Add JSDoc types to html.mjs exports", "XS"],
  ["typescript", "jsdoc-validate-gigs", "Add JSDoc to validate-gigs helpers", "XS"],
  ["components", "n/a-no-react", "N/A — static HTML generator", "XS"],
  ["hooks", "n/a-no-react-hooks", "N/A — static HTML generator", "XS"],
];

const batchTasks = buildBatchTasks();

const tasks = [];
let seq = 1;

function add(category, key, task, scope) {
  tasks.push({
    id: String(seq++).padStart(3, "0"),
    key,
    category,
    task,
    scope,
    status: completed.has(key) ? "done" : "pending",
  });
}

for (const [category, key, task, scope] of [...historical, ...explicit]) {
  add(category, key, task, scope);
}

for (const batch of batchTasks) {
  add(batch.category, batch.key, batch.task, batch.scope);
}

const payload = {
  generated: new Date().toISOString().slice(0, 10),
  total: tasks.length,
  done: tasks.filter((t) => t.status === "done").length,
  pending: tasks.filter((t) => t.status === "pending").length,
  tasks,
};

fs.writeFileSync(OUT, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Wrote ${payload.total} tasks (${payload.done} done, ${payload.pending} pending).`);
