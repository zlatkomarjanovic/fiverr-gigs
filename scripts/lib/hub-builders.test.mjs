import test from "node:test";
import assert from "node:assert/strict";
import { sortedGigs, buildPersonLd, absUrl } from "./hub-builders.mjs";

test("sortedGigs orders by id", () => {
  const list = sortedGigs([{ id: "z" }, { id: "a" }]);
  assert.deepEqual(list.map((g) => g.id), ["a", "z"]);
});

test("buildPersonLd dedupes sameAs sorted", () => {
  const ld = buildPersonLd({
    sellerName: "Test",
    sellerUrl: "https://www.fiverr.com/a",
    sellerSite: "https://www.fiverr.com/a",
    githubUrl: "https://github.com/a",
  });
  assert.equal(ld.sameAs.length, 2);
});

test("absUrl joins origin and path", () => {
  assert.equal(absUrl("https://ex.com", "/rss.xml"), "https://ex.com/rss.xml");
  assert.equal(absUrl("", "/rss.xml"), "/rss.xml");
});
