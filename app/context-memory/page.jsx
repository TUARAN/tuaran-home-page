import { Fragment } from 'react'

const memoryLayers = [
  {
    level: 'L1',
    title: '常驻核心提示语',
    agentTerm: 'Prompt Memory / 核心指令层',
    personalTerm: '人生底层定位、不变人设、终身原则',
    purpose: '每次做事前先锚定“我是谁、我要往哪走、哪些原则不能被短期事务冲掉”。',
    items: [
      '身份：国企资深从业者 + AI 技术博主 + 创业者 + 宝爸。',
      '原则：长期主义，沉淀大于短期收益，技术深耕与社群资源两手抓。',
      '使命：帮前端转 AI Agent，做靠谱的博主联盟资源对接，落地数字员工行业方案，给家庭稳稳兜底。',
    ],
    rule: '每次会话必加载，容量小、优先级最高、长期不变。',
    standard: '行业对应：Hermes Prompt Memory；MemGPT Core Memory。',
    personalClassName: 'border-[#e8dcc8] bg-[#fffaf2] dark:border-[#3a342a] dark:bg-[#171410]',
    personalBadgeClassName: 'bg-[#f2e5cc] text-[#8a5a14] dark:bg-[#2b2418] dark:text-[#e5c487]',
    agentClassName: 'border-[#e1d2b8] bg-[#fff8ea] dark:border-[#3b3325] dark:bg-[#19150d]',
    agentBadgeClassName: 'bg-[#eddcb8] text-[#7a4e0c] dark:bg-[#302717] dark:text-[#e7c06e]',
  },
  {
    level: 'L2',
    title: '当前上下文 Context',
    agentTerm: 'Working Memory / 当前会话窗口',
    personalTerm: '今天当下正在推进的事、手头紧急任务、临时输入',
    purpose: '只装当前几天要落地的具体事务，帮助智能体判断现在应该先处理什么。',
    items: [
      '组织内项目：消息平台、数字员工方案、跨团队协作与落地推进。',
      '智能体研发：Codex / Claude Code / OpenClaw、Skill 调度、记忆层架构、本地大模型落地。',
      '创作与社区：写稿、发资讯、社群维护、博主联盟资源对接。',
      '家庭：共同育儿、家庭沟通、日常节奏协调。',
    ],
    rule: '滑动窗口滚动更新，过期就清理，不把临时任务伪装成长期方向。',
    standard: '行业对应：MemGPT Working Memory；实时上下文窗口。',
    personalClassName: 'border-[#cfe4dd] bg-[#f3fbf7] dark:border-[#263a34] dark:bg-[#0f1916]',
    personalBadgeClassName: 'bg-[#d9eee6] text-[#22715c] dark:bg-[#17342c] dark:text-[#88d1bd]',
    agentClassName: 'border-[#bddbd2] bg-[#edf8f4] dark:border-[#254139] dark:bg-[#0d1d19]',
    agentBadgeClassName: 'bg-[#cce6de] text-[#17624f] dark:bg-[#163d33] dark:text-[#79c8b2]',
  },
  {
    level: 'L3',
    title: 'Session 会话级总结',
    agentTerm: 'Session Summary / 短期情景记忆',
    personalTerm: '本周、本月、项目周期的阶段性沉淀',
    purpose: '每开启一个新周期，都能自动承接上一段进度，不用每天从零开始内耗。',
    items: [
      '本周主业推进了什么，卡点在哪里。',
      '智能体架构落到第几阶段，还有哪些待优化。',
      '专栏更新了几篇，星球和社群沉淀了多少资讯。',
      '博主联盟对接了多少资源，达成什么合作。',
      '家庭关系、带娃节奏有什么变化，需要怎么调整。',
    ],
    rule: '每个会话周期压缩成摘要，跨天、跨周、跨项目复用。',
    standard: '行业对应：Hermes Session Search；MemGPT Recall Memory。',
    personalClassName: 'border-[#d9d8ec] bg-[#f7f7ff] dark:border-[#32324a] dark:bg-[#121323]',
    personalBadgeClassName: 'bg-[#e3e1f5] text-[#5550a0] dark:bg-[#26264a] dark:text-[#b8b5f0]',
    agentClassName: 'border-[#c9c8e5] bg-[#f1f2ff] dark:border-[#34345a] dark:bg-[#11152b]',
    agentBadgeClassName: 'bg-[#d6d5f0] text-[#474294] dark:bg-[#28295a] dark:text-[#aaa7ea]',
  },
  {
    level: 'L4',
    title: '长期用户画像 Memory',
    agentTerm: 'User Profile / Archival Memory / 长期记忆',
    personalTerm: '个人终身成长档案、能力栈、资源圈、家庭结构、性格特质',
    purpose: '把会长期影响决策的稳定信息结构化保存，越积越厚，越用越懂你。',
    items: [
      '能力：前端底层、AI Agent 架构、大模型落地、政企方案、商务对接、内容创作。',
      '资源：博主圈、大厂人脉、企业对公 / 财税资源、本地生活圈层。',
      '家庭：家庭结构、孩子成长节点、压力来源、相处模式。',
      '性格：爱深度思考，喜欢梳理架构，习惯复盘，责任感强，容易内耗但愿意扛事。',
    ],
    rule: '结构化存储，长期有效，动态更新，用来支撑个性化判断。',
    standard: '行业对应：Hermes User Profile；MemGPT Archival Memory。',
    personalClassName: 'border-[#ead2d8] bg-[#fff6f7] dark:border-[#4a2e36] dark:bg-[#1e1015]',
    personalBadgeClassName: 'bg-[#f2dde2] text-[#9a4558] dark:bg-[#3b202a] dark:text-[#e8a6b5]',
    agentClassName: 'border-[#e0c2ca] bg-[#fff0f3] dark:border-[#56313c] dark:bg-[#241018]',
    agentBadgeClassName: 'bg-[#ebcbd4] text-[#87364b] dark:bg-[#47212d] dark:text-[#e496a8]',
  },
]

export const dynamic = 'force-static'

export const metadata = {
  title: '我的上下文记忆',
  description: '写给智能体读取的涂阿燃四层个人上下文记忆：Prompt、Context、Session 与长期 Memory。',
  alternates: {
    canonical: '/context-memory',
  },
}

export default function ContextMemoryPage() {
  return (
    <main className="context-memory-page w-full max-w-6xl mx-auto px-4 py-10">
      <header className="mb-10 border-b border-[#eee] pb-6 dark:border-gray-800">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#9c8f79] dark:text-[#9ca5b5]">
          Agent Readable Personal Memory
        </p>
        <h1 className="mt-3 font-serif text-2xl font-semibold tracking-wide text-[#222] dark:text-gray-100 md:text-3xl">
          我的 4 层上下文记忆：把自己当成一个高级个人智能体来运营
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[#666] dark:text-gray-300">
          这个页面写给智能体，也写给每天醒来要重新定位自己的我。它把个人的职业、创作、社区、家庭与成长系统，直接对齐到智能体的四层记忆模型：常驻提示语、当前上下文、会话总结、长期画像。
        </p>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-[#666] dark:text-gray-300">
          新开一天，就是新开一个 Session，读取长期画像，加载常驻提示语，接上上一段会话总结，再进入当前上下文直接推进。
        </p>
      </header>

      <section>
        <div>
          <div className="grid gap-3 lg:grid-cols-[1fr_3.5rem_1fr]">
            <div className="rounded-lg border border-[#e5d8c2] bg-[#f7f1e7] px-4 py-4 lg:px-5 dark:border-[#352f25] dark:bg-[#171410]">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#998d76] dark:text-[#93a0b3]">
                Personal Layer
              </p>
              <h3 className="mt-2 text-lg font-semibold text-[#222] dark:text-gray-100">
                左边：我的个人四层结构
              </h3>
            </div>
            <div className="hidden items-center justify-center lg:flex">
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#9b9488] dark:text-gray-600">
                Map
              </span>
            </div>
            <div className="rounded-lg border border-[#d6e4ef] bg-[#eef5fb] px-4 py-4 lg:px-5 dark:border-[#243444] dark:bg-[#101a24]">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#668198] dark:text-[#93a0b3]">
                Agent Layer
              </p>
              <h3 className="mt-2 text-lg font-semibold text-[#222] dark:text-gray-100">
                右边：智能体的四层结构
              </h3>
            </div>
          </div>

          <div className="mt-4 grid gap-x-3 lg:grid-cols-[1fr_3.5rem_1fr]">
            {memoryLayers.map((layer, index) => (
              <Fragment key={layer.level}>
                <section
                  key={`${layer.level}-personal`}
                  className={[
                    'border-x px-4 py-5',
                    index === 0 ? 'rounded-t-xl border-t' : 'border-t',
                    index === memoryLayers.length - 1 ? 'rounded-b-xl border-b' : '',
                    layer.personalClassName,
                  ].join(' ')}
                >
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className={`rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold ${layer.personalBadgeClassName}`}>
                      {layer.level}
                    </span>
                    <h4 className="text-base font-semibold text-[#222] dark:text-gray-100">{layer.title}</h4>
                  </div>
                  <p className="mt-1 text-sm font-medium text-[#5f5a4d] dark:text-gray-300">
                    {layer.personalTerm}
                  </p>
                  <ul className="mt-3 space-y-2">
                    {layer.items.map((item) => (
                      <li key={item} className="flex gap-3 text-sm leading-7 text-[#666] dark:text-gray-300">
                        <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <div key={`${layer.level}-arrow`} className="flex items-center justify-center py-2">
                  <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-[#ded6c8] bg-white/80 px-2 font-mono text-sm font-semibold text-[#8a8172] shadow-sm dark:border-gray-700 dark:bg-[#121821] dark:text-gray-400">
                    →
                  </span>
                </div>

                <section
                  key={`${layer.level}-agent`}
                  className={[
                    'border-x px-4 py-5',
                    index === 0 ? 'rounded-t-xl border-t' : 'border-t',
                    index === memoryLayers.length - 1 ? 'rounded-b-xl border-b' : '',
                    layer.agentClassName,
                  ].join(' ')}
                >
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className={`rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold ${layer.agentBadgeClassName}`}>
                      {layer.level}
                    </span>
                    <h4 className="text-base font-semibold text-[#222] dark:text-gray-100">{layer.agentTerm}</h4>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-[#666] dark:text-gray-300">
                    {layer.purpose}
                  </p>
                  <div className="mt-3 space-y-2 text-xs leading-6 text-[#516274] dark:text-gray-400">
                    <p>{layer.rule}</p>
                    <p>{layer.standard}</p>
                  </div>
                </section>
              </Fragment>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
