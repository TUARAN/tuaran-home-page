export const CONTRACT_RENEWAL_TOTAL_SECONDS = 300
export const CONTRACT_RENEWAL_TITLE = '续签述职'
export const CONTRACT_RENEWAL_DECK = '智能消息室 · 合同续签答辩 v1.3'
export const CONTRACT_RENEWAL_SLIDE_DIR = '/admin/contract-renewal/slides'

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
    seconds: 15,
    job: '报身份，先把结果立住。',
    stance: '稳、短、不客套。',
    point: '看评委，不要看标题。',
    avoid: '不要加感谢词，不要预告“我分五部分详细汇报”。',
    lines: [
      '各位领导好，我是智能消息室涂阿燃。',
      '这一期合同，智能体用起来了，阅信结算跑起来了，项目也收得住。',
    ],
  },
  {
    id: 2,
    title: '目录',
    seconds: 12,
    job: '画出路线，立刻翻页。',
    stance: '带路，不念目录。',
    point: '手从 1 扫到 5，停在“成果”上。',
    avoid: '不要把五条目录逐条念完。',
    lines: [
      '五块内容，重点听成果：智能体、阅信数字员工、项目管理。',
      '最后说下一阶段怎么把边界管住。',
    ],
  },
  {
    id: 3,
    title: '三条主线',
    seconds: 40,
    job: '让人看见一条成长路径，不是三堆杂事。',
    stance: '总览只讲骨架。',
    point: '时间轴扫到红点，再点下面三张卡片，最后扫底下一排箭头。',
    avoid: '不要把三张卡片里的小点再念一遍。',
    lines: [
      '合同期从 2023 年 10 月到现在。我从开发转到项目，三条线并行。',
      '左边，新消息和智能体，把通信能力接到智能体上。',
      '中间，阅信考核，把重复劳动做成工具。',
      '右边，项目管理。底下一排就是路径：项目跑顺，工具做出来，再接到智能体上。',
    ],
  },
  {
    id: 4,
    title: '两个智能体',
    seconds: 50,
    job: '一个已经能用，一个已经过验收。',
    stance: '报结果，不报名词。',
    point: '先指左边 16 项，再指右边 100%。',
    avoid: '不要展开 Dify、OpenClaw、MCP、Skill。',
    lines: [
      '通信服务专家是我在 WorkBuddy 上搭的。',
      '新通信、139 邮箱、云盘，一共 16 项能力一个入口。',
      '三轮专项测试过了，公司首批专家类智能体，点开链接就能用。',
      '个人通信智能体配合联创，品质部 CTC 验收通过率 100%，已经具备上线条件。',
      '码号申请按流程在推进。',
    ],
  },
  {
    id: 5,
    title: '群聊通道',
    seconds: 28,
    job: '说明下一棒在推进，不是已经上线。',
    stance: '交代进度，不讲协议。',
    point: '顺着上面箭头扫过去，再点三行进度。',
    avoid: '不要解释 MCP、ACP 是什么。超时就改成一句。',
    lines: [
      '群聊智能体是下一棒。要进新消息群里干活，还要保住会话和上下文。',
      '命令行已经打通，模型和工具都能跑。',
      '正式通道在验授权和权限，开放平台材料同步在准备。',
    ],
    cutLines: ['群聊还在推进。命令行已经打通，正式通道和开放平台接入还在验证。'],
  },
  {
    id: 6,
    title: '阅信智核官',
    seconds: 42,
    job: '痛点、工具、底部四个数。',
    stance: '这页要能算账。',
    point: '不要讲中间六步。手指落在最底下那条结果栏。',
    avoid: '不要把流程图当正文念。',
    lines: [
      '阅信考核结算我一直在扛。原来合同多、环节多，对表、出材料、找人签，一套要 20 天。',
      '阅信智核官把校对、材料、邮件、电子签收成工具。',
      '周期 20 天收到 5 天，效率提升 70% 以上，一个月省 18 个人天、3.8 万成本。',
    ],
  },
  {
    id: 7,
    title: '成效和认可',
    seconds: 52,
    job: '用数把上一页钉死，竞赛一句带过。',
    stance: '整场高潮。看人，放慢数字。',
    point: '左手服务量和收入，右手竞赛第一。不要念表格。',
    avoid: '不要再重复 20 天到 5 天。不要念别人的项目名。',
    lines: [
      '结果对得上数。12 个月考核 95 条记录，服务量 42.17 亿次。',
      '2025 年 BC 收入 1500 万，下游结算 7629 万。今年 1 到 8 月收入 896 万，结算 1979 万。',
      '工具累计校对 1300 多次、生成文档 700 多份，月月稽核、月月考核、月月结算。',
      '公司 AI 竞赛产品市场方向第一，项目拿了卓越奖。',
    ],
  },
  {
    id: 8,
    title: '项目管理',
    seconds: 24,
    job: '证明项目也能收口。',
    stance: '收得住，不展开。',
    point: '点一下地图，右边科创一句。',
    avoid: '不要念各省份。团青一句就够。',
    lines: [
      '2024 年完成 22 项 DICT 甄选，覆盖 10 省 13 地市，平均两周一项，协同 6 份阅信招募合同。',
      '科室科创接口期间，公司级奖 11 项、集团级 2 项。团支部换届按职责完成。',
    ],
    cutLines: ['22 项甄选，10 省 13 地市，科创和团青工作按职责做完了。'],
  },
  {
    id: 9,
    title: '不足和改进',
    seconds: 28,
    job: '认一个短板，给一个改法。',
    stance: '有下一棒，不是认错。',
    point: '底部三个灰框从左说到右。四个阶段不要再讲。',
    avoid: '不要连续道歉，不要说自己还差得很远。',
    lines: [
      '效率已经做上来。下一阶段把权限、数据安全和外部调用边界管住，再往前铺模型和通道。',
      '模型、能力和通道接入，都按这个顺序走：先可控，再加快。',
    ],
  },
  {
    id: 10,
    title: '收束',
    seconds: 9,
    job: '停住。把时间留给评委提问。',
    stance: '收得干净。',
    point: '看评委，不要补一句。',
    avoid: '不要再补充“其实我还做了很多”。',
    lines: ['汇报完毕，请领导指正。'],
  },
].map((page) => Object.freeze({
  ...page,
  slideSrc: contractRenewalSlideSrc(page.id),
  lines: Object.freeze(page.lines),
  cutLines: page.cutLines ? Object.freeze(page.cutLines) : null,
})))

export const CONTRACT_RENEWAL_NUMBERS = Object.freeze([
  { label: '通信能力', value: '16 项', note: '三轮测试，首批专家类智能体' },
  { label: 'CTC 验收', value: '100%', note: '个人通信智能体，具备上线条件' },
  { label: '考核周期', value: '20 天 → 5 天', note: '效率提升 70% 以上' },
  { label: '月省投入', value: '18 人天 / 3.8 万', note: '稽核 8 人天 + 考核 10 人天' },
  { label: '考核记录', value: '95 条', note: '覆盖 12 个月' },
  { label: '服务量', value: '42.17 亿次', note: '五厘四合同口径' },
  { label: '2025 年 BC 收入', value: '1500 万', note: '下游结算 7629 万' },
  { label: '2026 年 1—8 月', value: '896 万', note: '下游结算 1979 万' },
  { label: '竞赛成绩', value: '产品市场第一', note: '阅信智核官，卓越奖' },
  { label: 'DICT 甄选', value: '22 项', note: '10 省 13 地市，平均两周一项' },
])

export const CONTRACT_RENEWAL_QUESTIONS = Object.freeze([
  {
    id: 'role',
    q: '这些智能体，你具体做了哪一层？',
    a: '通信服务专家是我搭的，能力整合和三轮测试问题我跟到底。个人通信智能体是配合联创和品质部，我做方案适配、测试和验收协同。',
  },
  {
    id: 'security',
    q: '数字员工是你一个人做的吗？安全怎么保证？',
    a: '业务规则和结算流程我最熟，工具是我把重复操作收进去的。权限、数据边界和稳定性是下一阶段要加硬的，不会为了快把口子留着。',
  },
  {
    id: 'channel',
    q: '群聊通道什么时候能用？',
    a: '现在还不能说已经上线。命令行验证过了，正式通道还在验授权、消息通道和权限边界。开放平台材料在准备，下一步是把边界收住再接入。',
  },
  {
    id: 'savings',
    q: '70%、18 人天、3.8 万，口径是什么？',
    a: '对比的是原来纯人工流程。稽核大约 8 人天，考核大约 10 人天，合在一起一个月大约 18 人天。周期从 20 天收到 5 天，对应效率提升 70% 以上。3.8 万按人力成本折。',
  },
  {
    id: 'revenue',
    q: '为什么结算比收入大？',
    a: '阅信是结算型业务。BC 收入是我们这边确认的，下游结算是按合同给下游的，不是同一个口径。',
  },
  {
    id: 'next',
    q: '下一期合同你想干什么？',
    a: '阅信工具继续稳，拆账和可视化还要做。新消息这边，重点把群聊智能体接入做可控，安全和权限走在功能前面。',
  },
])
