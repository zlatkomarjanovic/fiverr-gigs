import test from "node:test";
import assert from "node:assert/strict";
import { renderLayout } from "./layout.mjs";

const gigs = {
  sellerName: "Test Seller",
  sellerUrl: "https://www.fiverr.com/test",
  githubUrl: "https://github.com/test",
};

test("renderLayout includes core meta and favicon", () => {
  const html = renderLayout({
    gigs,
    siteOrigin: "https://example.com",
    abs: (p) => `https://example.com${p}`,
    title: "Page title",
    description: "Page description",
    canonical: "/",
    jsonLd: { "@context": "https://schema.org", "@type": "WebPage", name: "Page title" },
    body: "<p>Body</p>",
  });
  assert.match(html, /lang="en"/);
  assert.match(html, /rel="icon" href="favicon.svg"/);
  assert.match(html, /format-detection" content="telephone=no"/);
  assert.match(html, /twitter:url/);
  assert.match(html, /og:image/);
  assert.match(html, /generator" content="fiverr-gig-indexer/);
});

test("renderLayout uses nested asset paths on service pages", () => {
  const html = renderLayout({
    gigs,
    siteOrigin: "https://example.com",
    abs: (p) => `https://example.com${p}`,
    title: "Service",
    description: "Summary",
    canonical: "/services/webflow.html",
    jsonLd: { "@context": "https://schema.org", "@type": "WebPage", name: "Service" },
    body: "<p>Body</p>",
    ogType: "article",
    navCurrent: "gigs",
  });
  assert.match(html, /href="\.\.\/favicon.svg"/);
  assert.match(html, /href="\.\.\/styles.css"/);
  assert.match(html, /og:type" content="article"/);
  assert.match(html, /aria-current="page">Gigs/);
});
