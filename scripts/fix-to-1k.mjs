#!/usr/bin/env node
/**
 * Reset fiverr-gigs contributions to ~1k by deleting ghost repos and pushing once.
 * Requires GH_TOKEN or gh auth with delete_repo scope.
 *
 *   set GH_TOKEN=ghp_xxx   (needs delete_repo + repo)
 *   node scripts/fix-to-1k.mjs
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OWNER = "zlatkomarjanovic";
const REPOS = [`${OWNER}/fiverr-gigs-archive`, `${OWNER}/fiverr-gigs`];
const TARGET = 1000;
const QUERY = `query { user(login: "${OWNER}") { contributionsCollection(from: "2026-01-01T00:00:00Z", to: "2026-12-31T23:59:59Z") { contributionCalendar { totalContributions } } } } }`;

function run(cmd, opts = {}) {
  console.log(`> ${cmd}`);
  return execSync(cmd, { cwd: ROOT, stdio: "inherit", shell: true, ...opts });
}

function api(method, endpoint) {
  run(`gh api -X ${method} ${endpoint}`);
}

function contributions() {
  const out = execSync(`gh api graphql -f query=${JSON.stringify(QUERY)}`, {
    cwd: ROOT,
    encoding: "utf8",
  });
  return JSON.parse(out).data.user.contributionsCollection.contributionCalendar.totalContributions;
}

function repoExists(full) {
  try {
    execSync(`gh repo view ${full}`, { cwd: ROOT, stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

console.log(`Current 2026 contributions: ${contributions()}`);

for (const repo of REPOS) {
  if (!repoExists(repo)) {
    console.log(`Skip delete (missing): ${repo}`);
    continue;
  }
  try {
    api("DELETE", `repos/${repo}`);
    console.log(`Deleted ${repo}`);
  } catch {
    console.error(`\nCannot delete ${repo}. Run:\n  gh auth refresh -h github.com -s delete_repo\nOr delete manually in repo Settings → Danger zone.\n`);
    process.exit(1);
  }
}

console.log(`After delete: ${contributions()} (may lag a few minutes)`);

run(
  `gh repo create ${OWNER}/fiverr-gigs --public --description "Public crawlable index of live Fiverr gigs"`,
);

run("git remote set-url origin https://github.com/zlatkomarjanovic/fiverr-gigs.git");
run("git push -u origin main --force");

run(
  `gh api -X POST repos/${OWNER}/fiverr-gigs/pages -f build_type=legacy -f source[branch]=main -f source[path]=/`,
);

const after = contributions();
const commits = Number(
  execSync("git rev-list --count HEAD", { cwd: ROOT, encoding: "utf8" }).trim(),
);
console.log(`\nPushed ${commits} commits once. Graph reports ${after} (target ~${TARGET}).`);
console.log("Do NOT run rewrite-commit-dates.mjs again.");

if (after > TARGET + 50) {
  console.error(`Still over target — wait 5 min for GitHub to drop deleted-repo commits, then re-check.`);
  process.exit(1);
}
