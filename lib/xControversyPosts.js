import { weightedTextLength } from './xDistribution.js'

const SHANGHAI_TIME_ZONE = 'Asia/Shanghai'
const TARGET_WEIGHT = 200
const HARD_WEIGHT_LIMIT = 200
const SIGNAL_TIMEOUT_MS = 8_000
const BAIDU_HOT_URL = 'https://top.baidu.com/board?tab=realtime'
const META_LABEL_PATTERN = /(?:[【[(（]\s*)?(?:小剧场|故事时间|讲个故事|先说结论|说句实话|有事就直说|有话直说|开门见山|打个比方|举个例子|假设一下|设想一下|来聊聊|今天聊聊|今日话题|热议话题|事情是这样的|先来一句)(?:\s*[】\])）])?\s*[：:|｜，,。.!！?？—-]*/giu

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
  '租住生活：房东、租客、押金、维修、续租和生活品质之间的责任边界',
  '邻里物业：停车位、噪音、宠物、电梯、公共空间与物业费的日常冲突',
  '汽车出行：油车电车、充电排队、停车成本、通勤时间与面子消费',
  '旅行休假：预算、排队、请假、同伴节奏、景点打卡与真正休息',
  '朋友往来：借钱、请客、送礼、拼单、群聊沉默与关系远近',
  '合租室友：卫生、空调、公共用品、访客、作息与费用平摊',
  '数字生活：会员续费、自动扣款、算法推荐、隐私授权与使用便利',
  '网购售后：低价、运费险、退换货、客服话术与商家成本',
  '外卖与服务：配送费、等待时间、平台规则、骑手处境与消费者预期',
  '自由职业：报价、免费试稿、熟人折扣、修改次数与专业价值',
  '副业创业：稳定收入、试错成本、家人期待、流量焦虑与幸存者偏差',
  '内容创作：原创、蹭热点、标题尺度、免费分享与付费价值',
  'AI 工具：效率提升、岗位焦虑、订阅成本、学习门槛与责任归属',
  '社交平台：点赞、已读不回、公开表达、熟人围观与边界感',
  '二手交易：成色描述、砍价、售后、当面验货与信任成本',
  '节日人情：红包、礼物、回家安排、仪式感与实际预算',
  '兴趣爱好：装备消费、圈层优越感、入门门槛与真正喜欢',
])

export const X_CONTROVERSY_STRUCTURES = Object.freeze([
  Object.freeze({ id: 'curious-hook', label: '不懂就问', guide: '第一行固定写“不懂就问：”，空一行后提出一个具体、容易回答的问题。可以引用已确认的数字；没有可靠依据时不得编造收入、排行或“第一/第二”。全文保持简短。' }),
  Object.freeze({ id: 'hot-take-hook', label: '说个暴论', guide: '第一行固定写“说个暴论：”，空一行后给出一句明确判断；再空一行写“我个人觉得，……”说明一个具体理由；最后空一行用“你觉得呢？”收尾。不要为了制造争议夸大事实。' }),
  Object.freeze({ id: 'scene', label: '现场切片', guide: '从一个可见动作或一句现场话开始，只截取最有张力的十几秒；结尾留在动作上，不用“原来”。' }),
  Object.freeze({ id: 'observation', label: '生活观察', guide: '从一个常见但容易被忽略的现象开始，写两种人的不同算盘；全篇可以没有人物对话。' }),
  Object.freeze({ id: 'ledger', label: '账本拆解', guide: '围绕一笔具体但不虚构数额的成本，逐项写谁提议、谁决定、谁付钱、谁承担后果；避免固定的问答反转。' }),
  Object.freeze({ id: 'rule', label: '规则悖论', guide: '先摆出一条大家都接受的规则，再指出它在现实执行中的矛盾；用一句短判断收尾。' }),
  Object.freeze({ id: 'choice', label: '两难选择', guide: '并列两个都不轻松的选项，让冲突自然出现；不要替读者强行选答案。' }),
  Object.freeze({ id: 'confession', label: '第一人称承认', guide: '用“我也会……”式的诚实自嘲切入，承认普通人的矛盾心理；不编造履历或真实事件。' }),
  Object.freeze({ id: 'object', label: '物件线索', guide: '让账单、钥匙、工牌、购物车、群消息或空座位承载冲突，少解释，多给可见细节。' }),
  Object.freeze({ id: 'afterward', label: '事后余味', guide: '从事情结束后的一个小结果写起，再反推此前的分歧；结尾不要做大道理总结。' }),
  Object.freeze({ id: 'three-lines', label: '三句递进', guide: '用三到五句短句递进：事实、代价、态度变化；禁止角色轮流说话。' }),
  Object.freeze({ id: 'question', label: '具体反问', guide: '围绕一个能明确站队的具体问题展开，正文先给足情境，最后只留一个不空泛的反问。' }),
  Object.freeze({ id: 'contrast', label: '前后对照', guide: '对照同一个人在建议别人和轮到自己时的不同标准；不要使用“不是……而是……”或“原来”。' }),
  Object.freeze({ id: 'micro-dialogue', label: '两句对话', guide: '最多保留两句自然对话，其余用动作或旁白完成；角色不能总是亲戚、老板和“我”。' }),
])

const NEWS_QUERIES = Object.freeze([
  '房地产 OR 楼市 OR 房价 OR 买房',
  '婚姻 OR 彩礼 OR 相亲 OR 感情',
  '就业 OR 职场 OR 加班 OR 工资',
  '教育 OR 生育 OR 养老 OR 消费 OR 社会',
  '出行 OR 汽车 OR 旅游 OR 租房 OR 物业 OR 外卖',
  '人工智能 OR 社交平台 OR 网购 OR 内容创作 OR 副业',
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

function structureFor({ slot, now }) {
  const hour = Number(normalizeXControversySlot(slot, 'controversy_00').slice(-2))
  const day = Math.floor(Date.parse(`${shanghaiDateKey(now)}T00:00:00Z`) / 86_400_000)
  return X_CONTROVERSY_STRUCTURES[(day * 5 + hour * 5) % X_CONTROVERSY_STRUCTURES.length]
}

export function buildXControversyMessages({ slot = 'controversy_00', signals = [], recentTexts = [], now = new Date() } = {}) {
  const normalizedSlot = normalizeXControversySlot(slot, 'controversy_00')
  const candidates = signals.slice(0, 8)
  const signalText = candidates.length
    ? candidates.map((item, index) => `${index + 1}. ${item.title}${item.source ? `（${item.source}）` : ''}`).join('\n')
    : '没有取得足够可靠的新热点。不要假装有实时事件，改用常青冲突题。'
  const recentText = recentTexts.length
    ? recentTexts.slice(0, 24).map((text, index) => `${index + 1}. ${String(text).replace(/\s+/g, ' ').slice(0, 120)}`).join('\n')
    : '暂无历史争议短帖。'
  const structure = structureFor({ slot: normalizedSlot, now })
  return [
    {
      role: 'system',
      content: [
        '你负责为个人 X 账号写一条可直接发布的中文纯文字短帖。',
        '只输出最终文案，不要标题、Markdown、解释、候选版本、链接、话题标签或引号包裹。',
        '目标是有分歧、有代入、有生活质感：让读者能看见自己或身边人的处境，愿意站队、补充经历或提出反例。',
        '语气可以俏皮、克制、带一点损，也可以冷静、诚实或自嘲。不要为了“狠”而强行补刀，不使用脏话。',
        '第一句直接进入具体观察、动作、物件、选择、结果或一句自然对话，不得用栏目名、类型名、写作说明或铺垫开场。只有本次指定结构为“不懂就问”或“说个暴论”时，才使用对应的固定钩子开场。',
        '禁止出现这些套话：“小剧场”“故事时间”“讲个故事”“先说结论”“说句实话”“有事就直说”“有话直说”“开门见山”“打个比方”“举个例子”“假设一下”“设想一下”“来聊聊”“今天聊聊”“今日话题”“热议话题”“事情是这样的”。',
        '选题可以来自钱、住房、婚恋、家庭、职场、教育、消费，也可以来自租住、邻里、出行、旅行、朋友往来、合租、网购、外卖、AI 工具、社交平台、二手交易、兴趣爱好和内容创作。每条只聚焦一个具体矛盾。',
        '允许明确站队、反问和尖锐判断，也允许把两难如实摆出来。不要机械地每条都问“你怎么看”，不要伪装成新闻摘要。',
        '从用户提供的热点标题中选择最适合普通人代入、最容易形成两派的一条。标题只提供选题线索；无法确认的细节、数字、因果和当事人动机一律不写。',
        '如果热点都不适合，就使用给定常青冲突题。虚构场景使用泛化角色和日常条件，不得冒充真实新闻；不要自报“这是虚构”，也不要添加写作标签。',
        '只批评观点、选择、制度或利益逻辑。不得造谣，不攻击私人个体，不煽动围攻，不拿灾难、犯罪、疾病或未成年人遭遇开玩笑，不使用地域、性别、年龄、职业等群体羞辱。',
        '可以写 2—6 个短段落，约 55—100 个汉字，X 加权长度不超过 200。钩子结构可以更短，但必须用真实换行分段，留白清楚。段落数量、句长和收尾方式要随结构变化。禁用“不是……而是……”句式，禁用鸡汤、营销腔和故作深沉的总结。',
        '近期文案既是事实去重清单，也是结构去重清单：不得复用相同的开头句法、人物关系、对话轮次、反转方式、比喻、关键词串或“原来/说到底/这才是”等收尾。',
        '角色要轮换，可以是伴侣、朋友、室友、邻居、同事、顾客、店员、房东、租客、家长、学生、创作者、普通路人，也可以完全没有角色。',
        '理想效果：像一个真实的人刚观察到一件具体小事，话里有立场，但没有批量生产感。',
      ].join('\n'),
    },
    {
      role: 'user',
      content: [
        `小时槽位：${X_CONTROVERSY_SLOTS[normalizedSlot].label}`,
        `轮换日期：${shanghaiDateKey(now)}`,
        `没有合适热点时的常青题：${fallbackFor({ slot: normalizedSlot, now })}`,
        `本次必须采用的结构：${structure.label}。${structure.guide}`,
        '最近 12 小时公开新闻标题：',
        signalText,
        '近期已经发布的文案（不得复用其核心比喻、台词、反转或结尾）：',
        recentText,
        '先从近期文案中识别已经用过的角色、开头和收尾，再挑一个没有重复的角度。严格使用本次指定结构；不要强行加入对话或反转，不要复述来源名。',
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
    .replace(META_LABEL_PATTERN, '')
    .replace(/^[：:|｜，,。.!！?？—-]+\s*/gm, '')
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
