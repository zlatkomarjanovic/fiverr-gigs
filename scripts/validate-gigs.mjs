#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.join(ROOT, "data", "gigs.json");

const REQUIRED_ROOT = ["seller", "sellerName", "sellerUrl", "updated", "gigs"];
const REQUIRED_GIG = [
  "id",
  "slug",
  "url",
  "title",
  "shortTitle",
  "primaryKeyword",
  "lane",
  "searchTerms",
  "tags",
  "category",
  "subcategory",
  "summary",
  "description",
  "faq",
];

const errors = [];

function fail(message) {
  errors.push(message);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value) {
  return Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString);
}

let data;
try {
  data = JSON.parse(fs.readFileSync(file, "utf8"));
} catch (err) {
  console.error(`data/gigs.json is not valid JSON: ${err.message}`);
  process.exit(1);
}

for (const key of REQUIRED_ROOT) {
  if (!(key in data)) fail(`Missing root field: ${key}`);
}

if (!Array.isArray(data.gigs) || data.gigs.length === 0) {
  fail("gigs must be a non-empty array");
}

if (data.sellerUrl && !/^https:\/\/www\.fiverr\.com\//.test(data.sellerUrl)) {
  fail("sellerUrl must be an https Fiverr profile URL");
}

if (data.updated && !/^\d{4}-\d{2}-\d{2}$/.test(data.updated)) {
  fail("updated must be YYYY-MM-DD");
}

function isHttpsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

if (data.sellerSite && !isHttpsUrl(data.sellerSite)) {
  fail("sellerSite must be an https URL");
}

if (data.githubUrl && !isHttpsUrl(data.githubUrl)) {
  fail("githubUrl must be an https URL");
}

const ids = new Set();
const slugs = new Set();
const urls = new Set();
const keywords = new Set();

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

  if (!isNonEmptyString(gig?.url) || !gig.url.startsWith("https://www.fiverr.com/")) {
    fail(`${label}: url must be an https Fiverr gig URL`);
  } else if (!gig.url.endsWith(`/${gig.slug}`)) {
    fail(`${label}: url must end with /${gig.slug}`);
  } else if (urls.has(gig.url)) fail(`Duplicate url: ${gig.url}`);
  else urls.add(gig.url);

  if (!isNonEmptyString(gig?.primaryKeyword)) fail(`${label}: primaryKeyword must be a non-empty string`);
  else if (keywords.has(gig.primaryKeyword)) fail(`Duplicate primaryKeyword: ${gig.primaryKeyword}`);
  else keywords.add(gig.primaryKeyword);

  if (!isNonEmptyString(gig?.summary)) fail(`${label}: summary must be a non-empty string`);
  else if (gig.summary.length > 160) fail(`${label}: summary should be ≤160 chars for meta descriptions (${gig.summary.length})`);

  if (!isNonEmptyString(gig?.description)) fail(`${label}: description must be a non-empty string`);
  else if (gig.description.length > 500) fail(`${label}: description should be ≤500 chars (${gig.description.length})`);

  if (!isNonEmptyString(gig?.title)) fail(`${label}: title must be a non-empty string`);
  else if (gig.title.length > 80) fail(`${label}: title should be ≤80 chars (${gig.title.length})`);

  if (!isStringArray(gig?.searchTerms)) fail(`${label}: searchTerms must be a non-empty string array`);
  if (!isStringArray(gig?.tags)) fail(`${label}: tags must be a non-empty string array`);
  if ((gig?.tags || []).length > 5) fail(`${label}: Fiverr allows at most 5 tags`);

  if (!Array.isArray(gig?.faq) || gig.faq.length === 0) {
    fail(`${label}: faq must be a non-empty array`);
  } else {
    for (const [faqIndex, item] of gig.faq.entries()) {
      if (!isNonEmptyString(item?.q) || !isNonEmptyString(item?.a)) {
        fail(`${label}: faq[${faqIndex}] needs q and a`);
      }
    }
  }
}

if (errors.length) {
  console.error(`gigs.json failed ${errors.length} check${errors.length === 1 ? "" : "s"}:`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`gigs.json OK — ${data.gigs.length} gigs, unique ids/slugs/urls/keywords.`);
