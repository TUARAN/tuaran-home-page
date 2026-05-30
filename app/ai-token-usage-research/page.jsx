import Link from 'next/link'

export const dynamic = 'force-static'

export const metadata = {
  title: 'AI Token 用量与花费强度调研',
  description:
    '基于日耗 1000 万与 4.5 亿 tokens 的样本，给出强度分级、效率评估、预估花费与未来趋势，适用于个人与团队的 AI 使用治理。',
  alternates: {
    canonical: '/ai-token-usage-research',
  },
}

const DAILY_TOKENS = {
  baseline: 10_000_000,
  elite: 450_000_000,
}

const ASSUMPTIONS = [
  { key: 'conservative', label: '保守（输入 80% / 输出 20%）', usdPer1M: 5 },
  { key: 'baseline', label: '基线（输入 70% / 输出 30%）', usdPer1M: 6 },
  { key: 'outputHeavy', label: '输出重（输入 50% / 输出 50%）', usdPer1M: 9 },
]

function formatNumber(value) {
  return value.toLocaleString('zh-CN')
}

function estimateUsd(tokens, usdPer1M) {
  return (tokens / 1_000_000) * usdPer1M
}

function formatUsd(value) {
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

export default function AiTokenUsageResearchPage() {
  const baselineInteractions = Math.round(DAILY_TOKENS.baseline / 3000)
  const eliteInteractions = Math.round(DAILY_TOKENS.elite / 3000)

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10">
      <header className="mb-8 space-y-3">
        <p className="text-xs tracking-wide text-[#8c8376] dark:text-gray-500">专题 · AI 调研</p>
        <h1 className="text-3xl font-semibold text-[#222] dark:text-gray-100">AI Token 用量与花费强度调研</h1>
        <p className="text-sm leading-7 text-[#5e5548] dark:text-gray-300">
          这份专题为非 Markdown 页面，聚合了“日耗 1000 万 / 4.5 亿 tokens”的强度分级、场景评估与通用花费测算口径。
        </p>
      </header>

      <section className="mb-8 rounded-xl border border-[#eadfcd] bg-[#fffdf9] p-4 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-3 text-lg font-semibold text-[#2b2419] dark:text-gray-100">快照结论</h2>
        <ul className="space-y-2 text-sm leading-7 text-[#51493d] dark:text-gray-300">
          <li>• 每天 1000 万 tokens：个人中重度，接近全职 AI 辅助开发/研究工作流。</li>
          <li>• 每天 4.5 亿 tokens：顶级重度，通常是多 Agent 或自动化流程主导。</li>
          <li>• 按每次 3000 tokens 估算：分别约 3,333 次/日 与 150,000 次/日有效交互。</li>
        </ul>
      </section>

      <section className="mb-8 overflow-hidden rounded-xl border border-[#eee3d2] dark:border-gray-800">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-[#faf5eb] text-[#4b4336] dark:bg-gray-900 dark:text-gray-200">
            <tr>
              <th className="px-3 py-2 text-left font-medium">指标</th>
              <th className="px-3 py-2 text-right font-medium">1000 万/日</th>
              <th className="px-3 py-2 text-right font-medium">4.5 亿/日</th>
            </tr>
          </thead>
          <tbody className="bg-white text-[#3f382f] dark:bg-gray-950 dark:text-gray-300">
            <tr className="border-t border-[#f1e9db] dark:border-gray-800">
              <td className="px-3 py-2">日总 tokens</td>
              <td className="px-3 py-2 text-right">{formatNumber(DAILY_TOKENS.baseline)}</td>
              <td className="px-3 py-2 text-right">{formatNumber(DAILY_TOKENS.elite)}</td>
            </tr>
            <tr className="border-t border-[#f1e9db] dark:border-gray-800">
              <td className="px-3 py-2">等效交互数（3000 tokens/次）</td>
              <td className="px-3 py-2 text-right">{formatNumber(baselineInteractions)}</td>
              <td className="px-3 py-2 text-right">{formatNumber(eliteInteractions)}</td>
            </tr>
            <tr className="border-t border-[#f1e9db] dark:border-gray-800">
              <td className="px-3 py-2">30 天累计 tokens</td>
              <td className="px-3 py-2 text-right">{formatNumber(DAILY_TOKENS.baseline * 30)}</td>
              <td className="px-3 py-2 text-right">{formatNumber(DAILY_TOKENS.elite * 30)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-[#2b2419] dark:text-gray-100">通用花费口径（官方价折算）</h2>
        <p className="mb-3 text-sm leading-7 text-[#5e5548] dark:text-gray-300">
          口径参考 OpenAI / Anthropic / Gemini 官方定价页，按输入/输出占比做综合折算。实际账单会受缓存、批处理、长上下文、推理模式影响。
        </p>
        <div className="overflow-hidden rounded-xl border border-[#eee3d2] dark:border-gray-800">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-[#faf5eb] text-[#4b4336] dark:bg-gray-900 dark:text-gray-200">
              <tr>
                <th className="px-3 py-2 text-left font-medium">预算口径</th>
                <th className="px-3 py-2 text-right font-medium">1000 万/日</th>
                <th className="px-3 py-2 text-right font-medium">4.5 亿/日</th>
                <th className="px-3 py-2 text-right font-medium">1000 万/月（30天）</th>
              </tr>
            </thead>
            <tbody className="bg-white text-[#3f382f] dark:bg-gray-950 dark:text-gray-300">
              {ASSUMPTIONS.map((a) => (
                <tr key={a.key} className="border-t border-[#f1e9db] dark:border-gray-800">
                  <td className="px-3 py-2">{a.label}</td>
                  <td className="px-3 py-2 text-right">{formatUsd(estimateUsd(DAILY_TOKENS.baseline, a.usdPer1M))}</td>
                  <td className="px-3 py-2 text-right">{formatUsd(estimateUsd(DAILY_TOKENS.elite, a.usdPer1M))}</td>
                  <td className="px-3 py-2 text-right">
                    {formatUsd(estimateUsd(DAILY_TOKENS.baseline * 30, a.usdPer1M))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-[#eadfcd] bg-[#fffdf9] p-4 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-2 text-lg font-semibold text-[#2b2419] dark:text-gray-100">使用建议</h2>
        <ul className="space-y-2 text-sm leading-7 text-[#51493d] dark:text-gray-300">
          <li>• 建立每日预算护栏：按场景做软/硬阈值与告警。</li>
          <li>• 建立 ROI 指标：跟踪“每百万 tokens 可交付产出”。</li>
          <li>• 做模型分层路由：复杂任务用主力/高性能，常规任务走经济档。</li>
          <li>• 限制自动化循环深度：避免无效链路导致 token 爆炸。</li>
        </ul>

        <div className="mt-4">
          <Link
            href="/articles?tab=special&special_type=ai"
            className="text-sm text-[#6d5633] underline decoration-[#d3b889] underline-offset-2 dark:text-[#cbb38c]"
          >
            返回专题列表（AI 调研）
          </Link>
        </div>
      </section>
    </main>
  )
}
