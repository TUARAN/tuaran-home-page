export const COINGECKO_MARKETS_API = 'https://api.coingecko.com/api/v3/coins/markets'
export const CRYPTO_POOL_SIZE = 250
export const CRYPTO_POOL_STALE_MS = 20 * 60 * 60 * 1000
export const CRYPTO_RESEARCH_TEMPLATE_VERSION = 1
export const MAX_DRAFT_ATTEMPTS = 5
// 联网调研需要完成多轮检索和长文生成；26 秒会在正常响应返回前反复中断。
export const GENERATION_TIMEOUT_MS = 90_000
export const GENERATION_LOCK_MS = 10 * 60 * 1000

const SECTIONS = [
  '一、先给结论',
  '二、起源、背景与发展时间线',
  '三、技术机制与网络结构',
  '四、用途、生态与价值来源',
  '五、代币经济与供给结构',
  '六、市场位置与历史表现',
  '七、治理、安全与关键依赖',
  '八、监管与合规环境',
  '九、催化因素、主要风险与外部研判',
  '十、信息来源与未能验证',
]

export function shanghaiDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}

export function shanghaiTime(date = new Date()) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', hour12: false }).format(date)
}

function numberOrNull(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

export function normalizeMarketCoins(rows) {
  const unique = new Map()
  for (const row of rows || []) {
    const id = String(row?.id || '').trim().toLowerCase()
    const symbol = String(row?.symbol || '').trim().toUpperCase()
    const name = String(row?.name || '').trim()
    const rank = numberOrNull(row?.market_cap_rank)
    const marketCap = numberOrNull(row?.market_cap)
    if (!id || !symbol || !name || !Number.isInteger(rank) || rank < 1 || marketCap === null || marketCap <= 0) continue
    unique.set(id, {
      id,
      symbol,
      name,
      image: String(row.image || ''),
      marketCapRank: rank,
      currentPrice: numberOrNull(row.current_price),
      marketCap,
      fullyDilutedValuation: numberOrNull(row.fully_diluted_valuation),
      totalVolume: numberOrNull(row.total_volume),
      priceChange24hPct: numberOrNull(row.price_change_percentage_24h),
      circulatingSupply: numberOrNull(row.circulating_supply),
      totalSupply: numberOrNull(row.total_supply),
      maxSupply: numberOrNull(row.max_supply),
      ath: numberOrNull(row.ath),
      athChangePct: numberOrNull(row.ath_change_percentage),
      athDate: String(row.ath_date || ''),
      atl: numberOrNull(row.atl),
      atlDate: String(row.atl_date || ''),
      lastUpdated: String(row.last_updated || ''),
    })
  }
  return [...unique.values()].sort((a, b) => a.marketCapRank - b.marketCapRank || b.marketCap - a.marketCap)
}

export function validateMarketSnapshot(coins) {
  if (!Array.isArray(coins) || coins.length < 100 || coins.length > CRYPTO_POOL_SIZE) {
    throw new Error(`币种数量 ${coins?.length || 0} 超出安全范围 100–${CRYPTO_POOL_SIZE}，拒绝覆盖快照。`)
  }
  if (coins[0]?.marketCapRank > 3) throw new Error('市值快照缺少头部币种，拒绝覆盖。')
}

export function pickHighestRankedUnresearched(coins, usedIds) {
  const coin = (coins || []).find((candidate) => !usedIds.has(candidate.id))
  if (!coin) throw new Error('当前市值币种池已全部完成，请扩大池范围或开启新一轮。')
  return coin
}

export function draftGenerationDecision(draft, now = Date.now()) {
  if (!draft) return { action: 'attempt' }
  if (draft.status === 'pending') return { action: 'done' }
  if (!['generating', 'failed'].includes(draft.status)) return { action: 'stop' }
  const attempts = Number(draft.attempt_count || 0)
  const recoverableLegacyTimeout = draft.status === 'failed'
    && attempts === MAX_DRAFT_ATTEMPTS
    && String(draft.generation_error || '').includes('DeepSeek API 超时')
  const recoverableLegacyCategoryValidation = draft.status === 'failed'
    && attempts === MAX_DRAFT_ATTEMPTS + 1
    && String(draft.generation_error || '') === '草稿缺少或错误：category。'
  if (attempts >= MAX_DRAFT_ATTEMPTS && !recoverableLegacyTimeout && !recoverableLegacyCategoryValidation) {
    return { action: 'exhausted', attempts }
  }
  if (draft.status === 'generating' && attempts > 0) {
    const retryAfterMs = GENERATION_LOCK_MS - (Number(now) - Number(draft.updated_at))
    if (retryAfterMs > 0) return { action: 'locked', retryAfterMs }
  }
  return { action: 'attempt' }
}

function value(value, suffix = '') {
  return value === null || value === undefined ? '—' : `${value}${suffix}`
}

export function buildCryptoDraftPrompt({ coin, style, now = new Date() }) {
  const date = shanghaiDate(now)
  const time = shanghaiTime(now)
  const marketText = [
    `CoinGecko ID：${coin.id}`,
    `名称 / 符号：${coin.name} / ${coin.symbol}`,
    `市值排名：#${coin.marketCapRank}`,
    `价格：${value(coin.currentPrice, ' USD')}`,
    `流通市值：${value(coin.marketCap, ' USD')}`,
    `FDV：${value(coin.fullyDilutedValuation, ' USD')}`,
    `24 小时成交额：${value(coin.totalVolume, ' USD')}`,
    `24 小时涨跌：${value(coin.priceChange24hPct, '%')}`,
    `流通量 / 总量 / 上限：${value(coin.circulatingSupply)} / ${value(coin.totalSupply)} / ${value(coin.maxSupply)}`,
    `历史高点：${value(coin.ath, ' USD')}（${coin.athDate || '—'}，距高点 ${value(coin.athChangePct, '%')}）`,
    `历史低点：${value(coin.atl, ' USD')}（${coin.atlDate || '—'}）`,
    `数据更新时间：${coin.lastUpdated || '—'}`,
  ].join('\n')
  const styleText = [
    `当前生效风格：${style?.label || '默认分析风格'}（${style?.id || 'default-research'}）`,
    ...(style?.principles || []).map((item) => `- ${item}`),
    ...(style?.badPhrases || []).map((item) => `- 禁用「${item.phrase}」：${item.why}`),
  ].join('\n')

  return [
    {
      role: 'system',
      content: '你是加密资产研究助手。必须使用 web_search 核实项目官方文档、代码仓库、治理与安全事件、代币经济和监管材料；最多检索 3 次。优先使用一手来源，不能编造 URL、人物、融资、供给、链上数据或法律结论。市场数字只采用用户给出的 CoinGecko 快照。输出完整 Markdown，含闭合 frontmatter 和指定十节，不输出代码围栏或过程说明。不得给出买卖、收益保证、仓位或价格预测。',
    },
    {
      role: 'user',
      content: [
        `调研对象：${coin.name}（${coin.symbol}）`,
        `资料截点：${date} ${time}（北京时间）`,
        '',
        'CoinGecko 市场快照：',
        marketText,
        '',
        '章节标题必须逐字出现：',
        SECTIONS.map((section) => `## ${section}`).join('\n'),
        '',
        'frontmatter 必填：',
        `title: "阿燃调研：每天一个加密资产 —— ${coin.name}（${coin.symbol}）观察"`,
        'category: topics',
        'topic_type: market',
        'crypto_type: asset',
        `coin_id: "${coin.id}"`,
        `symbol: "${coin.symbol}"`,
        `market_cap_rank: ${coin.marketCapRank}`,
        `date: "${date}"`,
        `time: "${time}"`,
        `tags: [加密资产, "${coin.name}", "${coin.symbol}"]`,
        'subjects: [business_market]',
        'summary 与 tldr 各一句；content_type: analysis；assistance: codex；model: deepseek-v4-flash',
        `research_template: crypto-asset-research；research_template_version: ${CRYPTO_RESEARCH_TEMPLATE_VERSION}；sources_as_of: "${date}"`,
        'show_assistance: false；review_ready: false；ad_eligible: false；pv: 0',
        '',
        '写作约束：每个关键事实附可访问的直接来源；区分协议、网络与代币；区分事实、项目方主张和外部判断；缺失或冲突信息进入第十节。第十节必须列出 CoinGecko markets 接口和实际检索来源。禁用“不是 X，而是 Y”句式，删除无导航作用的“本文/本篇/本调研”。',
        '',
        styleText,
      ].join('\n'),
    },
  ]
}

export function validateCryptoDraft(content, coin = null) {
  const text = String(content || '')
  if (text.length < 400) throw new Error('生成内容过短，疑似空响应。')
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u.exec(text)
  if (!match) throw new Error('草稿必须以闭合 frontmatter 开头。')
  const frontmatter = match[1]
  const required = [
    [/^category:\s*(["']?)topics\1\s*$/mu, 'category'],
    [/^crypto_type:\s*(["']?)asset\1\s*$/mu, 'crypto_type'],
    [/^coin_id:\s*"?[^"\s]+"?\s*$/mu, 'coin_id'],
    [/^symbol:\s*"?[^"\s]+"?\s*$/mu, 'symbol'],
    [/^market_cap_rank:\s*\d+\s*$/mu, 'market_cap_rank'],
    [/^review_ready:\s*false\s*$/mu, 'review_ready'],
    [/^ad_eligible:\s*false\s*$/mu, 'ad_eligible'],
  ]
  for (const [pattern, label] of required) if (!pattern.test(frontmatter)) throw new Error(`草稿缺少或错误：${label}。`)
  for (const section of SECTIONS) if (!text.includes(`## ${section}`)) throw new Error(`草稿缺少章节：${section}。`)
  if (coin && !new RegExp(`^coin_id:\\s*"?${coin.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"?\\s*$`, 'mu').test(frontmatter)) {
    throw new Error(`coin_id 与选题 ${coin.id} 不一致。`)
  }
  if (coin?.name && !text.includes(String(coin.name))) throw new Error(`正文未包含币种名称「${coin.name}」。`)
  if (/\{\{[A-Z0-9_]+\}\}/u.test(text)) throw new Error('草稿仍包含模板占位符。')
  return true
}
