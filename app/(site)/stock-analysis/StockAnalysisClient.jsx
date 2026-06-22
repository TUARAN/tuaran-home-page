'use client'

import * as echarts from 'echarts/core'
import { GaugeChart, RadarChart, BarChart, LineChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  MarkLineComponent,
} from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'
import { useCallback, useEffect, useRef } from 'react'

echarts.use([
  GaugeChart,
  RadarChart,
  BarChart,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  MarkLineComponent,
  SVGRenderer,
])

/* ─── helpers ─── */
function fmt(v) {
  return typeof v === 'number' ? v.toFixed(v < 1 ? 5 : 2) : v
}

/* ─── palette aligned to site theme ─── */
const C = {
  accent: '#00e5a0',
  accent2: '#ff4d6a',
  accent3: '#f5a623',
  accent4: '#6c5ce7',
  green: '#00e5a0',
  red: '#ff4d6a',
  muted: 'var(--site-muted)',
  ink: 'var(--site-ink)',
  line: 'var(--site-line)',
  panel: 'var(--site-panel)',
}

/* ─── chart configs ─── */
function radarOption(R) {
  return {
    animation: false,
    tooltip: { appendToBody: true },
    radar: {
      indicator: [
        { name: '资金费率风险', max: 100 },
        { name: '量价背离', max: 100 },
        { name: '均线乖离', max: 100 },
        { name: '超买程度', max: 100 },
        { name: '波动率', max: 100 },
        { name: '流动性', max: 100 },
      ],
      shape: 'polygon',
      splitNumber: 4,
      axisName: { color: C.muted, fontSize: 11 },
      splitLine: { lineStyle: { color: C.line } },
      splitArea: { show: false },
      axisLine: { lineStyle: { color: C.line } },
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: [
              R.radarValues.fundingRisk,
              R.radarValues.volumeDivergence,
              R.radarValues.maDeviation,
              R.radarValues.overbought,
              R.radarValues.volatility,
              R.radarValues.liquidity,
            ],
            name: '当前风险',
            areaStyle: { color: C.accent2 + '30' },
            lineStyle: { color: C.accent2, width: 2 },
            itemStyle: { color: C.accent2 },
            symbol: 'circle',
            symbolSize: 6,
          },
          {
            value: [
              R.radarNormal.fundingRisk,
              R.radarNormal.volumeDivergence,
              R.radarNormal.maDeviation,
              R.radarNormal.overbought,
              R.radarNormal.volatility,
              R.radarNormal.liquidity,
            ],
            name: '正常水平',
            areaStyle: { color: C.accent + '20' },
            lineStyle: { color: C.accent, width: 1, type: 'dashed' },
            itemStyle: { color: C.accent },
            symbol: 'circle',
            symbolSize: 4,
          },
        ],
      },
    ],
    legend: {
      bottom: 0,
      textStyle: { color: C.muted, fontSize: 11 },
      itemWidth: 14,
      itemHeight: 8,
    },
  }
}

function gaugeOption(R) {
  return {
    animation: false,
    tooltip: { appendToBody: true },
    series: [
      {
        type: 'gauge',
        center: ['50%', '55%'],
        radius: '80%',
        min: 0,
        max: 100,
        splitNumber: 5,
        axisLine: {
          lineStyle: {
            width: 18,
            color: [
              [0.3, C.accent],
              [0.6, C.accent3],
              [1, C.accent2],
            ],
          },
        },
        pointer: {
          itemStyle: { color: C.ink },
          width: 4,
          length: '60%',
        },
        axisTick: {
          distance: -18,
          length: 6,
          lineStyle: { color: '#fff', width: 1 },
        },
        splitLine: {
          distance: -18,
          length: 18,
          lineStyle: { color: '#fff', width: 2 },
        },
        axisLabel: { color: C.muted, distance: 28, fontSize: 11 },
        detail: {
          valueAnimation: false,
          formatter: (v) => v.toFixed(0),
          color: C.accent2,
          fontSize: 36,
          fontWeight: 'bold',
          offsetCenter: [0, '30%'],
        },
        title: {
          offsetCenter: [0, '50%'],
          color: C.muted,
          fontSize: 13,
        },
        data: [{ value: R.gaugeValue, name: '综合风险指数' }],
      },
    ],
  }
}

function maOption(R) {
  return {
    animation: false,
    tooltip: {
      appendToBody: true,
      trigger: 'axis',
      formatter: (params) => {
        let s = params[0].name + '<br/>'
        params.forEach((p) => {
          s += `<span style="color:${p.color}">&#9679;</span> ${p.seriesName}: ${p.value}%<br/>`
        })
        return s
      },
    },
    grid: { left: 50, right: 30, top: 40, bottom: 40 },
    xAxis: {
      type: 'category',
      data: (() => {
        const mp = R.maPeriods || { short: 7, mid: 25, long: 99 }
        return [`MA${mp.short}`, `MA${mp.mid}`, `MA${mp.long}`]
      })(),
      axisLine: { lineStyle: { color: C.line } },
      axisLabel: { color: C.muted, fontSize: 11 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      name: '偏离度 %',
      nameTextStyle: { color: C.muted, fontSize: 10 },
      axisLine: { show: false },
      axisLabel: { color: C.muted, fontSize: 10, formatter: '{value}%' },
      splitLine: { lineStyle: { color: C.line, type: 'dashed' } },
    },
    series: [
      {
        name: '当前偏离度',
        type: 'bar',
        barWidth: 40,
        data: [
          { value: R.ma.priceVsMa7Pct, itemStyle: { color: C.accent2 } },
          { value: R.ma.priceVsMa25Pct, itemStyle: { color: C.accent2 } },
          { value: R.ma.priceVsMa99Pct, itemStyle: { color: C.accent2 } },
        ],
        label: {
          show: true,
          position: 'top',
          color: C.accent2,
          fontSize: 12,
          fontWeight: 'bold',
          formatter: '{c}%',
        },
      },
      {
        name: '危险阈值',
        type: 'line',
        data: [20, 20, 20],
        lineStyle: { color: C.accent3, type: 'dashed', width: 2 },
        symbol: 'none',
        markLine: {
          silent: true,
          data: [{ yAxis: 20 }],
          lineStyle: { color: C.accent3, type: 'dashed', width: 1 },
          label: { show: true, formatter: '危险线 20%', color: C.accent3, fontSize: 10 },
        },
      },
    ],
  }
}

function levelsOption(R) {
  return {
    animation: false,
    tooltip: { appendToBody: true, trigger: 'axis' },
    grid: { left: 60, right: 30, top: 40, bottom: 40 },
    xAxis: {
      type: 'value',
      // 根据价格量级自适应区间
      min: 0,
      max: R.price.current > 100 ? Math.ceil(R.keyLevels.historicalHigh * 1.15 / 1000) * 1000 : 0.030,
      axisLine: { lineStyle: { color: C.line } },
      axisLabel: {
        color: C.muted,
        fontSize: 10,
        formatter: (v) => (R.price.current > 100 ? v.toFixed(0) : v.toFixed(4)),
      },
      splitLine: { lineStyle: { color: C.line, type: 'dashed' } },
    },
    yAxis: {
      type: 'category',
      data: ['近期低点', '支撑位2', '支撑位1', 'MA99', 'MA25', 'MA7', '当前价格', '24H高点', '历史高点'],
      axisLine: { lineStyle: { color: C.line } },
      axisLabel: { color: C.muted, fontSize: 10 },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'bar',
        data: [
          { value: R.keyLevels.recentLow, itemStyle: { color: C.muted } },
          { value: R.keyLevels.support2, itemStyle: { color: C.accent + '80' } },
          { value: R.keyLevels.support1, itemStyle: { color: C.accent + '80' } },
          { value: R.ma.ma99, itemStyle: { color: C.accent4 + '80' } },
          { value: R.ma.ma25, itemStyle: { color: C.accent4 + '80' } },
          { value: R.ma.ma7, itemStyle: { color: C.accent3 + '80' } },
          { value: R.price.current, itemStyle: { color: C.accent } },
          { value: R.keyLevels.resistance, itemStyle: { color: C.accent2 + '80' } },
          { value: R.keyLevels.historicalHigh, itemStyle: { color: C.accent2 } },
        ],
        barWidth: 20,
        label: {
          show: true,
          position: 'right',
          color: C.muted,
          fontSize: 10,
          formatter: (p) => (R.price.current > 100 ? p.value.toFixed(0) : p.value.toFixed(5)),
        },
      },
    ],
    markLine: { silent: true },
  }
}

/* ─── ECharts Hook（optionBuilder 接收 record） ─── */
function useECharts(domRef, optionBuilder, record) {
  const chartRef = useRef(null)
  useEffect(() => {
    if (!domRef.current) return
    const chart = echarts.init(domRef.current, null, { renderer: 'svg' })
    chartRef.current = chart
    chart.setOption(optionBuilder(record))
    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      chart.dispose()
    }
  }, [optionBuilder, record])
}

/* ─── sub-components ─── */

function MetricCard({ label, value, sub, colorClass }) {
  return (
    <div className="border border-[#d7d9cf] bg-white p-4 dark:border-[#2b3644] dark:bg-[#111923] hover:border-[#00e5a0] transition-colors">
      <p className="mb-1 text-[10px] uppercase tracking-[0.22em] text-[#68706a] dark:text-[#98a5b6]">{label}</p>
      <div className={`font-mono text-[26px] font-semibold leading-[1.15] tracking-tight ${colorClass || 'text-[#161b1a] dark:text-gray-100'}`}>
        {value}
      </div>
      {sub && <p className="mt-2 text-[12px] leading-5 text-[#77736b] dark:text-[#8d98a8]">{sub}</p>}
    </div>
  )
}

function SectionTitle({ dotColor, children }) {
  const dot = dotColor || C.accent
  return (
    <div className="flex items-center gap-2.5 pb-3 border-b border-[#d7d9cf] dark:border-[#2b3644] mb-6">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dot }} />
      <h2 className="font-serif text-[18px] text-[var(--site-ink)]">{children}</h2>
    </div>
  )
}

function AlertBox({ type, title, children, className = '' }) {
  const cls = {
    danger: 'bg-[rgba(255,77,106,0.08)] border-[rgba(255,77,106,0.3)] text-[#ff4d6a] dark:text-[#ff4d6a]',
    warning: 'bg-[rgba(245,166,35,0.08)] border-[rgba(245,166,35,0.3)] text-[#f5a623] dark:text-[#f5a623]',
    info: 'bg-[rgba(0,229,160,0.06)] border-[rgba(0,229,160,0.2)] text-[#00e5a0] dark:text-[#00e5a0]',
  }
  return (
    <div className={`border rounded-lg p-4 text-[14px] leading-[1.7] ${cls[type]} ${className}`}>
      <p className="font-bold mb-1.5 text-[12px] uppercase tracking-[0.05em]">{title}</p>
      {children}
    </div>
  )
}

function SignalTag({ type, children }) {
  const cls = {
    danger: 'bg-[rgba(255,77,106,0.12)] text-[#ff4d6a] border-[rgba(255,77,106,0.25)]',
    warning: 'bg-[rgba(245,166,35,0.12)] text-[#f5a623] border-[rgba(245,166,35,0.25)]',
    success: 'bg-[rgba(0,229,160,0.1)] text-[#00e5a0] border-[rgba(0,229,160,0.2)]',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded text-[12px] font-bold tracking-[0.03em] border ${cls[type]}`}>
      {children}
    </span>
  )
}

/* ─── 按 record 动态派生展示字段 ─── */
function deriveBadges(R) {
  const items = []
  if (R.riskSignals.highFundingRate) {
    items.push({ type: 'danger', label: '⚠ 资金费率极端' })
  }
  if (R.riskSignals.volumePriceDivergence) {
    items.push({ type: 'danger', label: '⚠ 量价背离' })
  }
  if (R.riskSignals.farFromMa) {
    items.push({ type: 'danger', label: '⚠ 均线严重乖离' })
  }
  if (R.riskSignals.overbought) {
    items.push({ type: 'warning', label: '⚠ 超买信号' })
  }
  if (R.range24h.rangePct >= 20) {
    items.push({ type: 'warning', label: '⚠ 高波动率' })
  }
  return items
}

function riskAlertType(R) {
  // 风险等级 → 顶栏 alert 颜色
  if (R.gaugeValue >= 70) return 'danger'
  if (R.gaugeValue >= 45) return 'warning'
  return 'info'
}

function buildTopAlertText(R) {
  const concerns = []
  if (R.riskSignals.highFundingRate) {
    concerns.push(`资金费率 ${R.funding.rateDisplay} 折算年化 ${R.funding.annualizedPct >= 0 ? '超过' : '约'} <strong>${Math.abs(R.funding.annualizedPct)}%</strong>`)
  }
  if (R.riskSignals.farFromMa) {
    const shortP = (R.maPeriods || { short: 7 }).short
    concerns.push(`当前价格偏离 MA${shortP} 达 <strong>${R.ma.priceVsMa7Pct.toFixed(1)}%</strong>`)
  }
  if (R.riskSignals.volumePriceDivergence) {
    concerns.push('量价背离明显')
  }
  if (R.riskSignals.overbought) {
    concerns.push('短期超买')
  }
  if (concerns.length === 0) {
    return `当前 ${R.pair} 处于 <strong>${R.analysisSummary.trend}</strong>，综合风险指数 <strong>${R.gaugeValue}</strong>，${R.analysisSummary.keyConcern}。`
  }
  return `${concerns.join('、')}。${R.analysisSummary.keyConcern}。`
}

/* ─── main component ─── */
export default function StockAnalysisClient({ record }) {
  const R = record
  const maP = R.maPeriods || { short: 7, mid: 25, long: 99 }
  const radarRef = useRef(null)
  const gaugeRef = useRef(null)
  const maRef = useRef(null)
  const levelsRef = useRef(null)

  const buildRadar = useCallback((rec) => radarOption(rec), [])
  const buildGauge = useCallback((rec) => gaugeOption(rec), [])
  const buildMA = useCallback((rec) => maOption(rec), [])
  const buildLevels = useCallback((rec) => levelsOption(rec), [])

  useECharts(radarRef, buildRadar, R)
  useECharts(gaugeRef, buildGauge, R)
  useECharts(maRef, buildMA, R)
  useECharts(levelsRef, buildLevels, R)

  const changePositive = R.price.changePct >= 0
  const changeColor = changePositive ? 'text-[#00e5a0]' : 'text-[#ff4d6a]'
  const changeSign = changePositive ? '+' : ''
  const badges = deriveBadges(R)
  const topAlertType = riskAlertType(R)
  const topAlertTitle = topAlertType === 'danger' ? '高风险预警' : topAlertType === 'warning' ? '中等风险' : '风险提示'
  const fundingHot = R.riskSignals.highFundingRate
  const fundingColor = fundingHot ? 'text-[#ff4d6a]' : changeColor

  return (
    <main className="mx-auto w-full max-w-[1120px] px-4 py-10">

      {/* Header */}
      <header className="text-center pb-8 border-b border-[#d7d9cf] dark:border-[#2b3644] mb-10">
        <div className="inline-block bg-[#00e5a0] text-[#0a0e17] px-3 py-1 rounded text-[10px] font-bold uppercase tracking-[0.1em] mb-4">
          多维度交易分析
        </div>
        <h1 className="font-serif text-[36px] text-[var(--site-ink)] mb-2 tracking-[0.02em]">
          {R.pair} {R.contractType}
        </h1>
        <p className="text-[14px] text-[var(--site-muted)]">{R.exchange} · {R.timeframe}级别 · 多维度综合研判（精确到分钟）</p>
        <div className="flex justify-center gap-8 mt-6 flex-wrap">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--site-muted)]">当前价格</p>
            <p className={`text-[18px] font-bold mt-1 ${changeColor}`}>{fmt(R.price.current)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--site-muted)]">24H 涨跌幅</p>
            <p className={`text-[18px] font-bold mt-1 ${changeColor}`}>{changeSign}{R.price.changePct}%</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--site-muted)]">24H 最高</p>
            <p className="text-[18px] font-bold text-[var(--site-ink)] mt-1">{fmt(R.range24h.high)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--site-muted)]">24H 最低</p>
            <p className="text-[18px] font-bold text-[var(--site-ink)] mt-1">{fmt(R.range24h.low)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--site-muted)]">资金费率</p>
            <p className={`text-[18px] font-bold mt-1 ${fundingColor}`}>{R.funding.rateDisplay}</p>
          </div>
          {R.position?.contractOpenInterestToken ? (
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--site-muted)]">持仓量</p>
              <p className="text-[18px] font-bold text-[var(--site-ink)] mt-1">
                {(R.position.contractOpenInterestToken / 1_000_000).toFixed(2)}M
                <span className="text-[11px] font-normal text-[var(--site-muted)] ml-1">{R.pair.split('USDT')[0]}</span>
              </p>
            </div>
          ) : null}
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--site-muted)]">采集时间</p>
            <p className="text-[18px] font-bold text-[var(--site-ink)] mt-1">{R.date} {R.time}</p>
          </div>
        </div>
      </header>

      {/* Risk Alert */}
      <AlertBox type={topAlertType} title={topAlertTitle}>
        <span dangerouslySetInnerHTML={{ __html: buildTopAlertText(R) }} />
      </AlertBox>

      {/* Section 1: Price Overview */}
      <section className="mb-10">
        <SectionTitle dotColor={C.accent}>价格概览</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard label="最新价格" value={fmt(R.price.current)} sub={`标记价格: ${fmt(R.price.markPrice)}`} colorClass={changeColor} />
          <MetricCard
            label="24H 涨跌"
            value={`${changeSign}${R.price.changePct}%`}
            sub={`涨跌额: ${changeSign}${fmt(R.price.changeAbs)}`}
            colorClass={changeColor}
          />
          <MetricCard label="今日开盘" value={fmt(R.price.open)} sub={`收盘: ${fmt(R.price.close)}`} />
          <MetricCard
            label="今日振幅"
            value={`${(((R.price.high - R.price.low) / R.price.open) * 100).toFixed(2)}%`}
            sub={`高: ${fmt(R.price.high)} / 低: ${fmt(R.price.low)}`}
            colorClass="text-[#f5a623]"
          />
          <MetricCard
            label="24H 价格区间"
            value={`${R.range24h.rangePct}%`}
            sub={R.range24h.rangePct >= 20 ? '日内波动剧烈' : R.range24h.rangePct >= 10 ? '日内波动较大' : '日内波动温和'}
            colorClass={R.range24h.rangePct >= 20 ? 'text-[#f5a623]' : ''}
          />
          <MetricCard label="指数价格" value={fmt(R.price.indexPrice)} sub="现货参考基准" />
        </div>
      </section>

      {/* Section 2: Volume & Funding */}
      <section className="mb-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Volume */}
          <div>
            <SectionTitle dotColor={C.accent4}>成交量分析</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <MetricCard label="24H 成交量" value={R.volume.vol24hToken ? (R.volume.vol24hToken / 1_000_000).toFixed(1) + 'M' : '—'} sub={R.pair.split('USDT')[0]} />
              <MetricCard label="24H 成交额" value={R.volume.vol24hUsdt == null ? '未采集' : R.volume.vol24hUsdt >= 1_000_000_000 ? (R.volume.vol24hUsdt / 1_000_000_000).toFixed(2) + 'B' : R.volume.vol24hUsdt >= 1_000_000 ? (R.volume.vol24hUsdt / 1_000_000).toFixed(2) + 'M' : (R.volume.vol24hUsdt / 1_000).toFixed(1) + 'k'} sub="USDT" />
              <MetricCard label={R.volume.historicalMaxVolLabel || '历史最高量'} value={R.volume.historicalMaxVol} sub="对比参照" />
              <MetricCard label={R.volume.totalHistoricalVolLabel || '历史总成交'} value={R.volume.totalHistoricalVol} sub={R.pair.split('USDT')[0]} />
            </div>
            {R.riskSignals.volumePriceDivergence ? (
              <div className="mt-4">
                <AlertBox type="warning" title="量价背离信号">
                  近期巨量波动后量能明显回落，价格动能未获得持续量能配合，存在量价背离迹象。
                </AlertBox>
              </div>
            ) : null}
          </div>
          {/* Funding */}
          <div>
            <SectionTitle dotColor={C.red}>资金费率</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <MetricCard label="当前费率" value={R.funding.rateDisplay} sub="每4小时结算" colorClass={fundingColor} />
              <MetricCard
                label="年化费率"
                value={R.funding.annualizedPct == null ? '—' : `~${R.funding.annualizedPct}%`}
                sub={R.funding.annualizedPct == null ? '未采集' : fundingHot ? '极端异常水平' : '正常区间'}
                colorClass={fundingColor}
              />
              <MetricCard label="费率方向" value={R.funding.direction} sub="多空杠杆对比" colorClass={fundingColor} />
              <MetricCard label="下次结算" value={R.funding.countdown} sub="倒计时" />
            </div>
            {R.funding.rate == null ? (
              <div className="mt-4">
                <AlertBox type="info" title="资金费率未采集">
                  本次为行情页截图，未包含资金费率字段，故不对多空拥挤度做判断。
                </AlertBox>
              </div>
            ) : R.riskSignals.highFundingRate ? (
              <div className="mt-4">
                <AlertBox type="danger" title="资金费率极端异常">
                  {R.funding.annualizedPct >= 0
                    ? '正费率意味着多头需向空头支付费用。费率越高，说明多头杠杆仓位越拥挤，市场情绪极度狂热，随时可能出现多杀多踩踏。'
                    : '负费率意味着空头需向多头支付费用。负费率过深说明空头杠杆仓位过挤，存在轧空风险。'}
                </AlertBox>
              </div>
            ) : (
              <div className="mt-4">
                <AlertBox type="info" title="资金费率正常">
                  费率处于健康区间，多空力量相对均衡。
                </AlertBox>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Section 3: Technical Indicators */}
      <section className="mb-10">
        <SectionTitle dotColor={C.accent3}>技术指标</SectionTitle>
        <div className="overflow-x-auto overflow-y-auto max-h-[600px] rounded-lg border border-[#d7d9cf] dark:border-[#2b3644]">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                <th className="bg-[var(--site-panel-strong)] text-[var(--site-muted)] text-[10px] uppercase tracking-[0.08em] p-3 text-left sticky top-0 z-10 border-b border-[#d7d9cf] dark:border-[#2b3644]">指标</th>
                <th className="bg-[var(--site-panel-strong)] text-[var(--site-muted)] text-[10px] uppercase tracking-[0.08em] p-3 text-left sticky top-0 z-10 border-b border-[#d7d9cf] dark:border-[#2b3644]">数值</th>
                <th className="bg-[var(--site-panel-strong)] text-[var(--site-muted)] text-[10px] uppercase tracking-[0.08em] p-3 text-left sticky top-0 z-10 border-b border-[#d7d9cf] dark:border-[#2b3644]">当前价格偏离</th>
                <th className="bg-[var(--site-panel-strong)] text-[var(--site-muted)] text-[10px] uppercase tracking-[0.08em] p-3 text-left sticky top-0 z-10 border-b border-[#d7d9cf] dark:border-[#2b3644]">状态</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-[var(--site-panel)]">
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">MA({maP.short}) 短期均线</td>
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">{fmt(R.ma.ma7)}</td>
                <td className={`p-3 border-b border-[#d7d9cf] dark:border-[#2b3644] ${R.ma.priceVsMa7Pct >= 0 ? 'text-[#ff4d6a]' : 'text-[#00e5a0]'}`}>
                  {R.ma.priceVsMa7Pct >= 0 ? '+' : ''}{R.ma.priceVsMa7Pct}%
                </td>
                <td className={`p-3 border-b border-[#d7d9cf] dark:border-[#2b3644] ${Math.abs(R.ma.priceVsMa7Pct) > 20 ? 'text-[#ff4d6a]' : Math.abs(R.ma.priceVsMa7Pct) > 10 ? 'text-[#f5a623]' : 'text-[#00e5a0]'}`}>
                  {Math.abs(R.ma.priceVsMa7Pct) > 20 ? (R.ma.priceVsMa7Pct >= 0 ? '严重超买' : '严重超卖') : Math.abs(R.ma.priceVsMa7Pct) > 10 ? '明显偏离' : '合理区间'}
                </td>
              </tr>
              <tr className="hover:bg-[var(--site-panel)]">
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">MA({maP.mid}) 中期均线</td>
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">{fmt(R.ma.ma25)}</td>
                <td className={`p-3 border-b border-[#d7d9cf] dark:border-[#2b3644] ${R.ma.priceVsMa25Pct >= 0 ? 'text-[#ff4d6a]' : 'text-[#00e5a0]'}`}>
                  {R.ma.priceVsMa25Pct >= 0 ? '+' : ''}{R.ma.priceVsMa25Pct}%
                </td>
                <td className={`p-3 border-b border-[#d7d9cf] dark:border-[#2b3644] ${Math.abs(R.ma.priceVsMa25Pct) > 30 ? 'text-[#ff4d6a]' : Math.abs(R.ma.priceVsMa25Pct) > 15 ? 'text-[#f5a623]' : 'text-[#00e5a0]'}`}>
                  {Math.abs(R.ma.priceVsMa25Pct) > 30 ? '极端偏离' : Math.abs(R.ma.priceVsMa25Pct) > 15 ? '明显偏离' : '合理区间'}
                </td>
              </tr>
              <tr className="hover:bg-[var(--site-panel)]">
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">MA({maP.long}) 长期均线</td>
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">{fmt(R.ma.ma99)}</td>
                <td className={`p-3 border-b border-[#d7d9cf] dark:border-[#2b3644] ${R.ma.priceVsMa99Pct >= 0 ? 'text-[#ff4d6a]' : 'text-[#00e5a0]'}`}>
                  {R.ma.priceVsMa99Pct >= 0 ? '+' : ''}{R.ma.priceVsMa99Pct}%
                </td>
                <td className={`p-3 border-b border-[#d7d9cf] dark:border-[#2b3644] ${Math.abs(R.ma.priceVsMa99Pct) > 50 ? 'text-[#ff4d6a]' : Math.abs(R.ma.priceVsMa99Pct) > 25 ? 'text-[#f5a623]' : 'text-[#00e5a0]'}`}>
                  {Math.abs(R.ma.priceVsMa99Pct) > 50 ? '极端偏离' : Math.abs(R.ma.priceVsMa99Pct) > 25 ? '明显偏离' : '合理区间'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="bg-[var(--site-panel)] border-l-3 border-[#00e5a0] p-4 mt-4 rounded-r-lg text-[13px] text-[var(--site-muted)] leading-[1.8]">
          <strong className="text-[var(--site-ink)]">均线分析：</strong>
          价格相对 MA{maP.short} 偏离 <strong>{R.ma.priceVsMa7Pct >= 0 ? '+' : ''}{R.ma.priceVsMa7Pct}%</strong>，
          {Math.abs(R.ma.priceVsMa7Pct) > 20
            ? '属于极端乖离，历史上此类形态常伴随剧烈回调。'
            : Math.abs(R.ma.priceVsMa7Pct) > 10
            ? '乖离偏大，需警惕短期回调风险。'
            : '乖离率处于健康区间，趋势延续概率较高。'}
        </div>
      </section>

      {/* Section 4: Key Levels */}
      <section className="mb-10">
        <SectionTitle dotColor={C.accent4}>关键价格点位</SectionTitle>
        <div className="overflow-x-auto rounded-lg border border-[#d7d9cf] dark:border-[#2b3644]">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                <th className="bg-[var(--site-panel-strong)] text-[var(--site-muted)] text-[10px] uppercase tracking-[0.08em] p-3 text-left sticky top-0 z-10 border-b border-[#d7d9cf] dark:border-[#2b3644]">类型</th>
                <th className="bg-[var(--site-panel-strong)] text-[var(--site-muted)] text-[10px] uppercase tracking-[0.08em] p-3 text-left sticky top-0 z-10 border-b border-[#d7d9cf] dark:border-[#2b3644]">价格</th>
                <th className="bg-[var(--site-panel-strong)] text-[var(--site-muted)] text-[10px] uppercase tracking-[0.08em] p-3 text-left sticky top-0 z-10 border-b border-[#d7d9cf] dark:border-[#2b3644]">说明</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-[var(--site-panel)]">
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644] text-[#ff4d6a]">历史高点（可见）</td>
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">{fmt(R.keyLevels.historicalHigh)}</td>
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">历史最高价，重要阻力参考</td>
              </tr>
              <tr className="hover:bg-[var(--site-panel)]">
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644] text-[#f5a623]">当前阻力位</td>
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">{fmt(R.keyLevels.resistance)}</td>
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">24h 高点，突破则看向历史高点</td>
              </tr>
              <tr className="hover:bg-[var(--site-panel)]">
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644] text-[#00e5a0]">关键支撑位 1</td>
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">{fmt(R.keyLevels.support1)}</td>
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">短期支撑，破位需警惕</td>
              </tr>
              <tr className="hover:bg-[var(--site-panel)]">
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644] text-[#00e5a0]">关键支撑位 2</td>
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">{fmt(R.keyLevels.support2)}</td>
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">MA25/MA99 附近，强支撑区</td>
              </tr>
              <tr className="hover:bg-[var(--site-panel)]">
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">近期低点</td>
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">{fmt(R.keyLevels.recentLow)}</td>
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">近期底部，已反弹 {R.keyLevels.reboundFromLowPct}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 5: Charts */}
      <section className="mb-10">
        <SectionTitle dotColor={C.accent}>可视化分析</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <p className="font-bold text-[14px] text-[var(--site-ink)] mb-3">多维度风险评估雷达图</p>
            <div ref={radarRef} style={{ width: '100%', minHeight: 380 }} />
          </div>
          <div>
            <p className="font-bold text-[14px] text-[var(--site-ink)] mb-3">风险信号仪表盘</p>
            <div ref={gaugeRef} style={{ width: '100%', minHeight: 380 }} />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div>
            <p className="font-bold text-[14px] text-[var(--site-ink)] mb-3">均线偏离度对比</p>
            <div ref={maRef} style={{ width: '100%', minHeight: 350 }} />
          </div>
          <div>
            <p className="font-bold text-[14px] text-[var(--site-ink)] mb-3">价格区间与关键点位</p>
            <div ref={levelsRef} style={{ width: '100%', minHeight: 350 }} />
          </div>
        </div>
      </section>

      {/* Section 6: Risk Signals */}
      <section className="mb-10">
        <SectionTitle dotColor={C.red}>风险信号矩阵</SectionTitle>
        <div className="overflow-x-auto rounded-lg border border-[#d7d9cf] dark:border-[#2b3644]">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                <th className="bg-[var(--site-panel-strong)] text-[var(--site-muted)] text-[10px] uppercase tracking-[0.08em] p-3 text-left border-b border-[#d7d9cf] dark:border-[#2b3644]">风险维度</th>
                <th className="bg-[var(--site-panel-strong)] text-[var(--site-muted)] text-[10px] uppercase tracking-[0.08em] p-3 text-left border-b border-[#d7d9cf] dark:border-[#2b3644]">状态</th>
                <th className="bg-[var(--site-panel-strong)] text-[var(--site-muted)] text-[10px] uppercase tracking-[0.08em] p-3 text-left border-b border-[#d7d9cf] dark:border-[#2b3644]">严重程度</th>
                <th className="bg-[var(--site-panel-strong)] text-[var(--site-muted)] text-[10px] uppercase tracking-[0.08em] p-3 text-left border-b border-[#d7d9cf] dark:border-[#2b3644]">详细说明</th>
              </tr>
            </thead>
            <tbody>
              {R.riskSignals.highFundingRate ? (
                <tr className="hover:bg-[var(--site-panel)]">
                  <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">资金费率异常</td>
                  <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644] text-[#ff4d6a]">触发</td>
                  <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644] text-[#ff4d6a]">极高</td>
                  <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">年化 {Math.abs(R.funding.annualizedPct)}%，{R.funding.direction}，极端拥挤</td>
                </tr>
              ) : null}
              {R.riskSignals.volumePriceDivergence ? (
                <tr className="hover:bg-[var(--site-panel)]">
                  <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">量价背离</td>
                  <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644] text-[#f5a623]">触发</td>
                  <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644] text-[#f5a623]">高</td>
                  <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">价格创新高但成交量未同步放大，上涨动力不足</td>
                </tr>
              ) : null}
              {R.riskSignals.farFromMa ? (
                <tr className="hover:bg-[var(--site-panel)]">
                  <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">均线乖离</td>
                  <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644] text-[#ff4d6a]">触发</td>
                  <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644] text-[#ff4d6a]">极高</td>
                  <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">偏离 MA{maP.short} 达 {Math.abs(R.ma.priceVsMa7Pct)}%，偏离 MA{maP.mid} 达 {Math.abs(R.ma.priceVsMa25Pct)}%</td>
                </tr>
              ) : null}
              {R.riskSignals.overbought ? (
                <tr className="hover:bg-[var(--site-panel)]">
                  <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">超买信号</td>
                  <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644] text-[#ff4d6a]">触发</td>
                  <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644] text-[#ff4d6a]">高</td>
                  <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">连续大幅上涨，短期获利盘巨大</td>
                </tr>
              ) : null}
              {R.range24h.rangePct >= 20 ? (
                <tr className="hover:bg-[var(--site-panel)]">
                  <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">波动率风险</td>
                  <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644] text-[#f5a623]">触发</td>
                  <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644] text-[#f5a623]">中高</td>
                  <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">24H 振幅 {R.range24h.rangePct}%，日内波动剧烈</td>
                </tr>
              ) : null}
              {badges.length === 0 ? (
                <tr className="hover:bg-[var(--site-panel)]">
                  <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">综合风险</td>
                  <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644] text-[#00e5a0]">未触发</td>
                  <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644] text-[#00e5a0]">低</td>
                  <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">暂无明显风险信号，按既定策略执行</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        {badges.length > 0 ? (
          <div className="flex flex-wrap gap-2 mt-4">
            {badges.map((b, i) => (
              <SignalTag key={i} type={b.type}>{b.label}</SignalTag>
            ))}
          </div>
        ) : null}
      </section>

      {/* Section 7: Conclusion */}
      <section className="mb-10">
        <SectionTitle dotColor={C.accent}>综合研判</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="grid grid-cols-2 gap-4">
              <MetricCard
                label="趋势状态"
                value={R.analysisSummary.trend}
                sub={R.analysisSummary.riskLevel === '低风险' ? '多空力量均衡' : '动能充足'}
                colorClass={changePositive ? 'text-[#00e5a0]' : 'text-[#f5a623]'}
              />
              <MetricCard
                label="风险等级"
                value={R.analysisSummary.riskLevel}
                sub={R.gaugeValue >= 70 ? '多项风险信号触发' : R.gaugeValue >= 45 ? '存在风险信号' : '风险可控'}
                colorClass={R.gaugeValue >= 70 ? 'text-[#ff4d6a]' : R.gaugeValue >= 45 ? 'text-[#f5a623]' : 'text-[#00e5a0]'}
              />
              <MetricCard label="市场情绪" value={R.analysisSummary.sentiment} sub="综合费率/价格/量能判断" colorClass="text-[#f5a623]" />
              <MetricCard label="操作建议" value={R.analysisSummary.action} sub="仅供参考" />
            </div>
          </div>
          <div>
            <AlertBox type="info" title="核心观点">
              {R.pair} 当前处于 <strong>{R.analysisSummary.trend}</strong>，
              综合风险指数 <strong>{R.gaugeValue}</strong>（{R.analysisSummary.riskLevel}）。
              {R.analysisSummary.keyConcern}。
            </AlertBox>
            <AlertBox type="warning" title="关注要点" className="mt-4">
              1. 能否突破 {fmt(R.keyLevels.resistance)} 阻力<br />
              2. 资金费率是否回归正常区间（绝对值 &lt; 0.05%）<br />
              3. 成交量是否重新放大配合价格变化<br />
              4. 均线乖离率是否收窄
            </AlertBox>
          </div>
        </div>
      </section>

      {/* Section 8: 持仓基础情况（仅当快照含 position 时渲染） */}
      {R.position ? (
        <section className="mb-10">
          <SectionTitle dotColor={C.accent4}>持仓基础情况</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <MetricCard
              label="当前浮盈"
              value={`${R.position.pnlUsdt >= 0 ? '+' : ''}${R.position.pnlUsdt} USDT`}
              sub="火币持仓浮窗「收益」"
              colorClass={R.position.pnlUsdt >= 0 ? 'text-[#00e5a0]' : 'text-[#ff4d6a]'}
            />
            <MetricCard
              label="名义 / 保证金"
              value={`${R.position.notionalUsdt} USDT`}
              sub="持仓浮窗右侧数值"
            />
            <MetricCard
              label="合约持仓量"
              value={R.position.contractOpenInterestToken ? (R.position.contractOpenInterestToken / 1_000_000).toFixed(2) + 'M' : '—'}
              sub={`${R.pair.split('USDT')[0]} · 火币该合约`}
            />
            <MetricCard
              label="开仓均价"
              value={R.position.avgCost != null ? fmt(R.position.avgCost) : '未披露'}
              sub={R.position.avgCost != null ? '持仓成本' : '截图未直接显示'}
              colorClass={R.position.avgCost == null ? 'text-[#f5a623]' : ''}
            />
          </div>
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AlertBox type="info" title="持仓对象 / 方向">
              <span className="block text-[var(--site-ink)]">{R.position.object}</span>
              <span className="block mt-1.5 text-[var(--site-muted)]">{R.position.direction}</span>
              {R.position.orderBookImbalance ? (
                <span className="block mt-1.5 text-[var(--site-muted)]">盘口买卖比：{R.position.orderBookImbalance}</span>
              ) : null}
            </AlertBox>
            <AlertBox type="warning" title="成本说明">
              {R.position.costNote}
            </AlertBox>
          </div>
        </section>
      ) : null}

      {/* Section 9: 龙虾币基础情况（仅当快照含 fundamentals 时渲染） */}
      {R.fundamentals ? (
        <section className="mb-10">
          <SectionTitle dotColor={C.accent3}>{R.fundamentals.name} · 币种基础情况</SectionTitle>
          <div className="overflow-x-auto rounded-lg border border-[#d7d9cf] dark:border-[#2b3644]">
            <table className="w-full border-collapse text-[13px]">
              <tbody>
                {[
                  ['所在链', R.fundamentals.chain],
                  ['合约地址', R.fundamentals.contract],
                  ['总供应量', R.fundamentals.totalSupply],
                  ['发行方式', R.fundamentals.launch],
                  ['团队', R.fundamentals.team],
                  ['历史峰值市值', R.fundamentals.peakMarketCap],
                  ['全市场永续持仓', R.fundamentals.totalOpenInterest],
                  ['由来 / 价值驱动', R.fundamentals.origin],
                ].filter(([, v]) => v).map(([k, v]) => (
                  <tr key={k} className="hover:bg-[var(--site-panel)]">
                    <th className="bg-[var(--site-panel-strong)] text-[var(--site-muted)] text-[11px] tracking-[0.04em] p-3 text-left align-top border-b border-[#d7d9cf] dark:border-[#2b3644] whitespace-nowrap w-[140px]">{k}</th>
                    <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644] break-all leading-[1.7]">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {R.fundamentals.note ? (
            <div className="mt-4">
              <AlertBox type="warning" title="风险提示">{R.fundamentals.note}</AlertBox>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Footer */}
      <footer className="mt-10 pt-6 border-t border-[#d7d9cf] dark:border-[#2b3644] text-center text-[11px] text-[var(--site-muted)]">
        {R.pair} 多维度交易分析 · 数据来源: {R.dataSource} · 采集时间: {R.date} {R.time}<br />
        本分析仅供参考，不构成投资建议。加密货币交易风险极高，请谨慎决策。
      </footer>
    </main>
  )
}
