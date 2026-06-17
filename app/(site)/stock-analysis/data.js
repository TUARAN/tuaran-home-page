/**
 * LOBSTERUSDT 永续合约交易分析数据
 * 数据来源: Binance · 分析日期: 2026-06-17
 */

export const STOCK_ANALYSIS_RECORDS = [
  {
    id: 1,
    date: '2026-06-17',
    pair: 'LOBSTERUSDT',
    contractType: '永续合约',
    exchange: 'Binance',
    timeframe: '日线',
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
    },
  },
]