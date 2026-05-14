import { esc } from "./html.mjs";

export function buildRss({ origin, sellerName, gigs, updated }) {
  const pubDate = new Date(`${updated}T12:00:00.000Z`).toUTCString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xml:lang="en">
  <channel>
    <title>${esc(sellerName)} Fiverr gigs</title>
    <link>${esc(origin)}/</link>
    <description>Live Fiverr services from ${esc(sellerName)}</description>
    <lastBuildDate>${pubDate}</lastBuildDate>
    ${gigs.map((g) => `
    <item>
      <title>${esc(g.title)}</title>
      <link>${esc(`${origin}/services/${g.id}.html`)}</link>
      <guid>${esc(`${origin}/services/${g.id}.html`)}</guid>
      <description>${esc(g.summary)}</description>
      <pubDate>${pubDate}</pubDate>
    </item>`).join("")}
  </channel>
</rss>
`;
}
