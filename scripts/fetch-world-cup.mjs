#!/usr/bin/env node
/**
 * 手动触发一次 WC 数据采集。
 *
 * 数据源是 openfootball/worldcup.json (无 key、无限流),所以这个脚本不需要任何
 * API key —— 只是带上 WC_COLLECT_SECRET 去敲 /api/wc/collect 端点。
 *
 * 用法:
 *   node scripts/fetch-world-cup.mjs              # 打本地 http://localhost:8788
 *   node scripts/fetch-world-cup.mjs --remote     # 打 https://2aran.com
 *   BASE=http://localhost:3000 node scripts/fetch-world-cup.mjs
 *
 * secret 解析顺序: 环境变量 WC_COLLECT_SECRET > .dev.vars 里的同名项。
 */

import { readFileSync } from 'node:fs'

function readSecret() {
  if (process.env.WC_COLLECT_SECRET) return process.env.WC_COLLECT_SECRET
  try {
    const txt = readFileSync('.dev.vars', 'utf8')
    const m = /^WC_COLLECT_SECRET=(.*)$/m.exec(txt)
    if (m) return m[1].trim()
  } catch {
    /* .dev.vars 不存在,忽略 */
  }
  return ''
}

const remote = process.argv.includes('--remote')
const base =
  process.env.BASE || (remote ? 'https://2aran.com' : 'http://localhost:8788')
const secret = readSecret()

if (!secret) {
  console.error('❌ 没找到 WC_COLLECT_SECRET (环境变量或 .dev.vars 里都没有)')
  console.error('   export WC_COLLECT_SECRET=... 或在 .dev.vars 里加一行')
  process.exit(1)
}

const url = `${base}/api/wc/collect`
console.log(`→ POST ${url}`)

try {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'x-wc-secret': secret },
  })
  const body = await res.json().catch(() => ({}))
  console.log(`← ${res.status}`, JSON.stringify(body, null, 2))
  process.exit(res.ok && body.ok ? 0 : 1)
} catch (err) {
  console.error('请求失败:', err.message)
  console.error('  本地模式记得先起: npx wrangler pages dev .vercel/output/static --d1=DB=tuaran-me --port 8788')
  process.exit(1)
}
