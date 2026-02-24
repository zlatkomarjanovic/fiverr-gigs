import { esc, fiverrLink } from "./html.mjs";

export function renderLayout({
  gigs,
  siteOrigin,
  abs,
  title,
  description,
  canonical,
  jsonLd,
  body,
  robots = "index,follow",
  ogType = "website",
  navCurrent = null,
}) {
  const canonPath = canonical === "/" && siteOrigin ? `${siteOrigin}/` : (siteOrigin ? `${siteOrigin}${canonical}` : canonical);
  const nested = canonical.includes("/services/");
  const homeHref = nested ? "../index.html" : "index.html";
  const sitemapHref = nested ? "../sitemap.xml" : "sitemap.xml";
  const gigsHref = nested ? "../index.html#gigs" : "#gigs";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="theme-color" content="#1f7a4d">
  <meta name="format-detection" content="telephone=no">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="author" content="${esc(gigs.sellerName)}">
  <link rel="canonical" href="${esc(canonPath)}">
  <meta name="robots" content="${esc(robots)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:type" content="${esc(ogType)}">
  <meta property="og:url" content="${esc(canonPath)}">
  <meta property="og:locale" content="en_US">
  <meta property="og:site_name" content="${esc(gigs.sellerName)} Fiverr gigs">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <link rel="alternate" type="application/rss+xml" href="${esc(abs("/rss.xml"))}">
  <link rel="sitemap" type="application/xml" href="${esc(abs("/sitemap.xml"))}">
  ${gigs.githubUrl ? `<link rel="me" href="${esc(gigs.githubUrl)}">` : ""}
  <link rel="stylesheet" href="${nested ? "../styles.css" : "styles.css"}">
  <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>
</head>
<body>
  <a class="skip-link" href="#content">Skip to content</a>
  <header role="banner">
    <a href="${homeHref}"><strong>${esc(gigs.sellerName)}</strong></a>
    <nav aria-label="Primary">
      <a href="${gigsHref}"${navCurrent === "gigs" ? ' aria-current="page"' : ""}>Gigs</a>
      ${fiverrLink(gigs.sellerUrl, "Fiverr profile")}
    </nav>
  </header>
  <main id="content">${body}</main>
  <footer role="contentinfo">
    <p>Official Fiverr gigs for ${esc(gigs.sellerName)}. Clean URLs only — no tracking parameters.</p>
    <p class="footer-links">
      <a href="${homeHref}">Hub home</a>
      · <a href="${sitemapHref}">Sitemap</a>
      ${gigs.sellerSite ? `· <a href="${esc(gigs.sellerSite)}" target="_blank" rel="noopener noreferrer">Portfolio<span class="sr-only"> (opens in new tab)</span></a>` : ""}
    </p>
  </footer>
  <!-- Optional analytics: inject Plausible, Fathom, or GA snippet here before </body> -->
</body>
</html>`;
}
