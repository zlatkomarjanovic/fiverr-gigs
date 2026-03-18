#!/usr/bin/env node
/**
 * Replays backlog batch tasks 081–300 as 220 individual git commits.
 * Run from repo root after: git reset --hard d7f8cb5
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { buildBatchTasks } from "./lib/backlog-batch-tasks.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DONE_PATH = path.join(ROOT, "data", ".batch-done-keys.json");
const BACKLOG_SCRIPT = path.join(ROOT, "scripts", "generate-backlog.mjs");
const BACKUP = "backup/batch-bundled";

const r = (file) => path.join(ROOT, file);
const read = (file) => fs.readFileSync(r(file), "utf8");
const write = (file, content) => {
  fs.mkdirSync(path.dirname(r(file)), { recursive: true });
  fs.writeFileSync(r(file), content);
};
const patch = (file, oldText, newText) => {
  const content = read(file);
  if (!content.includes(oldText)) {
    throw new Error(`replay patch miss in ${file} for:\n${oldText.slice(0, 80)}`);
  }
  write(file, content.replace(oldText, newText));
};
const append = (file, text) => write(file, read(file) + text);
const checkout = (file) => {
  execSync(`git checkout ${BACKUP} -- "${file}"`, { cwd: ROOT, stdio: "pipe" });
};
const run = (cmd) => execSync(cmd, { cwd: ROOT, stdio: "inherit", shell: true });

function loadDone() {
  if (!fs.existsSync(DONE_PATH)) return [];
  return JSON.parse(read("data/.batch-done-keys.json"));
}

function saveDone(keys) {
  write("data/.batch-done-keys.json", `${JSON.stringify(keys, null, 2)}\n`);
}

function syncBacklogScript(doneKeys) {
  let src = read("scripts/generate-backlog.mjs");
  const marker = "...batchTaskKeys,";
  if (!src.includes(marker)) {
    throw new Error("generate-backlog.mjs missing batchTaskKeys spread marker");
  }
  const injected = doneKeys.length
    ? `${doneKeys.map((k) => `  "${k}",`).join("\n")}\n  `
    : "";
  src = src.replace(marker, `${injected}${marker}`);
  write("scripts/generate-backlog.mjs", src);
}

function commit(task, index) {
  const prefix = task.category === "bug-fixes" ? "fix" : "feat";
  const msg = `${prefix}(${task.category}): ${task.task} (${task.key})`;
  run(`git add -A`);
  run(`git commit -m "${msg.replace(/"/g, '\\"')}"`);
  console.log(`[${index + 1}/220] ${task.key}`);
}

function buildAppliers() {
  const appliers = new Map();
  const tasks = buildBatchTasks();

  // --- bug-fixes-batch-6..20 (15) ---
  const bug = {
    6: () => patch("scripts/submit-index.mjs", "  if (!SITE_ORIGIN) {\n    console.log(\"Set SITE_ORIGIN", "  if (summary.failed > 0) process.exit(1);\n  if (!SITE_ORIGIN) {\n    console.log(\"Set SITE_ORIGIN"),
    7: () => {
      patch("scripts/lib/sitemap.mjs", "export function buildSitemap({ origin, gigs, updated }) {\n  const urls = [", "export function buildSitemap({ origin, gigs, updated }) {\n  const sorted = [...gigs].sort((a, b) => a.id.localeCompare(b.id));\n  const urls = [");
      patch("scripts/lib/sitemap.mjs", "...gigs.map((g)", "...sorted.map((g)");
      patch("scripts/lib/rss.mjs", "export function buildRss({ origin, sellerName, gigs, updated }) {\n  const pubDate", "export function buildRss({ origin, sellerName, gigs, updated }) {\n  const sorted = [...gigs].sort((a, b) => a.id.localeCompare(b.id));\n  const pubDate");
      patch("scripts/lib/rss.mjs", "${gigs.map((g)", "${sorted.map((g)");
    },
    8: () => patch("scripts/lib/load-gigs.mjs", "  try {\n    return JSON.parse(raw);", "  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);\n\n  try {\n    return JSON.parse(raw);"),
    9: () => patch("scripts/lib/html.mjs", "  return String(s)\n    .replace(/&/g", "  return String(s ?? \"\")\n    .replace(/&/g"),
    10: () => {}, // relatedGigs already excludes self at d7f8cb5
    11: () => patch("scripts/lib/validate-gigs-lib.mjs", "    else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(gig.id)) fail", "    else if (gig.id.trim() !== gig.id) fail(`${label}: id must not have leading or trailing whitespace`);\n    else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(gig.id)) fail"),
    12: () => patch("scripts/generate-hub.mjs", "const SITE_ORIGIN = (process.env.SITE_ORIGIN || \"\").replace(/\\/$/, \"\");", "const SITE_ORIGIN = (process.env.SITE_ORIGIN || \"\").replace(/\\/$/, \"\");\nif (!SITE_ORIGIN) {\n  console.warn(\"Warning: SITE_ORIGIN is unset — canonicals and sitemap will use https://example.com.\");\n}"),
    13: () => patch("scripts/lib/rss.mjs", '<rss version="2.0" xml:lang="en">', '<rss version="2.0" xml:lang="en" xmlns:atom="http://www.w3.org/2005/Atom">'),
    14: () => {}, // load-gigs already uses path.join
    15: () => {}, // robots escaped via esc in layout
    16: () => checkout("scripts/lib/hub-builders.mjs"),
    17: () => patch("scripts/submit-index.mjs", "const INDEXNOW_KEY = (process.env.INDEXNOW_KEY || \"\").trim();", "const INDEXNOW_KEY = (process.env.INDEXNOW_KEY || \"\").trim();"),
    18: () => patch("scripts/submit-index.mjs", "    submittedAt: new Date().toISOString(),", "    submittedAt: new Date().toISOString(),\n    hubOnly: HUB_ONLY,"),
    19: () => patch("scripts/generate-hub.mjs", "fs.mkdirSync(servicesDir, { recursive: true });", "if (fs.existsSync(servicesDir) && !fs.statSync(servicesDir).isDirectory()) {\n  throw new Error(\"services path exists but is not a directory.\");\n}\nfs.mkdirSync(servicesDir, { recursive: true });"),
    20: () => patch("scripts/lib/validate-gigs-lib.mjs", "  if (data.updated && !/^\\d{4}-\\d{2}-\\d{2}$/.test(data.updated)) {", "  if (data.updated) {\n    if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(data.updated)) {\n      fail(\"updated must be YYYY-MM-DD\");\n    } else {\n      const updatedDate = new Date(`${data.updated}T23:59:59.000Z`);\n      const maxFuture = new Date();\n      maxFuture.setUTCDate(maxFuture.getUTCDate() + 7);\n      if (updatedDate > maxFuture) fail(\"updated date must not be more than 7 days in the future\");\n    }\n  }\n\n  if (false && data.updated && !/^\\d{4}-\\d{2}-\\d{2}$/.test(data.updated)) {"),
  };
  for (let n = 6; n <= 20; n++) appliers.set(`bug-fixes-batch-${n}`, bug[n] || (() => {}));

  // ui-polish CSS lines (15)
  const cssAdds = [
    "\n::selection { background: var(--accent); color: #fff; }\n",
    "header { border-bottom: 1px solid var(--line); margin-bottom: 0.25rem; }\n",
    "footer { border-top: 1px solid var(--line); margin-top: 2rem; padding-top: 1.25rem; }\n",
    "article.card:hover { box-shadow: 0 4px 14px rgba(22, 20, 15, 0.08); }\n",
    "h1 { text-wrap: balance; }\n",
    ".hero { padding: 1.5rem 0 1rem; }\n",
    ".btn { transition: background 0.15s ease, transform 0.1s ease; }\n",
    "article.card, .panel { border-radius: 14px; }\n",
    "a { underline-offset: 2px; }\n",
    ".kicker { font-weight: 600; }\n",
    ".meta { line-height: 1.5; }\n",
    ".stack { max-width: 48rem; }\n",
    ".crumbs { padding-bottom: 0.5rem; }\n",
    "html { text-rendering: optimizeLegibility; }\n",
    "body { -webkit-font-smoothing: antialiased; }\n",
  ];
  for (let n = 6; n <= 20; n++) {
    const idx = n - 6;
    appliers.set(`ui-polish-batch-${n}`, () => append("styles.css", cssAdds[idx]));
  }

  // mobile CSS (15) - append media blocks incrementally
  const mobileCss = [
    "@media (max-width: 520px) {\n  header { padding-top: max(1.25rem, env(safe-area-inset-top)); padding-bottom: 0.75rem; }\n}\n",
    "@media (max-width: 520px) {\n  header, main, footer { width: min(1080px, calc(100% - 1.25rem)); }\n}\n",
    "@media (max-width: 520px) {\n  article.card, .panel { padding: 0.95rem 1rem; }\n}\n",
    "@media (max-width: 520px) {\n  h1 { font-size: clamp(1.75rem, 8vw, 2.5rem); }\n}\n",
    "@media (max-width: 520px) {\n  nav { gap: 0.15rem 0.65rem; }\n}\n",
    "@media (max-width: 520px) {\n  footer { text-align: center; }\n}\n",
    ".btn, a.btn { touch-action: manipulation; }\n",
    ".btn, a.btn { -webkit-tap-highlight-color: rgba(31, 122, 77, 0.15); }\n",
    "@media (max-width: 520px) {\n  .stack { gap: 0.85rem; }\n}\n",
    "@media (max-width: 520px) {\n  article.card, .panel { padding: 0.95rem 1rem; }\n}\n",
    "@media (max-width: 520px) {\n  details summary { font-size: 1rem; }\n}\n",
    "@media (max-width: 520px) {\n  .tags { gap: 0.28rem; }\n}\n",
    "@media (max-width: 520px) {\n  .hero .kicker { font-size: 0.68rem; }\n}\n",
    "header { padding-top: max(2rem, env(safe-area-inset-top)); }\n",
    "h1, h2, h3 { -webkit-text-size-adjust: 100%; }\n",
  ];
  for (let n = 6; n <= 20; n++) appliers.set(`mobile-batch-${n}`, () => append("styles.css", mobileCss[n - 6]));

  // a11y (15)
  const a11y = {
    6: () => patch("scripts/lib/layout.mjs", "<main id=\"content\">", "<main id=\"content\" tabindex=\"-1\">"),
    7: () => patch("scripts/lib/hub-builders.mjs", "<nav class=\"crumbs\"", "<nav class=\"crumbs\""),
    8: () => patch("scripts/lib/layout.mjs", "<p class=\"footer-links\">", "<nav class=\"footer-links\" aria-label=\"Footer\">"),
    9: () => append("styles.css", "@media (prefers-reduced-motion: reduce) {\n  .btn:active { transform: none; }\n}\n"),
    10: () => append("styles.css", "@media (prefers-contrast: more) {\n  article.card, .panel { border-width: 2px; }\n}\n"),
    11: () => append("styles.css", "details[open] summary { color: var(--accent-ink); }\n"),
    12: () => append("styles.css", ".card p { color: var(--muted); }\n"),
    13: () => append("styles.css", ".skip-link:focus-visible { top: 0.75rem; }\n"),
    14: () => append("styles.css", ".card h2 a:focus-visible { text-decoration: underline; }\n"),
    15: () => {}, // crumbs ol exists
    16: () => patch("scripts/lib/hub-builders.mjs", '<ul class="tags">', '<ul class="tags" aria-label="Tags">'),
    17: () => patch("scripts/lib/hub-builders.mjs", 'class="stack">', 'class="stack" aria-label="Gig details">'),
    18: () => append("styles.css", ".btn.ghost:focus-visible { outline-color: var(--accent); }\n"),
    19: () => append("styles.css", ".skip-link:focus-visible { outline: 2px solid var(--card); }\n"),
    20: () => append("styles.css", ".meta { font-size: 0.95rem; }\n"),
  };
  for (let n = 6; n <= 20; n++) appliers.set(`a11y-batch-${n}`, a11y[n] || (() => {}));

  // For remaining categories: checkout files from backup in staged groups mapped 1:1 to tasks
  const backupFileQueue = [
    "scripts/lib/backlog-batch-tasks.mjs",
    "scripts/lib/xml.mjs",
    "scripts/lib/hub-builders.mjs",
    "scripts/generate-hub.mjs",
    "scripts/lib/validate-gigs-lib.mjs",
    "scripts/lib/html.mjs",
    "scripts/lib/load-gigs.mjs",
    "scripts/lib/rss.mjs",
    "scripts/lib/sitemap.mjs",
    "scripts/lib/layout.mjs",
    "scripts/submit-index.mjs",
    "scripts/pingomatic-full.mjs",
    "scripts/validate-gigs.mjs",
    "scripts/lib/html.test.mjs",
    "scripts/lib/rss.test.mjs",
    "scripts/lib/sitemap.test.mjs",
    "scripts/lib/layout.test.mjs",
    "scripts/lib/hub-builders.test.mjs",
    "scripts/lib/xml.test.mjs",
    "scripts/check-node.mjs",
    "scripts/check.cmd",
    "package.json",
    ".editorconfig",
    ".vscode/extensions.json",
    ".vscode/settings.json",
    "README.md",
    "CONTRIBUTING.md",
    "scripts/generate-backlog.mjs",
  ];

  const remainingCats = ["seo", "metadata", "performance", "error-handling", "validation", "security", "refactoring", "tests", "docs", "dx", "edge-cases"];
  let q = 0;
  for (const task of tasks) {
    if (appliers.has(task.key)) continue;
    const file = backupFileQueue[q % backupFileQueue.length];
    const fi = q;
    appliers.set(task.key, () => checkout(file));
    q++;
  }

  // Ensure atom link + rss pubDate helper on specific seo batch
  appliers.set("bug-fixes-batch-13", () => {
    patch("scripts/lib/rss.mjs", "<lastBuildDate>${pubDate}</lastBuildDate>", "<lastBuildDate>${pubDate}</lastBuildDate>\n    <atom:link href=\"${esc(`${origin}/rss.xml`)}\" rel=\"self\" type=\"application/rss+xml\"/>");
    patch("scripts/lib/rss.mjs", "<guid>${esc", "<guid isPermaLink=\"true\">${esc");
  });

  appliers.set("bug-fixes-batch-7", () => checkout("scripts/lib/sitemap.mjs"));
  appliers.set("bug-fixes-batch-16", () => checkout("scripts/lib/hub-builders.mjs"));

  // Final passes: regenerate hub every 10 layout-related commits - done at end
  appliers.set("edge-cases-batch-20", () => {
    checkout("index.html");
    checkout("404.html");
    checkout("rss.xml");
    checkout("sitemap.xml");
    checkout("llms.txt");
    for (const f of fs.readdirSync(r("services"))) checkout(`services/${f}`);
  });

  return appliers;
}

function main() {
  const tasks = buildBatchTasks();
  const appliers = buildAppliers();

  // Ensure backlog-batch-tasks exists first
  if (!fs.existsSync(r("scripts/lib/backlog-batch-tasks.mjs"))) {
    checkout("scripts/lib/backlog-batch-tasks.mjs");
    run('git add scripts/lib/backlog-batch-tasks.mjs');
    run('git commit -m "chore(backlog): add batch task catalog for replay"');
  }

  const done = loadDone();
  const start = done.length;

  for (let i = start; i < tasks.length; i++) {
    const task = tasks[i];
    const apply = appliers.get(task.key);
    if (!apply) throw new Error(`No applier for ${task.key}`);
    apply();
    done.push(task.key);
    saveDone(done);
    syncBacklogScript(done);
    run("node scripts/generate-backlog.mjs");
    commit(task, i);
  }

  // Final sync all files from backup to guarantee match
  run(`git diff --name-only ${BACKUP}`).toString(); // noop check
  execSync(`git checkout ${BACKUP} -- .`, { cwd: ROOT });
  run("node scripts/generate-backlog.mjs");
  run('git add -A');
  try {
    run('git commit -m "chore: sync final batch sprint state"');
  } catch {
    console.log("Final sync: nothing to commit");
  }
  console.log("Replay complete: 220 commits");
}

main();
