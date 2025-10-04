import { esc, fiverrLink } from "./html.mjs";

const HUB_VERSION = "1.2.0";

export function hubVersion() {
  return HUB_VERSION;
}

/** @param {string} siteOrigin @param {string} path */
export function absUrl(siteOrigin, path) {
  return siteOrigin ? `${siteOrigin}${path}` : path;
}

export function buildPersonLd(gigs) {
  return {
    "@type": "Person",
    name: gigs.sellerName,
    jobTitle: "Freelancer",
    url: gigs.sellerSite || gigs.sellerUrl,
    sameAs: [...new Set([gigs.sellerUrl, gigs.sellerSite, gigs.githubUrl].filter(Boolean))].sort(),
  };
}

export function sortedGigs(gigs) {
  return [...gigs].sort((a, b) => a.id.localeCompare(b.id));
}

export function buildTagList(tags) {
  return `<ul class="tags" aria-label="Tags">${tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`;
}

export function buildFaqDetails(faq) {
  return faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("");
}

export function buildBreadcrumbNav(shortTitle) {
  return `
    <nav class="crumbs" aria-label="Breadcrumb">
      <ol>
        <li><a href="../index.html">Gigs</a></li>
        <li aria-current="page">${esc(shortTitle)}</li>
      </ol>
    </nav>`;
}

export function buildIndexCard(g) {
  return `
      <article class="card" aria-labelledby="gig-${esc(g.id)}">
        <p class="kicker">${esc(g.primaryKeyword)} · ${esc(g.lane)}</p>
        <h2 id="gig-${esc(g.id)}"><a href="services/${esc(g.id)}.html">${esc(g.shortTitle)}</a></h2>
        <p>${esc(g.summary)}</p>
        ${buildTagList(g.tags)}
        ${fiverrLink(g.url, "View gig on Fiverr", "btn")}
        <a class="btn ghost" href="services/${esc(g.id)}.html">Index page</a>
      </article>`;
}

export function buildIndexBody(gigs) {
  return `
  <section class="hero" aria-labelledby="hero-title">
    <p class="kicker">Fiverr seller · ${esc(gigs.seller)}</p>
    <h1 id="hero-title">${esc(gigs.sellerName)} — Webflow, AI apps, and vibe coding gigs</h1>
    <p class="lede">${gigs.gigs.length} live Fiverr services with clean, indexable URLs. Each page maps to one search lane so the gigs do not cannibalize each other.</p>
    <p>${fiverrLink(gigs.sellerUrl, "Open Fiverr profile", "btn")}</p>
  </section>
  <section id="gigs" class="grid" aria-label="All Fiverr gigs">
    ${gigs.gigs.map((g) => buildIndexCard(g)).join("")}
  </section>`;
}

export function buildServiceBody(g, related) {
  return `
    ${buildBreadcrumbNav(g.shortTitle)}
    <section class="hero" aria-labelledby="service-title">
      <p class="kicker">${esc(g.category)} / ${esc(g.subcategory)}</p>
      <h1 id="service-title">${esc(g.title)}</h1>
      <p class="lede">${esc(g.description)}</p>
      <p class="meta">Primary Fiverr search term: <strong>${esc(g.primaryKeyword)}</strong> · Lane: ${esc(g.lane)}</p>
      <p>${fiverrLink(g.url, "Open this gig on Fiverr", "btn")}</p>
    </section>
    <section class="stack" aria-label="Gig details">
      <div class="panel">
        <h2>Search terms this gig should rank for</h2>
        ${buildTagList(g.searchTerms)}
        <h3>Recommended Fiverr tags</h3>
        ${buildTagList(g.tags)}
      </div>
      <div class="panel">
        <h2>What buyers get</h2>
        <p>${esc(g.summary)}</p>
        ${buildFaqDetails(g.faq)}
      </div>
      <div class="panel">
        <h2>Related gigs</h2>
        <nav aria-label="Related gigs">
        <ul>${related.length ? related.map((r) => `<li><a href="${esc(r.id)}.html">${esc(r.shortTitle)}</a> — ${esc(r.primaryKeyword)}</li>`).join("") : "<li>No related gigs indexed yet.</li>"}</ul>
        </nav>
      </div>
    </section>`;
}

export function buildIndexLd(gigs, siteOrigin, origin, personLd) {
  const list = sortedGigs(gigs.gigs);
  return {
    "@context": "https://schema.org",
    "@graph": [
      personLd,
      {
        "@type": "WebSite",
        name: `${gigs.sellerName} Fiverr gigs`,
        url: siteOrigin ? `${siteOrigin}/` : origin,
        description: "Indexable directory of live Fiverr services by Zlatko Marjanović.",
        inLanguage: "en",
        publisher: personLd,
        potentialAction: {
          "@type": "SearchAction",
          target: siteOrigin ? `${siteOrigin}/#gigs` : "#gigs",
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "ItemList",
        name: `${gigs.sellerName} Fiverr gigs`,
        numberOfItems: list.length,
        itemListElement: list.map((g, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: siteOrigin ? `${siteOrigin}/services/${g.id}.html` : `services/${g.id}.html`,
          name: g.title,
        })),
      },
    ],
  };
}

export function buildServiceLd(g, gigs, siteOrigin, personLd) {
  const pageUrl = siteOrigin ? `${siteOrigin}/services/${g.id}.html` : `services/${g.id}.html`;
  return {
    "@type": "Service",
    name: g.title,
    description: g.description,
    url: pageUrl,
    serviceType: g.primaryKeyword,
    inLanguage: "en",
    provider: personLd,
    areaServed: "Worldwide",
    offers: {
      "@type": "Offer",
      url: g.url,
      availability: "https://schema.org/InStock",
      priceCurrency: "USD",
    },
    mainEntityOfPage: pageUrl,
  };
}

export function buildServiceJsonLd(g, gigs, siteOrigin, personLd) {
  const serviceLd = buildServiceLd(g, gigs, siteOrigin, personLd);
  const breadcrumbLd = {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Gigs",
        item: siteOrigin ? `${siteOrigin}/` : "../index.html",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: g.shortTitle,
        item: siteOrigin ? `${siteOrigin}/services/${g.id}.html` : `${g.id}.html`,
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
  return {
    "@context": "https://schema.org",
    "@graph": faqLd ? [serviceLd, faqLd, breadcrumbLd] : [serviceLd, breadcrumbLd],
  };
}

export function resolveIndexNowKey(root, fs, path) {
  const fromEnv = (process.env.INDEXNOW_KEY || "").trim();
  if (fromEnv) return fromEnv;

  const keyCache = path.join(root, "data", "indexnow-key.txt");
  if (fs.existsSync(keyCache)) {
    const cached = fs.readFileSync(keyCache, "utf8").trim();
    if (cached) return cached;
  }

  const published = fs.readdirSync(root).find((name) => {
    if (!/^[a-f0-9]{32}\.txt$/i.test(name)) return false;
    const body = fs.readFileSync(path.join(root, name), "utf8").trim();
    return body.toLowerCase() === name.slice(0, -4).toLowerCase();
  });
  if (published) return published.slice(0, -4);

  throw new Error(
    "IndexNow key missing. Set INDEXNOW_KEY or add the public {key}.txt verification file. Generate will not mint a new key.",
  );
}

export function writeHubFiles(root, fs, path, { robots, llms, sitemap, rss, indexHtml, notFoundHtml, servicePages }) {
  fs.writeFileSync(path.join(root, "index.html"), indexHtml);
  fs.writeFileSync(path.join(root, "404.html"), notFoundHtml);
  fs.writeFileSync(path.join(root, "sitemap.xml"), sitemap);
  fs.writeFileSync(path.join(root, "rss.xml"), rss);
  fs.writeFileSync(path.join(root, "robots.txt"), robots);
  fs.writeFileSync(path.join(root, "llms.txt"), llms);
  for (const [filename, html] of Object.entries(servicePages)) {
    fs.writeFileSync(path.join(root, "services", filename), html);
  }
}
