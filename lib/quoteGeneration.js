export const QUOTE_GENERATION_MODELS = Object.freeze({
  primary: 'qwen3.8-27b',
  secondary: 'qwen3.5:9b',
  fallback: 'deepseek-v4-flash',
})

export const QUOTE_GENERATION_COUNT = 3

function cleanLine(value, maxLength) {
  return String(value || '').replace(/\r\n?/g, '\n').trim().slice(0, maxLength)
}

export function buildQuoteGenerationMessages({ direction = '', existingQuotes = [] } = {}) {
  const existing = existingQuotes
    .map((item) => cleanLine(item, 80))
    .filter(Boolean)
    .slice(0, 80)

  return [
    {
      role: 'system',
      content: [
        '你为个人内容站撰写可供人工复核的原创中文短句。',
        `一次生成 ${QUOTE_GENERATION_COUNT} 条，每条表达一个完整、具体、可以独立理解的观察。`,
        '每条正文 10 至 28 个汉字，不含作者名、出处、标题、序号、引号或句末句号。',
        '作者只能写 TUARAN。不要引用、仿写或改写已有名言，不要冒充历史人物，不要编造出处。',
        '三条在主题、句子长短和语气上要有明显差异。优先写学习、行动、判断、日常经验中的具体感受。',
        '避免口号、说教、营销腔、空泛鸡汤、强行升华、排比三连、自问自答和短句轰炸。',
        '禁用这些模板：不是 X 而是 Y；不只是 X 更是 Y；真正重要的不是 X；X 是 Y 的语言；X 是一面镜子；在这个时代；值得注意的是；让我们；未来可期。',
        '只输出严格 JSON，格式为 {"quotes":[{"text":"短句","author":"TUARAN"}]}，不要输出 Markdown 或解释。',
      ].join('\n'),
    },
    {
      role: 'user',
      content: [
        `写作方向：${cleanLine(direction, 240) || '自由选择一个贴近日常经验的角度'}`,
        existing.length
          ? `不得与这些已有短句重复或近似：\n${existing.map((text) => `- ${text}`).join('\n')}`
          : '当前没有需要避开的已有短句。',
      ].join('\n\n'),
    },
  ]
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
  const rows = Array.isArray(parsed?.quotes) ? parsed.quotes : []
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
    if (quotes.length === QUOTE_GENERATION_COUNT) break
  }

  if (!quotes.length) throw new Error('QUOTE_GENERATION_NO_VALID_CANDIDATES')
  return quotes
}
