import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import worker from "../src/index.js";
import { renderPoem, renderHome, SITE_NAME, sitemapUrls } from "../src/seo.js";

const template = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
const schema = await readFile(new URL("../migrations/0001_initial.sql", import.meta.url), "utf8");
const seeds = await readFile(new URL("../migrations/0002_seed.sql", import.meta.url), "utf8");
const versionedIndex = await readFile(new URL("../migrations/0004_r2_versioned_index.sql", import.meta.url), "utf8");

function fixture(t) {
  const sql = new DatabaseSync(":memory:");
  t.after(() => sql.close());
  sql.exec(schema);
  sql.exec(seeds);
  sql.exec(versionedIndex);
  function statement(query, args = []) {
    return {
      bind(...values) { return statement(query, values); },
      async all() { return { results: sql.prepare(query).all(...args) }; },
      async first() { return sql.prepare(query).get(...args) || null; },
    };
  }
  const env = { DB: { prepare: statement, batch: async list => Promise.all(list.map(item => item.all())) },
    POEM_CONTENT: { async get() { return null; } },
    ASSETS: { async fetch(request) {
      assert.equal(request.headers.get("cookie"), null);
      return new URL(request.url).pathname === "/" ? new Response(template) : new Response("Not found", { status: 404 });
    } },
  };
  return { sql, env, get: (path, options = {}) => worker.fetch(new Request(`https://poemcn.2aran.com${path}`, options), env) };
}

test("home delivers visible poems, crawlable links, brand metadata and bootstrap without JS", async t => {
  const { get } = fixture(t);
  const response = await get("/", { headers: { cookie: "tuaran_session=not-forwarded" } });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Set-Cookie"), null);
  const html = await response.text();
  assert.match(html, /<title>阿燃诗词｜古诗词与文言文<\/title>/);
  assert.match(html, /<a href="\/poems\/seed-chun-jiang-hua-yue-ye">春江花月夜<\/a>/);
  assert.match(html, /春江潮水连海平/);
  assert.doesNotMatch(html, /正在翻开诗卷/);
  assert.equal((html.match(/rel="canonical"/g) || []).length, 1);
  const graph = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert.equal(graph["@graph"][0].name, SITE_NAME);
  assert.equal(graph["@graph"][0].url, "https://poemcn.2aran.com/");
  assert.match(html, /id="poemInitialData"/);
  assert.equal(response.headers.get("X-Robots-Tag"), null);
});

test("poems have their own canonical, real original text, sources and shared account controls", async t => {
  const { get } = fixture(t);
  const response = await get("/poems/seed-jiang-xue");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>江雪（柳宗元）原文｜阿燃诗词<\/title>/);
  assert.match(html, /rel="canonical" href="https:\/\/poemcn.2aran.com\/poems\/seed-jiang-xue"/);
  assert.match(html, /千山鸟飞绝，万径人踪灭。/);
  assert.match(html, /<h2>作品来源<\/h2>/);
  assert.match(html, /<script src="\/account.js" defer>/);
  assert.doesNotMatch(html, /<script src="\/app.js"|poemInitialData|搜索诗文/);
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1);
});

test("sitemaps are XML, partition by rowid without missing a boundary and use real timestamps", async t => {
  const { get, sql } = fixture(t);
  sql.exec("UPDATE poems SET rowid = 1001 WHERE id = 'seed-jiang-xue'");
  const index = await get("/sitemap.xml");
  assert.match(index.headers.get("Content-Type"), /application\/xml/);
  assert.match(await index.text(), /\/sitemaps\/poems-1.xml/);
  const first = await (await get("/sitemaps/poems-0.xml")).text();
  const second = await (await get("/sitemaps/poems-1.xml")).text();
  assert.doesNotMatch(first, /\/poems\/seed-jiang-xue/);
  assert.match(second, /\/poems\/seed-jiang-xue/);
  assert.match(second, /<lastmod>\d{4}-\d{2}-\d{2}T/);
  assert.equal((await get("/sitemaps/poems-2.xml")).status, 404);
  assert.equal((await get("/sitemaps/poems-NaN.xml")).status, 404);
  assert.doesNotMatch(sitemapUrls([{ id: "test", updated_at: "invalid" }]), /lastmod/);
  assert.match(await (await get("/sitemaps/pages.xml")).text(), /<loc>https:\/\/poemcn.2aran.com\/<\/loc>/);
});

test("robots, HEAD, canonical redirects and missing pages have correct protocol semantics", async t => {
  const { get, env } = fixture(t);
  const robots = await get("/robots.txt");
  assert.match(robots.headers.get("Content-Type"), /text\/plain/);
  assert.match(await robots.text(), /Sitemap: https:\/\/poemcn.2aran.com\/sitemap.xml/);
  for (const path of ["/poems/missing", "/poems/a/b", "/not-found"]) assert.equal((await get(path)).status, 404);
  assert.match((await get("/poems/missing")).headers.get("X-Robots-Tag"), /noindex/);
  assert.equal(await (await get("/poems/seed-jiang-xue", { method: "HEAD" })).text(), "");
  assert.equal((await get("/", { method: "POST" })).status, 405);
  assert.equal((await get("/index.html")).headers.get("Location"), "https://poemcn.2aran.com/");
  assert.equal((await get("/poems/seed-jiang-xue/")).headers.get("Location"), "https://poemcn.2aran.com/poems/seed-jiang-xue");
  const preview = await worker.fetch(new Request("https://poemcn.tuaran666.workers.dev/poems/seed-jiang-xue"), env);
  assert.equal(preview.status, 301);
  assert.equal(preview.headers.get("Location"), "https://poemcn.2aran.com/poems/seed-jiang-xue");
  assert.match((await get("/?q=江雪")).headers.get("X-Robots-Tag"), /noindex/);
});

test("unavailable data returns non-cacheable 503 rather than a successful empty page", async t => {
  const { env } = fixture(t);
  env.DB.prepare = () => { throw new Error("test database unavailable"); };
  const response = await worker.fetch(new Request("https://poemcn.2aran.com/"), env);
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.doesNotMatch(await response.text(), /database unavailable/);
});

test("HTML and JSON metadata escape imported content; missing extras are not advertised", () => {
  const poison = '</script><img src=x onerror="alert(1)">';
  const poem = { id: "test", title: poison, author: poison, dynasty: "唐代", genre: "诗", full: [poison], excerpt: [poison], source: { url: "javascript:alert(1)", license: "public domain" } };
  const detail = renderPoem(template, poem);
  assert.doesNotMatch(detail, /<img src=x|href="javascript:|<h2>译文|<h2>赏析/);
  const home = renderHome(template, { poems: [poem] });
  assert.doesNotMatch(home, /<img src=x/);
  assert.match(home, /\\u003c\/script>/);
});

test("teaching collection is a public, extensible page with owner names, standard titles and sources", async t => {
  const { get } = fixture(t);
  const response = await get("/collections/jiaoxue-xiaomoli");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("X-Robots-Tag"), null);
  const html = await response.text();
  assert.match(html, /<title>教小茉莉的诗词｜阿燃诗词<\/title>/);
  assert.match(html, /rel="canonical" href="https:\/\/poemcn\.2aran\.com\/collections\/jiaoxue-xiaomoli"/);
  assert.match(html, /把教过的篇目用网站记下来/);
  assert.match(html, /不是一次写死的六首展板/);
  assert.match(html, /id="jiang-xue"/);
  assert.match(html, /柳宗元《江雪》/);
  assert.match(html, /千山鸟飞绝，万径人踪灭。/);
  assert.match(html, /id="chun-xiao"/);
  assert.match(html, /孟浩然《春晓》/);
  assert.doesNotMatch(html, /欧阳修《春晓》|歐陽修《春曉》/);
  assert.match(html, /id="min-nong"/);
  assert.match(html, /站长叫法「悯农」/);
  assert.match(html, /李绅《悯农二首》/);
  assert.match(html, /春种一粒粟，秋收万颗子。/);
  assert.match(html, /锄禾日当午，汗滴禾下土。/);
  assert.match(html, /古風二首/);
  assert.match(html, /id="e-e-e"/);
  assert.match(html, /站长叫法「鹅鹅鹅」/);
  assert.match(html, /骆宾王《咏鹅》/);
  assert.match(html, /id="jing-ye-si"/);
  assert.match(html, /床前明月光，疑是地上霜。/);
  assert.match(html, /床前看月光，疑是地上霜。/);
  assert.match(html, /id="deng-guan-que-lou"/);
  assert.match(html, /登鹳鹊楼/);
  assert.match(html, /王之涣《登鹳雀楼》/);
  assert.match(html, /href="\/poems\/seed-jiang-xue"/);
  assert.match(html, /出处与依据/);
  assert.match(html, /待补出处/);
  assert.doesNotMatch(html, /<script src="\/app.js"|poemInitialData/);
  assert.match(html, /<script src="\/account.js" defer>/);
});

test("home shows the teaching collection entry without relying on search", async t => {
  const { get } = fixture(t);
  const html = await (await get("/")).text();
  assert.match(html, /id="teachingCollectionMount"/);
  assert.match(html, /<a href="\/collections\/jiaoxue-xiaomoli">教小茉莉的诗词<\/a>/);
  assert.match(html, /href="\/collections\/jiaoxue-xiaomoli#jiang-xue"/);
  assert.match(html, /href="\/collections\/jiaoxue-xiaomoli#min-nong"/);
  assert.match(html, /鹅鹅鹅<span>（咏鹅）<\/span>/);
  assert.match(html, /登鹳鹊楼<span>（登鹳雀楼）<\/span>/);
});

test("unknown collections 404, trailing slashes redirect, and sitemap lists the page", async t => {
  const { get } = fixture(t);
  assert.equal((await get("/collections/missing")).status, 404);
  assert.match((await get("/collections/missing")).headers.get("X-Robots-Tag"), /noindex/);
  assert.equal((await get("/collections/jiaoxue-xiaomoli/")).headers.get("Location"), "https://poemcn.2aran.com/collections/jiaoxue-xiaomoli");
  const pages = await (await get("/sitemaps/pages.xml")).text();
  assert.match(pages, /<loc>https:\/\/poemcn\.2aran\.com\/<\/loc>/);
  assert.match(pages, /<loc>https:\/\/poemcn\.2aran\.com\/collections\/jiaoxue-xiaomoli<\/loc>/);
});
