#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadGigs } from "./lib/load-gigs.mjs";
import { validateGigsData } from "./lib/validate-gigs-lib.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

let data;
try {
  data = loadGigs(ROOT);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

const errors = validateGigsData(data);
if (errors.length) {
  console.error(`[validate] gigs.json failed ${errors.length} check${errors.length === 1 ? "" : "s"}:`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`gigs.json OK — ${data.gigs.length} gigs, ${new Set(data.gigs.map((g) => g.shortTitle)).size} unique short titles.`);
