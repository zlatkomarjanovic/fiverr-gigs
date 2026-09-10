import { esc, fiverrLink } from "./html.mjs";
import { hubVersion } from "./hub-builders.mjs";

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
  pageMeta = {},
}) {
  const canonPath = canonical === "/" && siteOrigin ? `${siteOrigin}/` : (siteOrigin ? `${siteOrigin}${canonical}` : canonical);
  const nested = canonical.includes("/services/");
  const homeHref = nested ? "../index.html" : "index.html";
  const sitemapHref = nested ? "../sitemap.xml" : "sitemap.xml";
  const gigsHref = nested ? "../index.html#gigs" : "#gigs";
  const ogImage = siteOrigin ? `${siteOrigin}/favicon.svg` : "favicon.svg";
  const modified = pageMeta.updated || gigs.updated;

  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light">
  <meta name="theme-color" content="#1f7a4d" media="(prefers-color-scheme: light)">
  <meta name="format-detection" content="telephone=no">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <meta name="generator" content="fiverr-gig-indexer ${hubVersion()}">
  <meta name="msapplication-TileColor" content="#1f7a4d">
  <meta name="application-name" content="${esc(gigs.sellerName)} Fiverr gigs">
  <meta name="apple-mobile-web-app-title" content="${esc(gigs.sellerName)}">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="copyright" content="${esc(gigs.sellerName)}">
  <meta name="rating" content="general">
  <meta name="distribution" content="global">
  <meta name="coverage" content="Worldwide">
  <meta name="category" content="Fiverr gig directory">
  ${pageMeta.pagename ? `<meta name="pagename" content="${esc(pageMeta.pagename)}">` : ""}
  ${pageMeta.gigId ? `<meta name="identifier" content="${esc(pageMeta.gigId)}">` : ""}
  <meta name="dcterms.modified" content="${esc(modified)}">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="author" content="${esc(gigs.sellerName)}">
  <link rel="home" href="${esc(siteOrigin ? `${siteOrigin}/` : homeHref)}">
  <link rel="canonical" href="${esc(canonPath)}">
  <meta name="robots" content="${esc(robots)}, max-snippet:-1, max-image-preview:large">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:type" content="${esc(ogType)}">
  <meta property="og:url" content="${esc(canonPath)}">
  <meta property="og:image" content="${esc(ogImage)}">
  <meta property="og:image:alt" content="${esc(gigs.sellerName)} Fiverr gigs">
  <meta property="og:locale" content="en_US">
  <meta property="og:site_name" content="${esc(gigs.sellerName)} Fiverr gigs">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${esc(ogImage)}">
  <meta name="twitter:url" content="${esc(canonPath)}">
  <link rel="alternate" type="application/rss+xml" href="${esc(abs("/rss.xml"))}" title="RSS">
  <link rel="alternate" type="text/plain" href="${esc(abs("/llms.txt"))}" title="LLMs">
  <link rel="sitemap" type="application/xml" href="${esc(abs("/sitemap.xml"))}">
  ${gigs.githubUrl ? `<link rel="me" href="${esc(gigs.githubUrl)}">` : ""}
  <link rel="icon" href="${nested ? "../favicon.svg" : "favicon.svg"}" type="image/svg+xml">
  <!-- favicon is decorative -->
  <link rel="stylesheet" href="${nested ? "../styles.css" : "styles.css"}">
  <!-- JSON-LD sanitized via unicode escape -->
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
  <main id="content" tabindex="-1">${body}</main>
  <footer role="contentinfo">
    <p>Official Fiverr gigs for ${esc(gigs.sellerName)}. Clean URLs only, no tracking parameters.</p>
    <nav class="footer-links" aria-label="Footer">
      <a href="${homeHref}">Hub home</a>
      <a href="${sitemapHref}">Sitemap</a>
      ${gigs.sellerSite ? `<a href="${esc(gigs.sellerSite)}" target="_blank" rel="noopener noreferrer">Portfolio<span class="sr-only"> (opens in new tab)</span></a>` : ""}
    </nav>
  </footer>
  <!-- Optional analytics: inject Plausible, Fathom, or GA snippet here before </body> -->
</body>
</html>`;
}
