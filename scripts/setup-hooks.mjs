#!/usr/bin/env node
// 把 git 的 hooksPath 指向 scripts/hooks/，让仓库里的 pre-push 等钩子生效。
// 由 package.json 的 `prepare` 脚本在 npm install 后自动执行。
// 跳过：CI 环境（CI=true）或非 git 仓库时不动。

import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'

if (process.env.CI === 'true') {
  process.exit(0)
}

const repoRoot = process.cwd()
if (!existsSync(path.join(repoRoot, '.git'))) {
  // 例如发布为 npm 包后被人当依赖装的场景
  process.exit(0)
}

try {
  execSync('git config core.hooksPath scripts/hooks', { stdio: 'ignore', cwd: repoRoot })
  // 确保钩子可执行
  execSync('chmod +x scripts/hooks/pre-push', { stdio: 'ignore', cwd: repoRoot })
  console.log('[setup-hooks] core.hooksPath → scripts/hooks (pre-push lint guard active)')
} catch {
  // 无 git 或 chmod 不支持时静默退出
}
