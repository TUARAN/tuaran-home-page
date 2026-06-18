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
  {
    id: 2,
    slug: 'lobsterusdt-2026-06-18-1407',
    date: '2026-06-18',
    time: '14:07',
    pair: 'LOBSTERUSDT',
    contractType: '永续合约',
    exchange: '火币 HTX',
    timeframe: '1日',
    price: {
      // 火币行情截图直接可见的字段
      current: 0.009511,
      // 24h 跌 14.64%，按现价反推 24h 前参考价（标作「今日开盘」）
      open: 0.011142,
      high: 0.020550,
      low: 0.009233,
      close: 0.009511,
      changePct: -14.64,
      changeAbs: -0.001631,
      // 截图未单列标记/指数价，近似取最新成交价
      markPrice: 0.009511,
      indexPrice: 0.009511,
    },
    range24h: {
      high: 0.020550,
      low: 0.009233,
      // (高-低)/低
      rangePct: 122.6,
    },
    volume: {
      vol24hToken: 12550000,
      vol24hUsdt: 119000,
      vol24hDisplay: '12.55M 龙虾',
      volUsdtDisplay: '11.9万 USDT',
      historicalMaxVol: '—',
      totalHistoricalVol: '—',
    },
    funding: {
      // 截图为「行情」页，未含资金费率；不臆造，标记为未采集
      rate: null,
      rateDisplay: '未采集',
      annualizedPct: null,
      countdown: '—',
      direction: '—',
    },
    ma: {
      // 火币日线 MA5 / MA10 / MA30（注意非分钟级 MA7/25/99，见 maPeriods）
      ma7: 0.012513,
      ma25: 0.011686,
      ma99: 0.008851,
      priceVsMa7Pct: -24.0,
      priceVsMa25Pct: -18.6,
      priceVsMa99Pct: 7.5,
    },
    // 该条快照的均线周期标签（日线 MA5/10/30）；缺省视为分钟级 7/25/99
    maPeriods: { short: 5, mid: 10, long: 30 },
    keyLevels: {
      resistance: 0.020550,
      support1: 0.009233,
      support2: 0.008851,
      historicalHigh: 0.027461,
      recentLow: 0.005234,
      reboundFromLowPct: 82,
    },
    riskSignals: {
      highFundingRate: false, // 未采集，不判定
      volumePriceDivergence: false,
      farFromMa: true, // 价格跌破 MA5/MA10，乖离 -24%
      overbought: false, // 已自高位跳水，不再超买
    },
    radarValues: {
      fundingRisk: 50, // 数据缺失，取中性占位
      volumeDivergence: 55,
      maDeviation: 70,
      overbought: 25,
      volatility: 95,
      liquidity: 45,
    },
    radarNormal: {
      fundingRisk: 30,
      volumeDivergence: 25,
      maDeviation: 20,
      overbought: 30,
      volatility: 35,
      liquidity: 50,
    },
    gaugeValue: 78,
    analysisSummary: {
      trend: '高位跳水 / 回调',
      riskLevel: '高风险',
      sentiment: '多空剧烈分歧',
      keyConcern:
        '自 0.005234 反弹逾 80%、冲高 0.020550 后单日跳水，价格跌破 MA5/MA10，火币该合约 24h 成交额仅 11.9 万 USDT、流动性偏薄，追高风险极大',
      action: '观望为主',
    },
    // 龙虾币基础情况（公开数据检索：CoinMarketCap / CoinGlass / BingX Learn，2026-06-18）
    fundamentals: {
      name: '龙虾 / Lobster（LOBSTER）',
      chain: 'BNB Smart Chain',
      contract: '0xeccbb861c0dda7efd964010085488b69317e4444',
      totalSupply: '10 亿（1,000,000,000，部署时一次性铸造，无增发/质押/销毁/交易税）',
      launch: 'Four.meme 公平发射，PancakeSwap 提供初始流动性；无预挖、无团队预留',
      team: '匿名团队，合约未开源',
      peakMarketCap: '约 1000 万美元（2026-03-09 前后，盘中一度 +190%）',
      totalOpenInterest: '全市场永续未平仓约 815 万美元（CoinGlass）',
      origin:
        '得名于 OpenClaw（红色龙虾图标的开源 AI agent，"养龙虾"=跑 OpenClaw 当私人 AI 工人）；价值主要由社区情绪与 MEME 传播驱动，与 OpenClaw 热度深度绑定（共识层而非技术层）',
      note: '匿名团队 + 合约未开源 + 流动性偏薄，价格与代码风险均较高；以上为外部可观察到的公开信息，不构成投资建议',
    },
    // 持仓基础情况（对象 / 方向 / 成本 / 盈亏）——来自火币持仓浮窗 + 图上买卖标记，截图未直接给出开仓均价
    position: {
      object: '龙虾USDT 永续合约（LOBSTER/USDT Perp · 火币 HTX）',
      direction: '多头（图上多处绿色 B 买入标记，最低买点约 0.005234）',
      pnlUsdt: 15.2184, // 持仓浮窗「收益 +15.2184」
      notionalUsdt: 1010.0682, // 持仓浮窗右侧「1010.0682」(名义/保证金)
      contractOpenInterestToken: 3374800, // 火币该合约「持仓量 3,374,800.0 龙虾」
      avgCost: null, // 截图未直接显示开仓均价
      costNote: '截图未给出开仓均价；图上最低买入标记约 0.005234，高位卖出标记区约 0.018～0.020',
      orderBookImbalance: 'B 65% / 35% S（买盘略占优）',
    },
    dataSource: '火币 HTX（行情截图）+ CoinMarketCap / CoinGlass（基础数据检索）',
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
