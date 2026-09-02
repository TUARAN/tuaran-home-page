import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { normalizeRecord } from "../src/crawler.js";
import {
  DEFAULT_SHARD_SIZE,
  RELEASE_SCHEMA_VERSION,
  assertCommit,
  diffCatalog,
  estimateReleaseBudget,
  evaluateBudget,
  releaseVersion,
  shardKey,
  sqlString,
} from "./release-core.mjs";
import { UPSTREAM_REPOSITORY, UPSTREAM_SOURCES } from "./upstream-sources.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const workerDir = path.resolve(scriptDir, "..");

function args(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith("--")) throw new Error(`无法识别参数：${key}`);
    values[key.slice(2)] = argv[index + 1];
    index += 1;
  }
  return values;
}

function xmlEscape(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

function sitemapXml(rows) {
  const urls = rows.map((row) => `<url><loc>https://poemcn.2aran.com/poems/${encodeURIComponent(row.id)}</loc><lastmod>${row.updatedAt}</lastmod></url>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
}

function sitemapIndexXml(count) {
  const entries = ["pages.xml", ...Array.from({ length: count }, (_, index) => `poems-${index}.xml`)]
    .map((name) => `<sitemap><loc>https://poemcn.2aran.com/sitemaps/${xmlEscape(name)}</loc></sitemap>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</sitemapindex>`;
}

function indexSql(poem, version, bodyKey, ordinal, updatedAt) {
  return `INSERT INTO poem_search_index (
  dataset_version, id, title, author, dynasty, genre, form, categories_json,
  excerpt_json, search_text, body_key, fingerprint, quality_score, sitemap_ordinal, updated_at
) VALUES (${[
    version, poem.id, poem.title, poem.author, poem.dynasty, poem.genre, poem.form,
    JSON.stringify(poem.categories), JSON.stringify(poem.paragraphs.slice(0, 4)), poem.contentText,
    bodyKey, poem.fingerprint, poem.qualityScore, ordinal, updatedAt,
  ].map(sqlString).join(", ")});\n`;
}

function categorySql(poem, version) {
  return poem.categories.map((category) =>
    `INSERT OR IGNORE INTO poem_search_categories (dataset_version, category, poem_id) VALUES (${sqlString(version)}, ${sqlString(category)}, ${sqlString(poem.id)});\n`,
  ).join("");
}

async function writeObject(root, key, value, objects) {
  const file = path.join(root, ...key.split("/"));
  await mkdir(path.dirname(file), { recursive: true });
  const body = typeof value === "string" ? value : JSON.stringify(value);
  await writeFile(file, body);
  const bytes = Buffer.byteLength(body);
  objects.push({ key, file: path.relative(path.dirname(root), file), bytes, sha256: createHash("sha256").update(body).digest("hex") });
}

async function main() {
  const options = args(process.argv.slice(2));
  const commit = assertCommit(options.commit);
  const sourceDir = path.resolve(options["source-dir"] || "");
  if (!options["source-dir"]) throw new Error("必须提供 --source-dir，且目录必须是固定 commit 的本地 checkout");
  const actualCommit = execFileSync("git", ["-C", sourceDir, "rev-parse", "HEAD"], { encoding: "utf8" }).trim().toLowerCase();
  if (actualCommit !== commit) throw new Error(`上游 checkout 不匹配：期望 ${commit}，实际 ${actualCommit}`);

  const version = options.version || releaseVersion(commit);
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{2,80}$/.test(version)) throw new Error("release version 格式无效");
  const outputDir = path.resolve(options.output || path.join(workerDir, "dist", version));
  const r2Root = path.join(outputDir, "r2");
  const budgetFile = path.resolve(options.budget || path.join(workerDir, "release-budget.json"));
  const budgetLimits = JSON.parse(await readFile(budgetFile, "utf8"));
  const generatedAt = new Date().toISOString();
  const updatedAt = generatedAt.slice(0, 19).replace("T", " ");
  const objects = [];
  const catalog = [];
  const sourceStats = [];
  const sqlParts = [];
  let categoryRows = 0;
  let ordinal = 0;
  const seenIds = new Set();
  const seenFingerprints = new Set();

  await mkdir(outputDir, { recursive: true });
  for (const source of UPSTREAM_SOURCES) {
    const directory = path.join(sourceDir, ...source.directory.split("/"));
    const names = (await readdir(directory)).filter((name) => source.pattern.test(name)).sort();
    let sourceCount = 0;
    for (const fileName of names) {
      const records = JSON.parse(await readFile(path.join(directory, fileName), "utf8"));
      if (!Array.isArray(records)) throw new Error(`${source.source_key}/${fileName} 不是 JSON 数组`);
      const normalized = records.map((raw, rowIndex) => normalizeRecord(raw, { ...source, commit }, fileName, rowIndex)).filter(Boolean);
      const unique = [];
      for (const poem of normalized) {
        if (seenFingerprints.has(poem.fingerprint)) continue;
        if (!/^[A-Za-z0-9_-]{1,160}$/.test(poem.id) || seenIds.has(poem.id)) {
          poem.id = `cp-${source.source_key}-${poem.fingerprint}`;
        }
        if (seenIds.has(poem.id)) throw new Error(`无法生成唯一诗文 ID：${poem.id}`);
        seenIds.add(poem.id);
        seenFingerprints.add(poem.fingerprint);
        unique.push(poem);
      }
      for (let shardIndex = 0; shardIndex < unique.length; shardIndex += DEFAULT_SHARD_SIZE) {
        const chunk = unique.slice(shardIndex, shardIndex + DEFAULT_SHARD_SIZE);
        const key = shardKey(version, source.source_key, fileName, Math.floor(shardIndex / DEFAULT_SHARD_SIZE));
        const bodies = {};
        for (const poem of chunk) {
          ordinal += 1;
          sourceCount += 1;
          bodies[poem.id] = {
            id: poem.id,
            full: poem.paragraphs,
            translation: poem.translation || null,
            note: poem.note || null,
            appreciation: poem.appreciation || null,
            source: { key: poem.sourceKey, url: poem.sourceUrl, license: poem.sourceLicense },
          };
          sqlParts.push(indexSql(poem, version, key, ordinal, updatedAt));
          sqlParts.push(categorySql(poem, version));
          categoryRows += poem.categories.length;
          catalog.push({ id: poem.id, fingerprint: poem.fingerprint, bodyKey: key });
        }
        await writeObject(r2Root, key, {
          schemaVersion: RELEASE_SCHEMA_VERSION,
          datasetVersion: version,
          sourceCommit: commit,
          poems: bodies,
        }, objects);
      }
    }
    sourceStats.push({ sourceKey: source.source_key, label: source.label, poemCount: sourceCount, files: names.length });
  }

  const sitemapSize = 1000;
  const sitemapCount = Math.ceil(catalog.length / sitemapSize);
  const sitemapPrefix = `releases/${version}/sitemaps`;
  await writeObject(r2Root, `${sitemapPrefix}/pages.xml`, '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://poemcn.2aran.com/</loc></url></urlset>', objects);
  for (let index = 0; index < sitemapCount; index += 1) {
    const rows = catalog.slice(index * sitemapSize, (index + 1) * sitemapSize).map((item) => ({ id: item.id, updatedAt: generatedAt }));
    await writeObject(r2Root, `${sitemapPrefix}/poems-${index}.xml`, sitemapXml(rows), objects);
  }
  const sitemapIndexKey = `releases/${version}/sitemap.xml`;
  await writeObject(r2Root, sitemapIndexKey, sitemapIndexXml(sitemapCount), objects);

  const indexSqlBody = sqlParts.join("");
  await writeFile(path.join(outputDir, "index.sql"), indexSqlBody);
  const stats = { poemCount: catalog.length, sourceCount: sourceStats.length, sources: sourceStats };
  const activationSql = `UPDATE dataset_state SET
  active_version = ${sqlString(version)},
  source_repository = ${sqlString(UPSTREAM_REPOSITORY)},
  source_commit = ${sqlString(commit)},
  stats_json = ${sqlString(JSON.stringify(stats))},
  sitemap_index_key = ${sqlString(sitemapIndexKey)},
  sitemap_prefix = ${sqlString(sitemapPrefix)},
  published_at = ${sqlString(generatedAt)},
  updated_at = CURRENT_TIMESTAMP
WHERE id = 1;\n`;
  await writeFile(path.join(outputDir, "activate.sql"), activationSql);
  await writeFile(path.join(outputDir, "catalog.ndjson"), `${catalog.map((item) => JSON.stringify(item)).join("\n")}\n`);

  let previousCatalog = [];
  if (options["baseline-catalog"]) {
    previousCatalog = (await readFile(path.resolve(options["baseline-catalog"]), "utf8")).split("\n").filter(Boolean).map(JSON.parse);
  }
  const delta = diffCatalog(catalog, previousCatalog);
  await writeFile(path.join(outputDir, "delta.json"), JSON.stringify(delta, null, 2));

  const estimate = estimateReleaseBudget({
    poemCount: catalog.length,
    categoryRows,
    r2Objects: objects.length,
    r2Bytes: objects.reduce((sum, object) => sum + object.bytes, 0),
    d1SqlBytes: Buffer.byteLength(indexSqlBody) + Buffer.byteLength(activationSql),
  }, Number(budgetLimits.d1WriteSafetyMultiplier || 12));
  const budgetDecision = evaluateBudget(estimate, budgetLimits);
  const manifest = {
    schemaVersion: RELEASE_SCHEMA_VERSION,
    version,
    generatedAt,
    source: { repository: UPSTREAM_REPOSITORY, commit },
    stats,
    metrics: {
      poemCount: catalog.length,
      categoryRows,
      r2Objects: objects.length,
      r2Bytes: objects.reduce((sum, object) => sum + object.bytes, 0),
      d1SqlBytes: Buffer.byteLength(indexSqlBody) + Buffer.byteLength(activationSql),
    },
    delta: { added: delta.added.length, updated: delta.updated.length, removed: delta.removed.length, unchanged: delta.unchanged },
    files: { indexSql: "index.sql", activationSql: "activate.sql", catalog: "catalog.ndjson", objects },
    budget: { limits: budgetLimits, estimate, decision: budgetDecision },
  };
  await writeFile(path.join(outputDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  process.stdout.write(`${JSON.stringify({ outputDir, version, stats, delta: manifest.delta, budget: manifest.budget }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
});
