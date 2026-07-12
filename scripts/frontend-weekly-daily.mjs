#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const OUT = resolve(process.cwd(), 'content/frontend-weekly')
const DAILY = resolve(OUT, 'daily')
const PUBLIC_DAILY = resolve(process.cwd(), 'public/frontend-weekly/daily')
const KEYWORDS = ['Claude Code', 'Codex', 'Cursor', 'Copilot', 'Anthropic', 'OpenAI', 'DeepSeek', 'Agent', 'MCP', 'AI 编程', '代码', '编程', '具身智能', '机器人', 'Figure', '宇树']
const NEGATIVE = ['npm', 'pip install', 'release notes', 'patch', 'bugfix', 'dependabot']

function ymd(date) { return date.toISOString().slice(0, 10) }
function displayDate(date) { return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Shanghai' }).format(date) }
function topic(item) {
  const text = `${item.title || ''} ${item.summary || ''}`.toLowerCase()
  return /具身智能|机器人|embodied|figure|宇树/.test(text) ? '具身智能' : 'AI Coding'
}
function score(item) {
  const text = `${item.title || ''} ${item.summary || ''}`.toLowerCase()
  return KEYWORDS.reduce((total, keyword) => total + (text.includes(keyword.toLowerCase()) ? 1 : 0), 0)
    - NEGATIVE.reduce((total, keyword) => total + (text.includes(keyword) ? 10 : 0), 0)
}
function reason(item) {
  const text = `${item.title || ''} ${item.summary || ''}`
  if (/发布|推出|开源|上线/.test(text)) return '新能力发布直接影响开发者工具链，值得第一时间关注'
  if (/融资|IPO|估值|亿美元/.test(text)) return '资本动向反映赛道景气度，影响长期技术投入'
  if (/报告|数据|调查|评测|基准|benchmark/i.test(text)) return '行业数据与评测为技术选型提供参考'
  return '对 AI 开发与前端工具链有潜在影响，值得持续跟踪'
}

async function main() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const response = await fetch(`https://aihot.virxact.com/api/public/items?mode=selected&since=${encodeURIComponent(since)}&take=60`, { headers: { 'User-Agent': 'tuaran-home-page/frontend-weekly' } })
  if (!response.ok) throw new Error(`AI HOT API returned ${response.status}`)
  const payload = await response.json()
  const raw = Array.isArray(payload) ? payload : payload.items || payload.data || []
  const selected = raw
    .filter((item) => item?.title && item?.url)
    .map((item) => ({ item, score: score(item) }))
    .filter(({ score: value }) => value > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ item }, index) => ({
      num: String(index + 1).padStart(2, '0'), topic: topic(item), title: item.title,
      summary: item.summary || '', reason: reason(item), href: item.url, source: item.source || 'AI HOT',
    }))
  if (!selected.length) return console.log('No matching daily items; keeping the previous result.')

  const now = new Date()
  const date = ymd(now)
  const entry = { date, displayDate: displayDate(now), count: selected.length, highlights: selected.map((item) => item.title.slice(0, 26)) }
  const content = JSON.stringify({ ...entry, items: selected }, null, 2) + '\n'
  mkdirSync(DAILY, { recursive: true })
  mkdirSync(PUBLIC_DAILY, { recursive: true })
  writeFileSync(resolve(DAILY, `${date}.json`), content)
  writeFileSync(resolve(PUBLIC_DAILY, `${date}.json`), content)
  let manifest = { latest: '', list: [] }
  try { manifest = JSON.parse(readFileSync(resolve(OUT, 'daily-manifest.json'), 'utf8')) } catch {}
  manifest.list = [entry, ...(manifest.list || []).filter((item) => item.date !== date)].sort((a, b) => b.date.localeCompare(a.date))
  manifest.latest = date
  writeFileSync(resolve(OUT, 'daily-manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
  console.log(`Wrote daily selection for ${date}: ${selected.length} items`)
}

main().catch((error) => { console.error(error); process.exit(1) })
