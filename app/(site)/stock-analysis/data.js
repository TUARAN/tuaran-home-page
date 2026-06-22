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
 * - category    币种分类，{ id, label }，例如 { id: 'lobster', label: '龙虾币' }
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
    category: { id: 'lobster', label: '龙虾币' },
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
    category: { id: 'lobster', label: '龙虾币' },
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
  {
    id: 3,
    slug: 'lobsterusdt-2026-06-22-0920',
    date: '2026-06-22',
    time: '09:20',
    pair: 'LOBSTERUSDT',
    category: { id: 'lobster', label: '龙虾币' },
    contractType: '永续合约',
    exchange: 'Binance',
    timeframe: '1日',
    price: {
      current: 0.009406,
      open: 0.009354,
      high: 0.009566,
      low: 0.009324,
      close: 0.009406,
      changePct: 1.98,
      changeAbs: 0.000182,
      markPrice: 0.009399,
      indexPrice: 0.009360,
    },
    range24h: {
      high: 0.010797,
      low: 0.009110,
      rangePct: 18.52,
    },
    volume: {
      vol24hToken: 687823026,
      // 截图未给出 24H USDT 成交额，不用代币量乘现价伪造精确值
      vol24hUsdt: null,
      vol24hDisplay: '687.82M 龙虾',
      volUsdtDisplay: '未采集',
      // 日线图底部可见的当日成交数据
      currentCandleVolToken: 19859000,
      currentCandleVolUsdt: 187181,
      historicalMaxVol: '1.65B',
      totalHistoricalVol: '1.091B',
      historicalMaxVolLabel: '图示量能均线 1',
      totalHistoricalVolLabel: '图示量能均线 2',
    },
    funding: {
      rate: 0.000331,
      rateDisplay: '0.03310%',
      // 4 小时一次：0.03310% × 6 × 365（简单年化）
      annualizedPct: 72.5,
      countdown: '02:39:27',
      direction: '多头支付空头',
    },
    ma: {
      ma7: 0.010772,
      ma25: 0.010040,
      ma99: 0.008649,
      priceVsMa7Pct: -12.7,
      priceVsMa25Pct: -6.3,
      priceVsMa99Pct: 8.8,
    },
    maPeriods: { short: 7, mid: 25, long: 99 },
    keyLevels: {
      resistance: 0.010797,
      support1: 0.009110,
      support2: 0.008649,
      historicalHigh: 0.027461,
      recentLow: 0.005208,
      reboundFromLowPct: 81,
    },
    riskSignals: {
      highFundingRate: true,
      volumePriceDivergence: true,
      farFromMa: true,
      overbought: false,
    },
    radarValues: {
      fundingRisk: 78,
      volumeDivergence: 72,
      maDeviation: 48,
      overbought: 35,
      volatility: 68,
      liquidity: 55,
    },
    radarNormal: {
      fundingRisk: 30,
      volumeDivergence: 25,
      maDeviation: 20,
      overbought: 30,
      volatility: 35,
      liquidity: 50,
    },
    gaugeValue: 72,
    analysisSummary: {
      trend: '冲高回落后缩量整理',
      riskLevel: '高风险',
      sentiment: '短线谨慎偏多',
      keyConcern:
        '现价低于 MA7/MA25，短中期趋势尚未转强；冲高 0.020 上方后量能快速回落，但价格仍守住 MA99。4 小时资金费率 0.03310%、简单年化约 72.5%，多头持仓成本偏高',
      action: '等待放量突破或回踩确认',
    },
    dataSource: 'Binance 永续合约日线行情截图（2026-06-22 09:20）',
  },
]

export const WEEKLY_ADVICE_RECORDS = [
  {
    id: 'lobster-weekly-2026-06-22',
    category: { id: 'lobster', label: '龙虾币' },
    pair: 'LOBSTERUSDT',
    week: '2026-06-22 ~ 2026-06-28',
    createdAt: '2026-06-22 11:03',
    sourceSnapshotSlugs: [
      'lobsterusdt-2026-06-17-1320',
      'lobsterusdt-2026-06-18-1407',
      'lobsterusdt-2026-06-22-0920',
    ],
    sourceNote: '结合最新 3 个龙虾币快照与用户火币持仓截图录入。',
    position: {
      direction: '空单',
      marginMode: '全仓',
      leverage: '5x',
      notionalUsdt: 997.6428,
      marginUsdt: 199.5285,
      entryPrice: 0.009654,
      referencePrice: 0.009394,
      pnlUsdt: 27.6438,
      pnlPct: 13.48,
      liquidationPrice: 0.024520,
      priorMaxDrawdownNote: '此前该类仓位一度浮亏 1000+ USDT，本周首要目标是把风险窗口关闭，而不是继续扩大方向性押注。',
    },
    headline: '不要一次性平光：先保护本金，再留尾仓吃可能的暴跌。',
    summary:
      '最新 3 个快照显示：龙虾币从 6 月 17 日极端拉升，转入 6 月 18 日高位跳水，再到 6 月 22 日 0.0094 附近缩量整理偏弱。当前空单方向仍有依据，但已经接近 0.00911 / 0.00865 支撑区。更合理的处理不是“到支撑就全平”，而是先把这次从 1000+ USDT 浮亏扛回来的风险降下来，同时保留一部分尾仓，避免后续真暴跌时产生强烈 FOMO。',
    bias: '短线偏弱，空单可以继续参与；但应从“全仓扛方向”切换成“分层仓位 + 尾仓跟踪”。',
    priority: '本周第一优先级：先把账户从情绪扛单状态切回规则交易，同时保留尾仓参与极端下跌。',
    actionPlan: [
      {
        title: '现在',
        tone: 'warning',
        content: '不加仓空。先把仓位拆成两层：70% 主仓用于锁利润/降风险，30% 尾仓专门用来吃可能的暴跌。这样不需要在“全平”和“死扛”之间二选一。',
      },
      {
        title: '跌到 0.00911 附近',
        tone: 'success',
        content: '只平主仓的一部分，例如总仓 25%～35%。不是看空逻辑结束，而是先让这笔单从事故单变成可控单。',
      },
      {
        title: '跌到 0.00865 附近',
        tone: 'success',
        content: '再平总仓 25%～35%。到这里至少应让已兑现利润覆盖一部分此前情绪成本，但仍保留 20%～30% 尾仓。',
      },
      {
        title: '跌破 0.00820 并放量',
        tone: 'success',
        content: '尾仓继续跟踪，不急着全平。此时用移动止盈保护利润，例如反抽重新站回 0.00865 / 0.00911 再逐步收掉尾仓。',
      },
      {
        title: '反弹到 0.00975 附近',
        tone: 'danger',
        content: '主仓风险开始变大，先减掉总仓 30%～50%。尾仓可以保留，但必须接受它可能回吐利润。',
      },
      {
        title: '站上 0.01004',
        tone: 'danger',
        content: '空头结构被明显修复，主仓应退出。若还想防暴跌，只允许留很小尾仓，不能重新变成全仓扛单。',
      },
    ],
    priceLevels: [
      { price: 0.00975, label: '主仓风控线', action: '站上先减总仓 30%～50%', tone: 'danger' },
      { price: 0.01004, label: '主仓退出线', action: '主仓退出，只允许小尾仓', tone: 'danger' },
      { price: 0.00911, label: '第一止盈区', action: '平总仓 25%～35%，不全平', tone: 'success' },
      { price: 0.00865, label: '第二止盈区', action: '再平总仓 25%～35%，保留尾仓', tone: 'success' },
      { price: 0.00820, label: '暴跌延伸区', action: '尾仓跟踪，移动止盈', tone: 'warning' },
    ],
    riskRules: [
      '不要一次性全平，除非价格站上主仓退出线；否则保留 20%～30% 尾仓，专门处理“后续暴跌”的 FOMO。',
      '尾仓的意义是降低后悔，不是重新加回风险。尾仓盈利可以回吐，但不能加成新的重仓。',
      '如果跌到目标区后想追空加仓，先等反弹失败再说；不要在支撑位下方情绪化追空。',
      '任何时候只要重新出现被动扛单心态，优先减主仓，而不是补仓。',
    ],
    fomoProtocol: [
      '如果你平了一部分后继续暴跌：提醒自己“我还有尾仓”，不要用市价追回已经卖掉的仓位。',
      '如果你完全没平、价格又反弹：这就是旧问题复发，所以主仓必须按 0.00975 / 0.01004 执行风控。',
      '如果你想重新加空：只允许在反弹到压力位失败后，用已兑现利润的一小部分试，不允许把本金风险重新放大。',
    ],
    invalidation:
      '若价格重新站稳 0.0108 上方，最近“冲高回落后整理”的判断失效，应重新评估，不再按弱势空头思路执行。',
    disclaimer: '本周建议仅基于有限快照和用户提供的持仓截图，用于交易复盘与风险管理，不构成投资建议。',
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
    category: r.category,
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

/** 按币种分类取最近若干条完整快照，供横向趋势分析使用 */
export function getRecentSnapshotsByCategory(categoryId, limit = 5) {
  const safeLimit = Math.min(Math.max(Number(limit) || 5, 2), 8)
  return STOCK_ANALYSIS_RECORDS
    .filter((r) => r.category?.id === categoryId)
    .sort((a, b) => toDateTime(b).localeCompare(toDateTime(a)))
    .slice(0, safeLimit)
}

/** 按币种分类取最新周建议；未传分类时返回最新一条 */
export function getLatestWeeklyAdvice(categoryId = '') {
  const records = categoryId
    ? WEEKLY_ADVICE_RECORDS.filter((r) => r.category?.id === categoryId)
    : WEEKLY_ADVICE_RECORDS

  return records
    .slice()
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0] || null
}

/** 索引页用：所有周建议，按创建时间倒序 */
export function getAllWeeklyAdvice() {
  return WEEKLY_ADVICE_RECORDS
    .slice()
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
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
