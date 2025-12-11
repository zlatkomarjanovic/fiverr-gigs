/** Build robots.txt for the hub. */
export function buildRobots({ origin }) {
  return `User-agent: *
Allow: /
# Static assets cache at CDN — no special rules here
# Crawl-delay not used — static site
Sitemap: ${origin}/sitemap.xml
`;
}
