import { getRecentSnapshotsByCategory } from '../../../(site)/stock-analysis/data'
import { callDeepSeekJson } from '../../../../lib/deepseek'
import { enrichDeepSeekTask } from '../../../../lib/deepseekTasks'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const CATEGORY_LABELS = {
  lobster: '龙虾币',
}

function compactSnapshot(record) {
  return {
    collectedAt: `${record.date} ${record.time}`,
    pair: record.pair,
    exchange: record.exchange,
    timeframe: record.timeframe,
    price: record.price?.current,
    change24hPct: record.price?.changePct,
    range24hPct: record.range24h?.rangePct,
    volume24hToken: record.volume?.vol24hToken,
    fundingRate: record.funding?.rate,
    fundingAnnualizedPct: record.funding?.annualizedPct,
    ma: record.ma,
    riskSignals: record.riskSignals,
    riskGauge: record.gaugeValue,
    snapshotConclusion: record.analysisSummary,
  }
}

function makePrompt(categoryLabel, snapshots) {
  return `你是加密货币交易数据分析员。请横向对比下面按时间采集的 ${categoryLabel} 快照，识别变化和趋势。

分析规则：
1. 只依据输入数据，不补造行情、成交量或事件；不同交易所、不同周期的数据口径差异必须明确提示。
2. 重点比较价格、24H 涨跌、区间波动、量能、资金费率、均线位置、风险信号与综合风险指数。
3. 区分“数据直接显示的事实”和“基于数据的推断”，避免把少量快照描述成长期趋势。
4. 输出简洁中文，结论必须包含趋势是否改善、恶化或震荡，以及下一步值得观察的确认信号。
5. 不给出买入、卖出、做多、做空指令。

严格输出以下 JSON：
{
  "headline": "一句话总判断",
  "trend": "改善 | 恶化 | 高位震荡 | 低位震荡 | 信号混合",
  "confidence": "高 | 中 | 低",
  "summary": "2-4 句横向总结",
  "metricTrends": [
    {"metric": "指标名", "direction": "上升 | 下降 | 震荡 | 数据不足", "analysis": "变化及含义"}
  ],
  "keyChanges": ["关键变化"],
  "risks": ["风险或数据口径限制"],
  "watchPoints": ["后续确认信号"],
  "disclaimer": "本分析仅基于有限历史快照，不构成投资建议。"
}

快照（数组顺序为从新到旧）：
${JSON.stringify(snapshots.map(compactSnapshot))}`
}

function errorResponse(error) {
  if (error?.code === 'MISSING_DEEPSEEK_API_KEY') {
    return Response.json({ error: '横向分析服务尚未配置 DeepSeek API Key。' }, { status: 503 })
  }
  if (error?.code === 'DEEPSEEK_API_TIMEOUT') {
    return Response.json({ error: 'DeepSeek 分析超时，请稍后重试。' }, { status: 504 })
  }
  if (error?.code === 'DEEPSEEK_API_FAILED') {
    return Response.json({ error: 'DeepSeek 暂时不可用，请稍后重试。' }, { status: 502 })
  }
  return Response.json({ error: '横向分析生成失败，请稍后重试。' }, { status: 500 })
}

function stringValue(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback
}

function stringList(value) {
  return Array.isArray(value)
    ? value.filter((item) => typeof item === 'string').map((item) => item.trim()).filter(Boolean).slice(0, 8)
    : []
}

function normalizeAnalysis(value) {
  const metricTrends = Array.isArray(value?.metricTrends)
    ? value.metricTrends
        .filter((item) => item && typeof item === 'object')
        .map((item) => ({
          metric: stringValue(item.metric, '未命名指标'),
          direction: stringValue(item.direction, '数据不足'),
          analysis: stringValue(item.analysis, '暂无有效分析。'),
        }))
        .slice(0, 8)
    : []

  return {
    headline: stringValue(value?.headline, '近期快照呈现混合信号'),
    trend: stringValue(value?.trend, '信号混合'),
    confidence: stringValue(value?.confidence, '低'),
    summary: stringValue(value?.summary, 'DeepSeek 未返回有效的横向总结。'),
    metricTrends,
    keyChanges: stringList(value?.keyChanges),
    risks: stringList(value?.risks),
    watchPoints: stringList(value?.watchPoints),
    disclaimer: stringValue(value?.disclaimer, '本分析仅基于有限历史快照，不构成投资建议。'),
  }
}

export async function GET(request) {
  const searchParams = new URL(request.url).searchParams
  if (searchParams.size !== 1 || !searchParams.has('category')) {
    return Response.json({ error: '请求参数不合法。' }, { status: 400 })
  }

  const categoryId = searchParams.get('category') || ''
  const categoryLabel = CATEGORY_LABELS[categoryId]
  if (!categoryLabel) {
    return Response.json({ error: '不支持该币种分类。' }, { status: 400 })
  }

  const snapshots = getRecentSnapshotsByCategory(categoryId, 5)
  if (snapshots.length < 2) {
    return Response.json({ error: '至少需要 2 个快照才能进行横向分析。' }, { status: 422 })
  }

  try {
    const { json, model, usage, taskId } = await callDeepSeekJson({
      messages: [
        {
          role: 'system',
          content: '你是严谨的交易快照横向分析员，只输出符合指定结构的 JSON。',
        },
        { role: 'user', content: makePrompt(categoryLabel, snapshots) },
      ],
      temperature: 0.2,
      maxTokens: 1800,
      timeoutMs: 60000,
      task: {
        source: 'stock-analysis',
        taskType: 'horizontal-analysis',
        title: `${categoryLabel}最近快照横向分析`,
        actorId: 'public',
        actorName: '公开页面访客',
        inputSummary: `横向对比 ${snapshots.length} 个快照：${snapshots[snapshots.length - 1].date} 至 ${snapshots[0].date}`,
        metadata: { categoryId, snapshotCount: snapshots.length },
      },
    })

    const analysis = normalizeAnalysis(json)
    await enrichDeepSeekTask(taskId, {
      resultSummary: analysis.headline,
      metadata: {
        categoryId,
        snapshotCount: snapshots.length,
        trend: analysis.trend,
        confidence: analysis.confidence,
      },
    })

    return Response.json(
      {
        ok: true,
        category: { id: categoryId, label: categoryLabel },
        snapshotCount: snapshots.length,
        range: {
          from: `${snapshots.at(-1).date} ${snapshots.at(-1).time}`,
          to: `${snapshots[0].date} ${snapshots[0].time}`,
        },
        generatedAt: new Date().toISOString(),
        model,
        usage,
        taskRecordId: taskId,
        analysis,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
        },
      },
    )
  } catch (error) {
    return errorResponse(error)
  }
}
