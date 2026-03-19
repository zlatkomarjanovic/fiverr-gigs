import test from "node:test";
import assert from "node:assert/strict";
import { escapeXml } from "./xml.mjs";

test("escapeXml escapes special characters", () => {
  assert.equal(escapeXml(`Tom & "Co"`), "Tom &amp; &quot;Co&quot;");
});
