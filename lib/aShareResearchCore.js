/**
 * A 股公司观察 · 纯逻辑核心（无外部依赖，可单测）
 *
 * 与 scripts/manage-a-share-research.mjs 保持同一套分类与校验口径；
 * 在线编排（同步、选题、DeepSeek 起草）见 lib/aShareResearch.js。
 */

export const CNINFO_STOCK_LIST = 'https://www.cninfo.com.cn/new/data/szse_stock.json'
export const TENCENT_QUOTE_API = 'https://qt.gtimg.cn/q='
// 单次 Worker 调用子请求上限（免费计划 50）。公司池同步 = 1 次巨潮 + N 次行情，
// 每批 150 家 → 约 37 次行情请求，合计 38 次，留足余量。
export const QUOTE_BATCH_SIZE = 150
export const QUOTE_CONCURRENCY = 4
export const DEFAULT_STALE_DAYS = 7
export const MAX_DRAFT_ATTEMPTS = 5
export const GENERATION_TIMEOUT_MS = 26_000
export const GENERATION_LOCK_MS = 10 * 60 * 1000
export const A_SHARE_RESEARCH_TEMPLATE_VERSION = 3

const TEMPLATE_SECTIONS = [
  '一、先给结论',
  '二、公司身份与上市信息',
  '三、业务结构与行业位置',
  '四、财务质量',
  '五、治理与资本结构',
  '六、估值与市场预期',
  '七、催化因素与主要风险',
  '八、外部研判',
  '九、未能验证',
  '十、信息来源与说明',
]

export function shanghaiDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function shanghaiTime(date = new Date()) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Shanghai',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

export function classifyCompany(code) {
  if (/^(600|601|603|605)\d{3}$/.test(code)) {
    return { exchange: 'SSE', exchangeName: '上海证券交易所', board: 'main', boardName: '沪市主板' }
  }
  if (/^(688|689)\d{3}$/.test(code)) {
    return { exchange: 'SSE', exchangeName: '上海证券交易所', board: 'star', boardName: '科创板' }
  }
  if (/^(000|001|002|003)\d{3}$/.test(code)) {
    return { exchange: 'SZSE', exchangeName: '深圳证券交易所', board: 'main', boardName: '深市主板' }
  }
  if (/^(300|301|302)\d{3}$/.test(code)) {
    return { exchange: 'SZSE', exchangeName: '深圳证券交易所', board: 'chinext', boardName: '创业板' }
  }
  if (/^920\d{3}$/.test(code)) {
    return { exchange: 'BSE', exchangeName: '北京证券交易所', board: 'bse', boardName: '北交所' }
  }
  return null
}

export function normalizeCompanies(rows) {
  const unique = new Map()
  for (const row of rows || []) {
    const code = String(row?.f12 || row?.code || '').trim()
    const name = String(row?.f14 || row?.name || '').trim()
    const classification = classifyCompany(code)
    if (!classification || !name || name === '-') continue
    unique.set(code, { code, name, ...classification })
  }
  return [...unique.values()].sort((a, b) => a.code.localeCompare(b.code, 'zh-CN'))
}

export function validateSnapshot(companies) {
  if (companies.length < 5000 || companies.length > 8000) {
    throw new Error(`公司数量 ${companies.length} 超出安全范围 5000–8000，拒绝覆盖现有快照。`)
  }
  for (const exchange of ['SSE', 'SZSE', 'BSE']) {
    if (!companies.some((company) => company.exchange === exchange)) {
      throw new Error(`快照缺少 ${exchange} 公司，拒绝覆盖现有快照。`)
    }
  }
}

export function randomIndex(n) {
  if (!Number.isInteger(n) || n <= 0) return 0
  const bytes = new Uint32Array(1)
  crypto.getRandomValues(bytes)
  return bytes[0] % n
}

export function pickBestCompany(companies, usedCodes, randomIndexFn = randomIndex) {
  const available = (companies || []).filter((company) => !usedCodes.has(company.code))
  if (!available.length) throw new Error('公司池已全部完成，请归档状态后开启新一轮。')
  return available[randomIndexFn(available.length)]
}

/** 解析单家公司腾讯行情字段（仅取写稿需要的可核验数据）。 */
export function parseQuote(source) {
  const match = /^v_(?:sh|sz|bj)(\d{6})="(.*)"\s*;?\s*$/u.exec(String(source || '').trim())
  if (!match) return null
  const fields = match[2].split('~')
  if (fields.length < 48) return null
  const num = (index) => {
    const value = String(fields[index] || '').replace('%', '').trim()
    return value ? Number(value) : null
  }
  return {
    code: match[1],
    time: fields[30] || '',
    price: num(3),
    changePct: num(32),
    turnoverRate: num(38),
    pe: num(39),
    floatMarketCap: num(44),
    totalMarketCap: num(45),
    pb: num(46),
  }
}

function quoteTextFor(quote) {
  if (!quote) return '无'
  return [
    `报价时间：${quote.time || '—'}`,
    `现价：${quote.price || '—'} 元`,
    `涨跌幅：${quote.changePct || '—'}%`,
    `市盈率 TTM：${quote.pe || '—'}`,
    `市净率：${quote.pb || '—'}`,
    `总市值：${quote.totalMarketCap || '—'} 亿元`,
    `流通市值：${quote.floatMarketCap || '—'} 亿元`,
    `换手率：${quote.turnoverRate || '—'}%`,
  ].join('；')
}

export function buildDraftPrompt({ company, quote, style, sections = TEMPLATE_SECTIONS }) {
  const styleText = [
    `当前生效风格：${style?.label}（${style?.id}）`,
    '',
    '写作原则：',
    ...(style?.principles || []).map((item) => `- ${item}`),
    '',
    '禁用表达（违反即重写）：',
    ...(style?.badPhrases || []).map((item) => `- ${item.phrase}：${item.why}`),
    '',
    '建议表达：',
    ...(style?.goodPhrases || []).map((item) => `- ${item.phrase}：${item.why}`),
  ].join('\n')

  return [
    {
      role: 'system',
      content:
        '你是 A 股上市公司观察研究助手。你有服务端联网检索工具（web_search），必须用它核实公开信息，' +
        '包括主营业务与行业地位、最近财报与业绩预告、近期重大公告与新闻、控制权穿透、管理层与治理、机构研报观点等。' +
        '每条关键事实必须能追溯到用户提供的资料或你实际检索到的来源；检索不到、无法核实的，' +
        '一律留在「九、未能验证」小节并说明查证路径。不得编造财务数字、并购重组、管理层变动、' +
        '业绩预期等信息，也不得编造来源 URL。全程最多执行 2 次联网检索，优先覆盖主营业务与最新业绩；' +
        '检索结果直接服务写作，不要在正文里复述检索过程。' +
        '输出完整 Markdown 文章，包含 frontmatter 与十个小节；必须写完「十、信息来源与说明」再结束；' +
        '篇幅紧张时每节写 2–4 行关键事实即可，不得漏掉结尾来源节；不要输出代码围栏，不要输出任何额外说明。',
    },
    {
      role: 'user',
      content: [
        `公司名称：${company.name}`,
        `证券代码：${company.code}`,
        `交易所：${company.exchangeName}（${company.exchange}）`,
        `板块：${company.boardName}（${company.board}）`,
        '',
        `实时行情（来源：腾讯行情接口，时间为 ${shanghaiDate()} ${shanghaiTime()} 前后）：`,
        quoteTextFor(quote),
        '',
        '写作模板（十个小节必须全部出现，章节标题保持以下编号与名称）：',
        sections.map((section) => `## ${section}`).join('\n'),
        '',
        'frontmatter 要求：',
        [
          'title 为：阿燃调研：每天一家A股上市公司 —— {公司名称}（{证券代码}）公司观察',
          'category: companies',
          'company_type: a_share',
          'stock_code: 证券代码（加引号）',
          'exchange / board 用上面提供的信息',
          'date / time 使用当前北京时间',
          'tags: [A股, 公司名称, 行业标签]',
          'summary / tldr 各一句话',
          'content_type: analysis',
          'assistance: codex',
          'model: deepseek-v4-flash',
          'research_template: a-share-company-research',
          `research_template_version: ${A_SHARE_RESEARCH_TEMPLATE_VERSION}`,
          'sources_as_of: 今天日期',
          'show_assistance: false',
          'review_ready: false',
          'ad_eligible: false',
          'pv: 0',
        ]
          .map((line) => `- ${line}`)
          .join('\n'),
        '',
        '写作约束：',
        [
          '联网检索：你有 web_search 工具可用，每次检索前先想清楚要核实的点（如主营构成、最新年报/预告关键数字、近期公告/新闻、实控人与股权结构），最多检索 2 次，优先检索最关键的信息点。',
          '凡在正文使用检索结果，必须在「十、信息来源与说明」列出对应来源（网站名 + URL），URL 只能来自本次检索结果，不得编造。',
          '「二、公司身份与上市信息」只填你能从提供资料确认的项目，其余标「待核实」。',
          '控制权为必查项：写出直接控股股东及持股比例，逐层穿透至最终控制人，并标明民营、央企或地方国资；地方国资须进一步写明省级、市级或区县级及具体履职机构。',
          '核对最近一期定期报告之后的权益变动、无偿划转、收购报告书和控制权变更公告；说明中间持股层级变化是否改变直接控股股东或实际控制人。无法核实就列入「九、未能验证」，不得省略。',
          '「四、财务质量」没有可核实的年报数据时，表格留空并在「九、未能验证」说明。',
          '「六、估值与市场预期」使用提供的行情数据并写明口径日期。',
          '「八、外部研判」只写基于上面事实的观察，不替公司或投资者推断动机。',
          '「十、信息来源与说明」写：巨潮资讯公司列表、腾讯行情接口、本次检索实际使用的来源（名称 + URL），资料截至今天；关键财务数据以公司正式披露为准。',
          '全文不得出现「不是 X，而是 Y」句式，不得出现「本文/本篇/本调研」等无实际作用的自我指涉。',
        ]
          .map((line) => `- ${line}`)
          .join('\n'),
        '',
        styleText,
      ].join('\n'),
    },
  ]
}

export function validateDraft(content) {
  if (!content || content.length < 200) throw new Error('生成内容过短，疑似空响应。')
  if (/\{\{[A-Z0-9_]+\}\}/u.test(content)) throw new Error('草稿仍包含未替换的模板占位符。')
  if (!/^review_ready:\s*false\s*$/mu.test(content)) throw new Error('自动生成稿必须保持 review_ready: false。')
  if (!/^## .*(?:信息来源|资料来源|来源与说明)/mu.test(content)) throw new Error('草稿缺少结尾来源章节。')
}
