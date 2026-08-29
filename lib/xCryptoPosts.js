import { shanghaiDateKey } from './dailyGreeting.js'

export const X_CRYPTO_POST_SLOTS = Object.freeze({
  crypto_knowledge: Object.freeze({
    id: 'crypto_knowledge',
    label: '加密知识',
    time: '11:00',
    direction: '解释一个容易被误解的加密货币基础概念，用具体例子说明它如何影响普通持有者的风险判断。',
  }),
  crypto_market: Object.freeze({
    id: 'crypto_market',
    label: '币与走势观点',
    time: '17:00',
    direction: '围绕价格结构、成交量、流动性、资金费率、宏观环境或链上活动中的一个变量，给出有条件、有边界的市场观察。',
  }),
  crypto_people: Object.freeze({
    id: 'crypto_people',
    label: '加密人物与投资理念',
    time: '21:00',
    direction: '从加密行业人物的公开方法论或一个通用投资原则切入，提炼可执行的风险检查；无法确认人物观点时改写为不带人物归因的投资理念。',
  }),
})

const TOPICS_BY_SLOT = Object.freeze({
  crypto_knowledge: Object.freeze([
    '比特币供应上限、发行节奏与减半的区别',
    '稳定币的储备、赎回和对手方风险',
    '私钥、自托管、交易所托管分别承担什么风险',
    '链上确认、最终性与跨链桥风险',
    '流动性、滑点和市值为什么不是一回事',
    '代币解锁、流通量与完全稀释估值',
  ]),
  crypto_market: Object.freeze([
    '趋势判断先看结构，再看单根涨跌',
    '成交量放大与缩量上涨分别说明什么',
    '资金费率和持仓量只能作为拥挤度线索',
    '宏观流动性如何改变高波动资产的定价',
    '支撑阻力是观察区间，不是必然反转点',
    '链上活跃与币价之间为什么不能简单画等号',
  ]),
  crypto_people: Object.freeze([
    '能力圈：看不懂的收益来源就不参与',
    '安全边际：先计算能承受多大回撤',
    '仓位纪律：判断正确也可能因仓位过大而失败',
    '长期主义：持有期限不能替代项目质量审查',
    '反脆弱：为极端波动预留现金和退出路径',
    '独立判断：名人观点只能作为线索，不能代替验证',
  ]),
})

export function normalizeXCryptoSlot(value, fallback = '') {
  const slot = String(value || '').trim().toLowerCase()
  return X_CRYPTO_POST_SLOTS[slot] ? slot : fallback
}

export function xCryptoLastRunKey(slot) {
  return `automation.x_crypto.last_run.${normalizeXCryptoSlot(slot)}`
}

function shanghaiDayNumber(now = new Date()) {
  const [year, month, day] = shanghaiDateKey(now).split('-').map(Number)
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000)
}

export function pickXCryptoTopic({ slot = 'crypto_knowledge', now = new Date() } = {}) {
  const normalizedSlot = normalizeXCryptoSlot(slot, 'crypto_knowledge')
  const slotIndex = Object.keys(X_CRYPTO_POST_SLOTS).indexOf(normalizedSlot)
  const topics = TOPICS_BY_SLOT[normalizedSlot]
  return topics[(shanghaiDayNumber(now) + slotIndex) % topics.length]
}

export function buildXCryptoMessages({ slot = 'crypto_knowledge', now = new Date() } = {}) {
  const normalizedSlot = normalizeXCryptoSlot(slot, 'crypto_knowledge')
  const slotInfo = X_CRYPTO_POST_SLOTS[normalizedSlot]
  const topic = pickXCryptoTopic({ slot: normalizedSlot, now })
  return [
    {
      role: 'system',
      content: [
        '你负责为个人 X 账号撰写一条可直接发布的中文加密行业帖子。',
        '只输出最终文案，不要标题、Markdown、候选版本、链接占位符或写作说明。',
        '首句挑战一个常见误区并给出清晰判断，随后用一两个具体机制或条件解释，最后落到读者可以执行的风险检查。',
        '至少留下一句可以被单独认同或反对的核心判断，让沉默读者也有自然点赞的理由，但不要直接索要互动。',
        '明确区分事实、推断和不确定性。不要编造实时价格、收益率、链上数据、人物原话、持仓、内幕消息或监管结论。',
        '不得承诺涨跌，不给具体买卖指令，不鼓励梭哈或加杠杆；涉及走势时用“如果……那么……”表达情景边界。',
        '涉及人物时只能转述广为公开且有把握的立场，不使用无法核验的引号；无法确认就改写为不带人物归因的投资理念。',
        '语言像真实投资者的独立思考，犀利、具体，但不靠恐吓或绝对化措辞制造冲突。不写营销腔、标题党、空泛鸡汤或“不是……而是……”句式。',
        '控制在约 90—125 个汉字，X 加权长度不超过 280；最多使用一个自然相关的标签。',
        '在风险提示前留一个具体二选一或经验型问题，让读者能用一句话回答；不要直接索要点赞、转发或关注。',
        '结尾自然附上“仅供信息交流，不构成投资建议”。',
      ].join('\n'),
    },
    {
      role: 'user',
      content: [
        `发布时间：${slotInfo.time}（北京时间）`,
        `任务类型：${slotInfo.label}`,
        `写作方向：${slotInfo.direction}`,
        `今日轮换主题：${topic}`,
        `轮换标识：${shanghaiDateKey(now)}-${normalizedSlot}，请使用新鲜的开头和句式。`,
      ].join('\n'),
    },
  ]
}
