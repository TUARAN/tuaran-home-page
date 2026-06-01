'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import SharePageButton from '../components/SharePageButton'

// ============================================================
// 数据基础
// ============================================================

// 两个公开锚点样本（口径：账单 tokens，含 prompt cache 命中的 cache-read）
// - 1 亿 / 日：重度编程个人用户（IDE Agent 长上下文反复读取、重构、跨文件检索；非批量自动化）
// - 4.5 亿 / 日：社交媒体公开自报的极重度个人样本（同样以交互为主，未声明 7×24h 跑批）
const PERSONAL_DAILY = 100_000_000
const REPORTED_DAILY = 450_000_000

// 一次交互的常见上下文规模（含 system + 对话历史 + 检索 + 文件片段）
const TOKENS_PER_INTERACTION = 8000

// 强度分级（账单口径，含缓存命中）——经验阈值，不是行业标准
const INTENSITY_TIERS = [
  { name: '轻度', min: 0, max: 1_000_000, color: '#cbd5e1', desc: '偶尔问问题、查资料' },
  { name: '入门', min: 1_000_000, max: 10_000_000, color: '#a3b8d8', desc: 'AI 当辅助，主要还是自己写' },
  { name: '中度', min: 10_000_000, max: 100_000_000, color: '#7ba0d1', desc: '深度嵌入工作流，每天大段对话' },
  { name: '重度', min: 100_000_000, max: 500_000_000, color: '#a87b50', desc: 'IDE Agent 长会话 + 多窗口并行（含高缓存命中）' },
  { name: '极重度', min: 500_000_000, max: 2_000_000_000, color: '#8d5a2c', desc: '多 agent 协作、跨仓库检索、整日不离手' },
  { name: '自动化跑批', min: 2_000_000_000, max: 50_000_000_000, color: '#5a3618', desc: '后台任务流 / 评测管线主导跑量' },
]

// Prompt-cache 时代的真实公开 API 定价锚点（USD per 1M tokens）
// 三家头部厂商（Anthropic / OpenAI / Google）均已支持 prompt cache，cache-read 通常 ≈ 输入价的 10%。
// 价格周期约 12-18 个月腰斩，使用前请校对官网。
const REAL_PRICING = [
  {
    tier: '经济档',
    representative: 'Haiku 4.5 / GPT-mini / Gemini Flash',
    cacheRead: 0.08,
    input: 0.8,
    output: 4.0,
  },
  {
    tier: '主力档',
    representative: 'Sonnet 4.6 / GPT-4o / Gemini Pro',
    cacheRead: 0.3,
    input: 3.0,
    output: 15.0,
  },
  {
    tier: '旗舰档',
    representative: 'Opus 4.7 / o1 / Gemini Ultra',
    cacheRead: 1.5,
    input: 15.0,
    output: 75.0,
  },
]

const USD_TO_CNY = 7.2

// 三段比例：cache-read（命中复用）/ fresh-input（新增上下文）/ output（生成）
// 大量真实使用统计显示，长会话 IDE Agent 类工作流缓存命中率可达 80-90%。
const PROFILES = [
  {
    value: 'ide-agent',
    label: 'IDE Agent · 缓存读取 85% / 新增输入 10% / 输出 5%',
    cacheShare: 0.85,
    freshShare: 0.1,
    outputShare: 0.05,
  },
  {
    value: 'research',
    label: '调研写作 · 缓存读取 55% / 新增输入 30% / 输出 15%',
    cacheShare: 0.55,
    freshShare: 0.3,
    outputShare: 0.15,
  },
  {
    value: 'one-shot',
    label: '一次性脚本 / 翻译 · 缓存读取 15% / 新增输入 60% / 输出 25%',
    cacheShare: 0.15,
    freshShare: 0.6,
    outputShare: 0.25,
  },
]

// 场景结构：以「典型口径」呈现，不是「权威数据」
const TYPICAL_SCENARIOS = {
  developer: {
    label: '全职开发者画像（IDE Agent 主导）',
    rows: [
      { name: '仓库上下文反复读取（缓存命中为主）', share: 45 },
      { name: '代码生成 / 重构 / 排错', share: 25 },
      { name: '跨文件检索 / 调试日志注入', share: 15 },
      { name: '调研 / 文档查阅', share: 10 },
      { name: '写作 / 沟通文本', share: 5 },
    ],
  },
  researcher: {
    label: '研究 / 写作画像',
    rows: [
      { name: '深度调研 / 长文阅读', share: 38 },
      { name: '写作起稿 / 改稿', share: 28 },
      { name: '资料翻译 / 摘要', share: 18 },
      { name: '编程辅助', share: 11 },
      { name: '其他', share: 5 },
    ],
  },
}

// ============================================================
// 格式化工具
// ============================================================

const fmtCN = (v) => v.toLocaleString('zh-CN')
const fmtUsd = (v) => `$${v.toLocaleString('en-US', { maximumFractionDigits: v < 10 ? 2 : 0 })}`
const fmtCny = (v) => `¥${v.toLocaleString('zh-CN', { maximumFractionDigits: v < 10 ? 1 : 0 })}`

function blendedRate(p, profile) {
  return p.cacheRead * profile.cacheShare + p.input * profile.freshShare + p.output * profile.outputShare
}

function estimateUsd(tokens, usdPerMillion) {
  return (tokens / 1_000_000) * usdPerMillion
}

// 净处理 tokens（去掉缓存复用部分）：fresh-input + output 才是模型真正"新读 + 新写"的体量
function netProcessed(tokens, profile) {
  return tokens * (profile.freshShare + profile.outputShare)
}

// 中文字数：1 token ≈ 0.6 个中文汉字（用于净处理量换算）
function tokensToChars(tokens) {
  return Math.round(tokens * 0.6)
}

// 等价书目：1 本中等长度书 ≈ 25 万 tokens
function tokensToBooks(tokens) {
  return Math.round(tokens / 250_000)
}

// ============================================================
// 图表组件（零依赖、纯 SVG）
// ============================================================

/** 水平横条：对数刻度，用于强度分级。token 区间跨 5 个数量级，线性刻度会塌陷。 */
function IntensityChart({ markers = [] }) {
  const minLog = Math.log10(100_000)
  const maxLog = Math.log10(50_000_000_000)
  const span = maxLog - minLog
  const pos = (v) => ((Math.log10(v) - minLog) / span) * 100

  return (
    <div className="space-y-2">
      {INTENSITY_TIERS.map((tier) => {
        const left = pos(Math.max(tier.min || 100_000, 100_000))
        const right = pos(tier.max)
        return (
          <div key={tier.name} className="flex items-center gap-3 text-xs">
            <div className="w-20 shrink-0 text-right text-[#5e5548] dark:text-gray-300">{tier.name}</div>
            <div className="relative h-5 flex-1 rounded bg-[#f5efe2] dark:bg-gray-800">
              <div
                className="absolute top-0 bottom-0 rounded"
                style={{ left: `${left}%`, width: `${right - left}%`, background: tier.color }}
              />
              {markers.map((m) => {
                const x = pos(m.value)
                if (x < left || x > right) return null
                return (
                  <div
                    key={m.label}
                    className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-2 border-white dark:border-gray-950"
                    style={{ left: `${x}%`, background: '#1f2937' }}
                    title={`${m.label}：${fmtCN(m.value)} tokens/日`}
                  />
                )
              })}
            </div>
            <div className="hidden w-56 shrink-0 text-[10px] text-[#8c8376] dark:text-gray-400 sm:block">{tier.desc}</div>
          </div>
        )
      })}
      <div className="ml-[5.75rem] mt-3 flex justify-between text-[10px] text-[#8c8376] dark:text-gray-500">
        <span>10⁵</span>
        <span>10⁶</span>
        <span>10⁷</span>
        <span>10⁸</span>
        <span>10⁹</span>
        <span>10¹⁰</span>
      </div>
      <div className="ml-[5.75rem] flex flex-wrap gap-4 pt-1 text-[11px] text-[#5e5548] dark:text-gray-400">
        {markers.map((m) => (
          <span key={m.label} className="inline-flex items-center gap-1">
            <span className="inline-block h-2 w-2 rotate-45 bg-gray-800" />
            {m.label}
          </span>
        ))}
      </div>
    </div>
  )
}

/** 横向占比图，用于场景画像 */
function ShareBars({ rows }) {
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.name} className="flex items-center gap-3 text-xs">
          <div className="w-60 shrink-0 truncate text-[#5e5548] dark:text-gray-300">{r.name}</div>
          <div className="relative h-5 flex-1 overflow-hidden rounded bg-[#f5efe2] dark:bg-gray-800">
            <div
              className="h-full rounded bg-[#a87b50] transition-all"
              style={{ width: `${r.share}%` }}
            />
          </div>
          <div className="w-10 shrink-0 text-right tabular-nums text-[#5e5548] dark:text-gray-300">{r.share}%</div>
        </div>
      ))}
    </div>
  )
}

/** 分组柱状：3 档定价 × 2 样本（1 亿 / 4.5 亿） */
function CostColumnChart({ profile }) {
  const data = REAL_PRICING.map((p) => {
    const rate = blendedRate(p, profile)
    return {
      tier: p.tier,
      monthlyPersonal: estimateUsd(PERSONAL_DAILY * 30, rate),
      monthlyReported: estimateUsd(REPORTED_DAILY * 30, rate),
    }
  })

  const max = Math.max(...data.map((d) => d.monthlyReported))
  const h = 180

  return (
    <div>
      <div className="flex h-[200px] items-end gap-6 px-2">
        {data.map((d) => (
          <div key={d.tier} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-[180px] w-full items-end justify-center gap-2">
              <div className="flex w-1/2 flex-col items-center justify-end gap-1">
                <div className="text-[10px] tabular-nums text-[#5e5548] dark:text-gray-300">
                  {fmtUsd(d.monthlyPersonal)}
                </div>
                <div
                  className="w-full rounded-t bg-[#7ba0d1]"
                  style={{ height: `${(d.monthlyPersonal / max) * h}px`, minHeight: '2px' }}
                  title={`1 亿/日 · ${d.tier}：${fmtUsd(d.monthlyPersonal)} / 月`}
                />
              </div>
              <div className="flex w-1/2 flex-col items-center justify-end gap-1">
                <div className="text-[10px] tabular-nums text-[#5e5548] dark:text-gray-300">
                  {fmtUsd(d.monthlyReported)}
                </div>
                <div
                  className="w-full rounded-t bg-[#8d5a2c]"
                  style={{ height: `${(d.monthlyReported / max) * h}px`, minHeight: '2px' }}
                  title={`4.5 亿/日 · ${d.tier}：${fmtUsd(d.monthlyReported)} / 月`}
                />
              </div>
            </div>
            <div className="text-xs font-medium text-[#3f382f] dark:text-gray-200">{d.tier}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-center gap-6 text-[11px] text-[#5e5548] dark:text-gray-400">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-[#7ba0d1]" />
          1 亿 tokens/日（月费）
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-[#8d5a2c]" />
          4.5 亿 tokens/日（月费）
        </span>
      </div>
    </div>
  )
}

// ============================================================
// 通用表格
// ============================================================

function Table({ headers, rows, dense = false }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#eee3d2] dark:border-gray-800">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-[#faf5eb] text-[#4b4336] dark:bg-gray-900 dark:text-gray-200">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className={`px-3 ${dense ? 'py-1.5' : 'py-2'} text-left font-medium`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white text-[#3f382f] dark:bg-gray-950 dark:text-gray-300">
          {rows.map((row, idx) => (
            <tr key={idx} className="border-t border-[#f1e9db] dark:border-gray-800">
              {row.map((cell, cidx) => (
                <td
                  key={cidx}
                  className={`px-3 ${dense ? 'py-1.5' : 'py-2'} ${cidx > 0 ? 'text-right tabular-nums' : ''}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Section({ id, title, children, judgment }) {
  return (
    <section id={id} className="scroll-mt-24 space-y-3">
      <h2 className="text-lg font-semibold text-[#2b2419] dark:text-gray-100">{title}</h2>
      {children}
      {judgment ? (
        <p className="mt-2 border-l-2 border-[#a87b50] bg-[#fdf8ee] px-4 py-2 text-sm leading-7 text-[#4b4336] dark:border-[#a87b50] dark:bg-gray-900 dark:text-gray-300">
          <span className="mr-1 font-semibold">判断：</span>
          {judgment}
        </p>
      ) : null}
    </section>
  )
}

// ============================================================
// 主组件
// ============================================================

export default function AiTokenUsageResearchClient() {
  const [profileKey, setProfileKey] = useState('ide-agent')
  const [scenarioKey, setScenarioKey] = useState('developer')

  const profile = PROFILES.find((p) => p.value === profileKey) ?? PROFILES[0]
  const scenario = TYPICAL_SCENARIOS[scenarioKey]

  const pricing = useMemo(() => {
    return REAL_PRICING.map((p) => ({
      ...p,
      blended: blendedRate(p, profile),
    }))
  }, [profile])

  const personalNet = netProcessed(PERSONAL_DAILY, profile)
  const reportedNet = netProcessed(REPORTED_DAILY, profile)
  const personalInteractions = Math.round(PERSONAL_DAILY / TOKENS_PER_INTERACTION)
  const reportedInteractions = Math.round(REPORTED_DAILY / TOKENS_PER_INTERACTION)

  return (
    <main className="mx-auto w-full max-w-5xl space-y-10 px-4 py-10">
      <header className="space-y-3 border-b border-[#eadfcd] pb-6 dark:border-gray-800">
        <div className="flex items-start justify-between gap-4">
          <p className="text-xs tracking-wide text-[#8c8376] dark:text-gray-500">专题 · AI 调研</p>
          <SharePageButton
            title="AI Token 用量与花费强度调研"
            text="日耗 1 亿 / 4.5 亿 tokens 对照（账单口径，含缓存命中）：强度尺、净处理换算、场景画像、按 prompt-cache 真实定价折算月费、效率信号、优化抓手。"
            url="/ai-token-usage-research"
          />
        </div>
        <h1 className="text-3xl font-semibold text-[#222] dark:text-gray-100">
          AI Token 用量与花费强度调研
        </h1>
        <p className="text-sm leading-7 text-[#5e5548] dark:text-gray-300">
          围绕两个公开样本（日耗 1 亿 / 4.5 亿 tokens，账单口径含 prompt cache 命中）回答四件事：处在什么强度档、缓存复用之后真正"读了多少新东西"、按当下三家头部厂商的 cache-aware 定价每月要花多少钱、什么场景下 token 增长 = 生产力增长、什么场景下 = 浪费。
        </p>
        <div className="flex flex-wrap gap-3 text-xs text-[#8c8376] dark:text-gray-400">
          <span>口径：账单 tokens（含 cache-read）</span>
          <span>·</span>
          <span>定价锚点：2026-Q2 三家头部厂商公开 API 价</span>
          <span>·</span>
          <span>价格周期：每 12-18 个月约腰斩，使用前请校对</span>
        </div>
      </header>

      {/* 0. 口径说明 */}
      <Section
        id="accounting"
        title="0) 先把口径讲清楚：账单 tokens ≠ 净处理 tokens"
        judgment="一旦区分这两本账，多数「骇人听闻的 token 数字」就还原成可理解的工作量——账单 1 亿/日 在长会话编程下，净新增可能只有 1500 万左右。这不是省钱魔法，是 cache pricing 的常态。"
      >
        <p className="text-sm leading-7 text-[#5e5548] dark:text-gray-300">
          2024 年起，Anthropic / OpenAI / Google 都已把 prompt caching 列为头等公民——对反复使用的长前缀（系统提示、仓库结构、文档），第二次起按 <strong>输入价的 10% 左右</strong> 收费（Anthropic cache-read 为 base input 的 10%，OpenAI 是 50%，Gemini 是 25%）。因此同一笔"日耗 1 亿 tokens"在不同口径下含义完全不同：
        </p>
        <Table
          headers={['口径', '含义', '是否含 cache-read', '用途']}
          rows={[
            ['账单 tokens', '厂商按账单计费的总 token 数', '含', '判断"花了多少钱、跑了多大流量"'],
            ['净处理 tokens', 'fresh-input + output，模型真正"新读 + 新写"的量', '不含', '判断"实际吸收 / 产出多少信息"'],
            ['unique 内容 tokens', '去重后的实际文本量（同一文件多次注入算一份）', '不含', '判断"信息密度 / 噪声比"'],
          ]}
        />
        <p className="text-xs text-[#8c8376] dark:text-gray-500">
          后文所有"日耗 1 亿 / 4.5 亿"均为账单口径；提到"净处理"或"等效阅读量"时会显式换算。
        </p>
      </Section>

      {/* 1. 强度尺 */}
      <Section
        id="intensity"
        title="1) 强度尺：账单口径下的 6 档对数刻度"
        judgment="账单 1 亿/日 ≈ 一个全天泡在 IDE Agent 里、跨文件重构 + 反复让模型读同一份仓库的开发者；4.5 亿/日 在这个框架里是 4.5×，不是数量级跨越——重度编程 + 长上下文复用就能撑起来，不必预设 7×24h 跑批。"
      >
        <p className="text-sm leading-7 text-[#5e5548] dark:text-gray-300">
          token 区间跨 5 个数量级，横轴用对数刻度。两个钻石标记是常见公开样本：
        </p>
        <div className="rounded-xl border border-[#eee3d2] bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
          <IntensityChart
            markers={[
              { label: '1 亿/日（重度编程个人）', value: PERSONAL_DAILY },
              { label: '4.5 亿/日（极重度个人报样）', value: REPORTED_DAILY },
            ]}
          />
        </div>
        <p className="text-xs text-[#8c8376] dark:text-gray-500">
          经验阈值。不同人对"重度"定义差一个量级，仅作粗略锚点。
        </p>
      </Section>

      {/* 2. 等价换算 */}
      <Section
        id="equivalence"
        title="2) 换算尺：1 亿 / 4.5 亿 tokens 到底对应多大体量"
        judgment="账单数字大头是缓存复用——把它扣掉之后，「日均 1 亿」在 IDE Agent 画像下相当于一天净读写 1500 万 tokens、约 60 本中等长度书的内容；「日均 4.5 亿」对应约 6750 万、270 本。仍属极限值，但已经不是科幻。"
      >
        <p className="text-sm leading-7 text-[#5e5548] dark:text-gray-300">
          切换上方"输入/输出比例"选择器（默认 IDE Agent 85/10/5），下表的"净处理"与"等效书目"会随画像变化。
        </p>
        <Table
          headers={['指标', '1 亿/日', '4.5 亿/日', '解释']}
          rows={[
            ['账单 tokens', fmtCN(PERSONAL_DAILY), fmtCN(REPORTED_DAILY), '含 cache-read'],
            ['净处理 tokens', fmtCN(Math.round(personalNet)), fmtCN(Math.round(reportedNet)), 'fresh-input + output'],
            ['等效中文字数（净）', fmtCN(tokensToChars(personalNet)), fmtCN(tokensToChars(reportedNet)), '1 token ≈ 0.6 汉字'],
            ['等效中等书目（净）', `~${tokensToBooks(personalNet)} 本/日`, `~${tokensToBooks(reportedNet)} 本/日`, '1 本 ≈ 25 万 tokens'],
            ['交互次数（8000 t/次）', fmtCN(personalInteractions), fmtCN(reportedInteractions), '含上下文 + 历史 + 文件片段'],
            ['月账单总量（×30）', fmtCN(PERSONAL_DAILY * 30), fmtCN(REPORTED_DAILY * 30), '月度预算锚点（账单口径）'],
          ]}
        />
      </Section>

      {/* 3. 场景占比 */}
      <Section
        id="scenarios"
        title="3) 场景画像：账单 tokens 主要花在哪"
        judgment="开发者画像里近一半账单 tokens 是仓库上下文的反复读取（缓存命中为主）——这不是浪费，是 IDE Agent 范式的必然结果。真正能拧的水龙头是上下文规模与缓存命中率，不是少问几次。"
      >
        <p className="text-sm leading-7 text-[#5e5548] dark:text-gray-300">
          下方占比是从公开讨论归纳的"典型口径"，不是行业统计。切换画像看哪个更接近实际：
        </p>
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#eadfcd] bg-[#fffdf9] p-3 dark:border-gray-800 dark:bg-gray-900">
          <label htmlFor="scenario" className="text-sm text-[#5e5548] dark:text-gray-300">
            画像
          </label>
          <select
            id="scenario"
            value={scenarioKey}
            onChange={(e) => setScenarioKey(e.target.value)}
            className="rounded border border-[#d9cfbe] bg-white px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-950"
          >
            {Object.entries(TYPICAL_SCENARIOS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
        <div className="rounded-xl border border-[#eee3d2] bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
          <ShareBars rows={scenario.rows} />
        </div>
      </Section>

      {/* 4. 花费 */}
      <Section
        id="cost"
        title="4) 月度花费：cache-aware 定价折算"
        judgment="日均 1 亿在主力档 IDE Agent 画像下大约 $3900/月（≈ ¥2.8 万），日均 4.5 亿对应 $1.76 万/月（≈ ¥12.7 万）。比「按 base input 直算」的老口径低一个数量级——但同样要警告：如果换上旗舰档（Opus 等级），即便走 cache，4.5 亿/日仍逼近 ¥60 万/月，是公司级账单而非个人可持续支出。"
      >
        <p className="text-sm leading-7 text-[#5e5548] dark:text-gray-300">
          三段定价：<strong>cache-read</strong>（命中复用，最便宜）/ <strong>fresh-input</strong>（新增上下文，标准输入价）/ <strong>output</strong>（生成，最贵）。下方计算按 Anthropic 公开比例：cache-read 取 input × 10%；OpenAI / Gemini 比例更高（25-50%），同口径会更贵但不改变量级判断。
        </p>
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#eadfcd] bg-[#fffdf9] p-3 dark:border-gray-800 dark:bg-gray-900">
          <label htmlFor="profile" className="text-sm text-[#5e5548] dark:text-gray-300">
            使用画像
          </label>
          <select
            id="profile"
            value={profileKey}
            onChange={(e) => setProfileKey(e.target.value)}
            className="rounded border border-[#d9cfbe] bg-white px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-950"
          >
            {PROFILES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <span className="text-xs text-[#8f826c] dark:text-gray-400">缓存命中率越低、输出占比越高，单价越贵</span>
        </div>

        <div className="rounded-xl border border-[#eee3d2] bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
          <CostColumnChart profile={profile} />
        </div>

        <Table
          headers={[
            '档位',
            '代表模型',
            'cache / input / output（$/M）',
            '混合单价（$/M）',
            '1 亿/日 月费',
            '4.5 亿/日 月费',
          ]}
          rows={pricing.map((p) => [
            p.tier,
            p.representative,
            `${p.cacheRead} / ${p.input} / ${p.output}`,
            p.blended.toFixed(2),
            `${fmtUsd(estimateUsd(PERSONAL_DAILY * 30, p.blended))} ≈ ${fmtCny(estimateUsd(PERSONAL_DAILY * 30, p.blended) * USD_TO_CNY)}`,
            `${fmtUsd(estimateUsd(REPORTED_DAILY * 30, p.blended))} ≈ ${fmtCny(estimateUsd(REPORTED_DAILY * 30, p.blended) * USD_TO_CNY)}`,
          ])}
        />
      </Section>

      {/* 5. 订阅口径 */}
      <Section
        id="subscription"
        title="5) 市场口径：按 token 计费 vs 订阅制"
        judgment="账单 4.5 亿/日 听起来像每月 ¥10 万级支出，但相当一部分极重度个人样本走的是固定订阅而非 metered billing——同样的 token 流量在两种口径下账单可能差 20 倍。引用这种数字时一定要先问「是 API 计费还是订阅画像」。"
      >
        <p className="text-sm leading-7 text-[#5e5548] dark:text-gray-300">
          2025 年起头部 IDE Agent 类产品大多提供高位订阅档（Claude Max / GPT Pro / Cursor Ultra 等），月费 $100-$400 级别，对个人重度用户取消了"用得越多花得越多"的弹性账单。多数公开自报"日耗 X 亿 tokens"的样本，其真实支出落在这一档，而不是按上节表格的 metered 价格付费。
        </p>
        <Table
          headers={['计费口径', '典型档位', '对个人重度的实际支出', '何时仍按 metered 算账']}
          rows={[
            ['按量（metered API）', 'API key 直连', '由 token 量与画像决定，可见第 4 节', '需要审计、自定义路由、批处理、企业部署'],
            ['订阅（flat-rate）', 'Max / Pro / Ultra 级别', '月费 $100-$400 锁死', '触发硬性速率限制、需要更高并发或 SLA'],
            ['企业池（席位 + 池子）', '团队 / 组织计划', '按席位 + 用量阶梯', '部门级集中采购'],
          ]}
        />
        <p className="text-xs text-[#8c8376] dark:text-gray-500">
          口径选择本身就是优化抓手：如果使用画像稳定在 IDE Agent + 高缓存命中、不需要外部 API 集成，订阅档通常显著优于按量。
        </p>
      </Section>

      {/* 6. 效率定位 */}
      <Section
        id="efficiency"
        title="6) 效率定位：token 多 ≠ 生产力高"
        judgment="量上去之后真正的指标不是「跑了多少 token」，而是「每百万账单 token 沉淀了多少可交付物」。判断是否掉进高 token 低产出陷阱，看五个信号："
      >
        <Table
          headers={['信号', '健康', '掉进浪费陷阱的迹象']}
          rows={[
            ['会话留存', '能引用、能复用、被归档', '一次性扔掉、没人回看'],
            ['输出收口', '有人验收、能进生产', '生成完没人看 / 直接堆磁盘'],
            ['迭代次数', '收敛到结果（≤ 5 轮）', '反复试错（> 10 轮还没拿到目标）'],
            ['上下文密度', '指令明确、检索精准', '塞海量文档"让 AI 自己找"'],
            ['模型分层', '简单任务用小模型', '一律旗舰、爽就完事'],
          ]}
        />
      </Section>

      {/* 7. 优化抓手 */}
      <Section
        id="optimization"
        title="7) 优化抓手：按 ROI 排序"
        judgment="对绝大多数重度个人用户，前三条就能砍掉 30-50% 的成本，且不需要立刻上 agent 自动化。"
      >
        <Table
          headers={['抓手', '预期降本幅度', '落地难度', '说明']}
          rows={[
            ['切换到订阅档（若画像匹配）', '40-90%', '低', 'IDE Agent 主导 + 高缓存命中场景，订阅档常显著优于 metered'],
            ['启用 prompt caching 并设计稳定前缀', '20-40%', '低', '把系统提示、仓库结构、常用文档放在前缀；避免动态插值打散缓存'],
            ['模型路由分层', '20-50%', '中', '简单任务用经济档，深度推理才上旗舰；多数 IDE Agent 已内置'],
            ['压缩上下文 / 用 .ignore 排除', '10-30%', '中', '只塞相关文件，避免缓存写入开销摊不开'],
            ['限制输出长度', '5-15%', '低', 'max_tokens + "不要解释、只给答案"的指令'],
            ['Agent 步数上限 + checkpoint', '不直接降本但防失控', '低', '防止跑飞导致一次性账单爆炸'],
            ['批处理 + 异步', '间接降本', '高', '把可延迟的任务积到 batch API（半价）'],
          ]}
        />
      </Section>

      {/* 8. 快照模板 */}
      <Section
        id="snapshot"
        title="8) 月度快照（持续累积、只增不删）"
        judgment="模板留五列就够：账单 tokens、净处理（估）、主用模型、计费口径、本月最大优化点。每月写一行，半年回看就能看出强度爬升曲线与优化效果。"
      >
        <Table
          headers={['月份', '日均账单 tokens', '日均净处理（估）', '主用模型 / 工具', '计费口径', '本月最大优化点']}
          rows={[
            ['示例行', '~1 亿', '~1500 万', '主力档 IDE Agent', '订阅', '收紧 .ignore，缓存命中率提升至 85%'],
            ['填新行', '——', '——', '——', '——', '——'],
          ]}
        />
      </Section>

      {/* 9. 来源 */}
      <section className="rounded-xl border border-[#eadfcd] bg-[#fffdf9] p-4 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-2 text-lg font-semibold text-[#2b2419] dark:text-gray-100">来源与校准入口</h2>
        <ul className="space-y-1 text-sm text-[#51493d] dark:text-gray-300">
          <li>
            · <a href="https://openai.com/api/pricing/" target="_blank" rel="noreferrer" className="underline">OpenAI API Pricing（含 cached input 折扣比例）</a>
          </li>
          <li>
            · <a href="https://docs.anthropic.com/en/docs/about-claude/pricing" target="_blank" rel="noreferrer" className="underline">Anthropic API Pricing（cache-read / cache-write 公开报价）</a>
          </li>
          <li>
            · <a href="https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching" target="_blank" rel="noreferrer" className="underline">Anthropic Prompt Caching 文档</a>
          </li>
          <li>
            · <a href="https://platform.openai.com/docs/guides/prompt-caching" target="_blank" rel="noreferrer" className="underline">OpenAI Prompt Caching 文档</a>
          </li>
          <li>
            · <a href="https://ai.google.dev/gemini-api/docs/pricing" target="_blank" rel="noreferrer" className="underline">Gemini API Pricing（含 context caching）</a>
          </li>
          <li>
            · <a href="https://api-docs.deepseek.com/quick_start/pricing" target="_blank" rel="noreferrer" className="underline">DeepSeek Pricing</a>
          </li>
        </ul>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <Link href="/articles?tab=special&special_type=ai" className="underline decoration-[#d3b889] underline-offset-2">
            返回专题列表（AI 调研）
          </Link>
          <Link href="/articles/research/topics/llm-prompt-directives" className="underline decoration-[#d3b889] underline-offset-2">
            相关：LLM Prompt 指令清单
          </Link>
        </div>
      </section>
    </main>
  )
}
