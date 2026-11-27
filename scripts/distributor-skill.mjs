#!/usr/bin/env node
// 生成 `2aran-distributor` skill。
//   node scripts/distributor-skill.mjs           写入 codex-skills/2aran-distributor/SKILL.md
//   node scripts/distributor-skill.mjs --install 同时安装到 ~/.claude/skills/2aran-distributor/

import { mkdir, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { DISTRIBUTOR_SKILL_NAME, HARNESS_VERSION } from '../lib/distribution/harness.js'
import { buildDistributorSkill } from '../lib/distribution/skill.js'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const content = buildDistributorSkill()

async function write(dir) {
  await mkdir(dir, { recursive: true })
  const file = path.join(dir, 'SKILL.md')
  await writeFile(file, content)
  console.log(`wrote ${file}`)
}

await write(path.join(repoRoot, 'codex-skills', DISTRIBUTOR_SKILL_NAME))
if (process.argv.includes('--install')) {
  await write(path.join(os.homedir(), '.claude', 'skills', DISTRIBUTOR_SKILL_NAME))
  console.log(`installed ${DISTRIBUTOR_SKILL_NAME} v${HARNESS_VERSION}; start a new Claude session to load it.`)
}
