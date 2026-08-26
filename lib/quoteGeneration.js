export const QUOTE_GENERATION_MODELS = Object.freeze({
  primary: 'qwen3.8-27b',
  secondary: 'qwen3.5:9b',
  fallback: 'deepseek-v4-flash',
})

export const QUOTE_GENERATION_COUNT = 1

function cleanLine(value, maxLength) {
  return String(value || '').replace(/\r\n?/g, '\n').trim().slice(0, maxLength)
}

export function buildQuoteGenerationMessages({ prompt = '', direction = '' } = {}) {
  const userPrompt = cleanLine(prompt || direction, 500)
  return [
    {
      role: 'system',
      content: [
        '根据用户提示语写一句原创中文短句，表达完整、具体，可以独立理解。',
        '正文 10 至 28 个汉字，不含作者、出处、标题、序号、引号或句末标点。',
        '不要引用、仿写已有名言，不要冒充他人或编造出处。作者固定为 TUARAN。',
        '只输出严格 JSON：{"quote":{"text":"短句","author":"TUARAN"}}。',
      ].join('\n'),
    },
    {
      role: 'user',
      content: userPrompt,
    },
  ]
}

export function buildAutomatedQuotePrompt({ dateKey = '', recentQuotes = [] } = {}) {
  const recent = recentQuotes
    .map((item) => cleanLine(item, 80))
    .filter(Boolean)
    .slice(0, 20)
  return [
    `为 ${cleanLine(dateKey, 20) || '今天'} 写一句可以独立阅读的原创短句。`,
    '从行动、学习、创造、关系、时间、生活观察中自行选择一个具体角度；避免空泛鼓励。',
    recent.length ? `不要重复或近似这些近期短句：${recent.join('；')}` : '',
  ].filter(Boolean).join('\n')
}

function extractJson(value) {
  const text = String(value || '').trim()
  if (!text) throw new Error('QUOTE_GENERATION_EMPTY_RESPONSE')
  try {
    return JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('QUOTE_GENERATION_INVALID_JSON')
    return JSON.parse(match[0])
  }
}

export function parseGeneratedQuotes(value) {
  const parsed = extractJson(value)
  const rows = parsed?.quote ? [parsed.quote] : Array.isArray(parsed?.quotes) ? parsed.quotes : []
  const seen = new Set()
  const quotes = []

  for (const row of rows) {
    const text = cleanLine(row?.text, 80)
      .replace(/^[“\"']+|[”\"']+$/g, '')
      .replace(/[。.!！]+$/g, '')
      .trim()
    if (text.length < 10 || text.length > 28 || seen.has(text)) continue
    seen.add(text)
    quotes.push({
      text,
      author: 'TUARAN',
      source: '原创短句',
      sourceUrl: '',
      enabled: true,
      sortOrder: 0,
    })
    break
  }

  if (!quotes.length) throw new Error('QUOTE_GENERATION_NO_VALID_CANDIDATES')
  return quotes
}
