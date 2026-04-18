const REQUIRED_ROOT = ["seller", "sellerName", "sellerUrl", "updated", "gigs"];
const REQUIRED_GIG = [
  "id", "slug", "url", "title", "shortTitle", "primaryKeyword", "lane",
  "searchTerms", "tags", "category", "subcategory", "summary", "description", "faq",
];

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value) {
  return Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString);
}

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function hasUniqueStrings(values, label, fail) {
  const seen = new Set();
  for (const value of values) {
    const key = value.toLowerCase();
    if (seen.has(key)) fail(`${label}: duplicate value "${value}"`);
    seen.add(key);
  }
}

/** @param {unknown} data @returns {string[]} Validation error messages; empty when valid. */
export function validateGigsData(data) {
  const errors = [];
  const fail = (message) => errors.push(message);

  for (const key of REQUIRED_ROOT) {
    if (!(key in data)) fail(`Missing root field: ${key}`);
  }

  if (!Array.isArray(data.gigs) || data.gigs.length === 0) {
    fail("gigs must be a non-empty array");
  }

  if (data.sellerUrl && !/^https:\/\/www\.fiverr\.com\//.test(data.sellerUrl)) {
    fail("sellerUrl must be an https Fiverr profile URL");
  }

  if (data.seller && data.sellerUrl && !data.sellerUrl.includes(`/${data.seller}`)) {
    fail("seller handle must match sellerUrl path");
  }

  if (data.updated && !/^\d{4}-\d{2}-\d{2}$/.test(data.updated)) {
    fail("updated must be YYYY-MM-DD");
  }

  if (data.sellerSite && !isHttpsUrl(data.sellerSite)) fail("sellerSite must be an https URL");
  if (data.githubUrl && !isHttpsUrl(data.githubUrl)) fail("githubUrl must be an https URL");

  const ids = new Set();
  const slugs = new Set();
  const urls = new Set();
  const keywords = new Set();
  const shortTitles = new Set();

  for (const [index, gig] of (data.gigs || []).entries()) {
    const label = gig?.id || `#${index}`;

    for (const key of REQUIRED_GIG) {
      if (!(key in (gig || {}))) fail(`${label}: missing ${key}`);
    }

    if (!isNonEmptyString(gig?.id)) fail(`${label}: id must be a non-empty string`);
    else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(gig.id)) fail(`${label}: id must be kebab-case (${gig.id})`);
    else if (ids.has(gig.id)) fail(`Duplicate id: ${gig.id}`);
    else ids.add(gig.id);

    if (!isNonEmptyString(gig?.slug)) fail(`${label}: slug must be a non-empty string`);
    else if (slugs.has(gig.slug)) fail(`Duplicate slug: ${gig.slug}`);
    else slugs.add(gig.slug);

    if (!isNonEmptyString(gig?.lane)) fail(`${label}: lane must be a non-empty string`);
    if (!isNonEmptyString(gig?.category)) fail(`${label}: category must be a non-empty string`);
    if (!isNonEmptyString(gig?.subcategory)) fail(`${label}: subcategory must be a non-empty string`);

    if (!isNonEmptyString(gig?.url) || !gig.url.startsWith("https://www.fiverr.com/")) {
      fail(`${label}: url must be an https Fiverr gig URL`);
    } else if (gig.url.startsWith("http://")) {
      fail(`${label}: url must not use http`);
    } else if (!gig.url.endsWith(`/${gig.slug}`)) {
      fail(`${label}: url must end with /${gig.slug}`);
    } else if (urls.has(gig.url)) fail(`Duplicate url: ${gig.url}`);
    else urls.add(gig.url);

    if (!isNonEmptyString(gig?.primaryKeyword)) fail(`${label}: primaryKeyword must be a non-empty string`);
    else if (keywords.has(gig.primaryKeyword)) fail(`Duplicate primaryKeyword: ${gig.primaryKeyword}`);
    else keywords.add(gig.primaryKeyword);

    if (!isNonEmptyString(gig?.summary)) fail(`${label}: summary must be a non-empty string`);
    else if (gig.summary.length > 160) fail(`${label}: summary should be ≤160 chars (${gig.summary.length})`);

    if (!isNonEmptyString(gig?.description)) fail(`${label}: description must be a non-empty string`);
    else if (gig.description.length > 500) fail(`${label}: description should be ≤500 chars (${gig.description.length})`);

    if (!isNonEmptyString(gig?.title)) fail(`${label}: title must be a non-empty string`);
    else if (gig.title.length > 80) fail(`${label}: title should be ≤80 chars (${gig.title.length})`);

    if (!isNonEmptyString(gig?.shortTitle)) fail(`${label}: shortTitle must be a non-empty string`);
    else if (shortTitles.has(gig.shortTitle)) fail(`Duplicate shortTitle: ${gig.shortTitle}`);
    else shortTitles.add(gig.shortTitle);

    if (!isStringArray(gig?.searchTerms)) fail(`${label}: searchTerms must be a non-empty string array`);
    else hasUniqueStrings(gig.searchTerms, `${label}: searchTerms`, fail);

    if (!isStringArray(gig?.tags)) fail(`${label}: tags must be a non-empty string array`);
    else hasUniqueStrings(gig.tags, `${label}: tags`, fail);

    if ((gig?.tags || []).length > 5) fail(`${label}: Fiverr allows at most 5 tags`);

    if (!Array.isArray(gig?.faq) || gig.faq.length === 0) {
      fail(`${label}: faq must be a non-empty array`);
    } else {
      if (gig.faq.length > 5) fail(`${label}: FAQ count should be ≤5 (${gig.faq.length})`);
      for (const [faqIndex, item] of gig.faq.entries()) {
        if (!isNonEmptyString(item?.q) || !isNonEmptyString(item?.a)) {
          fail(`${label}: faq[${faqIndex}] needs non-empty q and a`);
        }
      }
    }
  }

  return errors;
}
function isForbiddenUrl(value) {
  return /^(javascript|data|file|vbscript):/i.test(String(value).trim());
}

function isGithubUrl(value) {
  try {
    return new URL(value).hostname === "github.com";
  } catch {
    return false;
  }
}

function hasScriptTag(value) {
  return /<script\b/i.test(String(value));
}

/** @param {unknown} data @returns {string[]} Validation error messages; empty when valid. */
export function validateGigsData(data) {
  const errors = [];
  const fail = (message) => errors.push(message);
  for (const key of REQUIRED_ROOT) {
    if (!(key in data)) fail(`Missing root field: ${key}`);
  if (!Array.isArray(data.gigs) || data.gigs.length === 0) {
    fail("gigs must be a non-empty array");
  }

  if (data.sellerUrl && !/^https:\/\/www\.fiverr\.com\//.test(data.sellerUrl)) {
    fail("sellerUrl must be an https Fiverr profile URL");
  } else if (data.sellerUrl && isForbiddenUrl(data.sellerUrl)) {
    fail("sellerUrl uses a forbidden protocol");
  } else if (data.sellerUrl && /\?/.test(data.sellerUrl)) {
    fail("sellerUrl must not include query parameters");
  }
  if (!isNonEmptyString(data.sellerName) || data.sellerName.trim().length < 2) {
    fail("sellerName must be at least 2 characters");
  }
  if (data.updated) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.updated)) {
      fail("updated must be YYYY-MM-DD");
    } else {
      const updatedDate = new Date(`${data.updated}T23:59:59.000Z`);
      const maxFuture = new Date();
      maxFuture.setUTCDate(maxFuture.getUTCDate() + 7);
      if (updatedDate > maxFuture) fail("updated date must not be more than 7 days in the future");
    }
  }

  if (data.seller && data.sellerUrl && !data.sellerUrl.includes(`/${data.seller}`)) {
    fail("seller handle must match sellerUrl path");
  }

  if (data.sellerSite) {
    if (!isHttpsUrl(data.sellerSite)) fail("sellerSite must be an https URL");
    else if (isForbiddenUrl(data.sellerSite)) fail("sellerSite uses a forbidden protocol");
    else {
      try {
        new URL(data.sellerSite).hostname;
      } catch {
        fail("sellerSite must have a valid hostname");
      }
    }
  }
  if (data.githubUrl) {
    if (!isHttpsUrl(data.githubUrl)) fail("githubUrl must be an https URL");
    else if (!isGithubUrl(data.githubUrl)) fail("githubUrl must be a github.com URL");
    else if (isForbiddenUrl(data.githubUrl)) fail("githubUrl uses a forbidden protocol");
  }