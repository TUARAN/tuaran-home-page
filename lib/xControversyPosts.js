import { weightedTextLength } from './xDistribution.js'

const SHANGHAI_TIME_ZONE = 'Asia/Shanghai'
const TARGET_WEIGHT = 200
const HARD_WEIGHT_LIMIT = 200
const SIGNAL_TIMEOUT_MS = 8_000
const BAIDU_HOT_URL = 'https://top.baidu.com/board?tab=realtime'

export const X_CONTROVERSY_SLOTS = Object.freeze(Object.fromEntries(
  Array.from({ length: 24 }, (_, hour) => {
    const id = `controversy_${String(hour).padStart(2, '0')}`
    return [id, Object.freeze({
      id,
      label: `${String(hour).padStart(2, '0')} 点热点争议`,
      time: `${String(hour).padStart(2, '0')}:00`,
    })]
  }),
))

export const X_CONTROVERSY_FALLBACKS = Object.freeze([
  '房地产：房价、首付、月供、租房、家庭出资与房产署名之间的利益冲突',
  '婚恋：彩礼、婚前财产、收入公开、家务分工、择偶条件与情绪价值',
  '家庭：父母付出、成年子女边界、养老责任、催婚催生与代际账本',
  '职场：工资、加班、忠诚、裁员、管理者责任与员工所谓格局',
  '教育：家长反对内卷却追逐排名、教育投入与结果焦虑',
  '消费：收入增长、消费期待、储蓄焦虑与所谓消费信心',
  '生育养老：建议由别人提出，时间、金钱和照护成本由普通家庭承担',
  '小故事：围绕钱、房子、婚姻、工作或亲情写一个明确为虚构的微型情境',
])

const NEWS_QUERIES = Object.freeze([
  '房地产 OR 楼市 OR 房价 OR 买房',
  '婚姻 OR 彩礼 OR 相亲 OR 感情',
  '就业 OR 职场 OR 加班 OR 工资',
  '教育 OR 生育 OR 养老 OR 消费 OR 社会',
])

function decodeXml(value) {
  return String(value || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function parseXControversyFeed(xml, { now = new Date() } = {}) {
  const cutoff = now.getTime() - 12 * 60 * 60_000
  return [...String(xml || '').matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)]
    .map((match) => {
      const item = match[1]
      const title = decodeXml(item.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1])
        .replace(/\s+-\s+[^-]{2,40}$/, '')
        .trim()
      const publishedAt = Date.parse(decodeXml(item.match(/<pubDate\b[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1]))
      const source = decodeXml(item.match(/<source\b[^>]*>([\s\S]*?)<\/source>/i)?.[1])
      if (!title || !Number.isFinite(publishedAt) || publishedAt < cutoff || publishedAt > now.getTime() + 5 * 60_000) return null
      return { title: title.slice(0, 120), source: source.slice(0, 40), publishedAt }
    })
    .filter(Boolean)
}

function decodeJsonString(value) {
  try {
    return JSON.parse(`"${String(value || '')}"`)
  } catch {
    return String(value || '')
  }
}

export function parseBaiduHotBoard(html, { now = new Date() } = {}) {
  const words = [...String(html || '').matchAll(/"word":"((?:\\.|[^"\\])*)"/g)]
    .map((match) => decodeJsonString(match[1]).replace(/<[^>]+>/g, '').trim())
    .filter(Boolean)
  const scores = [...String(html || '').matchAll(/"hotScore":"?(\d+)"?/g)]
    .map((match) => Number(match[1]))
  return words.slice(0, 30).map((title, index) => ({
    title: title.slice(0, 120),
    source: '百度热搜',
    publishedAt: now.getTime(),
    heat: scores[index] || 0,
  }))
}

function newsFeedUrl(query) {
  const url = new URL('https://news.google.com/rss/search')
  url.searchParams.set('q', `${query} when:12h`)
  url.searchParams.set('hl', 'zh-CN')
  url.searchParams.set('gl', 'CN')
  url.searchParams.set('ceid', 'CN:zh-Hans')
  return url.toString()
}

export async function fetchXControversySignals({ fetchImpl = fetch, now = new Date() } = {}) {
  try {
    const response = await fetchImpl(BAIDU_HOT_URL, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'Mozilla/5.0 (compatible; 2aran-x-topic-bot/1.0)',
      },
      signal: AbortSignal.timeout(SIGNAL_TIMEOUT_MS),
    })
    if (response.ok) {
      const hot = parseBaiduHotBoard(await response.text(), { now })
      if (hot.length >= 6) return hot.slice(0, 12)
    }
  } catch {
    // Fall through to public news RSS. A source failure must not prevent the scheduled post.
  }
  const results = await Promise.allSettled(NEWS_QUERIES.map(async (query) => {
    const response = await fetchImpl(newsFeedUrl(query), {
      headers: { accept: 'application/rss+xml, application/xml, text/xml' },
      signal: AbortSignal.timeout(SIGNAL_TIMEOUT_MS),
    })
    if (!response.ok) throw new Error(`news feed returned ${response.status}`)
    return parseXControversyFeed(await response.text(), { now })
  }))
  const seen = new Set()
  return results
    .flatMap((result) => result.status === 'fulfilled' ? result.value : [])
    .sort((left, right) => right.publishedAt - left.publishedAt)
    .filter((item) => {
      const key = item.title.replace(/[\s，。！？、：；“”‘’"']/g, '').slice(0, 48)
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 10)
}

export function normalizeXControversySlot(value, fallback = '') {
  const slot = String(value || '').trim().toLowerCase()
  return X_CONTROVERSY_SLOTS[slot] ? slot : fallback
}

export function xControversyLastRunKey(slot) {
  return `automation.x_controversy.last_run.${normalizeXControversySlot(slot)}`
}

function shanghaiDateKey(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: SHANGHAI_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

function fallbackFor({ slot, now }) {
  const hour = Number(normalizeXControversySlot(slot, 'controversy_00').slice(-2))
  const day = Math.floor(Date.parse(`${shanghaiDateKey(now)}T00:00:00Z`) / 86_400_000)
  return X_CONTROVERSY_FALLBACKS[(day + hour) % X_CONTROVERSY_FALLBACKS.length]
}

export function buildXControversyMessages({ slot = 'controversy_00', signals = [], recentTexts = [], now = new Date() } = {}) {
  const normalizedSlot = normalizeXControversySlot(slot, 'controversy_00')
  const candidates = signals.slice(0, 8)
  const signalText = candidates.length
    ? candidates.map((item, index) => `${index + 1}. ${item.title}${item.source ? `（${item.source}）` : ''}`).join('\n')
    : '没有取得足够可靠的新热点。不要假装有实时事件，改用常青冲突题。'
  const recentText = recentTexts.length
    ? recentTexts.slice(0, 12).map((text, index) => `${index + 1}. ${String(text).replace(/\s+/g, ' ').slice(0, 100)}`).join('\n')
    : '暂无历史争议短帖。'
  return [
    {
      role: 'system',
      content: [
        '你负责为个人 X 账号写一条可直接发布的中文纯文字短帖。',
        '只输出最终文案，不要标题、Markdown、解释、候选版本、链接、话题标签或引号包裹。',
        '目标是高争议、高代入、有戏剧性：让读者迅速站队，愿意反驳、引用或把文案转给别人。',
        '语气俏皮、戏谑、带一点损，但不使用脏话。像一出四行左右的微型讽刺剧：现场或台词开场，利益冲突升级，突然反转，最后一句冷幽默补刀。',
        '优先写钱、房子、婚姻、彩礼、家务、孩子、养老、工资、加班、教育、消费等普通人的具体利益。必须聚焦一个冲突，不能写成新闻摘要或温和的两面分析。',
        '允许明确站队、反问和尖锐判断；不要机械地每条都问“你怎么看”。',
        '从用户提供的热点标题中选择最适合普通人代入、最容易形成两派的一条。标题只提供选题线索；无法确认的细节、数字、因果和当事人动机一律不写。',
        '如果热点都不适合，就使用给定常青冲突题。不得声称虚构故事是真事；故事型必须通过“假设”“小剧场”等措辞让虚构属性清楚。',
        '只批评观点、选择、制度或利益逻辑。不得造谣，不攻击私人个体，不煽动围攻，不拿灾难、犯罪、疾病或未成年人遭遇开玩笑，不使用地域、性别、年龄、职业等群体羞辱。',
        '多换行，每段一两句，约 55—100 个汉字，X 加权长度不超过 220。禁用“不是……而是……”句式，禁用鸡汤、营销腔和故作深沉的总结。',
        '理想效果：嘴有点损，话有点真，读完总有人想反驳。',
      ].join('\n'),
    },
    {
      role: 'user',
      content: [
        `小时槽位：${X_CONTROVERSY_SLOTS[normalizedSlot].label}`,
        `轮换日期：${shanghaiDateKey(now)}`,
        `没有合适热点时的常青题：${fallbackFor({ slot: normalizedSlot, now })}`,
        '最近 12 小时公开新闻标题：',
        signalText,
        '近期已经发布的文案（不得复用其核心比喻、台词、反转或结尾）：',
        recentText,
        '挑一个最有真实利益冲突的角度，写成短、狠、俏皮的微型讽刺剧。不要复述来源名。',
      ].join('\n'),
    },
  ]
}

export function buildXControversyLengthRepairMessages({ text } = {}) {
  return [
    {
      role: 'system',
      content: [
        '压缩一条中文 X 短帖。只输出最终文案。',
        `保留冲突、反转、换行和最后的补刀，X 加权长度不超过 ${TARGET_WEIGHT}。`,
        '删除解释和重复，不新增事实、链接、标签、emoji 或攻击性称呼。',
      ].join('\n'),
    },
    { role: 'user', content: String(text || '').trim() },
  ]
}

export function normalizeXControversyText(value) {
  let text = String(value || '')
    .replace(/\r\n?/g, '\n')
    .replace(/^```(?:text|markdown)?\s*\n?|\n?```$/gi, '')
    .replace(/^(?:最终文案|推文|文案)\s*[：:]\s*/i, '')
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/#[^\s#]+/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  if ((text.startsWith('“') && text.endsWith('”')) || (text.startsWith('"') && text.endsWith('"'))) {
    text = text.slice(1, -1).trim()
  }
  if (weightedTextLength(text) <= HARD_WEIGHT_LIMIT) return text
  let result = ''
  for (const character of Array.from(text)) {
    if (weightedTextLength(`${result}${character}…`) > TARGET_WEIGHT) break
    result += character
  }
  const sentenceEnd = Math.max(
    result.lastIndexOf('。'),
    result.lastIndexOf('！'),
    result.lastIndexOf('？'),
    result.lastIndexOf('!'),
    result.lastIndexOf('?'),
  )
  if (sentenceEnd >= result.length * 0.55) return result.slice(0, sentenceEnd + 1).trim()
  return `${result.trimEnd()}…`
}

export function xControversyWithinTarget(value) {
  const text = String(value || '').trim()
  return Boolean(text) && weightedTextLength(text) <= HARD_WEIGHT_LIMIT
}
