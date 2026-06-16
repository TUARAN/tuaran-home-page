'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import DistributeMarkdownButton from '../articles/research/[category]/[slug]/DistributeMarkdownButton'
import SharePageButton from '../components/SharePageButton'

const SHARE_URL = 'https://2aran.com/ai-token-usage-research'

// 分发用：纯 markdown 版本（同步到 syncblog.cn）。不会在站点上直接渲染，仅供 DistributeMarkdownButton 携带。
const DISTRIBUTE_MARKDOWN = `# AI Token 用量与花费强度调研

> 围绕 10B-20B tokens/day 这种极端自报样本回答四件事：这种说法可信到什么程度、对方可能在跑什么、它为什么确实反映一部分 vibe coding 能力、以及什么情况下只是 token 空转。

口径：账单 tokens（含 cache-read） · 单位统一用 B / M，不使用中文大数单位 · 定价锚点：2026-Q2 三家头部厂商公开 API 价 · 价格周期：每 12-18 个月约腰斩，使用前请校对。

## 0. 先把口径讲清楚：账单 tokens ≠ 净处理 tokens

2024 年起，Anthropic / OpenAI / Google 都已把 prompt caching 列为头等公民。对反复使用的长前缀（系统提示、仓库结构、文档），第二次起通常按更低的 cache-read 价格收费。因此同一笔 "10B tokens/day" 在不同口径下含义完全不同：

| 口径 | 含义 | 是否含 cache-read | 用途 |
| --- | --- | --- | --- |
| 账单 tokens | 厂商按账单计费的总 token 数 | 含 | 判断"花了多少钱、跑了多大流量" |
| 净处理 tokens | fresh-input + output，模型真正"新读 + 新写"的量 | 不含 | 判断"实际吸收 / 产出多少信息" |
| unique 内容 tokens | 去重后的实际文本量（同一文件多次注入算一份） | 不含 | 判断"信息密度 / 噪声比" |

**判断**：一旦区分这两本账，多数"骇人听闻的 token 数字"会还原成两类问题：他是真的让 agent 处理了大量新信息，还是把同一批上下文反复送进模型。前者更像能力，后者更像系统形态或浪费。

## 1. 强度尺：账单口径下的 6 档对数刻度

token 区间跨 5 个数量级，横轴用对数刻度。

| 档位 | 账单 tokens / 日 | 画像 |
| --- | --- | --- |
| 轻度 | < 0.001B/day | 偶尔问问题、查资料 |
| 入门 | 0.001B-0.01B/day | AI 当辅助，主要还是自己写 |
| 中度 | 0.01B-0.1B/day | 深度嵌入工作流，每天大段对话 |
| 重度 | 0.1B-0.5B/day | IDE Agent 长会话 + 多窗口并行 |
| 极重度 | 0.5B-2B/day | 多 agent 协作、跨仓库检索、整日不离手 |
| **自动化跑批** | **> 2B/day** | **后台 agent / 评测管线 / 仓库自动化主导跑量** |

两个高位锚点：

- **10B/day** — 个人自报若属实，基本不再是"多聊 AI"，而是高并发 agent、长上下文 IDE、自动评测或批处理。
- **20B/day** — 与 OpenClaw 公开披露的平均日用量同档。OpenClaw 30 天约 603B tokens、7.6M requests、约 100 个 Codex agents，折算约 20.1B/day。

**判断**：10B-20B/day 已经不是普通个人聊天或单窗口 coding 的量级。可信解释通常只有三种：多 agent 并发、自动化任务流、或者计入口径包含大量 cache-read / 失败重试 / 空转循环。

## 2. 可信度校验：先问他到底报的是什么

看到别人说 "I used 10B tokens today"，先不要急着惊讶，按这张表拆：

| 问题 | 健康答案 | 可疑答案 |
| --- | --- | --- |
| token 来源 | API dashboard / vendor usage / proxy log | 只看产品 UI 的"额度消耗"或道听途说 |
| 口径 | input / output / cache-read 分开 | 只说总数，不知道是否含缓存 |
| 并发 | 有 agent 数、任务数、请求数 | 只有一个聊天窗口，却报 10B/day |
| 产出 | PR、测试、issue、报告、数据集可对账 | 只有"我很努力 vibe 了" |
| 时间线 | 能解释当天跑了什么批任务 | 无法说清楚具体行为 |

**判断**：10B/day 不是不能发生，但它需要系统解释。没有并发、没有自动化、没有可交付物、没有日志拆分，就更像口径误读或夸张表达。

## 3. 行为画像：10B/day 的人到底可能在做什么

### 高可信画像：agent 工厂

| 用途 | 占比 |
| --- | --- |
| 多个 coding agents 并发读仓库、开 PR、修测试 | 35% |
| 自动 review / 安全扫描 / issue 去重 | 20% |
| benchmark、回归测试、失败重试 | 20% |
| 长上下文仓库缓存读取 | 15% |
| 人工交互、调度、总结 | 10% |

### 中可信画像：超级重度 IDE Agent 用户

| 用途 | 占比 |
| --- | --- |
| 长会话跨文件重构 | 30% |
| 反复注入仓库上下文和测试日志 | 30% |
| 多窗口并行探索方案 | 20% |
| 文档、调研、写作辅助 | 10% |
| 失败重试与上下文污染 | 10% |

**判断**：如果 10B/day 是真的，他大概率不是"手速快"，而是会组织 AI 系统：会拆任务、开并发、让 agent 读仓库、跑测试、回收结果。这确实是一种 vibe coding 能力。

## 4. 换算尺：10B / 20B tokens/day 对应多大体量

以 IDE Agent 画像（cache-read 85% / fresh-input 10% / output 5%）换算：

| 指标 | 10B/day | 20B/day | 解释 |
| --- | --- | --- | --- |
| 账单 tokens | 10B | 20B | 含 cache-read |
| 净处理 tokens | 1.5B | 3B | fresh-input + output |
| 等效中文字数（净） | ~0.9B | ~1.8B | 1 token ≈ 0.6 汉字 |
| 等效中等书目（净） | ~6000 本/day | ~12000 本/day | 1 本 ≈ 0.25M tokens |
| 交互次数（80K t / 次） | 125000 | 250000 | 更接近 agent 请求而非人工聊天 |
| 月账单总量（× 30） | 300B | 600B | 月度预算锚点 |

**判断**：即便 85% 都是 cache-read，10B/day 仍然意味着约 1.5B/day 的新读写。这个量已经不适合用"我问了多少问题"理解，而要用"我调度了多少自动化任务"理解。

## 5. 月度花费：cache-aware 定价折算

三段定价：**cache-read**（命中复用，最便宜）/ **fresh-input**（新增上下文，标准输入价）/ **output**（生成，最贵）。按 Anthropic 公开比例：cache-read 取 input × 10%；OpenAI / Gemini 比例更高（25–50%），同口径会更贵但不改变量级判断。

**IDE Agent 画像（cache 85% / input 10% / output 5%）：**

| 档位 | 代表模型 | cache / input / output（$/M） | 混合单价（$/M） | 10B/day 月费 | 20B/day 月费 |
| --- | --- | --- | --- | --- | --- |
| 经济档 | Haiku 4.5 / GPT-mini / Gemini Flash | 0.08 / 0.8 / 4.0 | 0.35 | $105000 ≈ ¥756000 | $210000 ≈ ¥1512000 |
| 主力档 | Sonnet 4.6 / GPT-4o / Gemini Pro | 0.3 / 3.0 / 15.0 | 1.31 | $391500 ≈ ¥2818800 | $783000 ≈ ¥5637600 |
| 旗舰档 | Opus 4.7 / o1 / Gemini Ultra | 1.5 / 15.0 / 75.0 | 6.53 | $1957500 ≈ ¥14094000 | $3915000 ≈ ¥28188000 |

**判断**：按 API 真实付费，10B-20B/day 已经是公司级账单。若个人声称长期如此，但实际只付 $100-$400/月订阅，那他说的更可能是产品内部额度、缓存折算或平台吸收后的"使用量"，不是他自己按 API 单价结算的成本。

## 6. 市场口径：按 token 计费 vs 订阅制

2025 年起头部 IDE Agent 类产品大多提供高位订阅档，月费 $100-$400 级别，对个人重度用户取消了"用得越多花得越多"的弹性账单。多数公开自报 "X B tokens/day" 的样本，其真实支出可能落在这一档，而不是按上节表格的 metered 价格付费。

| 计费口径 | 典型档位 | 对个人重度的实际支出 | 何时仍按 metered 算账 |
| --- | --- | --- | --- |
| 按量（metered API） | API key 直连 | 由 token 量与画像决定，见第 4 节 | 需要审计、自定义路由、批处理、企业部署 |
| 订阅（flat-rate） | Max / Pro / Ultra 级别 | 月费 $100–$400 锁死 | 触发硬性速率限制、需要更高并发或 SLA |
| 企业池（席位 + 池子） | 团队 / 组织计划 | 按席位 + 用量阶梯 | 部门级集中采购 |

**判断**：10B/day 如果按 API 账单是大钱；如果按订阅产品口径，可能只是平台内部消耗或额度折算。引用这种数字时一定要先问"是 API 账单，还是订阅产品的使用量"。

## 7. vibe 能力：token 多为什么仍然有意义

| 信号 | 说明 | 为什么能反映 vibe 能力 |
| --- | --- | --- |
| 任务拆分 | 能把一个目标拆成多个 agent 可执行子任务 | 会调度模型，而不是只会聊天 |
| 上下文组织 | 能让模型持续拿到相关文件、日志、约束 | 长上下文使用质量决定结果上限 |
| 快速验收 | 能读 diff、跑测试、筛掉坏结果 | token 只有经过验收才变成生产力 |
| 并发管理 | 能让多个 agent 同时探索不同路径 | 高 token 才可能转化为高吞吐 |
| 复盘沉淀 | 能把会话、PR、经验写入记忆或规范 | 下一轮 token 效率会提高 |

**判断**：token 用量不等于能力，但在 agent 时代，持续高质量消耗 token 往往说明一个人已经把 AI 当成执行层，而不只是问答工具。

## 8. 浪费信号：什么时候 10B/day 只是空转

| 信号 | 健康 | 空转迹象 |
| --- | --- | --- |
| 会话留存 | 能引用、能复用、被归档 | 一次性扔掉、没人回看 |
| 输出收口 | 有人验收、能进生产 | 生成完没人看 / 直接堆磁盘 |
| 迭代次数 | 收敛到结果（≤ 5 轮） | 反复试错（> 10 轮还没拿到目标） |
| 上下文密度 | 指令明确、检索精准 | 塞海量文档"让 AI 自己找" |
| 模型分层 | 简单任务用小模型 | 一律旗舰、爽就完事 |

**判断**：判断一个 10B/day 用户强不强，不看 token 本身，看单位 token 产出：每 1B tokens 带来多少 merged PR、可用报告、自动化脚本、决策结论或可复用知识。

## 9. 月度快照模板

模板留五列就够：账单 tokens、净处理（估）、主用模型、计费口径、本月最大优化点。每月写一行，半年回看就能看出强度爬升曲线与优化效果。

| 月份 | 日均账单 tokens | 日均净处理（估） | 主用模型 / 工具 | 计费口径 | 本月最大优化点 |
| --- | --- | --- | --- | --- | --- |
| 示例行 | ~10B | ~1.5B | 主力档 IDE Agent + agent runner | 订阅 / 平台池 | 收紧上下文、限制失败重试、记录可交付物 |

## 来源与校准入口

- [Tom's Hardware: OpenClaw 30 天约 603B tokens / $1.3M API bill](https://www.tomshardware.com/tech-industry/artificial-intelligence/openclaw-creator-burns-through-1-3-million-in-openai-api-tokens-in-a-single-month)
- [OpenAI API Pricing（含 cached input 折扣比例）](https://openai.com/api/pricing/)
- [Anthropic API Pricing（cache-read / cache-write 公开报价）](https://docs.anthropic.com/en/docs/about-claude/pricing)
- [Anthropic Prompt Caching 文档](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)
- [OpenAI Prompt Caching 文档](https://platform.openai.com/docs/guides/prompt-caching)
- [Gemini API Pricing（含 context caching）](https://ai.google.dev/gemini-api/docs/pricing)
- [DeepSeek Pricing](https://api-docs.deepseek.com/quick_start/pricing)
`

const DISTRIBUTE_TAGS = ['AI', 'Token 用量', 'Prompt Cache', '花费测算', '订阅 vs 按量']

// ============================================================
// 数据基础
// ============================================================

// 两个高位锚点样本（口径：账单 tokens，含 prompt cache 命中的 cache-read）
// - 10B/day：极端个人自报样本，用来做可信度与行为反推
// - 20B/day：接近 OpenClaw 公开披露的 603B / 30 天平均量级
const PERSONAL_DAILY = 10_000_000_000
const REPORTED_DAILY = 20_000_000_000
const OPENCLAW_MONTHLY = 603_000_000_000
const OPENCLAW_REQUESTS = 7_600_000
const OPENCLAW_AGENTS = 100

// 一次 agent 请求的常见上下文规模（含 system + 对话历史 + 检索 + 文件片段）
const TOKENS_PER_INTERACTION = 80_000

// 强度分级（账单口径，含缓存命中）——经验阈值，不是行业标准
const INTENSITY_TIERS = [
  { name: '轻度', min: 0, max: 1_000_000, color: '#cbd5e1', desc: '偶尔问问题、查资料' },
  { name: '入门', min: 1_000_000, max: 10_000_000, color: '#a3b8d8', desc: 'AI 当辅助，主要还是自己写' },
  { name: '中度', min: 10_000_000, max: 100_000_000, color: '#7ba0d1', desc: '深度嵌入工作流，每天大段对话' },
  { name: '重度', min: 100_000_000, max: 500_000_000, color: '#6f6c50', desc: 'IDE Agent 长会话 + 多窗口并行（含高缓存命中）' },
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
    label: '高可信画像：agent 工厂',
    rows: [
      { name: '多 agent 并发读仓库、开 PR、修测试', share: 35 },
      { name: '自动 review / 安全扫描 / issue 去重', share: 20 },
      { name: 'benchmark、回归测试、失败重试', share: 20 },
      { name: '长上下文仓库缓存读取', share: 15 },
      { name: '人工交互、调度、总结', share: 10 },
    ],
  },
  researcher: {
    label: '中可信画像：超级重度 IDE Agent 用户',
    rows: [
      { name: '长会话跨文件重构', share: 30 },
      { name: '反复注入仓库上下文和测试日志', share: 30 },
      { name: '多窗口并行探索方案', share: 20 },
      { name: '文档、调研、写作辅助', share: 10 },
      { name: '失败重试与上下文污染', share: 10 },
    ],
  },
}

// ============================================================
// 格式化工具
// ============================================================

const fmtCN = (v) => v.toLocaleString('zh-CN')
const fmtUsd = (v) => `$${v.toLocaleString('en-US', { maximumFractionDigits: v < 10 ? 2 : 0 })}`
const fmtCny = (v) => `¥${v.toLocaleString('zh-CN', { maximumFractionDigits: v < 10 ? 1 : 0 })}`

function fmtTokenScale(v) {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toLocaleString('en-US', { maximumFractionDigits: 2 })}B`
  if (v >= 1_000_000) return `${(v / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 1 })}M`
  if (v >= 1_000) return `${(v / 1_000).toLocaleString('en-US', { maximumFractionDigits: 1 })}K`
  return v.toLocaleString('en-US')
}

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

// 等价书目：1 本中等长度书 ≈ 0.25M tokens
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
            <div className="w-20 shrink-0 text-right text-[#505048] dark:text-gray-300">{tier.name}</div>
            <div className="relative h-5 flex-1 rounded bg-[#e9eae2] dark:bg-gray-800">
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
                    title={`${m.label}: ${fmtTokenScale(m.value)} tokens/day`}
                  />
                )
              })}
            </div>
            <div className="hidden w-56 shrink-0 text-[10px] text-[#7e7e76] dark:text-gray-400 sm:block">{tier.desc}</div>
          </div>
        )
      })}
      <div className="ml-[5.75rem] mt-3 flex justify-between text-[10px] text-[#7e7e76] dark:text-gray-500">
        <span>10⁵</span>
        <span>10⁶</span>
        <span>10⁷</span>
        <span>10⁸</span>
        <span>10⁹</span>
        <span>10¹⁰</span>
      </div>
      <div className="ml-[5.75rem] flex flex-wrap gap-4 pt-1 text-[11px] text-[#505048] dark:text-gray-400">
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
          <div className="w-60 shrink-0 truncate text-[#505048] dark:text-gray-300">{r.name}</div>
          <div className="relative h-5 flex-1 overflow-hidden rounded bg-[#e9eae2] dark:bg-gray-800">
            <div
              className="h-full rounded bg-[#6f6c50] transition-all"
              style={{ width: `${r.share}%` }}
            />
          </div>
          <div className="w-10 shrink-0 text-right tabular-nums text-[#505048] dark:text-gray-300">{r.share}%</div>
        </div>
      ))}
    </div>
  )
}

/** 分组柱状：3 档定价 × 2 样本（10B / 20B） */
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
                <div className="text-[10px] tabular-nums text-[#505048] dark:text-gray-300">
                  {fmtUsd(d.monthlyPersonal)}
                </div>
                <div
                  className="w-full rounded-t bg-[#7ba0d1]"
                  style={{ height: `${(d.monthlyPersonal / max) * h}px`, minHeight: '2px' }}
                  title={`10B/day · ${d.tier}: ${fmtUsd(d.monthlyPersonal)} / month`}
                />
              </div>
              <div className="flex w-1/2 flex-col items-center justify-end gap-1">
                <div className="text-[10px] tabular-nums text-[#505048] dark:text-gray-300">
                  {fmtUsd(d.monthlyReported)}
                </div>
                <div
                  className="w-full rounded-t bg-[#8d5a2c]"
                  style={{ height: `${(d.monthlyReported / max) * h}px`, minHeight: '2px' }}
                  title={`20B/day · ${d.tier}: ${fmtUsd(d.monthlyReported)} / month`}
                />
              </div>
            </div>
            <div className="text-xs font-medium text-[#35352f] dark:text-gray-200">{d.tier}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-center gap-6 text-[11px] text-[#505048] dark:text-gray-400">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-[#7ba0d1]" />
          10B tokens/day monthly cost
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-[#8d5a2c]" />
          20B tokens/day monthly cost
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
    <div className="overflow-x-auto rounded-xl border border-[#dcddd2] dark:border-gray-800">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-[#f0f2eb] text-[#3d3e36] dark:bg-gray-900 dark:text-gray-200">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className={`px-3 ${dense ? 'py-1.5' : 'py-2'} text-left font-medium`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white text-[#35352f] dark:bg-gray-950 dark:text-gray-300">
          {rows.map((row, idx) => (
            <tr key={idx} className="border-t border-[#e3e4db] dark:border-gray-800">
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
      <h2 className="text-lg font-semibold text-[#1f2019] dark:text-gray-100">{title}</h2>
      {children}
      {judgment ? (
        <p className="mt-2 border-l-2 border-[#6f6c50] bg-[#f3f4ee] px-4 py-2 text-sm leading-7 text-[#3d3e36] dark:border-[#6f6c50] dark:bg-gray-900 dark:text-gray-300">
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
  const openclawDaily = OPENCLAW_MONTHLY / 30
  const openclawTokensPerRequest = Math.round(OPENCLAW_MONTHLY / OPENCLAW_REQUESTS)

  return (
    <main className="mx-auto w-full max-w-[1120px] space-y-10 px-4 py-10">
      <header className="space-y-3 border-b border-[#d7d9cd] pb-6 dark:border-gray-800">
        <div className="flex items-start justify-between gap-4">
          <p className="text-xs tracking-wide text-[#7e7e76] dark:text-gray-500">专题调研 · AI 调研</p>
          <div className="flex shrink-0 items-center gap-2">
            <DistributeMarkdownButton
              title="AI Token 用量与花费强度调研"
              summary="围绕 10B-20B tokens/day 的极端自报样本，拆解可信度校验、行为画像、OpenClaw 公开对照、账单 vs 净处理、vibe coding 能力信号与浪费信号。"
              markdown={DISTRIBUTE_MARKDOWN}
              url={SHARE_URL}
              category="ai"
              slug="ai-token-usage-research"
              tags={DISTRIBUTE_TAGS}
            />
            <SharePageButton
              title="AI Token 用量与花费强度调研"
              text="10B-20B tokens/day 是否可信？看口径、并发、产出、OpenClaw 对照、vibe coding 能力信号与浪费信号。"
              url="/ai-token-usage-research"
            />
          </div>
        </div>
        <h1 className="text-3xl font-semibold text-[#222] dark:text-gray-100">
          AI Token 用量与花费强度调研
        </h1>
        <p className="text-sm leading-7 text-[#505048] dark:text-gray-300">
          围绕 10B-20B tokens/day 这种极端自报样本回答四件事：这种说法可信到什么程度、对方可能在跑什么、它为什么确实反映一部分 vibe coding 能力、以及什么情况下只是 token 空转。
        </p>
        <div className="flex flex-wrap gap-3 text-xs text-[#7e7e76] dark:text-gray-400">
          <span>口径：账单 tokens（含 cache-read）</span>
          <span>·</span>
          <span>单位统一用 B / M</span>
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
        judgment="一旦区分这两本账，多数「骇人听闻的 token 数字」会还原成两类问题：他是真的让 agent 处理了大量新信息，还是把同一批上下文反复送进模型。前者更像能力，后者更像系统形态或浪费。"
      >
        <p className="text-sm leading-7 text-[#505048] dark:text-gray-300">
          2024 年起，Anthropic / OpenAI / Google 都已把 prompt caching 列为头等公民。对反复使用的长前缀（系统提示、仓库结构、文档），第二次起通常按更低的 cache-read 价格收费。因此同一笔 <strong>10B tokens/day</strong> 在不同口径下含义完全不同：
        </p>
        <Table
          headers={['口径', '含义', '是否含 cache-read', '用途']}
          rows={[
            ['账单 tokens', '厂商按账单计费的总 token 数', '含', '判断"花了多少钱、跑了多大流量"'],
            ['净处理 tokens', 'fresh-input + output，模型真正"新读 + 新写"的量', '不含', '判断"实际吸收 / 产出多少信息"'],
            ['unique 内容 tokens', '去重后的实际文本量（同一文件多次注入算一份）', '不含', '判断"信息密度 / 噪声比"'],
          ]}
        />
        <p className="text-xs text-[#7e7e76] dark:text-gray-500">
          后文所有 10B / 20B 均为账单口径；提到「净处理」或「等效阅读量」时会显式换算。
        </p>
      </Section>

      {/* 1. 强度尺 */}
      <Section
        id="intensity"
        title="1) 强度尺：账单口径下的 6 档对数刻度"
        judgment="10B-20B/day 已经不是普通个人聊天或单窗口 coding 的量级。可信解释通常只有三种：多 agent 并发、自动化任务流、或者计入口径包含大量 cache-read / 失败重试 / 空转循环。"
      >
        <p className="text-sm leading-7 text-[#505048] dark:text-gray-300">
          token 区间跨 5 个数量级，横轴用对数刻度。两个钻石标记是本页关注的高位锚点：
        </p>
        <div className="rounded-xl border border-[#dcddd2] bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
          <IntensityChart
            markers={[
              { label: '10B/day 自报样本', value: PERSONAL_DAILY },
              { label: '20B/day OpenClaw 同档', value: REPORTED_DAILY },
            ]}
          />
        </div>
        <p className="text-xs text-[#7e7e76] dark:text-gray-500">
          经验阈值。不同人对「重度」定义差一个量级，仅作粗略锚点。
        </p>
      </Section>

      {/* 2. 可信度校验 */}
      <Section
        id="credibility"
        title="2) 可信度校验：先问他到底报的是什么"
        judgment="10B/day 不是不能发生，但它需要系统解释。没有并发、没有自动化、没有可交付物、没有日志拆分，就更像口径误读或夸张表达。"
      >
        <p className="text-sm leading-7 text-[#505048] dark:text-gray-300">
          看到别人说 “I used 10B tokens today”，先不要急着惊讶，按这张表拆：
        </p>
        <Table
          headers={['问题', '健康答案', '可疑答案']}
          rows={[
            ['token 来源', 'API dashboard / vendor usage / proxy log', '只看产品 UI 的"额度消耗"或道听途说'],
            ['口径', 'input / output / cache-read 分开', '只说总数，不知道是否含缓存'],
            ['并发', '有 agent 数、任务数、请求数', '只有一个聊天窗口，却报 10B/day'],
            ['产出', 'PR、测试、issue、报告、数据集可对账', '只有"我很努力 vibe 了"'],
            ['时间线', '能解释当天跑了什么批任务', '无法说清楚具体行为'],
          ]}
        />
      </Section>

      {/* 3. 场景占比 */}
      <Section
        id="scenarios"
        title="3) 行为画像：10B/day 的人到底可能在做什么"
        judgment="如果 10B/day 是真的，他大概率不是「手速快」，而是会组织 AI 系统：会拆任务、开并发、让 agent 读仓库、跑测试、回收结果。这确实是一种 vibe coding 能力。"
      >
        <p className="text-sm leading-7 text-[#505048] dark:text-gray-300">
          下方占比是从公开讨论和 agent 工作流反推的「典型口径」，不是行业统计。切换画像看哪个更接近实际：
        </p>
        <div className="grid gap-3 rounded-xl border border-[#dcddd2] bg-white p-4 text-sm text-[#3d3e36] dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300 sm:grid-cols-4">
          <div>
            <div className="text-xs text-[#7e7e76] dark:text-gray-500">OpenClaw 公开月量</div>
            <div className="mt-1 font-mono text-lg">{fmtTokenScale(OPENCLAW_MONTHLY)}</div>
          </div>
          <div>
            <div className="text-xs text-[#7e7e76] dark:text-gray-500">折算日均</div>
            <div className="mt-1 font-mono text-lg">{fmtTokenScale(openclawDaily)}/day</div>
          </div>
          <div>
            <div className="text-xs text-[#7e7e76] dark:text-gray-500">请求数</div>
            <div className="mt-1 font-mono text-lg">{fmtTokenScale(OPENCLAW_REQUESTS)}</div>
          </div>
          <div>
            <div className="text-xs text-[#7e7e76] dark:text-gray-500">约合每请求</div>
            <div className="mt-1 font-mono text-lg">{fmtTokenScale(openclawTokensPerRequest)}</div>
          </div>
          <p className="sm:col-span-4 text-xs leading-6 text-[#7e7e76] dark:text-gray-500">
            OpenClaw 是公开报道里的高位参照：约 {OPENCLAW_AGENTS} 个 Codex agents、30 天 {fmtTokenScale(OPENCLAW_MONTHLY)} tokens、{fmtTokenScale(OPENCLAW_REQUESTS)} requests。它说明 20B/day 需要 agent 集群级解释，而不是普通聊天解释。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#d7d9cd] bg-[#fbfcf9] p-3 dark:border-gray-800 dark:bg-gray-900">
          <label htmlFor="scenario" className="text-sm text-[#505048] dark:text-gray-300">
            画像
          </label>
          <select
            id="scenario"
            value={scenarioKey}
            onChange={(e) => setScenarioKey(e.target.value)}
            className="rounded border border-[#c7c9be] bg-white px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-950"
          >
            {Object.entries(TYPICAL_SCENARIOS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
        <div className="rounded-xl border border-[#dcddd2] bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
          <ShareBars rows={scenario.rows} />
        </div>
      </Section>

      {/* 4. 等价换算 */}
      <Section
        id="equivalence"
        title="4) 换算尺：10B / 20B tokens/day 到底对应多大体量"
        judgment="即便 85% 都是 cache-read，10B/day 仍然意味着约 1.5B/day 的新读写。这个量已经不适合用「我问了多少问题」理解，而要用「我调度了多少自动化任务」理解。"
      >
        <p className="text-sm leading-7 text-[#505048] dark:text-gray-300">
          切换下方「使用画像」选择器（默认 IDE Agent 85/10/5），下表的「净处理」与「等效书目」会随画像变化。
        </p>
        <Table
          headers={['指标', '10B/day', '20B/day', '解释']}
          rows={[
            ['账单 tokens', fmtTokenScale(PERSONAL_DAILY), fmtTokenScale(REPORTED_DAILY), '含 cache-read'],
            ['净处理 tokens', fmtTokenScale(Math.round(personalNet)), fmtTokenScale(Math.round(reportedNet)), 'fresh-input + output'],
            ['等效中文字数（净）', fmtTokenScale(tokensToChars(personalNet)), fmtTokenScale(tokensToChars(reportedNet)), '1 token ≈ 0.6 汉字'],
            ['等效中等书目（净）', `~${fmtCN(tokensToBooks(personalNet))} 本/day`, `~${fmtCN(tokensToBooks(reportedNet))} 本/day`, '1 本 ≈ 0.25M tokens'],
            ['agent 请求次数（80K t/次）', fmtCN(personalInteractions), fmtCN(reportedInteractions), '更接近 agent 请求而非人工聊天'],
            ['月账单总量（×30）', fmtTokenScale(PERSONAL_DAILY * 30), fmtTokenScale(REPORTED_DAILY * 30), '月度预算锚点（账单口径）'],
          ]}
        />
      </Section>

      {/* 5. 花费 */}
      <Section
        id="cost"
        title="5) 月度花费：cache-aware 定价折算"
        judgment="按 API 真实付费，10B-20B/day 已经是公司级账单。若个人声称长期如此，但实际只付 $100-$400/month 订阅，那他说的更可能是产品内部额度、缓存折算或平台吸收后的「使用量」，不是他自己按 API 单价结算的成本。"
      >
        <p className="text-sm leading-7 text-[#505048] dark:text-gray-300">
          三段定价：<strong>cache-read</strong>（命中复用，最便宜）/ <strong>fresh-input</strong>（新增上下文，标准输入价）/ <strong>output</strong>（生成，最贵）。下方计算按 Anthropic 公开比例：cache-read 取 input × 10%；OpenAI / Gemini 比例更高（25-50%），同口径会更贵但不改变量级判断。
        </p>
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#d7d9cd] bg-[#fbfcf9] p-3 dark:border-gray-800 dark:bg-gray-900">
          <label htmlFor="profile" className="text-sm text-[#505048] dark:text-gray-300">
            使用画像
          </label>
          <select
            id="profile"
            value={profileKey}
            onChange={(e) => setProfileKey(e.target.value)}
            className="rounded border border-[#c7c9be] bg-white px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-950"
          >
            {PROFILES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <span className="text-xs text-[#787a6c] dark:text-gray-400">缓存命中率越低、输出占比越高，单价越贵</span>
        </div>

        <div className="rounded-xl border border-[#dcddd2] bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
          <CostColumnChart profile={profile} />
        </div>

        <Table
          headers={[
            '档位',
            '代表模型',
            'cache / input / output（$/M）',
            '混合单价（$/M）',
            '10B/day 月费',
            '20B/day 月费',
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

      {/* 6. 订阅口径 */}
      <Section
        id="subscription"
        title="6) 市场口径：按 token 计费 vs 订阅制"
        judgment="10B/day 如果按 API 账单是大钱；如果按订阅产品口径，可能只是平台内部消耗或额度折算。引用这种数字时一定要先问「是 API 账单，还是订阅产品的使用量」。"
      >
        <p className="text-sm leading-7 text-[#505048] dark:text-gray-300">
          2025 年起头部 IDE Agent 类产品大多提供高位订阅档，月费 $100-$400 级别，对个人重度用户取消了「用得越多花得越多」的弹性账单。多数公开自报「X B tokens/day」的样本，其真实支出可能落在这一档，而不是按上节表格的 metered 价格付费。
        </p>
        <Table
          headers={['计费口径', '典型档位', '对个人重度的实际支出', '何时仍按 metered 算账']}
          rows={[
            ['按量（metered API）', 'API key 直连', '由 token 量与画像决定，可见第 5 节', '需要审计、自定义路由、批处理、企业部署'],
            ['订阅（flat-rate）', 'Max / Pro / Ultra 级别', '月费 $100-$400 锁死', '触发硬性速率限制、需要更高并发或 SLA'],
            ['企业池（席位 + 池子）', '团队 / 组织计划', '按席位 + 用量阶梯', '部门级集中采购'],
          ]}
        />
        <p className="text-xs text-[#7e7e76] dark:text-gray-500">
          口径选择本身就是优化抓手：如果使用画像稳定在 IDE Agent + 高缓存命中、不需要外部 API 集成，订阅档通常显著优于按量。
        </p>
      </Section>

      {/* 7. vibe 能力 */}
      <Section
        id="efficiency"
        title="7) vibe 能力：token 多为什么仍然有意义"
        judgment="token 用量不等于能力，但在 agent 时代，持续高质量消耗 token 往往说明一个人已经把 AI 当成执行层，而不只是问答工具。"
      >
        <Table
          headers={['信号', '说明', '为什么能反映 vibe 能力']}
          rows={[
            ['任务拆分', '能把一个目标拆成多个 agent 可执行子任务', '会调度模型，而不是只会聊天'],
            ['上下文组织', '能让模型持续拿到相关文件、日志、约束', '长上下文使用质量决定结果上限'],
            ['快速验收', '能读 diff、跑测试、筛掉坏结果', 'token 只有经过验收才变成生产力'],
            ['并发管理', '能让多个 agent 同时探索不同路径', '高 token 才可能转化为高吞吐'],
            ['复盘沉淀', '能把会话、PR、经验写入记忆或规范', '下一轮 token 效率会提高'],
          ]}
        />
      </Section>

      {/* 8. 浪费信号 */}
      <Section
        id="optimization"
        title="8) 浪费信号：什么时候 10B/day 只是空转"
        judgment="判断一个 10B/day 用户强不强，不看 token 本身，看单位 token 产出：每 1B tokens 带来多少 merged PR、可用报告、自动化脚本、决策结论或可复用知识。"
      >
        <Table
          headers={['信号', '健康', '空转迹象']}
          rows={[
            ['会话留存', '能引用、能复用、被归档', '一次性扔掉、没人回看'],
            ['输出收口', '有人验收、能进生产', '生成完没人看 / 直接堆磁盘'],
            ['迭代次数', '收敛到结果（≤ 5 轮）', '反复试错（> 10 轮还没拿到目标）'],
            ['上下文密度', '指令明确、检索精准', '塞海量文档"让 AI 自己找"'],
            ['模型分层', '简单任务用小模型', '一律旗舰、爽就完事'],
          ]}
        />
      </Section>

      {/* 9. 快照模板 */}
      <Section
        id="snapshot"
        title="9) 月度快照（持续累积、只增不删）"
        judgment="模板留五列就够：账单 tokens、净处理（估）、主用模型、计费口径、本月最大优化点。每月写一行，半年回看就能看出强度爬升曲线与优化效果。"
      >
        <Table
          headers={['月份', '日均账单 tokens', '日均净处理（估）', '主用模型 / 工具', '计费口径', '本月最大优化点']}
          rows={[
            ['示例行', '~10B', '~1.5B', '主力档 IDE Agent + agent runner', '订阅 / 平台池', '收紧上下文、限制失败重试、记录可交付物'],
            ['填新行', '——', '——', '——', '——', '——'],
          ]}
        />
      </Section>

      {/* 9. 来源 */}
      <section className="rounded-xl border border-[#d7d9cd] bg-[#fbfcf9] p-4 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-2 text-lg font-semibold text-[#1f2019] dark:text-gray-100">来源与校准入口</h2>
        <ul className="space-y-1 text-sm text-[#44453d] dark:text-gray-300">
          <li>
            · <a href="https://www.tomshardware.com/tech-industry/artificial-intelligence/openclaw-creator-burns-through-1-3-million-in-openai-api-tokens-in-a-single-month" target="_blank" rel="noreferrer" className="underline">Tom&apos;s Hardware: OpenClaw 30 天约 603B tokens / $1.3M API bill</a>
          </li>
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
          <Link href="/articles?tab=works" className="underline decoration-[#a3a889] underline-offset-2">
            返回多维页面列表
          </Link>
          <Link href="/skill-center/llm-productivity-directives" className="underline decoration-[#a3a889] underline-offset-2">
            相关：大模型增效指令 Skill
          </Link>
        </div>
      </section>
    </main>
  )
}
