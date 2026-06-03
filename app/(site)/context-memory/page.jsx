import MemoryVault from './MemoryVault'

const memoryLayers = [
  {
    level: 'L1',
    title: '常驻核心提示语',
    shortTitle: '核心提示',
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
    accentClassName: 'border-l-[#b7791f] dark:border-l-[#d69e4a]',
    badgeClassName: 'bg-[#f7efe0] text-[#8a5a14] dark:bg-[#2a2115] dark:text-[#e2bd75]',
    dotClassName: 'bg-[#b7791f] dark:bg-[#d69e4a]',
  },
  {
    level: 'L2',
    title: '当前上下文 Context',
    shortTitle: '当前任务',
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
    accentClassName: 'border-l-[#2f7d68] dark:border-l-[#65b69f]',
    badgeClassName: 'bg-[#e2f1ec] text-[#22715c] dark:bg-[#14332b] dark:text-[#83d0bb]',
    dotClassName: 'bg-[#2f7d68] dark:bg-[#65b69f]',
  },
  {
    level: 'L3',
    title: 'Session 会话级总结',
    shortTitle: '阶段沉淀',
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
    accentClassName: 'border-l-[#5366a6] dark:border-l-[#91a4df]',
    badgeClassName: 'bg-[#e7ebf7] text-[#465992] dark:bg-[#1c2744] dark:text-[#aebdec]',
    dotClassName: 'bg-[#5366a6] dark:bg-[#91a4df]',
  },
  {
    level: 'L4',
    title: '长期用户画像 Memory',
    shortTitle: '长期画像',
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
    accentClassName: 'border-l-[#9a4558] dark:border-l-[#dd8fa1]',
    badgeClassName: 'bg-[#f3e3e7] text-[#9a4558] dark:bg-[#3a2028] dark:text-[#eba6b5]',
    dotClassName: 'bg-[#9a4558] dark:bg-[#dd8fa1]',
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
    <main className="context-memory-page w-full max-w-[1120px] mx-auto px-4 py-10">
      <header className="mb-8 border-b border-[#e5dccd] pb-8 dark:border-[#253140]">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#8f8069] dark:text-[#9ca5b5]">
              Agent Readable Personal Memory
            </p>
            <h1 className="mt-3 max-w-3xl font-serif text-2xl font-semibold tracking-wide text-[#221f19] dark:text-gray-100 md:text-3xl">
              我的 4 层上下文记忆
            </h1>
            <p className="mt-4 max-w-3xl text-[15px] leading-8 text-[#5d554a] dark:text-gray-300">
              把职业、创作、社区、家庭与成长系统整理成一套可复用的个人记忆结构。它既给智能体读取，也给自己每天重新校准方向。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4 lg:grid-cols-2">
            {memoryLayers.map((layer) => (
              <div
                key={`${layer.level}-summary`}
                className="rounded-lg border border-[#e5dccd] bg-white/70 px-3 py-3 dark:border-[#253140] dark:bg-[#111820]"
              >
                <div className="font-mono text-[11px] font-semibold text-[#8f8069] dark:text-[#8ea0b7]">{layer.level}</div>
                <div className="mt-1 font-medium text-[#2d261d] dark:text-gray-100">{layer.shortTitle}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <section aria-label="上下文记忆层级" className="space-y-4">
        {memoryLayers.map((layer) => (
          <article
            key={layer.level}
            className={`rounded-lg border border-[#e6dfd2] border-l-4 bg-white/80 p-4 shadow-[0_10px_34px_rgba(82,69,45,0.04)] dark:border-[#253140] dark:bg-[#111820]/90 ${layer.accentClassName}`}
          >
            <div className="grid gap-4 lg:grid-cols-[12rem_minmax(0,1fr)]">
              <div>
                <span className={`inline-flex rounded-md px-2 py-1 font-mono text-[11px] font-semibold ${layer.badgeClassName}`}>
                  {layer.level}
                </span>
                <h2 className="mt-3 text-lg font-semibold text-[#221f19] dark:text-gray-100">{layer.title}</h2>
                <p className="mt-2 text-sm leading-7 text-[#665e53] dark:text-gray-300">{layer.personalTerm}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-px flex-1 bg-[#ebe5d8] dark:bg-[#253140]" />
                    <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#8f8069] dark:text-[#8ea0b7]">
                      个人侧
                    </span>
                  </div>
                  <ul className="mt-3 space-y-2">
                    {layer.items.map((item) => (
                      <li key={item} className="flex gap-2 text-sm leading-7 text-[#5f5a4d] dark:text-gray-300">
                        <span className={`mt-3 h-1.5 w-1.5 shrink-0 rounded-full ${layer.dotClassName}`} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-[#ebe5d8] pt-4 dark:border-[#253140] md:border-l md:border-t-0 md:pl-4 md:pt-0">
                  <div className="flex items-center gap-2">
                    <span className="h-px flex-1 bg-[#ebe5d8] dark:bg-[#253140]" />
                    <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#61748a] dark:text-[#8ea0b7]">
                      智能体侧
                    </span>
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-[#27384b] dark:text-gray-100">{layer.agentTerm}</h3>
                  <p className="mt-2 text-sm leading-7 text-[#5d6875] dark:text-gray-300">
                    {layer.purpose}
                  </p>
                  <div className="mt-3 space-y-1 border-l border-[#d8e0e7] pl-3 text-xs leading-6 text-[#667789] dark:border-[#2a3a4a] dark:text-gray-400">
                    <p>{layer.rule}</p>
                    <p>{layer.standard}</p>
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* L5：真实运行中的记忆样本（加密 + 版本） */}
      <section
        aria-label="L5 实际运行中的记忆样本"
        className="mt-10 rounded-lg border border-l-4 border-[#e6dfd2] border-l-[#4a5560] bg-white/80 p-4 shadow-[0_10px_34px_rgba(82,69,45,0.04)] dark:border-[#253140] dark:border-l-[#7a8696] dark:bg-[#111820]/90"
      >
        <div className="grid gap-4 lg:grid-cols-[12rem_minmax(0,1fr)]">
          <div>
            <span className="inline-flex rounded-md bg-[#e8eaec] px-2 py-1 font-mono text-[11px] font-semibold text-[#3a4450] dark:bg-[#1f2935] dark:text-[#aebcce]">
              L5
            </span>
            <h2 className="mt-3 text-lg font-semibold text-[#221f19] dark:text-gray-100">
              实际运行中的记忆样本
            </h2>
            <p className="mt-2 text-sm leading-7 text-[#665e53] dark:text-gray-300">
              上面四层是理念，这一层是 Claude Code / 仓库 ai-context/ 里真实写下的内容快照。AES-GCM 加密上传，带版本时间线，密码只在我自己的浏览器里解密。
            </p>
          </div>
          <div className="space-y-4">
            <div className="rounded-md border border-dashed border-[#d6cdb8] bg-[#fbf6ec] px-3 py-2 text-xs leading-6 text-[#7c6643] dark:border-[#33425a] dark:bg-[#0a1119] dark:text-[#a9b3c4]">
              本板块是「自用 + 透明感」并存：访客能看到「这里有几个记忆文件、各更新过多少版」，但具体内容必须密码解密。
              密文已随仓库 push，未授权方读到的只是 base64 噪声。
            </div>
            <MemoryVault />
          </div>
        </div>
      </section>
    </main>
  )
}
