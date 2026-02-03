import test from "node:test";
import assert from "node:assert/strict";
import { esc, fiverrLink } from "../lib/html.mjs";

test("esc escapes HTML special characters", () => {
  assert.equal(esc(`Tom & Jerry "quotes" <tag>`), "Tom &amp; Jerry &quot;quotes&quot; &lt;tag&gt;");
});

test("esc coerces non-strings", () => {
  assert.equal(esc(42), "42");
  assert.equal(esc(undefined), "");
});

test("esc strips control characters", () => {
  assert.equal(esc("a\u0007b"), "ab");
});

test("fiverrLink adds noopener and escapes href", () => {
  const html = fiverrLink('https://example.com?q="1"', "Book", "btn");
  assert.match(html, /rel="noopener noreferrer"/);
  assert.match(html, /class="btn"/);
  assert.match(html, /href="https:\/\/example.com\?q=&quot;1&quot;"/);
});

test("fiverrLink works without className on anchor", () => {
  const html = fiverrLink("https://www.fiverr.com/seller", "Profile");
  assert.match(html, /^<a href=/);
  assert.doesNotMatch(html, /^<a [^>]*class=/);
  assert.match(html, /sr-only/);
  assert.match(html, /opens in new tab/);
});
