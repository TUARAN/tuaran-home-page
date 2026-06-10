/**
 * 从掘金 API 拉取用户发文日期，生成 lib/juejin/activitySnapshot.js
 * 供知识库热力图与创作日历共用。
 */
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const USER_ID = '1521379823340792'
const API = 'https://api.juejin.cn/content_api/v1/article/query_list'

async function fetchAllArticles() {
  const articles = []
  let cursor = '0'

  while (true) {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sort_type: 2, user_id: USER_ID, cursor }),
    })
    const json = await res.json()
    if (json.err_no !== 0 || !json.data?.length) break
    articles.push(...json.data)
    cursor = String(Number(cursor) + 10)
  }

  return articles
}

function toIsoDate(unixSeconds) {
  const d = new Date(Number(unixSeconds) * 1000)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function buildSnapshot(articles) {
  const countsByDate = {}
  const tagCounts = {}

  for (const row of articles) {
    const info = row.article_info
    if (!info?.ctime) continue
    const date = toIsoDate(info.ctime)
    countsByDate[date] = (countsByDate[date] || 0) + 1

    for (const tag of row.tags || []) {
      const name = tag.tag_name
      if (!name) continue
      tagCounts[name] = (tagCounts[name] || 0) + 1
    }
  }

  const yearSummary = {}
  for (const [date, count] of Object.entries(countsByDate)) {
    const year = Number(date.slice(0, 4))
    yearSummary[year] = (yearSummary[year] || 0) + count
  }

  const years = Object.keys(yearSummary)
    .map(Number)
    .sort((a, b) => b - a)

  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([tag, count]) => ({ tag, count }))

  return {
    source: 'juejin-auto-sync-blog',
    snapshotAt: new Date().toISOString(),
    years,
    countsByDate,
    yearSummary: years.map((year) => ({
      year,
      parsedCount: yearSummary[year],
      reportedTotal: yearSummary[year],
    })),
    topTags,
    totalPosts: articles.length,
  }
}

const articles = await fetchAllArticles()
const snapshot = buildSnapshot(articles)
const outPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../lib/juejin/activitySnapshot.js')
const content = `export const JUEJIN_ACTIVITY_SNAPSHOT = ${JSON.stringify(snapshot)}\n`
writeFileSync(outPath, content, 'utf8')
console.log(`Synced ${snapshot.totalPosts} posts → ${Object.keys(snapshot.countsByDate).length} active days`)
