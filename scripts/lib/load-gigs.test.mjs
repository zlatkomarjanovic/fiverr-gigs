import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadGigs } from "./load-gigs.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

test("loadGigs reads live gigs.json", () => {
  const gigs = loadGigs(ROOT);
  assert.ok(Array.isArray(gigs.gigs));
  assert.ok(gigs.gigs.length > 0);
});

test("loadGigs throws on missing file", () => {
  assert.throws(() => loadGigs(path.join(ROOT, "missing-dir")), /Missing .*gigs\.json/);
});

test("loadGigs throws on invalid JSON", () => {
  const tmp = fs.mkdtempSync(path.join(ROOT, ".tmp-load-gigs-"));
  try {
    fs.mkdirSync(path.join(tmp, "data"), { recursive: true });
    fs.writeFileSync(path.join(tmp, "data", "gigs.json"), "{not json");
    assert.throws(() => loadGigs(tmp), /not valid JSON/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
