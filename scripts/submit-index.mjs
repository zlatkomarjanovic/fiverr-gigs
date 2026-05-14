#!/usr/bin/env node
/**
 * Submit clean Fiverr gig URLs (and optional hub URLs) to public discovery endpoints.
 * IndexNow is only used for an owned host that can serve the key file.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadGigs } from "./lib/load-gigs.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const gigs = loadGigs(ROOT);
const SITE_ORIGIN = (process.env.SITE_ORIGIN || "").replace(/\/$/, "");
const INDEXNOW_KEY = (process.env.INDEXNOW_KEY || "").trim();
const HUB_ONLY = process.argv.includes("--hub-only") || process.env.HUB_ONLY === "1";
const UA = "ZlatkoGigIndexer/1.0 (+https://www.fiverr.com/zlatkomarjanovi)";

const fiverrUrls = [
  gigs.sellerUrl,
  ...gigs.gigs.map((g) => g.url),
];

function hubUrls() {
  if (!SITE_ORIGIN) return [];
  return [
    `${SITE_ORIGIN}/`,
    `${SITE_ORIGIN}/sitemap.xml`,
    `${SITE_ORIGIN}/rss.xml`,
    ...gigs.gigs.map((g) => `${SITE_ORIGIN}/services/${g.id}.html`),
  ];
}

function xmlRpcPing(name, homepage) {
  return `<?xml version="1.0"?>
<methodCall>
  <methodName>weblogUpdates.extendedPing</methodName>
  <params>
    <param><value><string>${escapeXml(name)}</string></value></param>
    <param><value><string>${escapeXml(homepage)}</string></value></param>
    <param><value><string>${escapeXml(homepage)}</string></value></param>
    <param><value><string>${escapeXml(SITE_ORIGIN ? `${SITE_ORIGIN}/rss.xml` : homepage)}</string></value></param>
  </params>
</methodCall>`;
}

function escapeXml(s) {
  return String(s).replace(/[<>&'"]/g, (c) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    '"': "&quot;",
  }[c]));
}

async function fetchSafe(url, options = {}, timeoutMs = 20000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: ctrl.signal,
      headers: {
        "User-Agent": UA,
        Accept: "application/json, text/html, */*",
        ...(options.headers || {}),
      },
    });
    const text = await res.text().catch(() => "");
    return { ok: res.ok, status: res.status, text: text.slice(0, 400) };
  } catch (err) {
    return { ok: false, status: 0, text: err.message || String(err) };
  } finally {
    clearTimeout(timer);
  }
}

async function submitWayback(url) {
  const encoded = encodeURIComponent(url);
  const attempts = [
    () => fetchSafe(`https://web.archive.org/save/${url}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    }, 45000),
    () => fetchSafe("https://web.archive.org/save/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        url,
        capture_all: "on",
        skip_first_archive: "1",
      }).toString(),
    }, 45000),
    () => fetchSafe(`https://web.archive.org/save/${encoded}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    }, 45000),
  ];

  for (const attempt of attempts) {
    const res = await attempt();
    const archived =
      res.ok ||
      /\/web\/\d{14}\//.test(res.text) ||
      /job_id|timestamp|watch_job/i.test(res.text) ||
      res.status === 200 ||
      res.status === 201;
    if (archived) return { service: "wayback", url, ...res, accepted: true };
    if (res.status === 429 || /rate.?limit/i.test(res.text)) {
      return { service: "wayback", url, ...res, accepted: false, note: "rate-limited" };
    }
  }
  return { service: "wayback", url, ok: false, status: 0, text: "all save attempts failed", accepted: false };
}

async function submitArchiveToday(url) {
  const res = await fetchSafe("https://archive.ph/submit/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ url }).toString(),
  }, 30000);
  const accepted = res.ok || res.status === 200 || res.status === 302 || /archive\.(ph|is|today)/i.test(res.text);
  return { service: "archive.today", url, ...res, accepted };
}

async function submitXmlRpc(endpoint, name, homepage) {
  const res = await fetchSafe(endpoint.url, {
    method: "POST",
    headers: { "Content-Type": "text/xml" },
    body: xmlRpcPing(name, homepage),
  }, 15000);
  const accepted = res.ok || /<(flerror|boolean)>0<\/|<value>Thanks/i.test(res.text);
  return { service: endpoint.name, url: homepage, ...res, accepted };
}

async function pingSitemap(engine, pingUrl) {
  if (!SITE_ORIGIN) {
    return { service: engine, url: pingUrl, accepted: false, status: 0, text: "SITE_ORIGIN not set" };
  }
  const sitemap = `${SITE_ORIGIN}/sitemap.xml`;
  const res = await fetchSafe(`${pingUrl}${encodeURIComponent(sitemap)}`);
  return { service: engine, url: sitemap, ...res, accepted: res.ok || res.status === 200 };
}

async function submitIndexNow(urls) {
  if (!SITE_ORIGIN || !INDEXNOW_KEY) {
    return {
      service: "indexnow",
      url: SITE_ORIGIN || "owned-host",
      accepted: false,
      status: 0,
      text: "IndexNow skipped: needs SITE_ORIGIN + INDEXNOW_KEY on a host you control. Cannot authenticate fiverr.com.",
    };
  }
  const host = new URL(SITE_ORIGIN).host;
  const res = await fetchSafe("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host,
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_ORIGIN}/${INDEXNOW_KEY}.txt`,
      urlList: urls,
    }),
  });
  return { service: "indexnow", url: host, ...res, accepted: res.status === 200 || res.status === 202 };
}

const XMLRPC = [
  { name: "pingomatic", url: "https://rpc.pingomatic.com/" },
  { name: "weblogs.com", url: "http://rpc.weblogs.com/RPC2" },
  { name: "blo.gs", url: "http://ping.blo.gs/" },
  { name: "twingly", url: "https://rpc.twingly.com/" },
];

async function mapLimit(items, limit, worker) {
  const out = [];
  let i = 0;
  async function next() {
    const idx = i++;
    if (idx >= items.length) return;
    out[idx] = await worker(items[idx], idx);
    return next();
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, next));
  return out;
}

async function main() {
  const results = [];
  const allFiverr = HUB_ONLY ? [] : fiverrUrls;

  if (allFiverr.length) {
    console.log(`Submitting ${allFiverr.length} Fiverr URLs to discovery endpoints...`);

    const wayback = await mapLimit(allFiverr, 2, (url) => submitWayback(url));
    results.push(...wayback);
    wayback.forEach((r) => console.log(`wayback  ${r.accepted ? "OK" : "FAIL"}  ${r.status}  ${r.url}`));

    const archives = await mapLimit(allFiverr, 2, (url) => submitArchiveToday(url));
    results.push(...archives);
    archives.forEach((r) => console.log(`archive  ${r.accepted ? "OK" : "FAIL"}  ${r.status}  ${r.url}`));

    for (const gig of [{ title: `${gigs.sellerName} on Fiverr`, url: gigs.sellerUrl }, ...gigs.gigs]) {
      const name = gig.title || gig.shortTitle;
      const homepage = gig.url;
      for (const endpoint of XMLRPC) {
        const res = await submitXmlRpc(endpoint, name, homepage);
        results.push(res);
        console.log(`${endpoint.name.padEnd(12)} ${res.accepted ? "OK" : "FAIL"}  ${res.status}  ${homepage}`);
      }
    }
  } else {
    console.log("Hub-only mode: skipping Fiverr pings.");
  }

  results.push(await pingSitemap("google-sitemap-ping", "https://www.google.com/ping?sitemap="));
  results.push(await pingSitemap("bing-sitemap-ping", "https://www.bing.com/ping?sitemap="));
  results.push(await submitIndexNow(hubUrls()));

  const logDir = path.join(ROOT, "data");
  const logPath = path.join(logDir, "submission-log.json");
  const summary = {
    submittedAt: new Date().toISOString(),
    fiverrUrls: allFiverr,
    hubUrls: hubUrls(),
    accepted: results.filter((r) => r.accepted).length,
    failed: results.filter((r) => !r.accepted).length,
    results,
  };
  fs.writeFileSync(logPath, JSON.stringify(summary, null, 2));
  console.log(`\n${summary.accepted} accepted / ${summary.failed} failed. Log: data/submission-log.json`);
  if (!SITE_ORIGIN) {
    console.log("Set SITE_ORIGIN after the hub is live, then rerun for Google/Bing sitemap ping + IndexNow.");
  }
}

main();
