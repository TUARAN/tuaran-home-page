#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const CATEGORY = { tip: '技巧', industry: '行业', 'ai-models': '模型', 'ai-products': '产品', paper: '论文', news: '资讯', tool: '工具', opensource: '开源', funding: '融资', research: '研究', agent: 'Agent' }

async function main() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const response = await fetch(`https://aihot.virxact.com/api/public/items?mode=selected&since=${encodeURIComponent(since)}&take=60`, { headers: { 'User-Agent': 'tuaran-home-page/frontend-weekly' } })
  if (!response.ok) throw new Error(`AI HOT API returned ${response.status}`)
  const payload = await response.json()
  const raw = Array.isArray(payload) ? payload : payload.items || payload.data || []
  const seen = new Set()
  const items = raw.filter((item) => {
    const key = item?.id || item?.url || item?.title
    if (!key || !item?.title || !item?.url || seen.has(key)) return false
    seen.add(key); return true
  }).map((item) => ({
    topic: CATEGORY[String(item.category || '').toLowerCase()] || '资讯', title: item.title,
    summary: item.summary || '', source: item.source || 'AI HOT', href: item.url, publishedAt: item.publishedAt || null,
  })).sort((a, b) => Date.parse(b.publishedAt || 0) - Date.parse(a.publishedAt || 0)).slice(0, 30)
  if (!items.length) return console.log('No live items; keeping the previous result.')
  const out = resolve(process.cwd(), 'content/frontend-weekly')
  mkdirSync(out, { recursive: true })
  writeFileSync(resolve(out, 'live.json'), JSON.stringify({ updatedAt: new Date().toISOString(), items }, null, 2) + '\n')
  console.log(`Wrote ${items.length} live items`)
}

main().catch((error) => { console.error(error); process.exit(1) })
