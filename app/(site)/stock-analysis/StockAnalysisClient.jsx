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
import { STOCK_ANALYSIS_RECORDS } from './data'

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
const R = STOCK_ANALYSIS_RECORDS[0]

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
function radarOption() {
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

function gaugeOption() {
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

function maOption() {
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
      data: ['MA7', 'MA25', 'MA99'],
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

function levelsOption() {
  return {
    animation: false,
    tooltip: { appendToBody: true, trigger: 'axis' },
    grid: { left: 60, right: 30, top: 40, bottom: 40 },
    xAxis: {
      type: 'value',
      min: 0,
      max: 0.030,
      axisLine: { lineStyle: { color: C.line } },
      axisLabel: {
        color: C.muted,
        fontSize: 10,
        formatter: (v) => v.toFixed(4),
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
          formatter: (p) => p.value.toFixed(5),
        },
      },
    ],
    markLine: { silent: true },
  }
}

/* ─── ECharts Hook ─── */
function useECharts(domRef, optionBuilder) {
  const chartRef = useRef(null)
  useEffect(() => {
    if (!domRef.current) return
    const chart = echarts.init(domRef.current, null, { renderer: 'svg' })
    chartRef.current = chart
    chart.setOption(optionBuilder())
    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      chart.dispose()
    }
  }, [optionBuilder])
}

/* ─── sub-components ─── */

function MetricCard({ label, value, sub, colorClass }) {
  const color = colorClass || ''
  return (
    <div className="border border-[#d7d9cf] bg-white p-4 dark:border-[#2b3644] dark:bg-[#111923] hover:border-[#00e5a0] transition-colors">
      <p className="mb-1 text-[10px] uppercase tracking-[0.22em] text-[#68706a] dark:text-[#98a5b6]">{label}</p>
      <div className={`font-mono text-[26px] font-semibold leading-none ${color || 'text-[#161b1a] dark:text-gray-100'}`}>
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

function AlertBox({ type, title, children }) {
  const cls = {
    danger: 'bg-[rgba(255,77,106,0.08)] border-[rgba(255,77,106,0.3)] text-[#ff4d6a] dark:text-[#ff4d6a]',
    warning: 'bg-[rgba(245,166,35,0.08)] border-[rgba(245,166,35,0.3)] text-[#f5a623] dark:text-[#f5a623]',
    info: 'bg-[rgba(0,229,160,0.06)] border-[rgba(0,229,160,0.2)] text-[#00e5a0] dark:text-[#00e5a0]',
  }
  return (
    <div className={`border rounded-lg p-4 text-[14px] leading-[1.7] ${cls[type]}`}>
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

/* ─── main component ─── */
export default function StockAnalysisClient() {
  const radarRef = useRef(null)
  const gaugeRef = useRef(null)
  const maRef = useRef(null)
  const levelsRef = useRef(null)

  const buildRadar = useCallback(() => radarOption(), [])
  const buildGauge = useCallback(() => gaugeOption(), [])
  const buildMA = useCallback(() => maOption(), [])
  const buildLevels = useCallback(() => levelsOption(), [])

  useECharts(radarRef, buildRadar)
  useECharts(gaugeRef, buildGauge)
  useECharts(maRef, buildMA)
  useECharts(levelsRef, buildLevels)

  return (
    <main className="mx-auto w-full max-w-[1120px] px-4 py-10">

      {/* Header */}
      <header className="text-center pb-8 border-b border-[#d7d9cf] dark:border-[#2b3644] mb-10">
        <div className="inline-block bg-[#00e5a0] text-[#0a0e17] px-3 py-1 rounded text-[10px] font-bold uppercase tracking-[0.1em] mb-4">
          多维度交易分析
        </div>
        <h1 className="font-serif text-[36px] text-[var(--site-ink)] mb-2 tracking-[0.02em]">
          LOBSTERUSDT 永续合约
        </h1>
        <p className="text-[14px] text-[var(--site-muted)]">Binance 日线级别 · 多维度综合研判</p>
        <div className="flex justify-center gap-8 mt-6 flex-wrap">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--site-muted)]">当前价格</p>
            <p className="text-[18px] font-bold text-[#00e5a0] mt-1">{fmt(R.price.current)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--site-muted)]">24H 涨跌幅</p>
            <p className="text-[18px] font-bold text-[#00e5a0] mt-1">+{R.price.changePct}%</p>
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
            <p className="text-[18px] font-bold text-[#ff4d6a] mt-1">{R.funding.rateDisplay}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--site-muted)]">分析日期</p>
            <p className="text-[18px] font-bold text-[var(--site-ink)] mt-1">{R.date}</p>
          </div>
        </div>
      </header>

      {/* Risk Alert */}
      <AlertBox type="danger" title="高风险预警">
        资金费率 0.0717% 折算年化超过 <strong>628%</strong>，属于极端异常水平。当前价格偏离 MA7 达 <strong>38.3%</strong>，量价背离明显，短期回调风险极大。建议严格控制仓位，切勿追高。
      </AlertBox>

      {/* Section 1: Price Overview */}
      <section className="mb-10">
        <SectionTitle dotColor={C.accent}>价格概览</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard label="最新价格" value={fmt(R.price.current)} sub={`标记价格: ${fmt(R.price.markPrice)}`} colorClass="text-[#00e5a0]" />
          <MetricCard label="24H 涨跌" value={`+${R.price.changePct}%`} sub={`涨跌额: +${fmt(R.price.changeAbs)}`} colorClass="text-[#00e5a0]" />
          <MetricCard label="今日开盘" value={fmt(R.price.open)} sub={`收盘: ${fmt(R.price.close)}`} />
          <MetricCard label="今日振幅" value="18.53%" sub={`高: ${fmt(R.price.high)} / 低: ${fmt(R.price.low)}`} colorClass="text-[#f5a623]" />
          <MetricCard label="24H 价格区间" value={`${R.range24h.rangePct}%`} sub="日内波动剧烈" colorClass="text-[#f5a623]" />
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
              <MetricCard label="24H 成交量" value="921.7M" sub="LOBSTER 代币" />
              <MetricCard label="24H 成交额" value="16.88M" sub="USDT" />
              <MetricCard label="历史最高量" value="940.88M" sub="接近历史峰值" />
              <MetricCard label="历史总成交" value="1.621B" sub="LOBSTER 代币" />
            </div>
            <AlertBox type="warning" title="量价背离信号">
              近期出现巨量 spike 后缩量上涨，价格创新高但成交量未同步放大，存在量价背离迹象。
            </AlertBox>
          </div>
          {/* Funding */}
          <div>
            <SectionTitle dotColor={C.red}>资金费率</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <MetricCard label="当前费率" value={R.funding.rateDisplay} sub="每4小时结算" colorClass="text-[#ff4d6a]" />
              <MetricCard label="年化费率" value={`~${R.funding.annualizedPct}%`} sub="极端异常水平" colorClass="text-[#ff4d6a]" />
              <MetricCard label="费率方向" value="多头付空头" sub="多头杠杆过热" colorClass="text-[#ff4d6a]" />
              <MetricCard label="下次结算" value={R.funding.countdown} sub="倒计时" />
            </div>
            <AlertBox type="danger" title="资金费率极端异常">
              正费率意味着多头需向空头支付费用。费率越高，说明多头杠杆仓位越拥挤，市场情绪极度狂热，随时可能出现多杀多踩踏。
            </AlertBox>
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
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">MA(7) 短期均线</td>
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">{fmt(R.ma.ma7)}</td>
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644] text-[#ff4d6a]">+{R.ma.priceVsMa7Pct}%</td>
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644] text-[#ff4d6a]">严重超买</td>
              </tr>
              <tr className="hover:bg-[var(--site-panel)]">
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">MA(25) 中期均线</td>
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">{fmt(R.ma.ma25)}</td>
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644] text-[#ff4d6a]">+{R.ma.priceVsMa25Pct}%</td>
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644] text-[#ff4d6a]">极端偏离</td>
              </tr>
              <tr className="hover:bg-[var(--site-panel)]">
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">MA(99) 长期均线</td>
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">{fmt(R.ma.ma99)}</td>
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644] text-[#ff4d6a]">+{R.ma.priceVsMa99Pct}%</td>
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644] text-[#ff4d6a]">极端偏离</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="bg-[var(--site-panel)] border-l-3 border-[#00e5a0] p-4 mt-4 rounded-r-lg text-[13px] text-[var(--site-muted)] leading-[1.8]">
          <strong className="text-[var(--site-ink)]">均线分析：</strong>
          价格位于所有均线上方，呈多头排列。但短期乖离率极大（偏离MA7达38.3%），历史上此类极端乖离往往伴随剧烈回调。MA7/MA25/MA99 三线发散程度加剧，趋势虽强但不可持续。
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
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">3月初高点，当前未突破</td>
              </tr>
              <tr className="hover:bg-[var(--site-panel)]">
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644] text-[#f5a623]">当前阻力位</td>
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">{fmt(R.keyLevels.resistance)}</td>
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">24h高点，接近前高区域</td>
              </tr>
              <tr className="hover:bg-[var(--site-panel)]">
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644] text-[#00e5a0]">关键支撑位 1</td>
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">{fmt(R.keyLevels.support1)}</td>
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">心理关口</td>
              </tr>
              <tr className="hover:bg-[var(--site-panel)]">
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644] text-[#00e5a0]">关键支撑位 2</td>
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">{fmt(R.keyLevels.support2)}</td>
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">MA25/MA99 附近</td>
              </tr>
              <tr className="hover:bg-[var(--site-panel)]">
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">近期低点</td>
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">{fmt(R.keyLevels.recentLow)}</td>
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">5月底部，已反弹 {R.keyLevels.reboundFromLowPct}%</td>
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
              <tr className="hover:bg-[var(--site-panel)]">
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">资金费率异常</td>
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644] text-[#ff4d6a]">触发</td>
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644] text-[#ff4d6a]">极高</td>
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">年化628%，多头极度拥挤，多杀多风险</td>
              </tr>
              <tr className="hover:bg-[var(--site-panel)]">
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">量价背离</td>
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644] text-[#f5a623]">触发</td>
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644] text-[#f5a623]">高</td>
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">价格创新高但成交量萎缩，上涨动力不足</td>
              </tr>
              <tr className="hover:bg-[var(--site-panel)]">
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">均线乖离</td>
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644] text-[#ff4d6a]">触发</td>
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644] text-[#ff4d6a]">极高</td>
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">偏离MA7达38.3%，偏离MA25达96.4%</td>
              </tr>
              <tr className="hover:bg-[var(--site-panel)]">
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">超买信号</td>
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644] text-[#ff4d6a]">触发</td>
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644] text-[#ff4d6a]">高</td>
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">连续大幅上涨，短期获利盘巨大</td>
              </tr>
              <tr className="hover:bg-[var(--site-panel)]">
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">波动率风险</td>
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644] text-[#f5a623]">触发</td>
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644] text-[#f5a623]">中高</td>
                <td className="p-3 border-b border-[#d7d9cf] dark:border-[#2b3644]">24H振幅31.97%，日内波动剧烈</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <SignalTag type="danger">&#9888; 资金费率极端</SignalTag>
          <SignalTag type="danger">&#9888; 量价背离</SignalTag>
          <SignalTag type="danger">&#9888; 均线严重乖离</SignalTag>
          <SignalTag type="warning">&#9888; 超买信号</SignalTag>
          <SignalTag type="warning">&#9888; 高波动率</SignalTag>
        </div>
      </section>

      {/* Section 7: Conclusion */}
      <section className="mb-10">
        <SectionTitle dotColor={C.accent}>综合研判</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="grid grid-cols-2 gap-4">
              <MetricCard label="趋势状态" value="强势上涨" sub="多头排列，动能充足" colorClass="text-[#00e5a0]" />
              <MetricCard label="风险等级" value="高风险" sub="多项风险信号触发" colorClass="text-[#ff4d6a]" />
              <MetricCard label="市场情绪" value="极端看多" sub="FOMO情绪主导" colorClass="text-[#f5a623]" />
              <MetricCard label="操作建议" value="观望为主" sub="严控仓位，勿追高" />
            </div>
          </div>
          <div>
            <AlertBox type="info" title="核心观点">
              LOBSTERUSDT 当前处于<strong>强势上涨趋势</strong>中，但多项风险指标已达到极端水平。资金费率年化628%表明多头杠杆极度拥挤，量价背离暗示上涨动力衰减，均线乖离率创近期新高。短期内回调概率极高，建议<strong>已持仓者设置止损</strong>，<strong>未持仓者等待回调至MA7（0.0138）附近再考虑介入</strong>。
            </AlertBox>
            <AlertBox type="warning" title="关注要点" className="mt-4">
              1. 能否放量突破 0.027 前高<br />
              2. 资金费率是否回落至正常区间（&lt;0.01%）<br />
              3. 成交量是否重新放大配合上涨<br />
              4. MA7 是否能跟上价格（乖离率收窄）
            </AlertBox>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-10 pt-6 border-t border-[#d7d9cf] dark:border-[#2b3644] text-center text-[11px] text-[var(--site-muted)]">
        LOBSTERUSDT 多维度交易分析 · 数据来源: Binance · 分析日期: 2026-06-17<br />
        本分析仅供参考，不构成投资建议。加密货币交易风险极高，请谨慎决策。
      </footer>
    </main>
  )
}