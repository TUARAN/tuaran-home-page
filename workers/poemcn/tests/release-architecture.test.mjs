import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import worker from "../src/index.js";
import { getPoem, getStats, queryPoems } from "../src/database.js";
import {
  assertCommit,
  diffCatalog,
  estimateReleaseBudget,
  evaluateBudget,
  releaseVersion,
  shardKey,
} from "../scripts/release-core.mjs";
import { UPSTREAM_SOURCES } from "../scripts/upstream-sources.mjs";

const schema = await readFile(new URL("../migrations/0004_r2_versioned_index.sql", import.meta.url), "utf8");
const wrangler = await readFile(new URL("../wrangler.toml", import.meta.url), "utf8");

function d1(sql) {
  const queries = [];
  function statement(query, args = []) {
    queries.push(query);
    return {
      bind(...values) { return statement(query, values); },
      async all() { return { results: sql.prepare(query).all(...args) }; },
      async first() { return sql.prepare(query).get(...args) || null; },
    };
  }
  return { db: { prepare: statement }, queries };
}

test("versioned D1 keeps only metadata/search fields and reads body from an immutable R2 shard", async t => {
  const sql = new DatabaseSync(":memory:");
  t.after(() => sql.close());
  sql.exec(schema);
  const version = "20260902-0123456789ab";
  const bodyKey = `releases/${version}/poems/tang/demo-0000.json`;
  sql.prepare(`INSERT INTO poem_search_index (
    dataset_version,id,title,author,dynasty,genre,form,categories_json,excerpt_json,
    search_text,body_key,fingerprint,quality_score,sitemap_ordinal
  ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    version, "cp-demo", "江雪", "柳宗元", "唐代", "诗", "五言绝句",
    '["唐代","诗","山水"]', '["千山鸟飞绝，万径人踪灭。"]',
    "千山鸟飞绝 万径人踪灭", bodyKey, "abc", 60, 1,
  );
  sql.prepare("INSERT INTO poem_search_categories VALUES (?,?,?)").run(version, "山水", "cp-demo");
  sql.prepare(`UPDATE dataset_state SET active_version=?, source_commit=?, stats_json=?, sitemap_prefix=? WHERE id=1`)
    .run(version, "0123456789abcdef0123456789abcdef01234567", '{"poemCount":1}', `releases/${version}/sitemaps`);
  const { db, queries } = d1(sql);
  const bucket = {
    async get(key) {
      assert.equal(key, bodyKey);
      return {
        body: true,
        async json() {
          return { poems: { "cp-demo": { full: ["千山鸟飞绝，万径人踪灭。", "孤舟蓑笠翁，独钓寒江雪。"], source: { url: "https://example.com", license: "公共领域" } } } };
        },
      };
    },
  };

  const poems = await queryPoems(db, new URLSearchParams({ category: "山水" }));
  const poem = await getPoem(db, bucket, "cp-demo");
  const stats = await getStats(db);
  assert.equal(poems.length, 1);
  assert.deepEqual(poem.full, ["千山鸟飞绝，万径人踪灭。", "孤舟蓑笠翁，独钓寒江雪。"]) ;
  assert.equal(stats.ingestionMode, "versioned-release");
  assert.ok(queries.some(query => /JOIN poem_search_categories/.test(query)));
  assert.ok(queries.every(query => !/SELECT p[.]search_text|SELECT \*/.test(query)));

  const columns = sql.prepare("PRAGMA table_info(poem_search_index)").all().map(row => row.name);
  assert.ok(columns.includes("search_text"));
  for (const forbidden of ["content_json", "translation", "note", "appreciation"]) assert.ok(!columns.includes(forbidden));
  const plan = sql.prepare(`EXPLAIN QUERY PLAN SELECT id,title,author FROM poem_search_index
    WHERE dataset_version=? ORDER BY quality_score DESC,id ASC LIMIT 12`).all(version).map(row => row.detail).join(" ");
  assert.match(plan, /SEARCH poem_search_index USING INDEX idx_poem_search_version_quality/);
});

test("release budget blocks publishing before any remote write", () => {
  const estimate = estimateReleaseBudget({ poemCount: 1000, categoryRows: 3000, r2Objects: 20, r2Bytes: 5000, d1SqlBytes: 8000 }, 12);
  assert.equal(estimate.estimatedD1RowsWritten, 48000);
  assert.deepEqual(evaluateBudget(estimate, {
    maxEstimatedD1RowsWritten: 47000,
    maxR2Objects: 100,
    maxR2Bytes: 10000,
    maxD1SqlBytes: 10000,
  }), {
    ok: false,
    violations: [{ metric: "estimatedD1RowsWritten", actual: 48000, limit: 47000 }],
  });
});

test("release identity requires a fixed commit and produces deterministic delta/shard keys", () => {
  const commit = "0123456789abcdef0123456789abcdef01234567";
  assert.equal(assertCommit(commit), commit);
  assert.throws(() => assertCommit("master"), /40 位 Git commit SHA/);
  assert.equal(releaseVersion(commit, new Date("2026-09-02T00:00:00Z")), "20260902-0123456789ab");
  assert.equal(shardKey("v1", "tang", "poet.tang.0.json", 2), shardKey("v1", "tang", "poet.tang.0.json", 2));
  assert.deepEqual(diffCatalog(
    [{ id: "a", fingerprint: "2" }, { id: "b", fingerprint: "1" }],
    [{ id: "a", fingerprint: "1" }, { id: "c", fingerprint: "1" }],
  ), { added: ["b"], updated: ["a"], removed: ["c"], unchanged: 0 });
});

test("production worker exposes no scheduled writer and binds a dedicated R2 bucket", () => {
  assert.equal(Object.hasOwn(worker, "scheduled"), false);
  assert.match(wrangler, /binding = "POEM_CONTENT"/);
  assert.doesNotMatch(wrangler, /CRAWLER_ENABLED|\[triggers\]|crons/);
});

test("offline builder pins checkout commit and emits verifiable D1/R2 release artifacts", async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), "poemcn-release-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const upstream = path.join(root, "upstream");
  const output = path.join(root, "release");
  await mkdir(upstream, { recursive: true });
  const fileNames = {
    "tang-poetry": "poet.tang.0.json",
    "song-poetry": "poet.song.0.json",
    "song-ci": "ci.song.0.json",
    "yuan-qu": "yuanqu.json",
    shijing: "shijing.json",
    chuci: "chuci.json",
    "cao-cao": "caocao.json",
    nalan: "纳兰性德诗集.json",
    huajianji: "huajianji-1-juan.json",
    "nantang-ci": "poetrys.json",
  };
  for (const [index, source] of UPSTREAM_SOURCES.entries()) {
    const directory = path.join(upstream, ...source.directory.split("/"));
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, fileNames[source.source_key]), JSON.stringify([{
      id: `${index + 1}`,
      title: `${source.label}样例`,
      author: "测试作者",
      paragraphs: [`第${index + 1}句山水`, "用于验证固定版本离线构建"],
    }]));
  }
  execFileSync("git", ["init", "-q", upstream]);
  execFileSync("git", ["-C", upstream, "config", "user.name", "Poem Test"]);
  execFileSync("git", ["-C", upstream, "config", "user.email", "poem-test@example.invalid"]);
  execFileSync("git", ["-C", upstream, "add", "."]);
  execFileSync("git", ["-C", upstream, "commit", "-qm", "fixture"]);
  const commit = execFileSync("git", ["-C", upstream, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();

  execFileSync(process.execPath, [
    new URL("../scripts/build-dataset.mjs", import.meta.url).pathname,
    "--commit", commit,
    "--source-dir", upstream,
    "--output", output,
  ], { encoding: "utf8" });

  const manifest = JSON.parse(await readFile(path.join(output, "manifest.json"), "utf8"));
  const indexSql = await readFile(path.join(output, "index.sql"), "utf8");
  const firstShard = manifest.files.objects.find(object => object.key.includes("/poems/"));
  const shard = JSON.parse(await readFile(path.join(output, firstShard.file), "utf8"));
  assert.equal(manifest.source.commit, commit);
  assert.equal(manifest.stats.poemCount, UPSTREAM_SOURCES.length);
  assert.equal(manifest.delta.added, UPSTREAM_SOURCES.length);
  assert.equal(manifest.budget.decision.ok, true);
  assert.doesNotMatch(indexSql, /content_json|appreciation|translation/);
  assert.equal(shard.sourceCommit, commit);
  assert.equal(Object.keys(shard.poems).length, 1);

  const publishScript = new URL("../scripts/publish-dataset.mjs", import.meta.url).pathname;
  const dryRun = execFileSync(process.execPath, [
    publishScript,
    "--manifest", path.join(output, "manifest.json"),
    "--database", "test-offline-d1",
  ], { encoding: "utf8" });
  assert.equal(JSON.parse(dryRun).mode, "dry-run");

  await writeFile(path.join(output, firstShard.file), "tampered");
  assert.throws(() => execFileSync(process.execPath, [
    publishScript,
    "--manifest", path.join(output, "manifest.json"),
    "--database", "test-offline-d1",
  ], { encoding: "utf8", stdio: "pipe" }), /Command failed/);
});
