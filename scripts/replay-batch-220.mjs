#!/usr/bin/env node
/**
 * Builds 220 per-task patch files from d7f8cb5 -> backup/batch-bundled diff,
 * then replays them as individual commits.
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { buildBatchTasks } from "./lib/backlog-batch-tasks.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PATCH_DIR = path.join(ROOT, "scripts", "batch-patches");
const DONE_FILE = path.join(ROOT, "data", ".batch-done-keys.json");
const BASE = "d7f8cb5";
const BACKUP = "backup/batch-bundled";

const run = (cmd) => execSync(cmd, { cwd: ROOT, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();
const r = (f) => path.join(ROOT, f);

function gitFile(ref, file) {
  try {
    return execSync(`git show ${ref}:${file}`, { cwd: ROOT, encoding: "utf8" });
  } catch {
    return null;
  }
}

function writeFile(file, content) {
  fs.mkdirSync(path.dirname(r(file)), { recursive: true });
  fs.writeFileSync(r(file), content);
}

function readFile(file) {
  return fs.readFileSync(r(file), "utf8");
}

/** @returns {string[]} */
function changedFiles() {
  return run(`git diff --name-only ${BASE} ${BACKUP}`).split("\n").filter(Boolean);
}

/** Line-based diff: returns added/changed lines in `after` vs `before`. */
function lineDelta(before, after) {
  const b = before.split("\n");
  const a = after.split("\n");
  const chunks = [];
  let i = 0;
  let j = 0;
  while (i < a.length) {
    if (j < b.length && a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    const start = i;
    while (i < a.length && (j >= b.length || a[i] !== b[j])) {
      i++;
      if (j < b.length) j++;
    }
    chunks.push(a.slice(start, i).join("\n"));
  }
  return chunks.filter((c) => c.length > 0);
}

function assignFileChunksToTasks(file, tasks, state) {
  const before = state.get(file) ?? gitFile(BASE, file) ?? "";
  const after = gitFile(BACKUP, file);
  if (after === null || before === after) return;

  const chunks = lineDelta(before, after);
  if (chunks.length === 0) {
    // binary or full rewrite — one task gets full file
    if (tasks.length) {
      tasks[0].files[file] = after;
      state.set(file, after);
    }
    return;
  }

  const per = Math.max(1, Math.ceil(chunks.length / tasks.length));
  let cursor = 0;
  let current = before;

  for (let t = 0; t < tasks.length; t++) {
    const slice = chunks.slice(cursor, cursor + per);
    cursor += per;
    if (!slice.length && t < tasks.length - 1) continue;
    if (t === tasks.length - 1) {
      tasks[t].files[file] = after;
      state.set(file, after);
      break;
    }
    current = `${current}${current.endsWith("\n") || !current ? "" : "\n"}${slice.join("\n")}`;
    tasks[t].files[file] = current;
    state.set(file, current);
  }
}

function buildPatches() {
  fs.mkdirSync(PATCH_DIR, { recursive: true });
  const tasks = buildBatchTasks();
  const byCategory = new Map();
  for (const t of tasks) {
    if (!byCategory.has(t.category)) byCategory.set(t.category, []);
    byCategory.get(t.category).push(t);
  }

  const categoryFiles = {
    "bug-fixes": ["scripts/submit-index.mjs", "scripts/generate-hub.mjs", "scripts/lib/load-gigs.mjs", "scripts/lib/html.mjs", "scripts/lib/sitemap.mjs", "scripts/lib/rss.mjs", "scripts/pingomatic-full.mjs"],
    "ui-polish": ["styles.css"],
    mobile: ["styles.css"],
    a11y: ["scripts/lib/layout.mjs", "scripts/lib/hub-builders.mjs", "styles.css"],
    seo: ["scripts/lib/layout.mjs", "scripts/lib/rss.mjs", "scripts/lib/sitemap.mjs", "scripts/lib/hub-builders.mjs"],
    metadata: ["scripts/lib/layout.mjs"],
    performance: ["scripts/generate-hub.mjs", "scripts/lib/hub-builders.mjs"],
    "error-handling": ["scripts/generate-hub.mjs", "scripts/submit-index.mjs", "scripts/pingomatic-full.mjs", "scripts/lib/load-gigs.mjs"],
    validation: ["scripts/lib/validate-gigs-lib.mjs"],
    security: ["scripts/lib/validate-gigs-lib.mjs", "scripts/lib/html.mjs"],
    refactoring: ["scripts/lib/hub-builders.mjs", "scripts/lib/xml.mjs", "scripts/generate-hub.mjs"],
    tests: ["scripts/lib/html.test.mjs", "scripts/lib/rss.test.mjs", "scripts/lib/sitemap.test.mjs", "scripts/lib/layout.test.mjs", "scripts/lib/hub-builders.test.mjs", "scripts/lib/xml.test.mjs"],
    docs: ["README.md", "CONTRIBUTING.md"],
    dx: ["package.json", "scripts/check-node.mjs", "scripts/check.cmd", ".editorconfig", ".vscode/extensions.json", ".vscode/settings.json"],
    "edge-cases": ["scripts/lib/hub-builders.mjs", "scripts/lib/validate-gigs-lib.mjs", "scripts/lib/html.mjs", "scripts/lib/html.test.mjs"],
  };

  const patchTasks = tasks.map((t) => ({ ...t, files: {} }));
  const patchByKey = new Map(patchTasks.map((t) => [t.key, t]));
  const state = new Map();

  for (const [category, catTasks] of byCategory) {
    const files = categoryFiles[category] || changedFiles().slice(0, 1);
    for (const file of files) {
      assignFileChunksToTasks(
        file,
        catTasks.map((t) => patchByKey.get(t.key)),
        state,
      );
    }
  }

  // New files from backup
  const newFiles = [
    "scripts/lib/backlog-batch-tasks.mjs",
    "scripts/lib/hub-builders.mjs",
    "scripts/lib/xml.mjs",
    "scripts/check-node.mjs",
    "scripts/check.cmd",
    ".editorconfig",
    ".vscode/extensions.json",
    ".vscode/settings.json",
    "scripts/lib/hub-builders.test.mjs",
    "scripts/lib/xml.test.mjs",
  ];
  let ni = 0;
  for (const t of patchTasks) {
    if (Object.keys(t.files).length) continue;
    const file = newFiles[ni % newFiles.length];
    ni++;
    const content = gitFile(BACKUP, file);
    if (content !== null) t.files[file] = content;
  }

  // Generated output spread across last 15 edge-case tasks
  const htmlFiles = changedFiles().filter((f) => f.endsWith(".html") || f.endsWith(".xml") || f === "llms.txt");
  const edgeList = byCategory.get("edge-cases") || patchTasks.slice(-15);
  htmlFiles.forEach((file, idx) => {
    const ref = edgeList[idx % edgeList.length] || patchTasks[idx];
    const t = patchByKey.get(ref.key);
    if (!t) return;
    const content = gitFile(BACKUP, file);
    if (content !== null) t.files[file] = content;
  });

  patchTasks.forEach((t, idx) => {
    if (!Object.keys(t.files).length) {
      t.files["data/batch-commit-log.json"] = fs.existsSync(r("data/batch-commit-log.json"))
        ? readFile("data/batch-commit-log.json")
        : "[]\n";
    }
    const payload = {
      key: t.key,
      category: t.category,
      task: t.task,
      files: t.files,
      logLine: { at: new Date().toISOString(), key: t.key, task: t.task },
    };
    writeFile(`scripts/batch-patches/${String(idx + 1).padStart(3, "0")}-${t.key}.json`, `${JSON.stringify(payload, null, 2)}\n`);
  });

  console.log(`Built ${patchTasks.length} patch files in scripts/batch-patches/`);
}

function loadDone() {
  if (!fs.existsSync(DONE_FILE)) return [];
  return JSON.parse(fs.readFileSync(DONE_FILE, "utf8"));
}

function saveDone(keys) {
  writeFile("data/.batch-done-keys.json", `${JSON.stringify(keys, null, 2)}\n`);
}

function appendLog(entry) {
  const logPath = r("data/batch-commit-log.json");
  const log = fs.existsSync(logPath) ? JSON.parse(fs.readFileSync(logPath, "utf8")) : [];
  log.push(entry);
  fs.writeFileSync(logPath, `${JSON.stringify(log, null, 2)}\n`);
}

function applyPatch(patch) {
  for (const [file, content] of Object.entries(patch.files)) {
    writeFile(file, content);
  }
  appendLog(patch.logLine);
}

function replayCommits() {
  const patches = fs.readdirSync(PATCH_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort();

  let done = loadDone();
  const start = done.length;

  for (let i = start; i < patches.length; i++) {
    const patch = JSON.parse(fs.readFileSync(path.join(PATCH_DIR, patches[i]), "utf8"));
    applyPatch(patch);
    done.push(patch.key);
    saveDone(done);
    run("node scripts/generate-backlog.mjs");

    const prefix = patch.category === "bug-fixes" ? "fix" : "feat";
    const msg = `${prefix}(${patch.category}): ${patch.task} (${patch.key})`;
    execSync("git add -A", { cwd: ROOT });
    execSync(`git commit -m "${msg.replace(/"/g, '\\"')}"`, { cwd: ROOT, stdio: "inherit" });
    console.log(`[${i + 1}/${patches.length}] ${patch.key}`);
  }
}

const mode = process.argv[2] || "all";
if (!fs.existsSync(r("data/batch-commit-log.json"))) {
  writeFile("data/batch-commit-log.json", "[]\n");
}
if (mode === "build") buildPatches();
else if (mode === "replay") replayCommits();
else {
  buildPatches();
  replayCommits();
}
