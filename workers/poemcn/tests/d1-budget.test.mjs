import assert from "node:assert/strict";
import test from "node:test";

import { insertPoems, normalizeRecord } from "../src/crawler.js";
import { getAuthors, getSitemapBuckets, getStats } from "../src/database.js";

test("sitemap buckets use the maximum rowid instead of scanning every poem", async () => {
  const queries = [];
  const db = {
    prepare(sql) {
      queries.push(sql);
      return {
        bind() { return this; },
        async first() {
          return /FROM dataset_state/.test(sql)
            ? { active_version: "legacy", stats_json: "{}" }
            : { max_ordinal: 2001 };
        },
      };
    },
  };

  assert.deepEqual(await getSitemapBuckets(db, 1000), [0, 1, 2]);
  assert.equal(queries.length, 2);
  assert.match(queries[0], /FROM dataset_state/);
  assert.equal(queries[1], "SELECT MAX(rowid) AS max_ordinal FROM poems");
});

test("home metadata reads only crawler source rows and uses curated authors", async () => {
  const queries = [];
  const db = {
    prepare(sql) {
      queries.push(sql);
      return {
        async first() {
          return { active_version: "legacy", source_commit: "", stats_json: "{}" };
        },
        async all() {
          return { results: [
            { source_key: "tang-poetry", imported_count: 120 },
            { source_key: "song-ci", imported_count: 30 },
          ] };
        },
      };
    },
  };

  const authors = await getAuthors(db);
  const stats = await getStats(db);
  assert.equal(authors[0].name, "李白");
  assert.equal(stats.poemCount, 156);
  assert.equal(stats.ingestionMode, "legacy-snapshot");
  assert.equal(queries.length, 2);
  assert.match(queries[0], /FROM dataset_state/);
  assert.doesNotMatch(queries[1], /FROM poems|COUNT\(|GROUP BY/);
});

test("crawler counts insert changes without full-table counts", async () => {
  const source = { source_key: "tang-poetry", directory: "全唐诗", dynasty: "唐代", genre: "诗" };
  const poems = [0, 1].map((index) => normalizeRecord({
    id: `demo-${index}`,
    title: `测试诗${index}`,
    author: "佚名",
    paragraphs: ["山高水长。"],
  }, source, "poet.tang.0.json", index));
  const queries = [];
  const db = {
    prepare(sql) {
      queries.push(sql);
      return { bind() { return this; } };
    },
    async batch(statements) {
      assert.equal(statements.length, 2);
      return [{ meta: { changes: 1 } }, { meta: { changes: 0 } }];
    },
  };

  assert.equal(await insertPoems(db, poems), 1);
  assert.equal(queries.length, 2);
  assert.ok(queries.every((sql) => /INSERT OR IGNORE INTO poems/.test(sql)));
  assert.ok(queries.every((sql) => !/COUNT\(\*\)/.test(sql)));
});
