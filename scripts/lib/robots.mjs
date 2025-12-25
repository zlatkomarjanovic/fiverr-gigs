/** Build robots.txt for the hub. */
export function buildRobots({ origin }) {
  return `User-agent: *
Allow: /
# Crawl-delay not used — static site
Sitemap: ${origin}/sitemap.xml
`;
}
