import { esc } from "./html.mjs";

export function buildSitemap({ origin, gigs, updated }) {
  const sorted = [...gigs].sort((a, b) => a.id.localeCompare(b.id));
  const urls = [
    { loc: "/", lastmod: updated, priority: "1.0" },
    ...sorted.map((g) => ({ loc: `/services/${g.id}.html`, lastmod: updated, priority: "0.8" })),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${esc(origin + u.loc)}</loc><lastmod>${u.lastmod}</lastmod><changefreq>weekly</changefreq><priority>${u.priority}</priority></url>`).join("\n")}
</urlset>
`;
}
