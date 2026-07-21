#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const gigs = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "gigs.json"), "utf8"));
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

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fiverrLink(href, label, className) {
  const cls = className ? ` class="${className}"` : "";
  return `<a${cls} href="${esc(href)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
}

function gigTerms(gig) {
  return [gig.primaryKeyword, gig.category, gig.subcategory, ...(gig.searchTerms || []), ...(gig.tags || [])]
    .map((term) => String(term).toLowerCase());
}

function relatedGigs(gig, all, limit = 4) {
  const mine = new Set(gigTerms(gig));
  return all
    .filter((other) => other.id !== gig.id)
    .map((other) => ({
      other,
      score: gigTerms(other).filter((term) => mine.has(term)).length,
    }))
    .sort((a, b) => b.score - a.score || a.other.shortTitle.localeCompare(b.other.shortTitle))
    .slice(0, limit)
    .map((entry) => entry.other);
}

if (!fs.existsSync(path.join(ROOT, "styles.css"))) {
  throw new Error("styles.css is missing. The generator no longer emits CSS.");
}

function layout({ title, description, canonical, jsonLd, body, robots = "index,follow" }) {
  const canon = SITE_ORIGIN ? `${SITE_ORIGIN}${canonical}` : canonical;
  const nested = canonical.includes("/services/");
  const homeHref = nested ? "../index.html" : "index.html";
  const sitemapHref = nested ? "../sitemap.xml" : "sitemap.xml";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${esc(canon)}">
  <meta name="robots" content="${esc(robots)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${esc(canon)}">
  <meta property="og:locale" content="en_US">
  <meta property="og:site_name" content="${esc(gigs.sellerName)} Fiverr gigs">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <link rel="alternate" type="application/rss+xml" href="${esc(abs("/rss.xml"))}">
  <link rel="stylesheet" href="${nested ? "../styles.css" : "styles.css"}">
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
  <a class="skip-link" href="#content">Skip to content</a>
  <header>
    <a href="${homeHref}"><strong>${esc(gigs.sellerName)}</strong></a>
    <nav aria-label="Primary">
      <a href="${nested ? "../index.html#gigs" : "#gigs"}">Gigs</a>
      ${fiverrLink(gigs.sellerUrl, "Fiverr profile")}
    </nav>
  </header>
  <main id="content">${body}</main>
  <footer>
    <p>Official Fiverr gigs for ${esc(gigs.sellerName)}. Clean URLs only — no tracking parameters.</p>
    <p>
      <a href="${homeHref}">Hub home</a>
      · <a href="${sitemapHref}">Sitemap</a>
      ${gigs.sellerSite ? `· <a href="${esc(gigs.sellerSite)}" target="_blank" rel="noopener noreferrer">Portfolio</a>` : ""}
    </p>
  </footer>
</body>
</html>`;
}

const personLd = {
  "@type": "Person",
  name: gigs.sellerName,
  url: gigs.sellerSite || gigs.sellerUrl,
  sameAs: [...new Set([gigs.sellerUrl, gigs.sellerSite, gigs.githubUrl].filter(Boolean))],
};

const indexBody = `
  <section class="hero">
    <p class="kicker">Fiverr seller · ${esc(gigs.seller)}</p>
    <h1>${esc(gigs.sellerName)} — Webflow, AI apps, and vibe coding gigs</h1>
    <p class="lede">${gigs.gigs.length} live Fiverr services with clean, indexable URLs. Each page maps to one search lane so the gigs do not cannibalize each other.</p>
    <p>${fiverrLink(gigs.sellerUrl, "Open Fiverr profile", "btn")}</p>
  </section>
  <section id="gigs" class="grid">
    ${gigs.gigs.map((g) => `
      <article class="card">
        <p class="kicker">${esc(g.primaryKeyword)} · ${esc(g.lane)}</p>
        <h2><a href="services/${esc(g.id)}.html">${esc(g.shortTitle)}</a></h2>
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

fs.writeFileSync(path.join(ROOT, "index.html"), layout({
  title: `${gigs.sellerName} Fiverr gigs — Webflow, AI, Shopify, n8n`,
  description: "Indexable directory of Zlatko Marjanović Fiverr gigs: Webflow websites, vibe coding, Next.js SaaS, Shopify, Framer, n8n agents, and AI voice receptionists.",
  canonical: "/",
  jsonLd: indexLd,
  body: indexBody,
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
    <section class="hero">
      <p class="kicker">${esc(g.category)} / ${esc(g.subcategory)}</p>
      <h1>${esc(g.title)}</h1>
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
        <ul>${related.map((r) => `<li><a href="${esc(r.id)}.html">${esc(r.shortTitle)}</a> — ${esc(r.primaryKeyword)}</li>`).join("")}</ul>
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
    mainEntityOfPage: g.url,
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

  fs.writeFileSync(path.join(servicesDir, `${g.id}.html`), layout({
    title: `${g.shortTitle} | ${gigs.sellerName} on Fiverr`,
    description: g.summary,
    canonical: `/services/${g.id}.html`,
    jsonLd,
    body,
  }));
}

const urls = [
  { loc: "/", lastmod: gigs.updated },
  ...gigs.gigs.map((g) => ({ loc: `/services/${g.id}.html`, lastmod: gigs.updated })),
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${esc(origin + u.loc)}</loc><lastmod>${u.lastmod}</lastmod><changefreq>weekly</changefreq></url>`).join("\n")}
</urlset>
`;

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${esc(gigs.sellerName)} Fiverr gigs</title>
    <link>${esc(origin)}/</link>
    <description>Live Fiverr services from ${esc(gigs.sellerName)}</description>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${gigs.gigs.map((g) => `
    <item>
      <title>${esc(g.title)}</title>
      <link>${esc(`${origin}/services/${g.id}.html`)}</link>
      <guid>${esc(`${origin}/services/${g.id}.html`)}</guid>
      <description>${esc(g.summary)}</description>
    </item>`).join("")}
  </channel>
</rss>
`;

const robots = `User-agent: *
Allow: /
Sitemap: ${origin}/sitemap.xml
`;

const llms = `# ${gigs.sellerName} Fiverr gigs

Index: ${origin}/

${gigs.gigs.map((g) => `- [${g.title}](${origin}/services/${g.id}.html) — ${g.primaryKeyword}. Book: ${g.url}`).join("\n")}
`;

fs.writeFileSync(path.join(ROOT, "404.html"), layout({
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
    <section class="hero">
      <p class="kicker">404</p>
      <h1>This page is not in the gig index</h1>
      <p class="lede">The URL may be outdated or typed incorrectly. The live Fiverr services are on the hub home page.</p>
      <p><a class="btn" href="index.html">Back to all gigs</a></p>
    </section>`,
}));

fs.writeFileSync(path.join(ROOT, "sitemap.xml"), sitemap);
fs.writeFileSync(path.join(ROOT, "rss.xml"), rss);
fs.writeFileSync(path.join(ROOT, "robots.txt"), robots);
fs.writeFileSync(path.join(ROOT, "llms.txt"), llms);

console.log(`Hub generated. IndexNow key: ${INDEXNOW_KEY}`);
console.log("Set SITE_ORIGIN before deploy so sitemap/canonical/IndexNow use your real host.");
