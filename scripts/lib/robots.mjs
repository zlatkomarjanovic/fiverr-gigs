/** Build robots.txt for the hub. */
export function buildRobots({ origin }) {
  return `User-agent: *
Allow: /
Sitemap: ${origin}/sitemap.xml
`;
}
