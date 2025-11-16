import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { sortedGigs, buildPersonLd, absUrl, hubVersion, writeHubFiles, buildTagList } from "./hub-builders.mjs";

test("sortedGigs orders by id", () => {
  const list = sortedGigs([{ id: "z" }, { id: "a" }]);
  assert.deepEqual(list.map((g) => g.id), ["a", "z"]);
});

test("buildPersonLd dedupes sameAs sorted", () => {
  const ld = buildPersonLd({
    sellerName: "Test",
    sellerUrl: "https://www.fiverr.com/a",
    sellerSite: "https://www.fiverr.com/a",
    githubUrl: "https://github.com/a",
  });
  assert.equal(ld.sameAs.length, 2);
});

test("absUrl joins origin and path", () => {
  assert.equal(absUrl("https://ex.com", "/rss.xml"), "https://ex.com/rss.xml");
  assert.equal(absUrl("", "/rss.xml"), "/rss.xml");
});

test("hubVersion returns semver", () => {
  assert.match(hubVersion(), /^\d+\.\d+\.\d+$/);
});

test("buildTagList uses distinct aria labels", () => {
  const search = buildTagList(["a"], "Search terms");
  const tags = buildTagList(["b"], "Fiverr tags");
  assert.match(search, /aria-label="Search terms"/);
  assert.match(tags, /aria-label="Fiverr tags"/);
});

test("writeHubFiles removes stale service pages", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "hub-write-"));
  const servicesDir = path.join(root, "services");
  fs.mkdirSync(servicesDir, { recursive: true });
  fs.writeFileSync(path.join(servicesDir, "removed-gig.html"), "<html></html>");
  fs.writeFileSync(path.join(servicesDir, "kept-gig.html"), "<html>old</html>");

  writeHubFiles(root, fs, path, {
    robots: "User-agent: *\nAllow: /",
    llms: "# test\n",
    sitemap: "<?xml version=\"1.0\"?><urlset></urlset>",
    rss: "<?xml version=\"1.0\"?><rss></rss>",
    indexHtml: "<html>index</html>",
    notFoundHtml: "<html>404</html>",
    servicePages: { "kept-gig.html": "<html>new</html>" },
  });

  assert.equal(fs.existsSync(path.join(servicesDir, "removed-gig.html")), false);
  assert.equal(fs.readFileSync(path.join(servicesDir, "kept-gig.html"), "utf8"), "<html>new</html>");
  fs.rmSync(root, { recursive: true, force: true });
});
