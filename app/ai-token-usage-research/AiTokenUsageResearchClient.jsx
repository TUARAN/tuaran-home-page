'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

// ============================================================
// 数据基础
// ============================================================

// 用户提供的两个公开锚点样本
const BASELINE_DAILY = 10_000_000 // 中重度个人
const ELITE_DAILY = 450_000_000 // 顶级重度（社交媒体公开自报）

// 一次交互的常见上下文规模（含 system + 对话历史 + 检索）
const TOKENS_PER_INTERACTION = 3000

// 强度分级（经验阈值，不是行业标准）
const INTENSITY_TIERS = [
  { name: '轻度', min: 0, max: 100_000, color: '#cbd5e1', desc: '偶尔问问题、查资料' },
  { name: '入门', min: 100_000, max: 1_000_000, color: '#a3b8d8', desc: 'AI 当辅助，每天主要还是自己写' },
  { name: '中度', min: 1_000_000, max: 5_000_000, color: '#7ba0d1', desc: '深度嵌入工作流' },
  { name: '中重度', min: 5_000_000, max: 20_000_000, color: '#a87b50', desc: '全职 AI 辅助专业流（开发 / 写作 / 研究）' },
  { name: '重度', min: 20_000_000, max: 100_000_000, color: '#8d5a2c', desc: '多窗口 / 多 agent 并行' },
  { name: '顶级重度', min: 100_000_000, max: 1_000_000_000, color: '#5a3618', desc: '自动化主导，企业级或全职 AI 驱动开发' },
]

// 真实公开 API 定价锚点（2024-Q4 公开价；价格每 12-18 个月约腰斩，使用前请校对）
// 单位：USD per 1M tokens
const REAL_PRICING = [
  {
    tier: '经济档',
    representative: 'GPT-4o mini / Claude Haiku 3.5 / Gemini Flash',
    input: 0.15,
    output: 0.60,
  },
  {
    tier: '主力档',
    representative: 'GPT-4o / Claude Sonnet 4.5',
    input: 3.0,
    output: 15.0,
  },
  {
    tier: '旗舰档',
    representative: 'Claude Opus 4 / OpenAI o1',
    input: 15.0,
    output: 75.0,
  },
]

const USD_TO_CNY = 7.2

const PROFILES = [
  { value: 'cache-heavy', label: '缓存重 · 输入 90% / 输出 10%', inputShare: 0.9 },
  { value: 'baseline', label: '基线 · 输入 70% / 输出 30%', inputShare: 0.7 },
  { value: 'output-heavy', label: '输出重 · 输入 50% / 输出 50%', inputShare: 0.5 },
]

// 场景结构：标注「典型口径」而不是「权威数据」，让读者知道这是经验值
const TYPICAL_SCENARIOS = {
  developer: {
    label: '全职开发者画像',
    rows: [
      { name: '代码生成 / 重构 / 排错', share: 55 },
      { name: 'IDE Agent 上下文同步', share: 20 },
      { name: '调研 / 文档查阅', share: 12 },
      { name: '写作 / 沟通文本', share: 8 },
      { name: '其他自动化', share: 5 },
    ],
  },
  researcher: {
    label: '研究 / 写作画像',
    rows: [
      { name: '深度调研 / 长文阅读', share: 40 },
      { name: '写作起稿 / 改稿', share: 30 },
      { name: '资料翻译 / 摘要', share: 15 },
      { name: '编程辅助', share: 10 },
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

function blended(input, output, inputShare) {
  return input * inputShare + output * (1 - inputShare)
}

function estimateUsd(tokens, usdPerMillion) {
  return (tokens / 1_000_000) * usdPerMillion
}

// 中文字数：1 token ≈ 0.6 个中文汉字
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

/** 水平横条：对数刻度，用于强度分级。token 区间跨 4 个数量级，线性刻度会塌陷。 */
function IntensityChart({ markers = [] }) {
  const minLog = Math.log10(50_000)
  const maxLog = Math.log10(1_000_000_000)
  const span = maxLog - minLog
  const w = 100
  const pos = (v) => ((Math.log10(v) - minLog) / span) * w

  return (
    <div className="space-y-2">
      {INTENSITY_TIERS.map((tier) => {
        const left = pos(Math.max(tier.min || 50_000, 50_000))
        const right = pos(tier.max)
        return (
          <div key={tier.name} className="flex items-center gap-3 text-xs">
            <div className="w-16 shrink-0 text-right text-[#5e5548] dark:text-gray-300">{tier.name}</div>
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
      <div className="ml-[4.75rem] mt-3 flex justify-between text-[10px] text-[#8c8376] dark:text-gray-500">
        <span>10⁵</span>
        <span>10⁶</span>
        <span>10⁷</span>
        <span>10⁸</span>
        <span>10⁹</span>
      </div>
      <div className="ml-[4.75rem] flex flex-wrap gap-4 pt-1 text-[11px] text-[#5e5548] dark:text-gray-400">
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
          <div className="w-44 shrink-0 truncate text-[#5e5548] dark:text-gray-300">{r.name}</div>
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

/** 分组柱状：3 档定价 × 2 样本（1000 万 / 4.5 亿） */
function CostColumnChart({ pricing, profile }) {
  const data = REAL_PRICING.map((p) => {
    const blendedRate = blended(p.input, p.output, profile.inputShare)
    return {
      tier: p.tier,
      monthlyBaseline: estimateUsd(BASELINE_DAILY * 30, blendedRate),
      monthlyElite: estimateUsd(ELITE_DAILY * 30, blendedRate),
    }
  })

  const max = Math.max(...data.map((d) => d.monthlyElite))
  const h = 180

  return (
    <div>
      <div className="flex h-[200px] items-end gap-6 px-2">
        {data.map((d) => (
          <div key={d.tier} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-[180px] w-full items-end justify-center gap-2">
              <div className="flex w-1/2 flex-col items-center justify-end gap-1">
                <div className="text-[10px] tabular-nums text-[#5e5548] dark:text-gray-300">
                  {fmtUsd(d.monthlyBaseline)}
                </div>
                <div
                  className="w-full rounded-t bg-[#7ba0d1]"
                  style={{ height: `${(d.monthlyBaseline / max) * h}px`, minHeight: '2px' }}
                  title={`1000 万/日 · ${d.tier}：${fmtUsd(d.monthlyBaseline)} / 月`}
                />
              </div>
              <div className="flex w-1/2 flex-col items-center justify-end gap-1">
                <div className="text-[10px] tabular-nums text-[#5e5548] dark:text-gray-300">
                  {fmtUsd(d.monthlyElite)}
                </div>
                <div
                  className="w-full rounded-t bg-[#8d5a2c]"
                  style={{ height: `${(d.monthlyElite / max) * h}px`, minHeight: '2px' }}
                  title={`4.5 亿/日 · ${d.tier}：${fmtUsd(d.monthlyElite)} / 月`}
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
          1000 万 tokens/日（月费）
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
  const [profileKey, setProfileKey] = useState('baseline')
  const [scenarioKey, setScenarioKey] = useState('developer')

  const profile = PROFILES.find((p) => p.value === profileKey) ?? PROFILES[1]
  const scenario = TYPICAL_SCENARIOS[scenarioKey]

  const pricing = useMemo(() => {
    return REAL_PRICING.map((p) => ({
      ...p,
      blended: blended(p.input, p.output, profile.inputShare),
    }))
  }, [profile.inputShare])

  const baselineInteractions = Math.round(BASELINE_DAILY / TOKENS_PER_INTERACTION)
  const eliteInteractions = Math.round(ELITE_DAILY / TOKENS_PER_INTERACTION)

  return (
    <main className="mx-auto w-full max-w-5xl space-y-10 px-4 py-10">
      <header className="space-y-3 border-b border-[#eadfcd] pb-6 dark:border-gray-800">
        <p className="text-xs tracking-wide text-[#8c8376] dark:text-gray-500">专题 · AI 调研</p>
        <h1 className="text-3xl font-semibold text-[#222] dark:text-gray-100">
          AI Token 用量与花费强度调研
        </h1>
        <p className="text-sm leading-7 text-[#5e5548] dark:text-gray-300">
          围绕两个公开样本（日耗 1000 万 / 4.5 亿 tokens）回答四件事：处在什么强度档、相当于多大的文本吞吐、按真实公开 API 价折算每月要花多少钱、什么场景下 token 增长 = 生产力增长、什么场景下 = 浪费。
        </p>
        <div className="flex flex-wrap gap-3 text-xs text-[#8c8376] dark:text-gray-400">
          <span>口径：以 2024-Q4 公开 API 价为锚点</span>
          <span>·</span>
          <span>价格周期：每 12-18 个月约腰斩，使用前请校对</span>
        </div>
      </header>

      {/* 1. 强度尺 */}
      <Section
        id="intensity"
        title="1) 强度尺：在 6 档对数刻度上找自己"
        judgment="档位的真正分界不在 token 数量，而在「人是不是还在每条 prompt 上花认知」——5000 万/日以下，token 是认知吞吐的副产物；5000 万/日以上，必然有自动化在主导跑量。"
      >
        <p className="text-sm leading-7 text-[#5e5548] dark:text-gray-300">
          token 区间跨 5 个数量级，所以横轴用对数刻度。两个钻石标记是你常引的样本：
        </p>
        <div className="rounded-xl border border-[#eee3d2] bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
          <IntensityChart
            markers={[
              { label: '1000 万/日（中重度个人）', value: BASELINE_DAILY },
              { label: '4.5 亿/日（顶级重度）', value: ELITE_DAILY },
            ]}
          />
        </div>
        <p className="text-xs text-[#8c8376] dark:text-gray-500">
          经验阈值，不同人对「重度」定义差一个量级。仅作粗略锚点。
        </p>
      </Section>

      {/* 2. 等价换算 */}
      <Section
        id="equivalence"
        title="2) 换算尺：1 千万 / 4.5 亿 tokens 到底是多大体量"
        judgment="读到「日均 4.5 亿」别立刻惊叹——换算下来等于一天读 1080 本书、每秒钟看 4 本。这不是「人在用 AI」，是「人在调度跑批」。"
      >
        <Table
          headers={['指标', '1000 万/日', '4.5 亿/日', '解释']}
          rows={[
            ['日总 tokens', fmtCN(BASELINE_DAILY), fmtCN(ELITE_DAILY), '总算力消耗'],
            ['等效中文字数', fmtCN(tokensToChars(BASELINE_DAILY)), fmtCN(tokensToChars(ELITE_DAILY)), '1 token ≈ 0.6 汉字'],
            ['等效中等书目', `~${tokensToBooks(BASELINE_DAILY)} 本/日`, `~${tokensToBooks(ELITE_DAILY)} 本/日`, '1 本 ≈ 25 万 tokens'],
            ['交互次数（3000 t/次）', fmtCN(baselineInteractions), fmtCN(eliteInteractions), '含上下文 + 历史'],
            ['月总量（×30）', fmtCN(BASELINE_DAILY * 30), fmtCN(ELITE_DAILY * 30), '月度预算锚点'],
          ]}
        />
      </Section>

      {/* 3. 场景占比 */}
      <Section
        id="scenarios"
        title="3) 场景画像：token 主要花在哪"
        judgment="开发者画像里 75% 是「代码 + IDE 上下文」，研究者画像里 70% 是「读 + 写」——画像决定了优化抓手在哪。开发者最大的杠杆是缩短 IDE 上下文，研究者最大的杠杆是模板化起稿。"
      >
        <p className="text-sm leading-7 text-[#5e5548] dark:text-gray-300">
          下方占比是从公开讨论和自身样本归纳的「典型口径」，不是行业统计。切换画像看哪个更接近你。
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
        title="4) 月度花费：按真实公开 API 价折算"
        judgment="日均 1000 万 在主力档大约 $5400/月（≈ 4 万元），可控但绝非零成本；日均 4.5 亿 在主力档要 $24 万/月——这个量级谁付？要么是企业账，要么背后必须有清晰的产品收入对账。"
      >
        <p className="text-sm leading-7 text-[#5e5548] dark:text-gray-300">
          单价用 OpenAI / Anthropic / Google 2024-Q4 已知公开 API 价格作锚点。具体模型名仅用于定位档位，价格周期约 12-18 个月腰斩，使用前请校对。
        </p>
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#eadfcd] bg-[#fffdf9] p-3 dark:border-gray-800 dark:bg-gray-900">
          <label htmlFor="profile" className="text-sm text-[#5e5548] dark:text-gray-300">
            输入/输出比例
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
          <span className="text-xs text-[#8f826c] dark:text-gray-400">输出比例越高，单价越贵</span>
        </div>

        <div className="rounded-xl border border-[#eee3d2] bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
          <CostColumnChart pricing={pricing} profile={profile} />
        </div>

        <Table
          headers={[
            '档位',
            '代表模型',
            '输入/输出（$/M）',
            '混合单价（$/M）',
            '1000 万/日 月费',
            '4.5 亿/日 月费',
          ]}
          rows={pricing.map((p) => [
            p.tier,
            p.representative,
            `${p.input} / ${p.output}`,
            p.blended.toFixed(2),
            `${fmtUsd(estimateUsd(BASELINE_DAILY * 30, p.blended))} ≈ ${fmtCny(estimateUsd(BASELINE_DAILY * 30, p.blended) * USD_TO_CNY)}`,
            `${fmtUsd(estimateUsd(ELITE_DAILY * 30, p.blended))} ≈ ${fmtCny(estimateUsd(ELITE_DAILY * 30, p.blended) * USD_TO_CNY)}`,
          ])}
        />
      </Section>

      {/* 5. 效率定位 */}
      <Section
        id="efficiency"
        title="5) 效率定位：token 多 ≠ 生产力高"
        judgment="量上去之后真正的指标不是「跑了多少 token」，而是「每百万 token 沉淀了多少可交付物」。判断自己有没有掉进高 token 低产出陷阱，看三个信号："
      >
        <Table
          headers={['信号', '健康', '掉进浪费陷阱的迹象']}
          rows={[
            ['会话留存', '能引用、能复用、被归档', '一次性扔掉、没人回看'],
            ['输出收口', '有人验收、能进生产', '生成完没人看 / 直接堆磁盘'],
            ['迭代次数', '收敛到结果（≤ 5 轮）', '反复试错（> 10 轮还没拿到目标）'],
            ['上下文密度', '指令明确、检索精准', '塞海量文档「让 AI 自己找」'],
            ['模型分层', '简单任务用小模型', '一律旗舰、爽就完事'],
          ]}
        />
      </Section>

      {/* 6. 优化抓手 */}
      <Section
        id="optimization"
        title="6) 优化抓手：按 ROI 排序"
        judgment="对绝大多数中重度个人，前两条就能砍掉 30-50% 的成本；不需要立刻上 agent。"
      >
        <Table
          headers={['抓手', '预期降本幅度', '落地难度', '说明']}
          rows={[
            ['启用 prompt caching', '20-40%', '低', 'Anthropic / OpenAI 都支持，长系统提示和稳定前文必开'],
            ['模型路由分层', '20-50%', '中', '简单任务用经济档，深度推理才上旗舰'],
            ['限制输出长度', '5-15%', '低', 'max_tokens + 「不要解释、只给答案」的指令'],
            ['压缩 IDE 上下文', '10-30%', '中', '只塞相关文件、用 .cursorignore / .codexignore 排除大目录'],
            ['Agent 步数上限', '不直接降本但防失控', '低', '加上限 + 人工 checkpoint，防止跑飞'],
            ['批处理 + 异步', '间接降本', '高', '把可延迟的任务积到 batch API（半价）'],
          ]}
        />
      </Section>

      {/* 7. 快照模板 */}
      <Section
        id="snapshot"
        title="7) 月度快照（持续累积、只增不删）"
        judgment="模板留三列就够：「日均 tokens、主用模型、本月最大优化点」。强迫自己每月写一行，半年回看就能看出强度爬升曲线和优化效果。"
      >
        <Table
          headers={['月份', '日均 tokens（估）', '主用模型', '本月最大优化点', '档位']}
          rows={[
            ['2026-05', '示例：800 万', 'Claude Code（Opus 4.7） / Cursor', '开启 prompt cache，输入费降 30%', '中重度'],
            ['填新行', '——', '——', '——', '——'],
          ]}
        />
      </Section>

      {/* 8. 来源 */}
      <section className="rounded-xl border border-[#eadfcd] bg-[#fffdf9] p-4 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-2 text-lg font-semibold text-[#2b2419] dark:text-gray-100">来源与校准入口</h2>
        <ul className="space-y-1 text-sm text-[#51493d] dark:text-gray-300">
          <li>
            · <a href="https://openai.com/api/pricing/" target="_blank" rel="noreferrer" className="underline">OpenAI API Pricing</a>
          </li>
          <li>
            · <a href="https://docs.anthropic.com/en/docs/about-claude/pricing" target="_blank" rel="noreferrer" className="underline">Anthropic API Pricing</a>
          </li>
          <li>
            · <a href="https://ai.google.dev/gemini-api/docs/pricing" target="_blank" rel="noreferrer" className="underline">Gemini API Pricing</a>
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
