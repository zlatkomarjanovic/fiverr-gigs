import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadGigs } from "./load-gigs.mjs";
import { validateGigsData } from "./validate-gigs-lib.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

test("validateGigsData passes for live gigs.json", () => {
  const gigs = loadGigs(ROOT);
  assert.deepEqual(validateGigsData(gigs), []);
});

test("validateGigsData rejects duplicate ids", () => {
  const gigs = loadGigs(ROOT);
  const broken = structuredClone(gigs);
  broken.gigs[1].id = broken.gigs[0].id;
  const errors = validateGigsData(broken);
  assert.ok(errors.some((e) => /duplicate id/i.test(e)));
});

test("validateGigsData rejects http urls", () => {
  const gigs = loadGigs(ROOT);
  const broken = structuredClone(gigs);
  broken.gigs[0].url = "http://www.fiverr.com/test";
  const errors = validateGigsData(broken);
  assert.ok(errors.some((e) => /https/i.test(e)));
});

test("validateGigsData rejects duplicate shortTitle", () => {
  const gigs = loadGigs(ROOT);
  const broken = structuredClone(gigs);
  broken.gigs[1].shortTitle = broken.gigs[0].shortTitle;
  const errors = validateGigsData(broken);
  assert.ok(errors.some((e) => /Duplicate shortTitle/i.test(e)));
});
