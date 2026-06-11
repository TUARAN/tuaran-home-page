/**
 * 调研风格模版（Research Style Templates）
 *
 * 站长产出的调研类内容在分寸、措辞、版式上的演进版本快照。
 * 每一版本都对应一次外部反馈或一次自我升级：保留全部历史版本，便于
 * 后续回看「同一条规则是何时、因何被加上」、避免被遗忘或被悄悄回退。
 *
 * 字段约定：
 * - id：版本号（v0 / v1 / v2 ...）
 * - label：人类可读标签
 * - date：首次落入这一版本的日期（YYYY-MM-DD）
 * - status：active（当前生效）/ historical（已被新版本覆盖）
 * - origin：触发该版本诞生的具体事件
 * - summary：30 字内一句话概述
 * - principles：核心原则（数组）
 * - badPhrases：示例：误用措辞 + 解释
 * - goodPhrases：示例：建议措辞 + 解释
 * - howToApply：落地动作清单
 * - whyItMatters：背景陈述（保留长文）
 * - appliedTo：已经应用该版本规则的文章 slug 列表
 */

export const RESEARCH_STYLE_TEMPLATES = [
  {
    id: 'v0',
    label: 'v0 · 初版（前 VibeCafé）',
    date: '2026-06-11',
    status: 'historical',
    origin: '尚无明确风格约束，直觉式表达，频繁出现"X 是 Y"式判决与诛心式措辞。',
    summary: '没有专项约束，分析锐度优先。',
    principles: [
      '直觉式表达，强调分析锐度',
      '允许"X 是 Y"式判决性结论',
      '可使用比喻（接近裸奔 / 慢性贬值 / 最容易死的方式）增强表达力',
    ],
    badPhrases: [
      { phrase: '"一个还没赚到钱的商业模型"', why: '没看对方账本，纯推测' },
      { phrase: '"假装做 (1)(2)(3)，实际押 (4)"', why: '"假装"是诛心，假设对方主观恶意' },
      { phrase: '"0 反作弊投入"', why: '只能看见外部表征，无法判断对方内部投入' },
      { phrase: '"VibeCafé 是 Strava + WakaTime + 商业模型"', why: '"X 是 Y + Z"是我的综合判断，不是事实定义' },
      { phrase: '"三角不稳的根因是 Anthropic 不开 API"', why: '把分析结论包装成因果定律' },
      { phrase: '"它最容易死的方式是..."', why: '用死亡比喻预测别人产品命运' },
      { phrase: '"VibeCafé 永远不会变成 OpenRouter"', why: '"永远"是无证据的远期断言' },
      { phrase: '"押注 Anthropic 不开第三方 API"', why: '"押注"假设对方主观战略意图' },
    ],
    goodPhrases: [],
    howToApply: [
      '想到什么写什么，让分析力度优先于措辞分寸',
    ],
    whyItMatters:
      'v0 是 2026-06-11 站长两次反馈"我觉得这样说不礼貌"之前的状态——本来 AI 协助调研在表达力上可以很猛，但当文章挂站长名字发出去时，每一句对外部团队的判决式陈述都会被读者归到站长头上。VibeCafé 调研早期版本因此踩雷。',
    appliedTo: [
      '2026-06-11-vibecafe.md（早期版本，已修正）',
    ],
  },
  {
    id: 'v1',
    label: 'v1 · 首次反馈后（基础版）',
    date: '2026-06-11',
    status: 'historical',
    origin: '站长第一次反馈"还没赚到钱"这类话不礼貌，开始建立诛心词黑名单与观察体改写规则。',
    summary: '建立诛心词黑名单，开始用"观察体"替代"事实体"。',
    principles: [
      '区分"外部可观察的事实"和"我的推测"',
      '不把推测写成事实，不用判断色彩的词',
      '涉及对方战略意图时，明确加免责"这只是外部观察"',
    ],
    badPhrases: [
      { phrase: '"还没赚到钱"', why: '没看账本' },
      { phrase: '"假装做 X"', why: '诛心' },
      { phrase: '"0 投入"', why: '无法判断内部状况' },
      { phrase: '"在赌 X"', why: '"赌"暗示鲁莽' },
    ],
    goodPhrases: [
      { phrase: '"外部能观察到的状态是 X"', why: '把推测显式标成观察' },
      { phrase: '"当前可见的 Y 水平较低"', why: '量化为可见维度，避免绝对' },
      { phrase: '"未对外披露 / 暂未公开 / 未见"', why: '代替"没有 / 没做"' },
      { phrase: '"看起来更接近 / 与 X 路径更兼容"', why: '代替"是 / 在做"' },
    ],
    howToApply: [
      '写完后全文 grep 一遍：`还没 | 没赚 | 假装 | 0 投入 | 在赌`',
      '逐个改成外部观察体',
      '文末「判断」段落加免责："以上为基于公开信息的外部观察"',
      'frontmatter 的 summary/tldr 不要压缩成判决式短语',
    ],
    whyItMatters:
      '调研要保持分析锐度，但锐度要建立在可观察证据上，不是建立在对别人团队的负面假设上。把推测当事实是 (a) 学术性不严谨，(b) 对正在做事的团队不公平，(c) 一旦发出去对站长本人的可信度也是负资产。',
    appliedTo: [
      '2026-06-11-vibecafe.md（首轮修正）',
    ],
  },
  {
    id: 'v2',
    label: 'v2 · 强化版（当前生效）',
    date: '2026-06-11',
    status: 'active',
    origin: '站长第二次反馈"X 是 Y"型定义同样属于诛心范畴，扩展黑名单并强化落地规则。',
    summary: '把"X = Y + Z"式定义、"最容易死""根因""永远"等远期断言也纳入禁用区。',
    principles: [
      '所有"X 是 Y"式定义默认视为诛心 → 改成"我的一种解读"',
      '任何对别人产品命运的预测都不写',
      '远期断言（永远 / 注定 / 必将）禁用',
      '因果定律（"根因是 X"）改成"外部能看到的相关性"',
      '保留分析锐度，但锐度落到可观察证据上',
    ],
    badPhrases: [
      { phrase: '"还没赚到钱"', why: '没看账本' },
      { phrase: '"假装做 X"', why: '诛心' },
      { phrase: '"0 投入"', why: '无法判断内部状况' },
      { phrase: '"在赌 X"', why: '"赌"暗示鲁莽' },
      { phrase: '"VibeCafé 是 X + Y + Z"', why: '我的综合判断 ≠ 事实定义' },
      { phrase: '"三角不稳的根因是..."', why: '把分析结论包装成因果定律' },
      { phrase: '"它最容易死的方式"', why: '用死亡比喻预测别人产品命运' },
      { phrase: '"永远不会变成 OpenRouter"', why: '"永远"是无证据的远期断言' },
      { phrase: '"押注 Anthropic 不开第三方 API"', why: '"押注"假设对方主观战略意图' },
    ],
    goodPhrases: [
      { phrase: '"外部能观察到的状态是 X"', why: '把推测显式标成观察' },
      { phrase: '"当前可见的 Y 水平较低"', why: '量化为可见维度' },
      { phrase: '"未对外披露 / 暂未公开 / 未见"', why: '代替"没有 / 没做"' },
      { phrase: '"看起来更接近 / 与 X 路径更兼容"', why: '代替"是 / 在做"' },
      { phrase: '"我的一种解读 / 外部观察 / 一种可能的看法"', why: '代替"X 是 Y"' },
      { phrase: '"以上是分析视角，不是预测，也不是建议"', why: '结尾免责模板' },
    ],
    howToApply: [
      '写完 research/companies/* 或 research/topics/* 后，全文 grep：`还没 | 没赚 | 假装 | 0 投入 | 在赌 | 永远 | 最容易死 | 根因 | 押注 | 是 Strava | 是 WakaTime | X = Y + Z`',
      '站长 publish 时挂自己的名字 → 任何"X 是 Y"式定义、任何对别人产品的命运预测，都默认是诛心式',
      '文末「判断」「评估」「总结」段落，强制加开篇免责：「以下是我作为外部观察者的一种解读，不代表 X 团队的真实定位或战略」',
      'frontmatter 的 summary / tldr 不能压缩成判决式短语；宁可长一点也不要把 "X 是 Y" 写出去',
      '最后一句结论 / 总结框：用"一种可能的外部解读"开头，结尾再加一句"以上是分析视角，不是预测，也不是建议"',
    ],
    whyItMatters:
      '站长 publish 时挂的是自己的名字，文章发出去之后每一句对别人产品的判决都会被读者归到站长头上。AI 协助调研本身是 commodity，分寸感才是站长独立判断力的体现——分寸感即护城河。',
    appliedTo: [
      '2026-06-11-vibecafe.md（最终版本）',
      '2026-06-11-captainbed.md',
      '2026-06-11-lobster-vs-doubao-phone-agent-divide.md',
      '2026-06-11-china-individual-income-tax-rules-evolution.md',
    ],
  },
]

/** 按时间正序 / 倒序排列 */
export function sortTemplatesByDateDesc() {
  return [...RESEARCH_STYLE_TEMPLATES].sort((a, b) => (a.date < b.date ? 1 : -1))
}

/** 当前生效版本（status === 'active'） */
export function getActiveTemplate() {
  return RESEARCH_STYLE_TEMPLATES.find((t) => t.status === 'active')
}

/** 按 id 查找 */
export function getTemplateById(id) {
  return RESEARCH_STYLE_TEMPLATES.find((t) => t.id === id)
}
