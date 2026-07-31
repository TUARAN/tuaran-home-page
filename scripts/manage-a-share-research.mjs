import crypto from 'node:crypto'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DATA_DIR = path.join(ROOT, 'data', 'a-shares')
const SNAPSHOT_PATH = path.join(DATA_DIR, 'companies.json')
const STATE_PATH = path.join(DATA_DIR, 'research-state.json')
const LIST_ARTICLE_PATH = path.join(ROOT, 'research', 'companies', '2026-07-31-a-share-company-list.md')
const TEMPLATE_PATH = path.join(ROOT, 'research', 'templates', 'a-share-company-research.md')
const RESEARCH_DIR = path.join(ROOT, 'research', 'companies')

const CNINFO_STOCK_LIST = 'https://www.cninfo.com.cn/new/data/szse_stock.json'
const TENCENT_QUOTE_API = 'https://qt.gtimg.cn/q='
const QUOTE_BATCH_SIZE = 80

const OFFICIAL_LIST_PAGES = {
  SSE: 'https://www.sse.com.cn/assortment/stock/list/share/',
  SZSE: 'https://www.szse.cn/market/product/stock/list/index.html',
  BSE: 'https://www.bse.cn/nq/listedcompany.html',
}

function shanghaiDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function shanghaiTime(date = new Date()) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Shanghai',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

export function classifyCompany(code) {
  if (/^(600|601|603|605)\d{3}$/.test(code)) {
    return { exchange: 'SSE', exchangeName: '上海证券交易所', board: 'main', boardName: '沪市主板' }
  }
  if (/^(688|689)\d{3}$/.test(code)) {
    return { exchange: 'SSE', exchangeName: '上海证券交易所', board: 'star', boardName: '科创板' }
  }
  if (/^(000|001|002|003)\d{3}$/.test(code)) {
    return { exchange: 'SZSE', exchangeName: '深圳证券交易所', board: 'main', boardName: '深市主板' }
  }
  if (/^(300|301|302)\d{3}$/.test(code)) {
    return { exchange: 'SZSE', exchangeName: '深圳证券交易所', board: 'chinext', boardName: '创业板' }
  }
  if (/^920\d{3}$/.test(code)) {
    return { exchange: 'BSE', exchangeName: '北京证券交易所', board: 'bse', boardName: '北交所' }
  }
  return null
}

export function normalizeCompanies(rows) {
  const unique = new Map()
  for (const row of rows || []) {
    const code = String(row?.f12 || row?.code || '').trim()
    const name = String(row?.f14 || row?.name || '').trim()
    const classification = classifyCompany(code)
    if (!classification || !name || name === '-') continue
    unique.set(code, { code, name, ...classification })
  }
  return [...unique.values()].sort((a, b) => a.code.localeCompare(b.code, 'zh-CN'))
}

export function validateSnapshot(companies) {
  if (companies.length < 5000 || companies.length > 8000) {
    throw new Error(`公司数量 ${companies.length} 超出安全范围 5000–8000，拒绝覆盖现有快照。`)
  }
  for (const exchange of ['SSE', 'SZSE', 'BSE']) {
    if (!companies.some((company) => company.exchange === exchange)) {
      throw new Error(`快照缺少 ${exchange} 公司，拒绝覆盖现有快照。`)
    }
  }
}

export function validateSnapshotChange(companies, previousSnapshot) {
  if (!previousSnapshot?.companies?.length) return
  const totalChange = Math.abs(companies.length - previousSnapshot.companies.length) / previousSnapshot.companies.length
  if (totalChange > 0.02) {
    throw new Error(`公司池较上一快照变化 ${(totalChange * 100).toFixed(2)}%，超过 2% 安全阈值，拒绝自动覆盖。`)
  }
  const currentCounts = countsFor(companies, 'exchange')
  const previousCounts = countsFor(previousSnapshot.companies, 'exchange')
  for (const exchange of ['SSE', 'SZSE', 'BSE']) {
    const baseline = previousCounts[exchange] || 0
    const change = baseline ? Math.abs((currentCounts[exchange] || 0) - baseline) / baseline : 1
    if (change > 0.05) {
      throw new Error(`${exchange} 公司数较上一快照变化 ${(change * 100).toFixed(2)}%，超过 5% 安全阈值。`)
    }
  }
}

function countsFor(companies, key) {
  return Object.fromEntries(
    [...new Set(companies.map((company) => company[key]))]
      .sort()
      .map((value) => [value, companies.filter((company) => company[key] === value).length]),
  )
}

function escapeMarkdownCell(value) {
  return String(value).replaceAll('|', '\\|').replaceAll('\n', ' ')
}

export function renderListArticle(snapshot) {
  const exchangeCounts = countsFor(snapshot.companies, 'exchange')
  const boardCounts = countsFor(snapshot.companies, 'boardName')
  const rows = snapshot.companies.map((company, index) =>
    `| ${index + 1} | ${company.code} | ${escapeMarkdownCell(company.name)} | ${company.exchangeName} | ${company.boardName} |`,
  )

  return `---
title: A 股上市公司全名单
category: companies
company_type: a_share_pool
date: 2026-07-31
time: ${snapshot.snapshotTime}
tags: [A股, 上市公司, 上海证券交易所, 深圳证券交易所, 北京证券交易所, 公司名单]
summary: "截至 ${snapshot.snapshotDate} 的 A 股上市公司候选池，共 ${snapshot.count} 家，覆盖沪市、深市与北交所。"
tldr: "A 股公司观察候选池当前收录 ${snapshot.count} 家公司；名单按证券代码排序。"
content_type: archive
assistance: codex
model: gpt-5.6
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

这份名单收录人民币普通股上市公司，覆盖上海证券交易所、深圳证券交易所和北京证券交易所。终止上市证券、B 股、基金、债券和存托凭证不在名单内。

快照日期为 **${snapshot.snapshotDate}**，共 **${snapshot.count} 家**。上市、退市和证券简称变更会造成名单变化。

## 市场分布

| 市场 | 公司数 |
|---|---:|
| 上海证券交易所 | ${exchangeCounts.SSE || 0} |
| 深圳证券交易所 | ${exchangeCounts.SZSE || 0} |
| 北京证券交易所 | ${exchangeCounts.BSE || 0} |

## 板块分布

| 板块 | 公司数 |
|---|---:|
${Object.entries(boardCounts).map(([board, count]) => `| ${board} | ${count} |`).join('\n')}

## 公司名单

| 序号 | 证券代码 | 证券简称 | 交易所 | 板块 |
|---:|---:|---|---|---|
${rows.join('\n')}

## 信息来源与说明

- [上海证券交易所股票列表](${OFFICIAL_LIST_PAGES.SSE})
- [深圳证券交易所股票列表](${OFFICIAL_LIST_PAGES.SZSE})
- [北京证券交易所股票列表](${OFFICIAL_LIST_PAGES.BSE})
- [巨潮资讯公司列表](${CNINFO_STOCK_LIST})
- 结构化基表来自巨潮资讯公司列表，腾讯行情状态用于剔除已终止上市的历史证券；抓取时间为 ${snapshot.generatedAt}。
- 名单适合选题与检索，不能替代交易所公告、上市公司公告或证券交易终端。
`
}

let preferCurl = false

async function fetchJson(url, label) {
  let payload
  let fetchError = new Error('已切换到 curl')
  if (!preferCurl) {
    try {
      const response = await fetch(url, {
        headers: {
          accept: 'application/json,text/plain,*/*',
          'user-agent': 'tuaran-home-page/a-share-research-pool',
        },
        signal: AbortSignal.timeout(30_000),
      })
      if (!response.ok) throw new Error(`行情接口返回 HTTP ${response.status}`)
      payload = await response.json()
    } catch (error) {
      fetchError = error
      preferCurl = true
    }
  }
  if (!payload) {
    try {
      const source = execFileSync('curl', [
        '-fsS',
        '--retry',
        '2',
        '--max-time',
        '30',
        url,
      ], { encoding: 'utf8', maxBuffer: 2 * 1024 * 1024 })
      payload = JSON.parse(source)
    } catch (curlError) {
      throw new Error(`${label}同步失败：fetch=${fetchError.message}；curl=${curlError.message}`)
    }
  }
  return payload
}

function quoteSymbol(company) {
  if (company.exchange === 'SSE') return `sh${company.code}`
  if (company.exchange === 'SZSE') return `sz${company.code}`
  return `bj${company.code}`
}

function fetchQuoteBatch(companies) {
  const url = `${TENCENT_QUOTE_API}${companies.map(quoteSymbol).join(',')}`
  let buffer
  try {
    buffer = execFileSync('curl', [
      '-fsS',
      '--retry',
      '2',
      '--max-time',
      '30',
      url,
    ], { maxBuffer: 4 * 1024 * 1024 })
  } catch (error) {
    throw new Error(`行情状态核验失败：${error.message}`)
  }
  const source = new TextDecoder('gb18030').decode(buffer)
  const statusByCode = new Map()
  for (const line of source.split(/;\s*/u)) {
    const match = /^v_(?:sh|sz|bj)(\d{6})="(.*)"$/u.exec(line.trim())
    if (match) statusByCode.set(match[1], match[2])
  }
  if (statusByCode.size < companies.length * 0.9) {
    throw new Error(`行情状态响应覆盖不足：请求 ${companies.length} 家，收到 ${statusByCode.size} 家。`)
  }
  return companies.filter((company) => {
    const status = statusByCode.get(company.code)
    return status && !status.includes('~D~')
  })
}

async function fetchMarketRows() {
  const payload = await fetchJson(CNINFO_STOCK_LIST, '巨潮资讯公司列表')
  if (!Array.isArray(payload?.stockList)) throw new Error('巨潮资讯返回了无法识别的公司列表。')
  const candidates = normalizeCompanies(
    payload.stockList
      .filter((company) => company.category === 'A股')
      .map((company) => ({ code: company.code, name: company.zwjc })),
  )
  const active = []
  for (let index = 0; index < candidates.length; index += QUOTE_BATCH_SIZE) {
    active.push(...fetchQuoteBatch(candidates.slice(index, index + QUOTE_BATCH_SIZE)))
  }
  return active
}

function atomicWriteJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  const temporary = `${file}.tmp-${process.pid}`
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`)
  fs.renameSync(temporary, file)
}

function atomicWriteText(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  const temporary = `${file}.tmp-${process.pid}`
  fs.writeFileSync(temporary, value)
  fs.renameSync(temporary, file)
}

async function syncPool() {
  const now = new Date()
  const previousSnapshot = readJson(SNAPSHOT_PATH)
  const companies = normalizeCompanies(await fetchMarketRows())
  validateSnapshot(companies)
  validateSnapshotChange(companies, previousSnapshot)
  const snapshot = {
    schemaVersion: 1,
    generatedAt: now.toISOString(),
    snapshotDate: shanghaiDate(now),
    snapshotTime: shanghaiTime(now),
    source: {
      provider: '巨潮资讯公司列表 + 腾讯行情状态核验',
      companyList: CNINFO_STOCK_LIST,
      statusApi: `${TENCENT_QUOTE_API}{symbols}`,
      officialListPages: OFFICIAL_LIST_PAGES,
    },
    count: companies.length,
    counts: {
      exchanges: countsFor(companies, 'exchange'),
      boards: countsFor(companies, 'board'),
    },
    companies,
  }
  atomicWriteJson(SNAPSHOT_PATH, snapshot)
  atomicWriteText(LIST_ARTICLE_PATH, renderListArticle(snapshot))
  return snapshot
}

function readJson(file, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (error) {
    if (error?.code === 'ENOENT') return fallback
    throw error
  }
}

function initialState() {
  return { schemaVersion: 1, selections: [] }
}

function existingResearchCodes() {
  const codes = new Set()
  for (const filename of fs.readdirSync(RESEARCH_DIR)) {
    if (!filename.endsWith('.md') || filename.endsWith('a-share-company-list.md')) continue
    const source = fs.readFileSync(path.join(RESEARCH_DIR, filename), 'utf8')
    const match = /^stock_code:\s*["']?(\d{6})["']?\s*$/mu.exec(source)
    if (match) codes.add(match[1])
  }
  return codes
}

export function selectNextCompany(companies, state, researchedCodes = new Set(), randomIndex = null) {
  const pending = state.selections.find((selection) => selection.status === 'selected')
  if (pending) {
    const company = companies.find((candidate) => candidate.code === pending.code)
    if (!company) throw new Error(`待完成公司 ${pending.code} 已不在当前公司池，请人工处理状态。`)
    return { company, selection: pending, resumed: true }
  }

  const usedCodes = new Set([
    ...researchedCodes,
    ...state.selections.map((selection) => selection.code),
  ])
  const available = companies.filter((company) => !usedCodes.has(company.code))
  if (!available.length) throw new Error('公司池已经全部完成，请归档状态后开启新一轮。')
  const index = randomIndex === null ? crypto.randomInt(available.length) : randomIndex(available.length)
  return { company: available[index], selection: null, resumed: false }
}

function outputPathFor(date, code) {
  return `research/companies/${date}-a-share-${code}.md`
}

function pickCompany() {
  const snapshot = readJson(SNAPSHOT_PATH)
  if (!snapshot?.companies?.length) throw new Error('缺少公司池，请先运行 npm run a-share:sync。')
  const state = readJson(STATE_PATH, initialState())
  const result = selectNextCompany(snapshot.companies, state, existingResearchCodes())
  let selection = result.selection
  if (!selection) {
    const selectedAt = new Date()
    const date = shanghaiDate(selectedAt)
    selection = {
      code: result.company.code,
      name: result.company.name,
      selectedAt: selectedAt.toISOString(),
      selectionDate: date,
      status: 'selected',
      outputPath: outputPathFor(date, result.company.code),
    }
    state.selections.push(selection)
    atomicWriteJson(STATE_PATH, state)
  }
  return {
    ...result.company,
    ...selection,
    resumed: result.resumed,
    templatePath: path.relative(ROOT, TEMPLATE_PATH),
  }
}

function readArg(name) {
  const index = process.argv.indexOf(name)
  return index === -1 ? '' : String(process.argv[index + 1] || '')
}

function completeCompany() {
  const code = readArg('--code')
  const article = readArg('--file')
  if (!/^\d{6}$/.test(code) || !article) {
    throw new Error('用法：complete --code 600000 --file research/companies/YYYY-MM-DD-a-share-600000.md')
  }
  const absoluteArticle = path.resolve(ROOT, article)
  if (!absoluteArticle.startsWith(`${RESEARCH_DIR}${path.sep}`)) throw new Error('文章必须位于 research/companies。')
  const source = fs.readFileSync(absoluteArticle, 'utf8')
  if (!new RegExp(`^stock_code:\\s*["']?${code}["']?\\s*$`, 'mu').test(source)) {
    throw new Error(`文章 frontmatter 缺少 stock_code: ${code}`)
  }
  if (/\{\{[A-Z0-9_]+\}\}/u.test(source)) throw new Error('文章仍包含未替换的模板占位符。')
  if (!/^review_ready:\s*false\s*$/mu.test(source)) throw new Error('自动生成稿必须保持 review_ready: false。')
  if (!/^## .*(?:信息来源|资料来源|来源与说明)/mu.test(source)) throw new Error('文章缺少结尾来源章节。')

  const state = readJson(STATE_PATH, initialState())
  const selection = state.selections.find((item) => item.code === code && item.status === 'selected')
  if (!selection) throw new Error(`没有找到 ${code} 的待完成抽取记录。`)
  selection.status = 'completed'
  selection.completedAt = new Date().toISOString()
  selection.articlePath = path.relative(ROOT, absoluteArticle)
  atomicWriteJson(STATE_PATH, state)
  return selection
}

function status() {
  const snapshot = readJson(SNAPSHOT_PATH)
  const state = readJson(STATE_PATH, initialState())
  return {
    pool: snapshot ? {
      count: snapshot.count,
      snapshotDate: snapshot.snapshotDate,
      generatedAt: snapshot.generatedAt,
    } : null,
    selected: state.selections.filter((item) => item.status === 'selected'),
    completed: state.selections.filter((item) => item.status === 'completed').length,
    remaining: snapshot
      ? snapshot.count - new Set([...existingResearchCodes(), ...state.selections.map((item) => item.code)]).size
      : null,
  }
}

async function main() {
  const command = process.argv[2]
  if (command === 'sync') {
    const snapshot = await syncPool()
    console.log(JSON.stringify({ count: snapshot.count, snapshotDate: snapshot.snapshotDate, article: path.relative(ROOT, LIST_ARTICLE_PATH) }))
    return
  }
  if (command === 'pick') {
    console.log(JSON.stringify(pickCompany(), null, 2))
    return
  }
  if (command === 'complete') {
    console.log(JSON.stringify(completeCompany(), null, 2))
    return
  }
  if (command === 'status') {
    console.log(JSON.stringify(status(), null, 2))
    return
  }
  throw new Error('用法：node scripts/manage-a-share-research.mjs <sync|pick|complete|status>')
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}
