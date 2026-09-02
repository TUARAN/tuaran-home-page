import { createHash } from "node:crypto";

export const RELEASE_SCHEMA_VERSION = 1;
export const DEFAULT_SHARD_SIZE = 200;

export function assertCommit(commit) {
  const value = String(commit || "").trim().toLowerCase();
  if (!/^[0-9a-f]{40}$/.test(value)) {
    throw new Error("--commit 必须是完整的 40 位 Git commit SHA，禁止使用 branch/tag");
  }
  return value;
}

export function releaseVersion(commit, date = new Date()) {
  const stamp = date.toISOString().slice(0, 10).replaceAll("-", "");
  return `${stamp}-${assertCommit(commit).slice(0, 12)}`;
}

export function shardKey(version, sourceKey, fileName, shardIndex) {
  const digest = createHash("sha256").update(fileName).digest("hex").slice(0, 12);
  return `releases/${version}/poems/${sourceKey}/${digest}-${String(shardIndex).padStart(4, "0")}.json`;
}

export function sqlString(value) {
  if (value == null) return "NULL";
  return `'${String(value).replaceAll("'", "''")}'`;
}

export function estimateReleaseBudget({ poemCount, categoryRows, r2Objects, r2Bytes, d1SqlBytes }, multiplier = 12) {
  const logicalD1Rows = Math.max(0, poemCount) + Math.max(0, categoryRows);
  return {
    poemCount: Math.max(0, poemCount),
    logicalD1Rows,
    estimatedD1RowsWritten: Math.ceil(logicalD1Rows * multiplier),
    d1WriteSafetyMultiplier: multiplier,
    r2Objects: Math.max(0, r2Objects),
    r2Bytes: Math.max(0, r2Bytes),
    d1SqlBytes: Math.max(0, d1SqlBytes),
  };
}

export function evaluateBudget(estimate, limits) {
  const checks = [
    ["estimatedD1RowsWritten", "maxEstimatedD1RowsWritten"],
    ["r2Objects", "maxR2Objects"],
    ["r2Bytes", "maxR2Bytes"],
    ["d1SqlBytes", "maxD1SqlBytes"],
  ];
  const violations = checks.flatMap(([metric, limit]) => {
    const ceiling = Number(limits?.[limit]);
    return Number.isFinite(ceiling) && estimate[metric] > ceiling
      ? [{ metric, actual: estimate[metric], limit: ceiling }]
      : [];
  });
  return { ok: violations.length === 0, violations };
}

export function diffCatalog(current, previous = []) {
  const before = new Map(previous.map((item) => [item.id, item.fingerprint]));
  const after = new Map(current.map((item) => [item.id, item.fingerprint]));
  const added = [];
  const updated = [];
  const removed = [];
  for (const [id, fingerprint] of after) {
    if (!before.has(id)) added.push(id);
    else if (before.get(id) !== fingerprint) updated.push(id);
  }
  for (const id of before.keys()) if (!after.has(id)) removed.push(id);
  return { added, updated, removed, unchanged: after.size - added.length - updated.length };
}
