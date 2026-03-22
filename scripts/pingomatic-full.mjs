#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadGigs } from "./lib/load-gigs.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const gigs = loadGigs(ROOT);
const UA = "ZlatkoGigIndexer/1.0 (+https://www.fiverr.com/zlatkomarjanovi)";

const CHECKS = [
  "chk_weblogscom",
  "chk_blogs",
  "chk_feedburner",
  "chk_newsgator",
  "chk_myyahoo",
  "chk_pubsubcom",
  "chk_blogdigger",
  "chk_blogstreet",
  "chk_moreover",
  "chk_weblogalot",
  "chk_icerocket",
  "chk_newsisfree",
  "chk_topicexchange",
  "chk_google",
  "chk_tailrank",
  "chk_bloglines",
  "chk_postrank",
  "chk_skygrid",
  "chk_collecta",
  "chk_superfeedr",
  "chk_audioweblogs",
  "chk_rubhub",
  "chk_geourl",
  "chk_a2b",
  "chk_blogshares",
];

const targets = [
  { title: `${gigs.sellerName} on Fiverr`, url: gigs.sellerUrl },
  ...gigs.gigs.map((g) => ({ title: g.title, url: g.url })),
];

async function ping(target) {
  const params = new URLSearchParams({
    title: target.title,
    blogurl: target.url,
    rssurl: target.url,
  });
  for (const chk of CHECKS) params.set(chk, "on");
  const url = `https://pingomatic.com/ping/?${params.toString()}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html,*/*" },
      signal: ctrl.signal,
      redirect: "follow",
    });
    const text = await res.text();
    const forwarded = (text.match(/forwarded to (\d+)/i) || [])[1];
    const thanks = /thank you|success|pinged|forwarded/i.test(text);
    return { url: target.url, status: res.status, accepted: res.ok && thanks, forwarded, snippet: text.replace(/\s+/g, " ").slice(0, 220) };
  } catch (err) {
    return { url: target.url, status: 0, accepted: false, forwarded: null, snippet: err.message };
  } finally {
    clearTimeout(timer);
  }
}

const results = [];
for (const target of targets) {
  const row = await ping(target);
  results.push(row);
  console.log(`${row.accepted ? "OK" : "FAIL"} ${row.status} fwd=${row.forwarded || "?"} ${target.url}`);
}

fs.writeFileSync(path.join(ROOT, "data", "pingomatic-full.json"), JSON.stringify({ at: new Date().toISOString(), results }, null, 2));
console.log(`Wrote data/pingomatic-full.json (${results.filter((r) => r.accepted).length}/${results.length} accepted)`);

let gigs;
try {
  gigs = loadGigs(ROOT);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
const UA = "ZlatkoGigIndexer/1.0 (+https://www.fiverr.com/zlatkomarjanovi)";

const CHECKS = [
  "chk_weblogscom",
  "chk_blogs",
  "chk_feedburner",
  "chk_newsgator",
  "chk_myyahoo",
  "chk_pubsubcom",
  "chk_blogdigger",
  "chk_blogstreet",
  "chk_moreover",
  "chk_weblogalot",
  "chk_icerocket",
  "chk_newsisfree",
  "chk_topicexchange",
  "chk_google",
  "chk_tailrank",
  "chk_bloglines",
  "chk_postrank",
  "chk_skygrid",
  "chk_collecta",
  "chk_superfeedr",
  "chk_audioweblogs",
  "chk_rubhub",
  "chk_geourl",
  "chk_a2b",
  "chk_blogshares",
];

const targets = [
  { title: `${gigs.sellerName} on Fiverr`, url: gigs.sellerUrl },
  ...gigs.gigs.map((g) => ({ title: g.title, url: g.url })),
];

async function ping(target) {
  const params = new URLSearchParams({
    title: target.title,
    blogurl: target.url,
    rssurl: target.url,
  });
  for (const chk of CHECKS) params.set(chk, "on");
  const url = `https://pingomatic.com/ping/?${params.toString()}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html,*/*" },
      signal: ctrl.signal,
      redirect: "follow",
    });
    const text = await res.text();
    const forwarded = (text.match(/forwarded to (\d+)/i) || [])[1];
    const thanks = /thank you|success|pinged|forwarded/i.test(text);
    return { url: target.url, status: res.status, accepted: res.ok && thanks, forwarded, snippet: text.replace(/\s+/g, " ").slice(0, 220) };
  } catch (err) {
    return { url: target.url, status: 0, accepted: false, forwarded: null, snippet: err.message };
  } finally {
    clearTimeout(timer);
  }
(async () => {
const results = [];
for (const target of targets) {
  const row = await ping(target);
  results.push(row);
  console.log(`${row.accepted ? "OK" : "FAIL"} ${row.status} fwd=${row.forwarded || "?"} ${target.url}`);
}

fs.writeFileSync(path.join(ROOT, "data", "pingomatic-full.json"), JSON.stringify({ at: new Date().toISOString(), results }, null, 2));
console.log(`Wrote data/pingomatic-full.json (${results.filter((r) => r.accepted).length}/${results.length} accepted)`);
})().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
