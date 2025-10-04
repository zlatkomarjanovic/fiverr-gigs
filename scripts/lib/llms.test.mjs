import test from "node:test";
import assert from "node:assert/strict";
import { buildLlms } from "./llms.mjs";

test("buildLlms lists gigs with hub links", () => {
  const txt = buildLlms({
    origin: "https://example.com",
    sellerName: "Seller",
    updated: "2026-01-01",
    gigs: [{ id: "a", title: "Title A", primaryKeyword: "kw", url: "https://www.fiverr.com/x/a" }],
  });
  assert.match(txt, /Index: https:\/\/example.com\//);
  assert.match(txt, /\[Title A\]\(https:\/\/example.com\/services\/a.html\)/);
});
