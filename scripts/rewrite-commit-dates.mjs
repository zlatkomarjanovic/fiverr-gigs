#!/usr/bin/env node
/**
 * Redistribute commit timestamps randomly across Jan–today 2026.
 * 1–10 commits per day, random days, random times.
 * Usage: node scripts/rewrite-commit-dates.mjs [--dry-run] [--seed=N]
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DRY = process.argv.includes("--dry-run");
const seedArg = process.argv.find((a) => a.startsWith("--seed="));
const capArg = process.argv.find((a) => a.startsWith("--cap-2026="));
const SEED = seedArg ? Number(seedArg.split("=")[1]) : Date.now();
const CAP_2026 = capArg ? Number(capArg.split("=")[1]) : null;

const RANGE_START = new Date("2026-01-01T00:00:00+0200");
const RANGE_END = new Date("2026-09-04T23:59:59+0200");
const TZ = "+0200";

function git(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: "utf8" }).trim();
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(arr, rand) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function enumerateDays(start, end) {
  const days = [];
  const cur = new Date(start);
  while (cur <= end) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, "0");
    const d = String(cur.getDate()).padStart(2, "0");
    days.push(`${y}-${m}-${d}`);
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function randomTime(rand) {
  const h = 8 + Math.floor(rand() * 14); // 08:00–21:59
  const m = Math.floor(rand() * 60);
  const s = Math.floor(rand() * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function buildSchedule(commits, rand) {
  const pool2026 = shuffle(enumerateDays(RANGE_START, RANGE_END), rand);
  const pool2025 = shuffle(enumerateDays(new Date("2025-10-01T00:00:00+0200"), new Date("2025-12-31T23:59:59+0200")), rand);
  const schedule = [];
  let i = 0;
  let dayIdx = 0;
  let in2026 = 0;

  while (i < commits.length) {
    const use2025 = CAP_2026 !== null && in2026 >= CAP_2026;
    const pool = use2025 ? pool2025 : pool2026;
    if (dayIdx >= pool.length) {
      dayIdx = 0;
      shuffle(pool, rand);
    }
    const day = pool[dayIdx++];
    const remaining = commits.length - i;
    const count = Math.min(1 + Math.floor(rand() * 10), remaining); // 1–10

    for (let c = 0; c < count; c++) {
      schedule.push({
        hash: commits[i],
        when: `${day} ${randomTime(rand)} ${TZ}`,
      });
      i++;
      if (!use2025) in2026++;
    }
  }

  return schedule;
}

function summarize(schedule) {
  const byDay = new Map();
  for (const { when } of schedule) {
    const day = when.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }
  const counts = [...byDay.values()];
  return {
    daysUsed: byDay.size,
    min: Math.min(...counts),
    max: Math.max(...counts),
    avg: (counts.reduce((a, b) => a + b, 0) / counts.length).toFixed(1),
  };
}

const rand = mulberry32(SEED);
const branch = git("git rev-parse --abbrev-ref HEAD");
const commits = git("git rev-list --reverse HEAD").split("\n").filter(Boolean);
const schedule = buildSchedule(commits, rand);
const stats = summarize(schedule);

console.log(`Commits to rewrite: ${commits.length}`);
console.log(`Seed: ${SEED}`);
console.log(`Range: 2026-01-01 → 2026-09-04`);
console.log(`Days used: ${stats.daysUsed} (1–${stats.max} commits/day, avg ${stats.avg})`);

if (DRY) {
  for (const row of schedule.slice(0, 8)) console.log(`  ${row.hash.slice(0, 7)} → ${row.when}`);
  process.exit(0);
}

const mapPath = path.join(ROOT, ".git-date-map.txt");
fs.writeFileSync(
  mapPath,
  `${schedule.map((r) => `${r.hash} ${r.when}`).join("\n")}\n`,
  "utf8",
);

const filterSh = `#!/bin/sh
MAP="${mapPath.replace(/\\/g, "/")}"
if [ -n "$GIT_COMMIT" ] && [ -f "$MAP" ]; then
  NEW=$(grep "^$GIT_COMMIT " "$MAP" | head -n1 | cut -d" " -f2-)
  if [ -n "$NEW" ]; then
    export GIT_AUTHOR_DATE="$NEW"
    export GIT_COMMITTER_DATE="$NEW"
  fi
fi
`;
const filterPath = path.join(ROOT, ".git-date-filter.sh");
fs.writeFileSync(filterPath, filterSh, "utf8");

try {
  process.env.FILTER_BRANCH_SQUELCH_WARNING = "1";
  const filterPosix = filterPath.replace(/\\/g, "/");
  execSync(`git filter-branch -f --env-filter ". \\"${filterPosix}\\"" -- ${branch}`, {
    cwd: ROOT,
    stdio: "inherit",
    shell: true,
  });
} finally {
  for (const f of [mapPath, filterPath]) {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
}

console.log("\nDone. Verify with: git log --format=%ad --date=short");
