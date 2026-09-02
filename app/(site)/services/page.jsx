import Image from 'next/image'
import Link from 'next/link'

import PageContainer from '../components/PageContainer'

export const dynamic = 'force-static'

export const metadata = {
  title: '合作说明 · AI 咨询、调研与内容协作',
  description:
    '涂阿燃（tuaran）的合作说明：AI 落地咨询、专题分析、技术内容协作、数字员工方案与企业内训。',
  keywords: [
    '涂阿燃',
    'tuaran',
    '合作说明',
    'AI 咨询',
    '专题分析',
    '技术内容',
    '数字员工',
    '博主联盟',
    '前端周看',
    'AI分发大师',
  ],
  alternates: { canonical: '/services' },
}

const cooperationAreas = [
  {
    title: 'AI 落地判断',
    desc: '适合已经有业务问题，但还不确定 AI 能否介入、从哪里开始、要不要自研或采购的团队。',
    output: ['场景拆解', '技术路线建议', 'PoC 范围', '风险与投入判断'],
  },
  {
    title: '专题分析',
    desc: '适合需要快速理解一家公司、一个行业、一个产品机会或一个人物脉络的产品、市场、投资与战略团队。',
    output: ['结构化报告', '来源附录', '关键判断', '不确定性说明'],
  },
  {
    title: '内容协作',
    desc: '适合 AI 产品、开发者工具、云服务和技术品牌，把复杂产品讲给真正会使用的人。',
    output: ['选题策划', '技术文章', '多平台分发', '博主联盟协作'],
  },
  {
    title: '数字员工方案',
    desc: '适合有高重复流程、跨系统操作和明确组织约束的团队，先从小流程验证，再决定是否扩大。',
    output: ['流程梳理', '原型方案', '落地文档', '培训与复盘'],
  },
]

const boundaries = [
  '不接只追热点、没有业务目标的泛泛咨询。',
  '不承诺无法验证的增长结果，只承诺交付范围内的判断、内容和执行。',
  '不替代法务、财务、医疗等专业意见，高风险决策需要你自己的专业审查。',
  '预算、周期、交付物先说清楚，再开始做。',
]

const sampleLinks = [
  { href: '/articles?tab=tech', label: '技术' },
  { href: '/articles?tab=other', label: '其他' },
  { href: '/articles?tab=companies', label: '公司观察' },
  { href: '/articles?tab=posts', label: '精选文章' },
  { href: '/works', label: '项目记录' },
]

const productLinks = [
  {
    href: 'https://blogger-alliance.cn/',
    label: '博主联盟',
    desc: 'AI 产品方与技术博主的内容协作网络',
  },
  {
    href: 'https://frontendnext.com/',
    label: '前端周看',
    desc: '前端、AI Agent 与大模型技术情报站',
  },
  {
    href: 'https://syncblog.cn/',
    label: 'AI分发大师',
    desc: '一次创作，多平台自动同步分发',
  },
]

const caseStudies = [
  {
    label: '内容系统',
    title: '把分散内容归一成可持续增长的知识库',
    problem: '文章、调研、资源和互动入口各自生长，读者难发现，维护也容易重复。',
    action: '统一 contentKey、内容索引、相关阅读、评论、阅读统计与订阅链路。',
    deliverable: '知识库、内容管线、RSS、Newsletter 与后台同步工具。',
    result: '目前统一索引 160+ 条内容，调研、资源和原创文章可以按同一套结构持续发布。',
    href: '/help#about-site',
  },
  {
    label: '开源协作',
    title: '推动 OpenClaw 图片兼容修复走到合并',
    problem: 'Anthropic 图片输入规范化存在真实兼容问题，仅提交代码不足以证明行为正确。',
    action: '定位问题、提交修复、补充行为证明，并根据机器人评审继续迭代。',
    deliverable: '代码补丁、复现说明、行为证明与完整 PR 沟通记录。',
    result: '修复成功合入 OpenClaw 主分支，并沉淀成一篇可复用的贡献流程记录。',
    href: '/articles/openclaw-pr-anthropic-image-normalization',
  },
  {
    label: 'AI 工程',
    title: '把端侧大模型做成可访问的浏览器实验',
    problem: '端侧推理涉及模型体积、浏览器兼容性、WebGPU 能力和交互反馈，概念验证难以直接交付给普通用户。',
    action: '整合浏览器端模型加载、能力检测与体验入口，并记录不同运行边界。',
    deliverable: '可访问的端侧大模型实验台与配套工程说明。',
    result: '形成持续维护的 Web LLM 页面，可直接验证浏览器端推理链路。',
    href: '/web-llm',
  },
]

export default function ServicesPage() {
  return (
    <PageContainer className="py-9 md:py-12">
      <section className="mb-12 border-b border-[#d7d6cb] pb-8 dark:border-[#27303a] md:mb-14 md:pb-10">
        <div className="grid gap-5 md:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] md:items-end">
          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.24em] text-[#858876] dark:text-[#8e9ab0]">
              Cooperation
            </p>
            <h1 className="mb-0 border-b-0 pb-0 font-serif text-[2rem] font-semibold leading-tight tracking-wide text-[#15140f] dark:text-gray-100 md:text-[2.45rem]">
              能合作的事，先摊开说清楚
            </h1>
          </div>
          <div className="max-w-[560px] md:justify-self-end">
            <p className="mb-4 text-[14px] leading-7 text-[#56564e] dark:text-[#aeb8c6]">
              我更适合做需要判断、拆解和落地执行的工作：把复杂问题整理成可验证的方案、内容或流程，而不是只给一堆抽象建议。
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="#contact"
                className="inline-flex min-h-10 items-center rounded-full bg-[#15140f] px-4 text-[13px] font-semibold text-white no-underline transition hover:bg-[#3f3a2f] dark:bg-gray-100 dark:text-[#111827] dark:hover:bg-white"
              >
                带着问题来聊
              </a>
              <a
                href="#cases"
                className="inline-flex min-h-10 items-center rounded-full border border-[#c7c6bb] px-4 text-[13px] font-medium text-[#51514a] no-underline transition hover:border-[#8a6422] hover:text-[#15140f] dark:border-[#33404d] dark:text-gray-300 dark:hover:border-[#a8ae82] dark:hover:text-white"
              >
                先看案例
              </a>
              <span className="font-mono text-[11px] text-[#858876] dark:text-[#8e9ab0]">微信 atar24</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-14">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#858876] dark:text-[#8e9ab0]">
              What I Can Help With
            </p>
            <h2 className="mb-0 border-b-0 pb-0 font-serif text-[1.55rem] font-semibold tracking-wide text-[#15140f] dark:text-gray-100">
              合作范围
            </h2>
          </div>
          <span className="font-mono text-[11px] text-[#9a988e] dark:text-[#6f7a8c]">01 - 04</span>
        </div>

        <div className="divide-y divide-[#d9d8ce] border-y border-[#c7c6bb] dark:divide-[#27303a] dark:border-[#33404d]">
          {cooperationAreas.map((item, index) => (
            <article
              key={item.title}
              className="grid gap-4 py-6 md:grid-cols-[72px_minmax(0,0.62fr)_minmax(260px,0.38fr)] md:gap-6 md:py-7"
            >
              <div className="font-mono text-[12px] tracking-[0.16em] text-[#b7791f] dark:text-[#a8ae82]">
                {String(index + 1).padStart(2, '0')}
              </div>
              <div>
                <h3 className="mb-2 text-[18px] font-semibold text-[#15140f] dark:text-gray-100">{item.title}</h3>
                <p className="mb-0 text-[14px] leading-7 text-[#51514a] dark:text-gray-300">{item.desc}</p>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 self-start border-l border-[#d9d8ce] pl-4 dark:border-[#27303a] sm:grid-cols-4 md:grid-cols-2">
                {item.output.map((output) => (
                  <span
                    key={output}
                    className="text-[12.5px] leading-5 text-[#606358] before:mr-2 before:text-[#b7791f] before:content-['/'] dark:text-[#aeb8c6] dark:before:text-[#a8ae82]"
                  >
                    {output}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="cases" className="mb-14 scroll-mt-24">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#858876] dark:text-[#8e9ab0]">
              Selected Cases
            </p>
            <h2 className="mb-0 border-b-0 pb-0 font-serif text-[1.55rem] font-semibold tracking-wide text-[#15140f] dark:text-gray-100">
              三个已经落地的样本
            </h2>
          </div>
          <span className="max-w-[420px] text-[12px] leading-6 text-[#76786c] dark:text-[#7f8aa0]">
            不只看最终页面，也看问题怎么拆、交付物怎么形成、结果如何验证。
          </span>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          {caseStudies.map((item, index) => (
            <article key={item.title} className="flex h-full flex-col rounded-xl border border-[#d9d8ce] bg-white/55 p-5 dark:border-[#303947] dark:bg-[#121821]">
              <div className="mb-5 flex items-center justify-between gap-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#b7791f] dark:text-[#a8ae82]">{item.label}</span>
                <span className="font-mono text-[10px] text-[#aaa79c] dark:text-[#667184]">0{index + 1}</span>
              </div>
              <h3 className="mb-4 text-[18px] font-semibold leading-7 text-[#15140f] dark:text-gray-100">{item.title}</h3>
              <dl className="mb-5 grid gap-3 text-[12.5px] leading-6">
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8b897e] dark:text-[#758195]">问题</dt>
                  <dd className="mt-0.5 text-[#55564f] dark:text-gray-300">{item.problem}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8b897e] dark:text-[#758195]">行动</dt>
                  <dd className="mt-0.5 text-[#55564f] dark:text-gray-300">{item.action}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8b897e] dark:text-[#758195]">交付</dt>
                  <dd className="mt-0.5 text-[#55564f] dark:text-gray-300">{item.deliverable}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8b897e] dark:text-[#758195]">结果</dt>
                  <dd className="mt-0.5 font-medium text-[#2d332c] dark:text-[#d9dfd6]">{item.result}</dd>
                </div>
              </dl>
              <Link href={item.href} className="mt-auto inline-flex items-center gap-2 text-[12px] font-semibold text-[#7c5d34] no-underline hover:text-[#15140f] dark:text-[#c2b48b] dark:hover:text-white">
                查看完整样本 <span aria-hidden="true">→</span>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-14 grid gap-9 md:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#858876] dark:text-[#8e9ab0]">
            Boundaries
          </p>
          <h2 className="mb-5 border-b border-[#15140f] pb-3 font-serif text-[1.45rem] font-semibold tracking-wide text-[#15140f] dark:border-gray-300 dark:text-gray-100">
            合作边界
          </h2>
          <ul className="space-y-0">
            {boundaries.map((item) => (
              <li
                key={item}
                className="flex gap-3 border-b border-[#dedbd0] py-3 text-[13.5px] leading-6 text-[#5d5d54] last:border-b-0 dark:border-[#27303a] dark:text-[#9aa6b8]"
              >
                <span className="mt-[0.45rem] h-px w-5 shrink-0 bg-[#b7791f] dark:bg-[#9ba475]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <aside className="border-t border-[#d7d6cb] pt-6 dark:border-[#27303a] md:border-l md:border-t-0 md:pl-5 md:pt-0">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#858876] dark:text-[#8e9ab0]">
            Samples
          </p>
          <h2 className="mb-3 border-b-0 pb-0 font-serif text-[1.35rem] font-semibold tracking-wide text-[#15140f] dark:text-gray-100">
            先看样本
          </h2>
          <p className="mb-4 text-[13px] leading-6 text-[#5d5d54] dark:text-[#9aa6b8]">
            站内内容基本能代表我的判断方式和写作密度。
          </p>
          <div className="grid gap-2">
            {sampleLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-center justify-between border-b border-[#dedbd0] py-2 text-[13px] font-medium text-[#53554d] no-underline transition last:border-b-0 hover:text-[#15140f] dark:border-[#27303a] dark:text-gray-300 dark:hover:text-white"
              >
                <span>{link.label}</span>
                <span className="font-mono text-[11px] text-[#a5a397] transition group-hover:text-[#7c5d34] dark:text-[#6f7a8c]">
                  open
                </span>
              </Link>
            ))}
          </div>
        </aside>
      </section>

      <section className="mb-14">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#858876] dark:text-[#8e9ab0]">
          Related Products
        </p>
        <h2 className="mb-5 border-b border-[#15140f] pb-3 font-serif text-[1.45rem] font-semibold tracking-wide text-[#15140f] dark:border-gray-300 dark:text-gray-100">
          也可以直接看三个长期项目
        </h2>
        <div className="divide-y divide-[#d9d8ce] border-y border-[#c7c6bb] dark:divide-[#27303a] dark:border-[#33404d]">
          {productLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className="no-external-arrow grid gap-2 py-4 no-underline transition hover:bg-[#f6f3eb] dark:hover:bg-[#151c25] md:grid-cols-[220px_minmax(0,1fr)_56px] md:items-center md:px-2"
            >
              <div className="text-[15px] font-semibold text-[#15140f] dark:text-gray-100">{item.label}</div>
              <p className="mb-0 text-[13px] leading-6 text-[#5d5d54] dark:text-[#9aa6b8]">{item.desc}</p>
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#9a988e] dark:text-[#6f7a8c] md:text-right">
                visit
              </span>
            </a>
          ))}
        </div>
      </section>

      <section
        id="contact"
        className="scroll-mt-24 border-t border-[#c7c6bb] pt-7 dark:border-[#33404d] md:pt-8"
      >
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_190px] md:items-center">
          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#858876] dark:text-[#8e9ab0]">
              Contact
            </p>
            <h2 className="mb-3 border-b-0 pb-0 font-serif text-[1.45rem] font-semibold tracking-wide text-[#15140f] dark:text-gray-100">
              联系方式
            </h2>
            <p className="mb-3 text-[14px] leading-7 text-[#51514a] dark:text-gray-300">
              微信 <span className="font-mono font-semibold text-[#15140f] dark:text-gray-100">atar24</span>。
              建议备注“来自 2aran.com / 合作类型 / 公司或项目”。如果有明确需求，直接附目标、时间和期望交付物。
            </p>
            <p className="mb-0 text-[12px] leading-6 text-[#76786c] dark:text-[#7f8aa0]">
              如果不适合，我会直接说明，不绕弯。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
            <div className="flex flex-col items-center gap-2 border border-[#d9dad2] bg-[#f9faf7] p-3 dark:border-[#303947] dark:bg-[#151c25]">
              <Image
                src="/qrcodewechat3.png"
                alt="微信二维码"
                width={96}
                height={96}
                className="h-24 w-24 rounded-sm border border-[#e5e5e5] bg-white dark:border-gray-800"
              />
              <span className="font-mono text-[10px] tracking-[0.14em] text-[#858779] dark:text-[#8e9ab0]">微信</span>
            </div>
            <div className="flex flex-col items-center gap-2 border border-[#d9dad2] bg-[#f9faf7] p-3 dark:border-[#303947] dark:bg-[#151c25]">
              <Link href="/donate" className="flex flex-col items-center gap-2 no-underline">
                <Image
                  src="/donate-wechat.jpg"
                  alt="微信赞助收款码"
                  width={96}
                  height={131}
                  className="h-[131px] w-24 rounded-sm border border-[#e5e5e5] bg-white object-contain dark:border-gray-800"
                />
                <span className="font-mono text-[10px] tracking-[0.14em] text-[#858779] dark:text-[#8e9ab0]">赞助本站 · 请我喝咖啡</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageContainer>
  )
}
