import { weightedTextLength } from './xDistribution.js'

export const X_AI_NEWS_MAX_WEIGHT = 280
export const X_AI_NEWS_LAST_RUN_KEY = 'automation.x_ai_news.last_run'

export function normalizeXAiNewsBrief(value) {
  return String(value || '').replace(/\r\n?/g, '\n').trim()
}

export function buildXAiNewsMessages({ brief } = {}) {
  const normalizedBrief = normalizeXAiNewsBrief(brief)
  return [
    {
      role: 'system',
      content: [
        '你负责把站长提供且已经核实的 AI 资讯素材整理成一条可直接发布到 X 的中文帖子。',
        '只输出最终帖子，不要解释、标题、Markdown、引号包裹或候选版本。',
        '不得补写素材中没有的日期、数字、引语、功能、价格、人物表态或因果关系。',
        '信息不足时明确保守表达，不要伪装成实时联网新闻。',
        '保留素材中必要的来源链接；中文表达自然、具体，避免营销腔和空泛评价。',
        '帖子加权长度必须不超过 280；中文字符按 2 计算，ASCII 字符按 1 计算。',
      ].join('\n'),
    },
    {
      role: 'user',
      content: `请整理以下已核实素材：\n${normalizedBrief}`,
    },
  ]
}

export function normalizeGeneratedXAiNews(value) {
  let text = String(value || '').replace(/\r\n?/g, '\n').trim()
  const fenced = text.match(/^```(?:text|markdown)?\s*\n?([\s\S]*?)\n?```$/i)
  if (fenced) text = fenced[1].trim()
  text = text.replace(/^(?:最终帖子|最终文案|帖子|推文|文案)\s*[：:]\s*/i, '').trim()
  if (
    text.length >= 2 &&
    ((text.startsWith('“') && text.endsWith('”')) ||
      (text.startsWith('"') && text.endsWith('"')))
  ) {
    text = text.slice(1, -1).trim()
  }
  return text
}

export function validateXAiNewsDraft(value) {
  const text = normalizeGeneratedXAiNews(value)
  if (!text) return { ok: false, error: 'EMPTY_X_AI_NEWS_DRAFT', text: '', weight: 0 }
  const weight = weightedTextLength(text)
  if (weight > X_AI_NEWS_MAX_WEIGHT) {
    return { ok: false, error: 'X_AI_NEWS_TOO_LONG', text, weight }
  }
  return { ok: true, text, weight }
}
