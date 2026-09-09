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
        '根据用户提示语写一句原创中文格言：用简洁的日常语言，说出一个关于行为、选择或人性的明确判断。',
        '必须包含可从经验中验证的观察，例如某种行为的代价、条件或后果；让读者有所发现，而非只感到被鼓励。',
        '先在内部构思三个不同观点，淘汰空话、常识复述和诗意包装，只输出最有洞察的一句。',
        '脱离发布日期也必须成立。不要写日期、早晚安、节日祝福、打卡口号或日签文案。',
        '避免堆砌微光、星辰、秋风、远方等意象，避免栽种时间、让心跳成为节拍等无明确含义的比喻。',
        '不要使用“不是……而是……”的假对比，不要用“愿你”“每一天”“加油”等泛泛鼓励代替观点。',
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

export function buildAutomatedQuotePrompt({ recentQuotes = [] } = {}) {
  const recent = recentQuotes
    .map((item) => cleanLine(item, 80))
    .filter((text) => text && !hasQuoteStyleViolation(text))
    .slice(0, 20)
  return [
    '写一句可以独立阅读、值得反复思考的原创格言。',
    '从行动、学习、创造、关系、时间、生活观察中自行选择一个具体角度；表达一个明确判断，写清行为与结果、选择与代价或经验的适用条件。',
    recent.length ? `以下仅用于排重，不是风格范例；不要重复或近似这些近期短句的观点或句式：${JSON.stringify(recent)}` : '',
  ].filter(Boolean).join('\n')
}

// Only reject recognizable templates here; literary quality still depends on the prompt.
export function hasQuoteStyleViolation(text) {
  return /(?:[0-9零〇一二三四五六七八九十]{1,4}年)?[0-9零〇一二三四五六七八九十]{1,3}月[0-9零〇一二三四五六七八九十]{1,3}[日号]|\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/u.test(text)
    || /早安|晚安|愿你|愿我们|加油|不是.{1,24}而是/u.test(text)
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

export function parseGeneratedQuotes(value, { recentQuotes = [] } = {}) {
  const parsed = extractJson(value)
  const rows = parsed?.quote ? [parsed.quote] : Array.isArray(parsed?.quotes) ? parsed.quotes : []
  const normalize = (text) => String(text || '').replace(/[\p{P}\s]/gu, '')
  const seen = new Set(recentQuotes.map(normalize))
  const quotes = []

  for (const row of rows) {
    const text = cleanLine(row?.text, 80)
      .replace(/^[“\"']+|[”\"']+$/g, '')
      .replace(/[。.!！]+$/g, '')
      .trim()
    if (text.length < 10 || text.length > 28 || hasQuoteStyleViolation(text) || seen.has(normalize(text))) continue
    seen.add(normalize(text))
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
