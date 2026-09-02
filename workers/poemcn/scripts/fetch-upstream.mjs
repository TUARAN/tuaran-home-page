import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";

import { assertCommit } from "./release-core.mjs";
import { UPSTREAM_REPOSITORY } from "./upstream-sources.mjs";

function option(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : "";
}

function git(cwd, args) {
  return execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }).trim();
}

async function main() {
  const commit = assertCommit(option("commit"));
  const target = path.resolve(option("target") || "");
  if (!option("target")) throw new Error("必须提供 --target，避免写入不明确目录");

  if (!existsSync(path.join(target, ".git"))) {
    if (existsSync(target)) throw new Error(`目标已存在但不是 Git 仓库：${target}`);
    await mkdir(path.dirname(target), { recursive: true });
    execFileSync("git", ["clone", "--filter=blob:none", "--no-checkout", `https://github.com/${UPSTREAM_REPOSITORY}.git`, target], { stdio: "inherit" });
  }
  const dirty = git(target, ["status", "--porcelain"]);
  if (dirty) throw new Error("上游缓存仓库存在未提交改动，拒绝切换 commit");
  git(target, ["fetch", "origin", commit, "--depth=1"]);
  git(target, ["checkout", "--detach", commit]);
  const actual = git(target, ["rev-parse", "HEAD"]).toLowerCase();
  if (actual !== commit) throw new Error(`checkout 校验失败：${actual}`);
  process.stdout.write(`${JSON.stringify({ repository: UPSTREAM_REPOSITORY, commit, target }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
});
