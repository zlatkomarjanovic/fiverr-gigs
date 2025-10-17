/** @param {object} gig */
export function gigTerms(gig) {
  return [gig.primaryKeyword, gig.category, gig.subcategory, ...(gig.searchTerms || []), ...(gig.tags || [])]
    .map((term) => String(term).toLowerCase());
}

export function relatedGigs(gig, all, limit = 4) {
  const mine = new Set(gigTerms(gig));
  return all
    .filter((other) => other.id !== gig.id)
    .map((other) => ({
      other,
      score: gigTerms(other).filter((term) => mine.has(term)).length,
    }))
    .sort((a, b) => b.score - a.score || a.other.shortTitle.localeCompare(b.other.shortTitle))
    .slice(0, limit)
    .map((entry) => entry.other);
}
