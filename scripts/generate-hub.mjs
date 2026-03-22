#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { esc, fiverrLink } from "./lib/html.mjs";
import { relatedGigs } from "./lib/gigs.mjs";
import { loadGigs } from "./lib/load-gigs.mjs";
import { validateGigsData } from "./lib/validate-gigs-lib.mjs";
import { renderLayout } from "./lib/layout.mjs";
import { buildSitemap } from "./lib/sitemap.mjs";
import { buildRss } from "./lib/rss.mjs";
import { buildRobots } from "./lib/robots.mjs";
import { buildLlms } from "./lib/llms.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

let gigs;
try {
  gigs = loadGigs(ROOT);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

const validationErrors = validateGigsData(gigs);
if (validationErrors.length) {
  console.error(`gigs.json failed ${validationErrors.length} check${validationErrors.length === 1 ? "" : "s"}:`);
  for (const error of validationErrors) console.error(`- ${error}`);
  process.exit(1);
}

const SITE_ORIGIN = (process.env.SITE_ORIGIN || "").replace(/\/$/, "");
const KEY_CACHE = path.join(ROOT, "data", "indexnow-key.txt");

function resolveIndexNowKey() {
  const fromEnv = (process.env.INDEXNOW_KEY || "").trim();
  if (fromEnv) return fromEnv;

  if (fs.existsSync(KEY_CACHE)) {
    const cached = fs.readFileSync(KEY_CACHE, "utf8").trim();
    if (cached) return cached;
  }

  const published = fs.readdirSync(ROOT).find((name) => {
    if (!/^[a-f0-9]{32}\.txt$/i.test(name)) return false;
    const body = fs.readFileSync(path.join(ROOT, name), "utf8").trim();
    return body.toLowerCase() === name.slice(0, -4).toLowerCase();
  });
  if (published) return published.slice(0, -4);

  throw new Error(
    "IndexNow key missing. Set INDEXNOW_KEY or add the public {key}.txt verification file. Generate will not mint a new key.",
  );
}

const INDEXNOW_KEY = resolveIndexNowKey();
const keyFile = path.join(ROOT, `${INDEXNOW_KEY}.txt`);
if (!fs.existsSync(keyFile) || fs.readFileSync(keyFile, "utf8").trim() !== INDEXNOW_KEY) {
  fs.writeFileSync(keyFile, INDEXNOW_KEY);
}

const origin = SITE_ORIGIN || "https://example.com";
const abs = (p) => (SITE_ORIGIN ? `${SITE_ORIGIN}${p}` : p);

if (!fs.existsSync(path.join(ROOT, "styles.css"))) {
  throw new Error("styles.css is missing. The generator no longer emits CSS.");
}

const personLd = {
  "@type": "Person",
  name: gigs.sellerName,
  url: gigs.sellerSite || gigs.sellerUrl,
  sameAs: [...new Set([gigs.sellerUrl, gigs.sellerSite, gigs.githubUrl].filter(Boolean))],
};

const indexBody = `
  <section class="hero" aria-labelledby="hero-title">
    <p class="kicker">Fiverr seller · ${esc(gigs.seller)}</p>
    <h1 id="hero-title">${esc(gigs.sellerName)} — Webflow, AI apps, and vibe coding gigs</h1>
    <p class="lede">${gigs.gigs.length} live Fiverr services with clean, indexable URLs. Each page maps to one search lane so the gigs do not cannibalize each other.</p>
    <p>${fiverrLink(gigs.sellerUrl, "Open Fiverr profile", "btn")}</p>
  </section>
  <section id="gigs" class="grid" aria-label="All Fiverr gigs">
    ${gigs.gigs.map((g) => `
      <article class="card" aria-labelledby="gig-${esc(g.id)}">
        <p class="kicker">${esc(g.primaryKeyword)} · ${esc(g.lane)}</p>
        <h2 id="gig-${esc(g.id)}"><a href="services/${esc(g.id)}.html">${esc(g.shortTitle)}</a></h2>
        <p>${esc(g.summary)}</p>
        <ul class="tags">${g.tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
        ${fiverrLink(g.url, "View gig on Fiverr", "btn")}
        <a class="btn ghost" href="services/${esc(g.id)}.html">Index page</a>
      </article>`).join("")}
  </section>`;

const indexLd = {
  "@context": "https://schema.org",
  "@graph": [
    personLd,
    {
      "@type": "WebSite",
      name: `${gigs.sellerName} Fiverr gigs`,
      url: SITE_ORIGIN ? `${SITE_ORIGIN}/` : origin,
      description: "Indexable directory of live Fiverr services by Zlatko Marjanović.",
      publisher: personLd,
    },
    {
      "@type": "ItemList",
      name: `${gigs.sellerName} Fiverr gigs`,
      numberOfItems: gigs.gigs.length,
      itemListElement: gigs.gigs.map((g, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: SITE_ORIGIN ? `${SITE_ORIGIN}/services/${g.id}.html` : `services/${g.id}.html`,
        name: g.title,
      })),
    },
  ],
};

fs.writeFileSync(path.join(ROOT, "index.html"), renderLayout({
  gigs,
  siteOrigin: SITE_ORIGIN,
  abs,
  title: `${gigs.sellerName} Fiverr gigs — Webflow, AI, Shopify, n8n`,
  description: "Indexable directory of Zlatko Marjanović Fiverr gigs: Webflow websites, vibe coding, Next.js SaaS, Shopify, Framer, n8n agents, and AI voice receptionists.",
  canonical: "/",
  jsonLd: indexLd,
  body: indexBody,
  navCurrent: "gigs",
}));

const servicesDir = path.join(ROOT, "services");
fs.mkdirSync(servicesDir, { recursive: true });

for (const g of gigs.gigs) {
  const related = relatedGigs(g, gigs.gigs);
  const body = `
    <nav class="crumbs" aria-label="Breadcrumb">
      <ol>
        <li><a href="../index.html">Gigs</a></li>
        <li aria-current="page">${esc(g.shortTitle)}</li>
      </ol>
    </nav>
    <section class="hero" aria-labelledby="service-title">
      <p class="kicker">${esc(g.category)} / ${esc(g.subcategory)}</p>
      <h1 id="service-title">${esc(g.title)}</h1>
      <p class="lede">${esc(g.description)}</p>
      <p class="meta">Primary Fiverr search term: <strong>${esc(g.primaryKeyword)}</strong> · Lane: ${esc(g.lane)}</p>
      <p>${fiverrLink(g.url, "Open this gig on Fiverr", "btn")}</p>
    </section>
    <section class="stack">
      <div class="panel">
        <h2>Search terms this gig should rank for</h2>
        <ul class="tags">${g.searchTerms.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
        <h3>Recommended Fiverr tags</h3>
        <ul class="tags">${g.tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
      </div>
      <div class="panel">
        <h2>What buyers get</h2>
        <p>${esc(g.summary)}</p>
        ${g.faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("")}
      </div>
      <div class="panel">
        <h2>Related gigs</h2>
        <nav aria-label="Related gigs">
        <ul>${related.map((r) => `<li><a href="${esc(r.id)}.html">${esc(r.shortTitle)}</a> — ${esc(r.primaryKeyword)}</li>`).join("")}</ul>
        </nav>
      </div>
    </section>`;

  const serviceLd = {
    "@type": "Service",
    name: g.title,
    description: g.description,
    url: SITE_ORIGIN ? `${SITE_ORIGIN}/services/${g.id}.html` : g.url,
    serviceType: g.primaryKeyword,
    provider: personLd,
    areaServed: "Worldwide",
    offers: {
      "@type": "Offer",
      url: g.url,
      availability: "https://schema.org/InStock",
    },
    mainEntityOfPage: SITE_ORIGIN ? `${SITE_ORIGIN}/services/${g.id}.html` : `services/${g.id}.html`,
  };
  const breadcrumbLd = {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Gigs",
        item: SITE_ORIGIN ? `${SITE_ORIGIN}/` : "../index.html",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: g.shortTitle,
        item: SITE_ORIGIN ? `${SITE_ORIGIN}/services/${g.id}.html` : `${g.id}.html`,
      },
    ],
  };
  const faqLd = g.faq.length
    ? {
      "@type": "FAQPage",
      mainEntity: g.faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    }
    : null;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": faqLd ? [serviceLd, faqLd, breadcrumbLd] : [serviceLd, breadcrumbLd],
  };

  fs.writeFileSync(path.join(servicesDir, `${g.id}.html`), renderLayout({
    gigs,
    siteOrigin: SITE_ORIGIN,
    abs,
    title: `${g.shortTitle} | ${gigs.sellerName} on Fiverr`,
    description: g.summary,
    canonical: `/services/${g.id}.html`,
    jsonLd,
    body,
    ogType: "article",
  }));
}

const robots = buildRobots({ origin });
const llms = buildLlms({ origin, sellerName: gigs.sellerName, gigs: gigs.gigs });

fs.writeFileSync(path.join(ROOT, "404.html"), renderLayout({
  gigs,
  siteOrigin: SITE_ORIGIN,
  abs,
  title: `Page not found | ${gigs.sellerName}`,
  description: "This Fiverr gig index page does not exist. Browse the live gigs or open the Fiverr profile.",
  canonical: "/404.html",
  robots: "noindex,follow",
  jsonLd: {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Page not found",
    url: SITE_ORIGIN ? `${SITE_ORIGIN}/404.html` : "/404.html",
  },
  body: `
    <section class="hero" aria-labelledby="not-found-title">
      <p class="kicker">404</p>
      <h1 id="not-found-title">This page is not in the gig index</h1>
      <p class="lede">The URL may be outdated or typed incorrectly. The live Fiverr services are on the hub home page.</p>
      <p><a class="btn" href="index.html">Back to all gigs</a></p>
    </section>`,
}));

fs.writeFileSync(path.join(ROOT, "sitemap.xml"), buildSitemap({ origin, gigs: gigs.gigs, updated: gigs.updated }));
fs.writeFileSync(path.join(ROOT, "rss.xml"), buildRss({ origin, sellerName: gigs.sellerName, gigs: gigs.gigs, updated: gigs.updated }));
fs.writeFileSync(path.join(ROOT, "robots.txt"), robots);
fs.writeFileSync(path.join(ROOT, "llms.txt"), llms);

console.log(`Hub generated. IndexNow key: ${INDEXNOW_KEY}`);
console.log("Set SITE_ORIGIN before deploy so sitemap/canonical/IndexNow use your real host.");
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
  console.error(err.message);
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
const keyFile = path.join(ROOT, `${INDEXNOW_KEY}.txt`);
if (!fs.existsSync(keyFile) || fs.readFileSync(keyFile, "utf8").trim() !== INDEXNOW_KEY) {
  fs.writeFileSync(keyFile, INDEXNOW_KEY);
}

const origin = SITE_ORIGIN || "https://example.com";
const abs = (p) => absUrl(SITE_ORIGIN, p);
const stylesPath = path.join(ROOT, "styles.css");
if (!fs.existsSync(stylesPath)) {
  throw new Error("styles.css is missing. The generator no longer emits CSS.");
}
if (fs.statSync(stylesPath).isDirectory()) {
  throw new Error("styles.css is a directory — expected a CSS file.");
}

const personLd = buildPersonLd(gigs);
const orderedGigs = sortedGigs(gigs.gigs);
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
  robots: "noindex,follow",
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
    llms: buildLlms({ origin, sellerName: gigs.sellerName, gigs: orderedGigs }),
    sitemap: buildSitemap({ origin, gigs: orderedGigs, updated: gigs.updated }),
    rss: buildRss({ origin, sellerName: gigs.sellerName, gigs: orderedGigs, updated: gigs.updated }),
    indexHtml,
    notFoundHtml,
    servicePages,
  });
} catch (err) {
  console.error(`Generate failed while writing hub files: ${err.message}`);
  process.exit(1);
}

console.log(`Hub generated (v${hubVersion()}). IndexNow key: ${INDEXNOW_KEY}`);
if (!SITE_ORIGIN) {
  console.log("Set SITE_ORIGIN before deploy so sitemap/canonical/IndexNow use your real host.");
}
