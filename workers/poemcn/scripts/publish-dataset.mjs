import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { assertCommit, estimateReleaseBudget, evaluateBudget } from "./release-core.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const workerDir = path.resolve(scriptDir, "..");

function option(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : "";
}

function run(command, args) {
  const result = spawnSync(command, args, { cwd: workerDir, encoding: "utf8", stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} 失败，退出码 ${result.status}`);
}

function runJson(command, args) {
  const result = spawnSync(command, args, { cwd: workerDir, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} 失败：${result.stderr || result.stdout}`);
  try {
    return JSON.parse(result.stdout);
  } catch {
    throw new Error(`${command} 未返回可解析的 JSON：${result.stdout}`);
  }
}

function d1Results(payload) {
  const result = Array.isArray(payload) ? payload[0] : payload;
  if (!result?.success || !Array.isArray(result.results)) throw new Error(`D1 校验失败：${JSON.stringify(payload)}`);
  return result.results;
}

function releaseFile(releaseDir, relativeFile) {
  if (typeof relativeFile !== "string" || path.isAbsolute(relativeFile)) throw new Error(`release 文件路径无效：${relativeFile}`);
  const resolved = path.resolve(releaseDir, relativeFile);
  if (!resolved.startsWith(`${releaseDir}${path.sep}`)) throw new Error(`release 文件越界：${relativeFile}`);
  return resolved;
}

async function verifyArtifacts(manifest, releaseDir) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{2,80}$/.test(manifest.version || "")) throw new Error("manifest version 无效");
  assertCommit(manifest.source?.commit);
  if (!Array.isArray(manifest.files?.objects)) throw new Error("manifest 缺少 R2 对象清单");
  let r2Bytes = 0;
  for (const object of manifest.files.objects) {
    if (!/^[A-Za-z0-9][A-Za-z0-9/_.,:@+=-]{0,1023}$/.test(object.key || "") || object.key.includes("..")) {
      throw new Error(`R2 object key 无效：${object.key}`);
    }
    const body = await readFile(releaseFile(releaseDir, object.file));
    const sha256 = createHash("sha256").update(body).digest("hex");
    if (body.byteLength !== object.bytes || sha256 !== object.sha256) throw new Error(`R2 对象校验失败：${object.key}`);
    r2Bytes += body.byteLength;
  }
  const indexSql = await readFile(releaseFile(releaseDir, manifest.files.indexSql), "utf8");
  const activationSql = await readFile(releaseFile(releaseDir, manifest.files.activationSql), "utf8");
  const poemCount = (indexSql.match(/INSERT INTO poem_search_index/g) || []).length;
  const categoryRows = (indexSql.match(/INSERT OR IGNORE INTO poem_search_categories/g) || []).length;
  if (poemCount !== Number(manifest.stats?.poemCount)) throw new Error("manifest 诗文数与 index.sql 不一致");
  return {
    poemCount,
    categoryRows,
    r2Objects: manifest.files.objects.length,
    r2Bytes,
    d1SqlBytes: Buffer.byteLength(indexSql) + Buffer.byteLength(activationSql),
  };
}

async function main() {
  const manifestPath = path.resolve(option("manifest") || "");
  if (!option("manifest")) throw new Error("必须提供 --manifest");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const releaseDir = path.dirname(manifestPath);
  const database = option("database");
  const bucket = option("bucket") || "poemcn-content";
  if (!database) throw new Error("必须显式提供 --database；建议填离线构建的新 D1 名称");
  const artifactMetrics = await verifyArtifacts(manifest, releaseDir);

  const currentLimits = JSON.parse(await readFile(path.join(workerDir, "release-budget.json"), "utf8"));
  const estimate = estimateReleaseBudget(artifactMetrics, Number(currentLimits.d1WriteSafetyMultiplier || 12));
  const decision = evaluateBudget(estimate, currentLimits);
  if (!decision.ok) {
    throw new Error(`发布预算超限，未执行任何远端写入：${JSON.stringify(decision.violations)}`);
  }

  const apply = process.argv.includes("--apply");
  const confirmed = option("confirm-version");
  const summary = {
    mode: apply ? "apply" : "dry-run",
    version: manifest.version,
    database,
    bucket,
    objects: manifest.files.objects.length,
    estimate,
    decision,
  };
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (!apply) return;
  if (confirmed !== manifest.version) {
    throw new Error(`必须提供 --confirm-version ${manifest.version} 才能发布`);
  }

  // 不可变 R2 对象先上传。中途失败只会留下未激活版本，不影响线上读取。
  for (const object of manifest.files.objects) {
    run("npx", ["wrangler", "r2", "object", "put", `${bucket}/${object.key}`, "--file", releaseFile(releaseDir, object.file)]);
  }

  // 索引数据写入目标 D1，随后做只读计数与查询计划检查；激活指针永远最后更新。
  run("npx", ["wrangler", "d1", "execute", database, "--remote", "--file", releaseFile(releaseDir, manifest.files.indexSql)]);
  const execute = (sql) => d1Results(runJson("npx", ["wrangler", "d1", "execute", database, "--remote", "--json", "--command", sql]));
  const countRows = execute(`SELECT COUNT(*) AS count FROM poem_search_index WHERE dataset_version = '${manifest.version}'`);
  if (Number(countRows[0]?.count) !== artifactMetrics.poemCount) {
    throw new Error(`D1 记录数校验失败：期望 ${artifactMetrics.poemCount}，实际 ${countRows[0]?.count}`);
  }
  const plans = {
    list: execute(`EXPLAIN QUERY PLAN SELECT id,title,author FROM poem_search_index WHERE dataset_version='${manifest.version}' ORDER BY quality_score DESC,id ASC LIMIT 12`),
    detail: execute(`EXPLAIN QUERY PLAN SELECT id,title,author FROM poem_search_index WHERE dataset_version='${manifest.version}' AND id='probe' LIMIT 1`),
    category: execute(`EXPLAIN QUERY PLAN SELECT p.id FROM poem_search_categories c JOIN poem_search_index p ON p.dataset_version=c.dataset_version AND p.id=c.poem_id WHERE c.dataset_version='${manifest.version}' AND c.category='唐代' ORDER BY p.quality_score DESC,p.id ASC LIMIT 12`),
  };
  const planText = Object.fromEntries(Object.entries(plans).map(([name, rows]) => [name, rows.map(row => row.detail).join(" | ")]));
  if (!planText.list.includes("idx_poem_search_version_quality")) throw new Error(`列表查询未使用预期索引：${planText.list}`);
  if (!planText.detail.includes("sqlite_autoindex_poem_search_index_1")) throw new Error(`详情查询未使用主键索引：${planText.detail}`);
  if (!planText.category.includes("poem_search_categories")) throw new Error(`分类查询未使用分类索引：${planText.category}`);
  process.stdout.write(`${JSON.stringify({ verifiedRows: artifactMetrics.poemCount, queryPlans: planText }, null, 2)}\n`);
  run("npx", ["wrangler", "d1", "execute", database, "--remote", "--file", releaseFile(releaseDir, manifest.files.activationSql)]);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
});
