import fs from "node:fs";
import path from "node:path";

export function loadGigs(root) {
  const file = path.join(root, "data", "gigs.json");
  if (!fs.existsSync(file)) {
    throw new Error(`Missing ${path.relative(root, file).replace(/\\/g, "/")}. Add gig data before generating.`);
  }

  let raw;
  try {
    raw = fs.readFileSync(file, "utf8");
  } catch (err) {
    throw new Error(`Cannot read data/gigs.json: ${err.message}`);
  }

  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);

  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`data/gigs.json is not valid JSON: ${err.message}`);
  }
}
