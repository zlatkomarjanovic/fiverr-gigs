import test from "node:test";
import assert from "node:assert/strict";
import { buildRobots } from "./robots.mjs";

test("buildRobots references sitemap", () => {
  const txt = buildRobots({ origin: "https://example.com" });
  assert.match(txt, /Allow: \//);
  assert.match(txt, /Sitemap: https:\/\/example.com\/sitemap.xml/);
});
