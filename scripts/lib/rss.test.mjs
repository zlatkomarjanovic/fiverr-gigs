import test from "node:test";
import assert from "node:assert/strict";
import { buildRss } from "./rss.mjs";

test("buildRss escapes titles and sets xml:lang", () => {
  const xml = buildRss({
    origin: "https://example.com",
    sellerName: "Tom & Co",
    updated: "2026-01-15",
    gigs: [{ id: "a", title: 'Build "fast"', summary: "Summary" }],
  });
  assert.match(xml, /xml:lang="en"/);
  assert.match(xml, /Tom &amp; Co Fiverr gigs/);
  assert.match(xml, /Build &quot;fast&quot;/);
});
    gigs: [{ id: "b", title: 'Build "fast"', summary: "Summary" }, { id: "a", title: "A", summary: "S" }],