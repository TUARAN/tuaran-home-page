/**
 * 交易分析快照库（多标的 · 分钟级）
 *
 * 每条记录 = 一次完整的「多维度交易分析」快照，精确到分钟。
 * 旧版页面以"日"为粒度（一天内变化巨大），现在统一在数组里维护，
 * 通过 /stock-analysis 索引页 + /stock-analysis/[slug] 详情页访问。
 *
 * 字段约定（统一 schema，便于后续脚本批量生成）：
 * - id          内部稳定 ID
 * - slug        URL 段：小写标的 + 日期 + 时间（精确到分钟）
 * - date        分析日期 YYYY-MM-DD
 * - time        分析时刻 HH:mm（精确到分钟）
 * - pair        交易对，例如 LOBSTERUSDT
 * - contractType  永续合约 / 交割合约 / 现货
 * - exchange    交易所
 * - timeframe   分析周期：1分钟 / 5分钟 / 15分钟 ...
 * - price / range24h / volume / funding / ma / keyLevels / riskSignals / radarValues / radarNormal / gaugeValue
 * - analysisSummary  { trend, riskLevel, sentiment, keyConcern, action }
 * - dataSource  数据源说明
 *
 * 重要：每条快照必须是真实采集的数据，不确定的不要写。
 */

export const STOCK_ANALYSIS_RECORDS = [
  {
    id: 1,
    slug: 'lobsterusdt-2026-06-17-1320',
    date: '2026-06-17',
    time: '13:20',
    pair: 'LOBSTERUSDT',
    contractType: '永续合约',
    exchange: 'Binance',
    timeframe: '1分钟',
    price: {
      current: 0.019070,
      open: 0.018313,
      high: 0.019580,
      low: 0.016186,
      close: 0.019091,
      changePct: 24.84,
      changeAbs: 0.003794,
      markPrice: 0.018959,
      indexPrice: 0.018939,
    },
    range24h: {
      high: 0.019580,
      low: 0.014836,
      rangePct: 31.97,
    },
    volume: {
      vol24hToken: 3956627558,
      vol24hUsdt: 16883000,
      vol24hDisplay: '921.7M LOBSTER',
      volUsdtDisplay: '16.88M USDT',
      historicalMaxVol: '940.883M',
      totalHistoricalVol: '1.621B',
    },
    funding: {
      rate: 0.000717,
      rateDisplay: '0.07170%',
      annualizedPct: 628,
      countdown: '02:40:36',
      direction: '多头支付空头',
    },
    ma: {
      ma7: 0.013786,
      ma25: 0.009709,
      ma99: 0.009205,
      priceVsMa7Pct: 38.3,
      priceVsMa25Pct: 96.4,
      priceVsMa99Pct: 107.2,
    },
    keyLevels: {
      resistance: 0.019580,
      support1: 0.015000,
      support2: 0.010000,
      historicalHigh: 0.027461,
      recentLow: 0.005208,
      reboundFromLowPct: 266,
    },
    riskSignals: {
      highFundingRate: true,
      volumePriceDivergence: true,
      farFromMa: true,
      overbought: true,
    },
    radarValues: {
      fundingRisk: 95,
      volumeDivergence: 75,
      maDeviation: 92,
      overbought: 88,
      volatility: 72,
      liquidity: 60,
    },
    radarNormal: {
      fundingRisk: 30,
      volumeDivergence: 25,
      maDeviation: 20,
      overbought: 30,
      volatility: 35,
      liquidity: 50,
    },
    gaugeValue: 82,
    analysisSummary: {
      trend: '强势上涨',
      riskLevel: '高风险',
      sentiment: '极端看多',
      keyConcern: '资金费率异常+量价背离+远离均线，短期回调风险极大',
      action: '观望为主',
    },
    dataSource: 'Binance',
  },
]

// ============================================================
// 工具函数
// ============================================================

/** 把 date + time 拼成可比较的字符串 'YYYY-MM-DD HH:mm' */
function toDateTime(r) {
  return `${r.date} ${r.time || '00:00'}`
}

/** 按 slug 取一条详情 */
export function getSnapshotBySlug(slug) {
  return STOCK_ANALYSIS_RECORDS.find((r) => r.slug === slug) || null
}

/** 按 id 取一条详情 */
export function getSnapshotById(id) {
  return STOCK_ANALYSIS_RECORDS.find((r) => r.id === Number(id)) || null
}

/** 所有 slug（供 generateStaticParams 用） */
export function getAllSlugs() {
  return STOCK_ANALYSIS_RECORDS.map((r) => r.slug)
}

/** 索引页用的精简摘要（避免把整套指标塞进索引） */
export function getAllSnapshotsSummary() {
  return STOCK_ANALYSIS_RECORDS.map((r) => ({
    id: r.id,
    slug: r.slug,
    date: r.date,
    time: r.time,
    datetime: toDateTime(r),
    pair: r.pair,
    contractType: r.contractType,
    exchange: r.exchange,
    timeframe: r.timeframe,
    price: r.price,
    funding: r.funding,
    riskSignals: r.riskSignals,
    gaugeValue: r.gaugeValue,
    analysisSummary: r.analysisSummary,
  }))
}

/** 给定 slug，返回上一条/下一条 slug（按 datetime 倒序：最新在前） */
export function getSiblingSlugs(slug) {
  // 默认排序：datetime 从新到旧
  const sorted = STOCK_ANALYSIS_RECORDS.slice().sort((a, b) => toDateTime(b).localeCompare(toDateTime(a)))
  const idx = sorted.findIndex((r) => r.slug === slug)
  if (idx === -1) return { prev: null, next: null }
  const prev = idx > 0 ? sorted[idx - 1].slug : null
  const next = idx < sorted.length - 1 ? sorted[idx + 1].slug : null
  return { prev, next }
}
