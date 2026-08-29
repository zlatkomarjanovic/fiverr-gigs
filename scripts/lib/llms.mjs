export function buildLlms({ origin, sellerName, gigs }) {
  return `# ${sellerName} Fiverr gigs

Index: ${origin}/

${gigs.map((g) => `- [${g.title}](${origin}/services/${g.id}.html) — ${g.primaryKeyword}. Book: ${g.url}`).join("\n")}
`;
}
