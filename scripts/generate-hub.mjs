#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { relatedGigs } from "./lib/gigs.mjs";
import { loadGigs } from "./lib/load-gigs.mjs";
import { validateGigsData } from "./lib/validate-gigs-lib.mjs";
import { renderLayout } from "./lib/layout.mjs";
import { buildSitemap } from "./lib/sitemap.mjs";
import { buildRss } from "./lib/rss.mjs";
import { buildRobots } from "./lib/robots.mjs";
import { buildLlms } from "./lib/llms.mjs";
import {
  absUrl,
  buildIndexBody,
  buildIndexLd,
  buildPersonLd,
  buildServiceBody,
  buildServiceJsonLd,
  hubVersion,
  resolveIndexNowKey,
  sortedGigs,
  writeHubFiles,
} from "./lib/hub-builders.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

let gigs;
try {
  gigs = loadGigs(ROOT);
} catch (err) {
  console.error(`[generate] ${err.message}`);
  process.exit(1);
}

const validationErrors = validateGigsData(gigs);
if (validationErrors.length) {
  console.error(`gigs.json failed ${validationErrors.length} check${validationErrors.length === 1 ? "" : "s"}:`);
  for (const error of validationErrors) console.error(`- ${error}`);
  process.exit(1);
}

const SITE_ORIGIN = (process.env.SITE_ORIGIN || "").replace(/\/$/, "");
if (!SITE_ORIGIN) {
  console.warn("Warning: SITE_ORIGIN is unset — canonicals and sitemap will use https://example.com.");
}

let INDEXNOW_KEY;
try {
  INDEXNOW_KEY = resolveIndexNowKey(ROOT, fs, path);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

const keyFile = path.join(ROOT, `${INDEXNOW_KEY}.txt`);
if (!fs.existsSync(keyFile) || fs.readFileSync(keyFile, "utf8").trim() !== INDEXNOW_KEY) {
  fs.writeFileSync(keyFile, INDEXNOW_KEY);
}

const origin = SITE_ORIGIN || "https://example.com";
const abs = (p) => absUrl(SITE_ORIGIN, p);
const stylesPath = path.join(ROOT, "styles.css");
if (!fs.existsSync(stylesPath)) {
  console.error("[generate] styles.css is missing. The generator no longer emits CSS.");
  process.exit(1);
}
if (fs.statSync(stylesPath).isDirectory()) {
  console.error("[generate] styles.css is a directory — expected a CSS file.");
  process.exit(1);
}

const personLd = buildPersonLd(gigs);
const orderedGigs = sortedGigs(gigs.gigs);
const gigCount = orderedGigs.length;
const relatedMap = new Map(
  orderedGigs.map((g) => [g.id, relatedGigs(g, orderedGigs)]),
);

const indexHtml = renderLayout({
  gigs,
  siteOrigin: SITE_ORIGIN,
  abs,
  title: `${gigs.sellerName} Fiverr gigs — Webflow, AI, Shopify, n8n`,
  description: "Indexable directory of Zlatko Marjanović Fiverr gigs: Webflow websites, vibe coding, Next.js SaaS, Shopify, Framer, n8n agents, and AI voice receptionists.",
  canonical: "/",
  jsonLd: buildIndexLd(gigs, SITE_ORIGIN, origin, personLd),
  body: buildIndexBody({ ...gigs, gigs: orderedGigs }),
  navCurrent: "gigs",
  pageMeta: { updated: gigs.updated, pagename: "hub-home" },
});

const servicesDir = path.join(ROOT, "services");
if (fs.existsSync(servicesDir) && !fs.statSync(servicesDir).isDirectory()) {
  throw new Error("services path exists but is not a directory.");
}
fs.mkdirSync(servicesDir, { recursive: true });

const servicePages = {};
for (const g of orderedGigs) {
  const related = relatedMap.get(g.id) || [];
  servicePages[`${g.id}.html`] = renderLayout({
    gigs,
    siteOrigin: SITE_ORIGIN,
    abs,
    title: `${g.shortTitle} | ${gigs.sellerName} on Fiverr`,
    description: g.summary,
    canonical: `/services/${g.id}.html`,
    jsonLd: buildServiceJsonLd(g, gigs, SITE_ORIGIN, personLd),
    body: buildServiceBody(g, related),
    ogType: "article",
    pageMeta: { updated: gigs.updated, pagename: g.id, gigId: g.id },
  });
}

const notFoundHtml = renderLayout({
  gigs,
  siteOrigin: SITE_ORIGIN,
  abs,
  title: `Page not found | ${gigs.sellerName}`,
  description: "This Fiverr gig index page does not exist. Browse the live gigs or open the Fiverr profile.",
  canonical: "/404.html",
  robots: "noindex,follow,noarchive",
  jsonLd: {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Page not found",
    url: SITE_ORIGIN ? `${SITE_ORIGIN}/404.html` : "/404.html",
    dateModified: gigs.updated,
  },
  body: `
    <section class="hero" aria-labelledby="not-found-title">
      <p class="kicker">404</p>
      <h1 id="not-found-title">This page is not in the gig index</h1>
      <p class="lede">The URL may be outdated or typed incorrectly. The live Fiverr services are on the hub home page.</p>
      <p><a class="btn" href="index.html">Back to all gigs</a></p>
    </section>`,
});

try {
  writeHubFiles(ROOT, fs, path, {
    robots: buildRobots({ origin }),
    llms: buildLlms({ origin, sellerName: gigs.sellerName, gigs: orderedGigs, updated: gigs.updated }),
    sitemap: buildSitemap({ origin, gigs: orderedGigs, updated: gigs.updated }),
    rss: buildRss({ origin, sellerName: gigs.sellerName, gigs: orderedGigs, updated: gigs.updated }),
    indexHtml,
    notFoundHtml,
    servicePages,
  });
} catch (err) {
  console.error(`[generate] Failed writing hub files: ${err.message}`);
  process.exit(1);
}

console.log(`Hub generated (v${hubVersion()}, ${gigCount} gigs). IndexNow key: ${INDEXNOW_KEY}`);
if (!SITE_ORIGIN) {
  console.log("Set SITE_ORIGIN before deploy so sitemap/canonical/IndexNow use your real host.");
}
