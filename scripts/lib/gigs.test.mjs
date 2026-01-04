import test from "node:test";
import assert from "node:assert/strict";
import { gigTerms, relatedGigs } from "./gigs.mjs";

const sample = [
  {
    id: "webflow-website-seo",
    shortTitle: "Webflow website with SEO",
    primaryKeyword: "webflow website",
    category: "Website Design",
    subcategory: "Webflow",
    searchTerms: ["webflow website", "webflow seo"],
    tags: ["webflow website", "cms website"],
  },
  {
    id: "webflow-seo-ready",
    shortTitle: "SEO-ready Webflow setup",
    primaryKeyword: "webflow seo",
    category: "Website Design",
    subcategory: "Webflow",
    searchTerms: ["webflow seo", "webflow setup"],
    tags: ["webflow seo", "webflow cms"],
  },
  {
    id: "shopify-ai",
    shortTitle: "Shopify store",
    primaryKeyword: "shopify store",
    category: "Website Design",
    subcategory: "Shopify",
    searchTerms: ["shopify store"],
    tags: ["shopify store"],
  },
];

test("gigTerms lowercases and merges fields", () => {
  const terms = gigTerms(sample[0]);
  assert.ok(terms.includes("webflow website"));
  assert.ok(terms.includes("website design"));
  assert.ok(terms.filter((t) => t === "webflow website").length >= 1);
});

test("relatedGigs prefers keyword overlap", () => {
  const related = relatedGigs(sample[0], sample, 2);
  assert.equal(related[0].id, "webflow-seo-ready");
  assert.equal(related.length, 2);
});
