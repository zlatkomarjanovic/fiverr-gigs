export function buildLlms({ origin, sellerName, gigs, updated }) {
  return `# ${sellerName} Fiverr gigs

Index: ${origin}/
Updated: ${updated || "unknown"}

${gigs.map((g) => `- [${g.title}](${origin}/services/${g.id}.html) — ${g.primaryKeyword}. Fiverr: ${g.url}`).join("\n")}
`;
}
