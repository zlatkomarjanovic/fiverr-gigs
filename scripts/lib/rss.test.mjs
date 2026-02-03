import test from "node:test";
import assert from "node:assert/strict";
import { buildRss } from "./rss.mjs";

test("buildRss escapes titles and sets xml:lang", () => {
  const xml = buildRss({
    origin: "https://example.com",
    sellerName: "Tom & Co",
    updated: "2026-01-15",
    gigs: [{ id: "b", title: 'Build "fast"', summary: "Summary" }, { id: "a", title: "A", summary: "S" }],
  });
  assert.match(xml, /xml:lang="en"/);
  assert.match(xml, /atom:link href="https:\/\/example.com\/rss.xml"/);
  assert.match(xml, /guid isPermaLink="true"/);
  assert.match(xml, /Build &quot;fast&quot;/);
  assert.ok(xml.indexOf("/services/a.html") < xml.indexOf("/services/b.html"));
});
