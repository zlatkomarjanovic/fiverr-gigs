#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const gigs = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "gigs.json"), "utf8"));
const SITE_ORIGIN = (process.env.SITE_ORIGIN || "").replace(/\/$/, "");
const keyPath = path.join(ROOT, "data", "indexnow-key.txt");
const INDEXNOW_KEY = (process.env.INDEXNOW_KEY || (fs.existsSync(keyPath)
  ? fs.readFileSync(keyPath, "utf8").trim()
  : crypto.randomBytes(16).toString("hex")));

fs.writeFileSync(keyPath, INDEXNOW_KEY);

const origin = SITE_ORIGIN || "https://example.com";
const abs = (p) => (SITE_ORIGIN ? `${SITE_ORIGIN}${p}` : p);

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const css = `:root {
  --bg: #f4efe6;
  --ink: #16140f;
  --muted: #5c564b;
  --line: #d8d0c2;
  --card: #fffdf8;
  --accent: #1f7a4d;
  --accent-ink: #073d24;
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  color: var(--ink);
  background: var(--bg);
  font: 18px/1.55 "Iowan Old Style", "Palatino Linotype", Palatino, serif;
}
a { color: var(--accent-ink); }
header, main, footer { width: min(1080px, calc(100% - 2rem)); margin: 0 auto; }
header { padding: 2rem 0 1rem; display: flex; justify-content: space-between; gap: 1rem; align-items: baseline; }
header a { text-decoration: none; color: inherit; }
nav { display: flex; gap: 1rem; font-size: 0.95rem; }
h1, h2, h3 { font-family: "Franklin Gothic Medium", "Arial Narrow", Arial, sans-serif; letter-spacing: -0.02em; line-height: 1.15; }
h1 { font-size: clamp(2.1rem, 5vw, 3.6rem); margin: 0 0 0.6rem; }
.lede { font-size: 1.2rem; color: var(--muted); max-width: 40rem; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; padding: 1.5rem 0 3rem; }
article.card, .panel {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 1.1rem 1.15rem 1.2rem;
}
.kicker { text-transform: uppercase; letter-spacing: 0.08em; font-size: 0.72rem; color: var(--muted); font-family: Arial, sans-serif; }
.card h2 { font-size: 1.25rem; margin: 0.35rem 0 0.45rem; }
.card p { margin: 0 0 0.8rem; color: var(--muted); font-size: 0.98rem; }
.tags { display: flex; flex-wrap: wrap; gap: 0.35rem; margin: 0 0 0.9rem; padding: 0; list-style: none; }
.tags li { font: 12px/1 Arial, sans-serif; border: 1px solid var(--line); border-radius: 999px; padding: 0.28rem 0.5rem; color: var(--muted); }
.btn {
  display: inline-block;
  background: var(--accent);
  color: #fff;
  text-decoration: none;
  border-radius: 999px;
  padding: 0.55rem 0.9rem;
  font: 600 0.92rem/1 Arial, sans-serif;
}
.btn.ghost { background: transparent; color: var(--accent-ink); border: 1px solid var(--line); }
.hero { padding: 1.5rem 0 0.5rem; }
.meta { color: var(--muted); font-size: 0.95rem; }
.stack { display: grid; gap: 1rem; padding-bottom: 3rem; }
footer { padding: 0 0 3rem; color: var(--muted); font-size: 0.92rem; }
`;

function layout({ title, description, canonical, jsonLd, body }) {
  const canon = SITE_ORIGIN ? `${SITE_ORIGIN}${canonical}` : canonical;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${esc(canon)}">
  <meta name="robots" content="index,follow">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:type" content="website">
  <link rel="alternate" type="application/rss+xml" href="${esc(abs("/rss.xml"))}">
  <link rel="stylesheet" href="${canonical.includes("/services/") ? "../styles.css" : "styles.css"}">
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
  <header>
    <a href="${canonical.includes("/services/") ? "../index.html" : "index.html"}"><strong>${esc(gigs.sellerName)}</strong></a>
    <nav>
      <a href="${canonical.includes("/services/") ? "../index.html#gigs" : "#gigs"}">Gigs</a>
      <a href="${esc(gigs.sellerUrl)}">Fiverr profile</a>
    </nav>
  </header>
  <main>${body}</main>
  <footer>
    <p>Official Fiverr gigs for ${esc(gigs.sellerName)}. Clean URLs only — no tracking parameters.</p>
  </footer>
</body>
</html>`;
}

const personLd = {
  "@type": "Person",
  name: gigs.sellerName,
  url: gigs.sellerUrl,
  sameAs: [gigs.sellerUrl],
};

const indexBody = `
  <section class="hero">
    <p class="kicker">Fiverr seller · ${esc(gigs.seller)}</p>
    <h1>${esc(gigs.sellerName)} — Webflow, AI apps, and vibe coding gigs</h1>
    <p class="lede">Twelve live Fiverr services with clean, indexable URLs. Each page maps to one search lane so the gigs do not cannibalize each other.</p>
    <p><a class="btn" href="${esc(gigs.sellerUrl)}">Open Fiverr profile</a></p>
  </section>
  <section id="gigs" class="grid">
    ${gigs.gigs.map((g) => `
      <article class="card">
        <p class="kicker">${esc(g.primaryKeyword)} · ${esc(g.lane)}</p>
        <h2><a href="services/${esc(g.id)}.html">${esc(g.shortTitle)}</a></h2>
        <p>${esc(g.summary)}</p>
        <ul class="tags">${g.tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
        <a class="btn" href="${esc(g.url)}">View gig on Fiverr</a>
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
        url: g.url,
        name: g.title,
      })),
    },
  ],
};

fs.writeFileSync(path.join(ROOT, "styles.css"), css);
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
  const related = gigs.gigs.filter((x) => x.id !== g.id).slice(0, 4);
  const body = `
    <section class="hero">
      <p class="kicker">${esc(g.category)} / ${esc(g.subcategory)}</p>
      <h1>${esc(g.title)}</h1>
      <p class="lede">${esc(g.description)}</p>
      <p class="meta">Primary Fiverr search term: <strong>${esc(g.primaryKeyword)}</strong> · Lane: ${esc(g.lane)}</p>
      <p><a class="btn" href="${esc(g.url)}">Open this gig on Fiverr</a></p>
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
        ${g.faq.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join("")}
      </div>
      <div class="panel">
        <h2>Related gigs</h2>
        <ul>${related.map((r) => `<li><a href="${esc(r.id)}.html">${esc(r.shortTitle)}</a> — ${esc(r.primaryKeyword)}</li>`).join("")}</ul>
      </div>
    </section>`;

  const jsonLd = {
    "@context": "https://schema.org",
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
      <link>${esc(g.url)}</link>
      <guid>${esc(g.url)}</guid>
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

${gigs.gigs.map((g) => `- [${g.title}](${g.url}) — ${g.primaryKeyword}`).join("\n")}
`;

fs.writeFileSync(path.join(ROOT, "sitemap.xml"), sitemap);
fs.writeFileSync(path.join(ROOT, "rss.xml"), rss);
fs.writeFileSync(path.join(ROOT, "robots.txt"), robots);
fs.writeFileSync(path.join(ROOT, "llms.txt"), llms);
fs.writeFileSync(path.join(ROOT, `${INDEXNOW_KEY}.txt`), INDEXNOW_KEY);

console.log(`Hub generated. IndexNow key: ${INDEXNOW_KEY}`);
console.log("Set SITE_ORIGIN before deploy so sitemap/canonical/IndexNow use your real host.");
