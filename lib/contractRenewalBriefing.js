export const CONTRACT_RENEWAL_TOTAL_SECONDS = 300
export const CONTRACT_RENEWAL_WARN_SECONDS = 30
export const CONTRACT_RENEWAL_MIN_MINUTES = 1
export const CONTRACT_RENEWAL_MAX_MINUTES = 15
export const CONTRACT_RENEWAL_TITLE = '续签述职'
export const CONTRACT_RENEWAL_DECK = '智能消息室 · 合同续签答辩 v1.4'
export const CONTRACT_RENEWAL_SLIDE_DIR = '/admin/contract-renewal/slides'
export const CONTRACT_RENEWAL_SETTING_KEY = 'contract-renewal.briefing'
export const CONTRACT_RENEWAL_LOCAL_STORAGE_KEY = 'tuaran.admin.contract-renewal.briefing'

export function contractRenewalSlideSrc(pageNumber) {
  return `${CONTRACT_RENEWAL_SLIDE_DIR}/page-${String(pageNumber).padStart(2, '0')}.jpg`
}

export function sumBriefingSeconds(pages = CONTRACT_RENEWAL_PAGES) {
  return pages.reduce((sum, page) => sum + page.seconds, 0)
}

export function briefingCharCount(page) {
  return page.lines.join('').replace(/\s/g, '').length
}

export const CONTRACT_RENEWAL_PAGES = Object.freeze([
  {
    id: 1,
    title: '开场',
    seconds: 8,
    job: '报身份：科室、岗位、姓名。',
    stance: '礼貌开场，不拖。',
    point: '看评委，点到自己的名字。',
    avoid: '不要再加寒暄，不要改口播稿。',
    lines: [
      '各位领导、同事，大家好！我是来自智能消息室的项目经理涂阿燃。',
    ],
  },
  {
    id: 2,
    title: '目录',
    seconds: 11,
    job: '报五个部分，立刻翻页。',
    stance: '带路，不展开。',
    point: '手从岗位经历扫到反思思考。',
    avoid: '不要在目录页开始讲经历。',
    lines: [
      '接下来是我的劳动合同续签述职，我将从以下5个部分展开述职。包括岗位经历、智能体应用、数字员工建设、项目管理以及反思思考。',
    ],
  },
  {
    id: 3,
    title: '三条主线',
    seconds: 28,
    job: '先报路径，再报本合同期主线。',
    stance: '总览只讲骨架。',
    point: '时间轴扫到第二次续签，再点下面主线。',
    avoid: '不要把后边智能体和阅信的细节提前讲完。',
    lines: [
      '我18年从华南师范大学毕业，20年9月加入公司在融通部做前端开发，23年2月从开发转岗项目岗，23年10月完成第一次劳动合同续签，本次是第二次续签述职。',
      '本合同期内，我有3个主线工作，分别是：新消息与智能体的融合建设、阅信稽核考核流程、建设数字员工工具、以及24年做过甄选/招募以及科创接口、兼任团支部组织委员工作。',
    ],
  },
  {
    id: 4,
    title: '两个智能体',
    seconds: 48,
    job: '先报 WorkBuddy 通信专家，再报开物个人通信智能体。',
    stance: '按口播稿报结果。',
    point: '先指左边 16 项，再指右边验收通过。',
    avoid: '不要解释框架原理，不要把 Channel 页的内容提前讲。',
    lines: [
      '首先，我协助团队基于WorkBuddy框架，手搓通信专家智能体，整合新通信、139邮箱、云盘管理等16项通信能力Skill。',
      '前后配合完成三轮专项测试，逐一排查修复问题，最终在WorkBuddy上打造出统一的通信能力入口，用户仅需分享链接即可直接体验使用。',
      '该智能体顺利通过品质部专项验收，成为公司首批落地的专家类智能体应用。',
      '此前，协助推进开物平台个人通信智能体对接，完成Dify、自建OpenClaw等多套方案的适配预研和测试，在开物上开发工作流及CTC测试。',
      '最终基于开物的个人通信智能体验收通过，满足上线技术条件，仅待码号申请完成即可推进落地。',
    ],
    cutLines: [
      '首先，我协助团队基于WorkBuddy框架，手搓通信专家智能体，整合16项通信能力，三轮测试后通过品质部专项验收，成为公司首批落地的专家类智能体。',
      '开物平台个人通信智能体验收通过，满足上线技术条件，仅待码号申请完成即可推进落地。',
    ],
  },
  {
    id: 5,
    title: '群聊通道',
    seconds: 32,
    job: '说明 Channel 在推进，不是已经上线。',
    stance: '交代进度和验证方式。',
    point: '顺着通道箭头扫过去，再点开发者平台。',
    avoid: '不要解释 MCP、ACP 是什么。超时就改成压缩稿。',
    lines: [
      '在 Channel 技术上，当前聚焦打通WorkBuddy开发者平台的Channel能力，实现基于消息触发的智能服务。',
      '依托WorkBuddy的模型与工具能力，接入MCP-CLI、ACP方式验证，可实现短信端口下发消息调用模型和工具，以及在9月开放的开发者平台上配合官方材料认证。',
      '持续验证从单次调用到会话介入的升级，让智能体记住用户上下文，支撑连贯复杂的任务执行。',
    ],
    cutLines: [
      '当前聚焦打通WorkBuddy开发者平台的Channel能力，实现基于消息触发的智能服务。MCP-CLI、ACP已验证短信端口调用模型和工具，正向会话介入升级。',
    ],
  },
  {
    id: 6,
    title: '阅信智核官',
    seconds: 37,
    job: '痛点、工具、六节点闭环。',
    stance: '这页把工具立住。',
    point: '先讲痛点，再落到阅信智核官和底部闭环。',
    avoid: '不要把下一页的收入和竞赛数字提前念。',
    lines: [
      '与此同时，我承担着阅信月度考核结算相关工作。',
      '在25年，我和团队发现传统流程存在核心痛点：业务涉及稽核、考核、拆账多环节，涉及合同数量多、类别杂，整体处理效率低、容易出错。',
      '针对这些痛点，结合大模型技术，基于苍穹平台，我主导开发“阅信智核官”数字员工工具，覆盖全流程自动化。',
      '该工具串联6大业务节点：可实现自动校对材料、生成考核结算材料、生成邮件、下发快签等，形成完整业务闭环。真正把业务难点转化为了可落地的智能提效工具。',
    ],
  },
  {
    id: 7,
    title: '成效和认可',
    seconds: 50,
    job: '用数把上一页钉死，竞赛一句带过。',
    stance: '整场高潮。看人，放慢数字。',
    point: '左手服务量和收入，右手竞赛第一。不要念表格。',
    avoid: '不要再重复痛点和六节点。',
    lines: [
      '阅信智核官数字员工现在全面支撑业务实现月月稽核、月月考核、月月结算，每月产出可量化的业务成果，在去年年底获得公司 AI 应用技能竞赛赛道第一。',
      '25年累计覆盖12个月共95条考核记录，支撑 42.17亿次解析条数的结算工作，2025年全年完成1500万元BC收入、7629万元下游结算，2026年前8月完成896万元BC收入、1979万元下游结算，业务量级清晰可控。',
      '工具层面累计完成1300余次数据校对，生成文档700余份，发送考核邮件60余封，还推动签署接口扩容，支持三种下发方式。',
      '目前，该数字员工还在持续迭代，新增拆账功能、升级数据可视化，引入开源Agent框架等。',
    ],
  },
  {
    id: 8,
    title: '项目管理',
    seconds: 50,
    job: '甄选、科创、团青三条都报完。',
    stance: '按口播稿收口，不加发挥。',
    point: '点一下地图，右边科创，最后团支部。',
    avoid: '不要念各省份。超时就改成压缩稿。',
    lines: [
      '在24年，在我转岗项目管理后，跳出单一技术职责范围，在多个领域拓展能力边界，全面提升综合履职素养。',
      'DICT甄选及阅信招募方面，我负责完成22项甄选任务，覆盖10省13地市，合作伙伴超20家，单项目平均交付周期控制在2周内，同步完成6份核心合同支撑，累计落地规模超1500万元，保障业务顺利推进。',
      '科创管理方面，我负责科室接口工作，推动成果输出，任期内科室斩获公司级奖项11项、集团级奖项2项、外部奖项4项，8项专利通过集团评审，完成科创成果沉淀。',
      '此外，我还兼任部门团支部组织委员，落实组织要求，推进理论学习与品牌活动建设，任职期内个人获评优秀团干部，所在支部获评集团红旗团支部。',
    ],
    cutLines: [
      '24年转岗项目管理后，完成22项甄选，覆盖10省13地市，6份合同落地超1500万元。科创接口期间公司级奖11项、集团级2项。团支部工作按职责完成，个人获评优秀团干部。',
    ],
  },
  {
    id: 9,
    title: '不足和改进',
    seconds: 30,
    job: '认安全、合规、稳定性，再给下一棒。',
    stance: '有下一棒，不是认错。',
    point: '底部三个灰框从左说到右。',
    avoid: '不要连续道歉，不要把口播稿改成自我批评。',
    lines: [
      '本次合同期内，我在持续提升业务处理效率、推进数字化和智能化应用的同时，反思自身，还需对安全风险、合规要求及系统稳定性的系统性进一步加强。',
      '未来我将继续围绕“AI技术+业务落地”进行投入，持续追踪大模型、Agent等前沿技术，沉淀可复用验证经验；强化项目全链路管理，将技术能力转化为稳定交付成果，持续拓展自身能力边界，为 AI技术与通信能力的融合助力。',
    ],
  },
  {
    id: 10,
    title: '收束',
    seconds: 6,
    job: '停住。把时间留给评委提问。',
    stance: '收得干净。',
    point: '看评委，不要补一句。',
    avoid: '不要再补充“其实我还做了很多”。',
    lines: [
      '以上就是我本次劳动合同续签的全部述职内容。',
      '请各位领导批评指正。',
    ],
  },
].map((page) => Object.freeze({
  ...page,
  slideSrc: contractRenewalSlideSrc(page.id),
  lines: Object.freeze(page.lines),
  cutLines: page.cutLines ? Object.freeze(page.cutLines) : null,
})))

export const CONTRACT_RENEWAL_NUMBERS = Object.freeze([
  { label: '通信能力', value: '16 项', note: '三轮测试，首批专家类智能体' },
  { label: '开物验收', value: '已通过', note: '个人通信智能体，待码号申请' },
  { label: '考核记录', value: '95 条', note: '覆盖 12 个月' },
  { label: '解析条数', value: '42.17 亿次', note: '2025 年结算服务量' },
  { label: '2025 年 BC 收入', value: '1500 万', note: '下游结算 7629 万' },
  { label: '2026 年 1—8 月', value: '896 万', note: '下游结算 1979 万' },
  { label: '工具产出', value: '1300 次校对', note: '文档 700 余份，邮件 60 余封' },
  { label: '竞赛成绩', value: '赛道第一', note: '公司 AI 应用技能竞赛' },
  { label: 'DICT 甄选', value: '22 项', note: '10 省 13 地市，落地超 1500 万' },
  { label: '科创成果', value: '公司级 11 项', note: '集团级 2 项，外部 4 项，专利 8 项' },
])

export const CONTRACT_RENEWAL_QUESTIONS = Object.freeze([
  {
    id: 'role',
    q: '这些智能体，你具体做了哪一层？',
    a: '通信专家智能体是我搭的，基于 WorkBuddy 手搓，16 项能力整合和三轮测试问题我跟到底。开物个人通信智能体是协助推进，我做 Dify、OpenClaw 方案适配、工作流和 CTC 测试协同。',
  },
  {
    id: 'security',
    q: '数字员工是你一个人做的吗？安全怎么保证？',
    a: '阅信智核官是我主导开发的，业务规则和结算流程我最熟。权限、数据安全和系统稳定性是下一阶段要加硬的，不会为了快把口子留着。',
  },
  {
    id: 'channel',
    q: '群聊通道什么时候能用？',
    a: '现在还不能说已经上线。当前聚焦打通 WorkBuddy 开发者平台 Channel，MCP-CLI、ACP 已验证短信端口调用模型和工具，9 月开放平台材料在配合认证。下一步是从单次调用升到会话介入，先把边界收住。',
  },
  {
    id: 'savings',
    q: '工具到底省了多少时间？',
    a: '口播稿报的是可量化产出：月月稽核、考核、结算，95 条记录，1300 余次校对、700 余份文档、60 余封邮件。如果问到周期，对照原来人工流程，稽核大约 8 人天、考核大约 10 人天。',
  },
  {
    id: 'revenue',
    q: '为什么结算比收入大？',
    a: '阅信是结算型业务。BC 收入是我们这边确认的，下游结算是按合同给下游的，不是同一个口径。',
  },
  {
    id: 'next',
    q: '下一期合同你想干什么？',
    a: '阅信工具继续迭代，拆账、可视化和开源 Agent 框架还要做。新消息这边继续把 Channel 和会话介入做可控，安全和权限走在功能前面。',
  },
])

function trimText(value, fallback, max) {
  const next = String(value ?? '').trim()
  if (!next) return fallback
  return next.slice(0, max)
}

function trimLines(value, fallback, maxItems = 20, maxChars = 2000) {
  if (!Array.isArray(value)) return [...fallback]
  const lines = value
    .map((line) => String(line || '').trim().slice(0, maxChars))
    .filter(Boolean)
    .slice(0, maxItems)
  return lines.length ? lines : [...fallback]
}

function trimSeconds(value, fallback) {
  const number = Number.parseInt(value, 10)
  if (!Number.isFinite(number)) return fallback
  return Math.min(180, Math.max(5, number))
}

export function minutesToBriefingSeconds(minutes) {
  const number = Number.parseInt(minutes, 10)
  if (!Number.isFinite(number)) return CONTRACT_RENEWAL_TOTAL_SECONDS
  return Math.min(CONTRACT_RENEWAL_MAX_MINUTES, Math.max(CONTRACT_RENEWAL_MIN_MINUTES, number)) * 60
}

export function briefingMinutes(totalSeconds = CONTRACT_RENEWAL_TOTAL_SECONDS) {
  return Math.round(Math.max(0, Number(totalSeconds) || 0) / 60)
}

export function briefingRemainingMs(elapsedMs, totalSeconds = CONTRACT_RENEWAL_TOTAL_SECONDS) {
  return Math.max(0, (Number(totalSeconds) || 0) * 1000 - Math.max(0, Number(elapsedMs) || 0))
}

export function briefingEndingSoon(remainingMs, warnSeconds = CONTRACT_RENEWAL_WARN_SECONDS) {
  return remainingMs > 0 && remainingMs <= warnSeconds * 1000
}

export function briefingTimedOut(remainingMs) {
  return remainingMs <= 0
}

export function textFromBriefingLines(lines = []) {
  return (Array.isArray(lines) ? lines : []).join('\n')
}

export function linesFromBriefingText(text) {
  return String(text || '')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function overlayPage(page, overlay = {}) {
  const cutSource = overlay.cutLines === undefined ? page.cutLines : overlay.cutLines
  let cutLines = null
  if (Array.isArray(cutSource)) {
    const cleaned = cutSource.map((line) => String(line || '').trim().slice(0, 2000)).filter(Boolean).slice(0, 12)
    cutLines = cleaned.length ? cleaned : null
  } else if (page.cutLines) {
    cutLines = [...page.cutLines]
  }
  return {
    id: page.id,
    title: trimText(overlay.title, page.title, 40),
    seconds: trimSeconds(overlay.seconds, page.seconds),
    job: trimText(overlay.job, page.job, 80),
    stance: trimText(overlay.stance, page.stance, 80),
    point: trimText(overlay.point, page.point, 160),
    avoid: trimText(overlay.avoid, page.avoid, 160),
    lines: trimLines(overlay.lines, page.lines),
    cutLines,
    slideSrc: contractRenewalSlideSrc(page.id),
  }
}

export function normalizeContractRenewalBriefing(input = {}) {
  const pagesInput = Array.isArray(input.pages) ? input.pages : []
  const pagesById = new Map(pagesInput.map((page) => [Number(page?.id), page]))
  const questionsInput = Array.isArray(input.questions) ? input.questions : []
  const questionsById = new Map(questionsInput.map((item) => [String(item?.id || ''), item]))
  const numbersInput = Array.isArray(input.numbers) ? input.numbers : []

  return {
    title: trimText(input.title, CONTRACT_RENEWAL_TITLE, 20),
    deck: trimText(input.deck, CONTRACT_RENEWAL_DECK, 80),
    totalSeconds: minutesToBriefingSeconds(briefingMinutes(input.totalSeconds || CONTRACT_RENEWAL_TOTAL_SECONDS)),
    pages: CONTRACT_RENEWAL_PAGES.map((page) => overlayPage(page, pagesById.get(page.id) || {})),
    questions: CONTRACT_RENEWAL_QUESTIONS.map((item) => {
      const overlay = questionsById.get(item.id) || {}
      return {
        id: item.id,
        q: trimText(overlay.q, item.q, 160),
        a: trimText(overlay.a, item.a, 800),
      }
    }),
    numbers: CONTRACT_RENEWAL_NUMBERS.map((item, index) => {
      const overlay = numbersInput[index] || {}
      return {
        label: trimText(overlay.label, item.label, 20),
        value: trimText(overlay.value, item.value, 24),
        note: trimText(overlay.note, item.note, 80),
      }
    }),
  }
}

export function defaultContractRenewalBriefing() {
  return normalizeContractRenewalBriefing({})
}

export function cloneContractRenewalBriefing(input) {
  return normalizeContractRenewalBriefing(input || {})
}

export function serializeContractRenewalBriefing(input) {
  const briefing = normalizeContractRenewalBriefing(input)
  return {
    title: briefing.title,
    deck: briefing.deck,
    totalSeconds: briefing.totalSeconds,
    pages: briefing.pages.map((page) => ({
      id: page.id,
      title: page.title,
      seconds: page.seconds,
      job: page.job,
      stance: page.stance,
      point: page.point,
      avoid: page.avoid,
      lines: [...page.lines],
      cutLines: page.cutLines ? [...page.cutLines] : null,
    })),
    questions: briefing.questions.map((item) => ({ id: item.id, q: item.q, a: item.a })),
    numbers: briefing.numbers.map((item) => ({ label: item.label, value: item.value, note: item.note })),
  }
}

export function escapeBriefingHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function printLines(lines) {
  return (lines || []).map((line) => `<p>${escapeBriefingHtml(line)}</p>`).join('')
}

export function buildContractRenewalPrintHtml(input) {
  const briefing = normalizeContractRenewalBriefing(input)
  const pages = briefing.pages.map((page) => `
    <section class="page">
      <h2>第 ${page.id} 页　${escapeBriefingHtml(page.title)}　<span>${page.seconds} 秒</span></h2>
      ${page.job ? `<p class="meta">${escapeBriefingHtml(page.job)}</p>` : ''}
      ${printLines(page.lines)}
      ${page.cutLines?.length ? `<h3>压缩稿</h3>${printLines(page.cutLines)}` : ''}
    </section>
  `).join('')
  const questions = briefing.questions.map((item) => `
    <section class="qa">
      <h3>${escapeBriefingHtml(item.q)}</h3>
      <p>${escapeBriefingHtml(item.a)}</p>
    </section>
  `).join('')
  const numbers = briefing.numbers.map((item) => `
    <li><strong>${escapeBriefingHtml(item.label)}</strong>　${escapeBriefingHtml(item.value)}　<span>${escapeBriefingHtml(item.note)}</span></li>
  `).join('')

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>${escapeBriefingHtml(briefing.title)} 打印稿</title>
  <style>
    @page { size: A4; margin: 16mm 16mm 18mm; }
    html, body {
      margin: 0;
      color: #111;
      background: #fff;
      font-family: "Songti SC", "STSong", "SimSun", serif;
      font-size: 12.5pt;
      line-height: 1.7;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    h1, h2, h3 { font-family: "Heiti SC", "STHeiti", "SimHei", sans-serif; }
    h1 { font-size: 20pt; margin: 0 0 6pt; }
    h2 { font-size: 13.5pt; margin: 18pt 0 8pt; page-break-after: avoid; }
    h2 span, .deck, .meta { font-weight: 400; color: #555; }
    h3 { font-size: 12pt; margin: 10pt 0 4pt; }
    p { margin: 0 0 8pt; }
    .deck, .meta { font-size: 11pt; margin: 0 0 4pt; }
    .page, .qa { break-inside: avoid; page-break-inside: avoid; }
    ul { padding-left: 1.2em; }
    li span { color: #555; }
    @media print { a { color: inherit; text-decoration: none; } }
  </style>
</head>
<body>
  <header>
    <h1>${escapeBriefingHtml(briefing.title)}</h1>
    <p class="deck">${escapeBriefingHtml(briefing.deck)}　倒计时 ${briefingMinutes(briefing.totalSeconds)} 分钟</p>
  </header>
  ${pages}
  <h2>答问</h2>
  ${questions}
  <h2>数字</h2>
  <ul>${numbers}</ul>
</body>
</html>`
}
