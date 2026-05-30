'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

const baselineDailyTokens = 10_000_000
const eliteDailyTokens = 450_000_000
const avgTokensPerInteraction = 3000
const usdToCny = 7.2

const PRICING_PROFILES = [
  { value: 'conservative', label: '保守（输入80%/输出20%）', inputShare: 0.8 },
  { value: 'baseline', label: '基线（输入70%/输出30%）', inputShare: 0.7 },
  { value: 'output-heavy', label: '输出重（输入50%/输出50%）', inputShare: 0.5 },
]

const MODEL_TIERS = {
  economical: { input: 1, output: 5, model: 'GPT-5.4 mini / Gemini 3.5 Flash / Claude Haiku 4.5' },
  professional: { input: 2.75, output: 15, model: 'GPT-5.4 / Claude Sonnet 4.6' },
  flagship: { input: 5, output: 27.5, model: 'GPT-5.5 / Claude Opus 4.7' },
}

function formatNumber(value) {
  return value.toLocaleString('zh-CN')
}

function formatUsd(value) {
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

function formatCny(value) {
  return `¥${value.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}`
}

function blendedRate(inputRate, outputRate, inputShare) {
  return inputRate * inputShare + outputRate * (1 - inputShare)
}

function estimateUsd(tokens, usdPer1M) {
  return (tokens / 1_000_000) * usdPer1M
}

function Table({ headers, rows }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#eee3d2] dark:border-gray-800">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-[#faf5eb] text-[#4b4336] dark:bg-gray-900 dark:text-gray-200">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-3 py-2 text-left font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white text-[#3f382f] dark:bg-gray-950 dark:text-gray-300">
          {rows.map((row, idx) => (
            <tr key={idx} className="border-t border-[#f1e9db] dark:border-gray-800">
              {row.map((cell, cidx) => (
                <td key={cidx} className={`px-3 py-2 ${cidx > 0 ? 'text-right' : ''}`}>
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

export default function AiTokenUsageResearchClient() {
  const [profile, setProfile] = useState('baseline')

  const selectedProfile = PRICING_PROFILES.find((p) => p.value === profile) ?? PRICING_PROFILES[1]
  const baselineInteractions = Math.round(baselineDailyTokens / avgTokensPerInteraction)
  const eliteInteractions = Math.round(eliteDailyTokens / avgTokensPerInteraction)

  const pricing = useMemo(() => {
    const low = blendedRate(MODEL_TIERS.economical.input, MODEL_TIERS.economical.output, selectedProfile.inputShare)
    const mid = blendedRate(MODEL_TIERS.professional.input, MODEL_TIERS.professional.output, selectedProfile.inputShare)
    const high = blendedRate(MODEL_TIERS.flagship.input, MODEL_TIERS.flagship.output, selectedProfile.inputShare)
    return { low, mid, high }
  }, [selectedProfile.inputShare])

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 px-4 py-10">
      <header className="space-y-3">
        <p className="text-xs tracking-wide text-[#8c8376] dark:text-gray-500">专题 · AI 调研</p>
        <h1 className="text-3xl font-semibold text-[#222] dark:text-gray-100">AI Token 用量结构化调研（与 Canvas 同口径）</h1>
        <p className="text-sm leading-7 text-[#5e5548] dark:text-gray-300">
          这页已与 Canvas 保持一致：同样的模块结构、强度分级、场景占比、效率评估、花费估算口径与快照模板。
        </p>
      </header>

      <section className="rounded-xl border border-[#eadfcd] bg-[#fffdf9] p-4 dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm leading-7 text-[#51493d] dark:text-gray-300">
          结论快照：每天 1,000 万 tokens 对个人已是中重度，接近全职 AI 辅助生产流；每天 4.5 亿 tokens 属顶级重度，通常对应自动化/代理链路主导，不再是纯人工会话节奏。
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2b2419] dark:text-gray-100">1) 用量趋势与统计（快照）</h2>
        <Table
          headers={['指标', '1,000 万/日', '4.5 亿/日', '解释']}
          rows={[
            ['日总 tokens', formatNumber(baselineDailyTokens), formatNumber(eliteDailyTokens), '总算力消耗规模'],
            ['按 3000 tokens/次的等效交互', formatNumber(baselineInteractions), formatNumber(eliteInteractions), '含上下文的有效会话轮次估算'],
            ['30 天总量', formatNumber(baselineDailyTokens * 30), formatNumber(eliteDailyTokens * 30), '用于月度预算与产能观察'],
          ]}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2b2419] dark:text-gray-100">2) 场景分类及占比</h2>
        <Table
          headers={['场景', '建议占比', '典型任务', '优化抓手']}
          rows={[
            ['代码开发与调试', '40%', '生成/重构/排错/测试', '缩短上下文、分层模型路由'],
            ['研究分析与写作', '30%', '调研、摘要、报告', '模板化提示词、缓存固定框架'],
            ['文档与知识管理', '15%', '文档生成、翻译、整理', '复用术语库、增量更新'],
            ['自动化脚本与工具调用', '10%', '批处理、Agent链路', '限制循环深度、失败回退'],
            ['沟通协作', '5%', '邮件、纪要、说明', '短上下文+轻量模型'],
          ]}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2b2419] dark:text-gray-100">3) 效率与生产力评估</h2>
        <Table
          headers={['评估维度', '1,000 万/日', '4.5 亿/日', '判断']}
          rows={[
            ['人工可控交互强度', '约 3,333 次/日', '约 150,000 次/日', '前者接近全职高强度，后者通常需 Agent/自动化主导'],
            ['投入产出风险', '高投入但可管理', '极高投入，波动与浪费风险显著', '高 token 不等于高准确率，需质量门禁'],
            ['成本可预测性', '中等（可模板化治理）', '低（波动幅度大）', '建议建立预算护栏与预估机制'],
          ]}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2b2419] dark:text-gray-100">4) 强度定位（分层）</h2>
        <Table
          headers={['层级', '日用量（tokens）', '定位', '典型画像']}
          rows={[
            ['轻度', '< 100 万', '偶发使用', '问答、轻量写作、零散编码'],
            ['中度', '100 万 - 500 万', '稳定使用', '每天多任务并行，AI 成为常用工具'],
            ['中重度', '500 万 - 2000 万', '高效重度依赖', '接近全职 AI 辅助开发/研究流'],
            ['重度', '2000 万 - 1 亿', '超高频生产流', '流程化协作、长上下文和工具链密集'],
            ['顶级重度', '> 1 亿（如 4.5 亿）', '系统级 AI 生产网络', '多 Agent 自动化、企业级节奏'],
          ]}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2b2419] dark:text-gray-100">5) 预估花费（通用单价口径，可切换）</h2>
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#eadfcd] bg-[#fffdf9] p-3 dark:border-gray-800 dark:bg-gray-900">
          <label htmlFor="pricing-profile" className="text-sm text-[#5e5548] dark:text-gray-300">
            口径切换
          </label>
          <select
            id="pricing-profile"
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
            className="rounded border border-[#d9cfbe] bg-white px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-950"
          >
            {PRICING_PROFILES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <span className="text-xs text-[#8f826c] dark:text-gray-400">当前：{selectedProfile.label}</span>
        </div>

        <Table
          headers={['档位', '代表模型（官方价样本）', '综合单价($/百万 total)', '1,000 万/日', '4.5 亿/日', '4.5 亿/月（30天）']}
          rows={[
            [
              '经济档',
              MODEL_TIERS.economical.model,
              pricing.low.toFixed(2),
              `${formatUsd(estimateUsd(baselineDailyTokens, pricing.low))} / ${formatCny(estimateUsd(baselineDailyTokens, pricing.low) * usdToCny)}`,
              `${formatUsd(estimateUsd(eliteDailyTokens, pricing.low))} / ${formatCny(estimateUsd(eliteDailyTokens, pricing.low) * usdToCny)}`,
              `${formatUsd(estimateUsd(eliteDailyTokens * 30, pricing.low))} / ${formatCny(estimateUsd(eliteDailyTokens * 30, pricing.low) * usdToCny)}`,
            ],
            [
              '主力档',
              MODEL_TIERS.professional.model,
              pricing.mid.toFixed(2),
              `${formatUsd(estimateUsd(baselineDailyTokens, pricing.mid))} / ${formatCny(estimateUsd(baselineDailyTokens, pricing.mid) * usdToCny)}`,
              `${formatUsd(estimateUsd(eliteDailyTokens, pricing.mid))} / ${formatCny(estimateUsd(eliteDailyTokens, pricing.mid) * usdToCny)}`,
              `${formatUsd(estimateUsd(eliteDailyTokens * 30, pricing.mid))} / ${formatCny(estimateUsd(eliteDailyTokens * 30, pricing.mid) * usdToCny)}`,
            ],
            [
              '高性能档',
              MODEL_TIERS.flagship.model,
              pricing.high.toFixed(2),
              `${formatUsd(estimateUsd(baselineDailyTokens, pricing.high))} / ${formatCny(estimateUsd(baselineDailyTokens, pricing.high) * usdToCny)}`,
              `${formatUsd(estimateUsd(eliteDailyTokens, pricing.high))} / ${formatCny(estimateUsd(eliteDailyTokens, pricing.high) * usdToCny)}`,
              `${formatUsd(estimateUsd(eliteDailyTokens * 30, pricing.high))} / ${formatCny(estimateUsd(eliteDailyTokens * 30, pricing.high) * usdToCny)}`,
            ],
          ]}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2b2419] dark:text-gray-100">6) 优化建议与预测</h2>
        <Table
          headers={['建议', '预期效果', '落地方式']}
          rows={[
            ['建立每日 token 预算护栏', '降低失控波动', '按场景设置软/硬阈值 + 告警'],
            ['模型路由分层', '降本 20%-50%（任务相关）', '复杂任务高配，常规任务轻量模型'],
            ['压缩重复上下文', '显著减少输入 token', '缓存系统提示、抽取稳定前文'],
            ['设置 Agent 循环上限', '减少无效迭代', '限制最大步骤并加人工确认点'],
            ['建立效率 KPI', '提高 token 产出比', '跟踪每百万 token 的可交付产出'],
          ]}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2b2419] dark:text-gray-100">7) 每日快照模板（用于持续积累对比）</h2>
        <Table
          headers={['日期', '总tokens', '交互数', '平均tokens/次', '预估花费(USD/CNY)', '代码%', '研究%', '文档%', '自动化%', '结论']}
          rows={[
            ['YYYY-MM-DD', '________', '________', '3000（或实测）', '$___ / ¥___', '____', '____', '____', '____', '一句话总结'],
            ['YYYY-MM-DD', '________', '________', '3000（或实测）', '$___ / ¥___', '____', '____', '____', '____', '一句话总结'],
          ]}
        />
      </section>

      <section className="rounded-xl border border-[#eadfcd] bg-[#fffdf9] p-4 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-2 text-lg font-semibold text-[#2b2419] dark:text-gray-100">来源与入口</h2>
        <ul className="space-y-1 text-sm text-[#51493d] dark:text-gray-300">
          <li>
            - <a href="https://openai.com/api/pricing/" target="_blank" rel="noreferrer" className="underline">OpenAI API Pricing</a>
          </li>
          <li>
            - <a href="https://platform.claude.com/docs/en/about-claude/pricing" target="_blank" rel="noreferrer" className="underline">Anthropic Pricing Docs</a>
          </li>
          <li>
            - <a href="https://ai.google.dev/gemini-api/docs/pricing" target="_blank" rel="noreferrer" className="underline">Gemini API Pricing</a>
          </li>
          <li>
            - <a href="https://api-docs.deepseek.com/quick_start/pricing" target="_blank" rel="noreferrer" className="underline">DeepSeek Pricing</a>
          </li>
        </ul>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <Link href="/articles?tab=special&special_type=ai" className="underline decoration-[#d3b889] underline-offset-2">
            返回专题列表（AI 调研）
          </Link>
          <span className="text-[#7b715f] dark:text-gray-400">Canvas 已同步为同口径内容（含可切换花费口径）</span>
        </div>
      </section>
    </main>
  )
}
