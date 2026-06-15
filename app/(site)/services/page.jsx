import Image from 'next/image'
import Link from 'next/link'

export const dynamic = 'force-static'

export const metadata = {
  title: '合作说明 · AI 咨询、调研与内容协作',
  description:
    '涂阿燃（tuaran）的合作说明：AI 落地咨询、调研定制、技术内容协作、数字员工方案与企业内训。',
  keywords: [
    '涂阿燃',
    'tuaran',
    '合作说明',
    'AI 咨询',
    '调研定制',
    '技术内容',
    '数字员工',
    '博主联盟',
    '前端周看',
    'PublishLab',
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
    title: '调研定制',
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
  { href: '/articles?tab=topics', label: '事项调研' },
  { href: '/articles?tab=companies', label: '公司调研' },
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
    href: 'https://publishlab.cc/',
    label: 'PublishLab',
    desc: 'AI 写作、内容创作与数字出版实验',
  },
]

export default function ServicesPage() {
  return (
    <main className="mx-auto w-full max-w-[960px] px-4 py-10 md:py-12">
      <header className="mb-10 border-b border-[#dee0db] pb-8 dark:border-gray-800">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#767869] dark:text-[#8e9ab0]">
          Services · 合作说明
        </p>
        <h1 className="mt-4 max-w-3xl font-serif text-[2rem] font-semibold leading-tight tracking-wide text-[#15140f] dark:text-gray-100 md:text-[2.55rem]">
          先聊方向，再判断怎么帮
        </h1>
        <p className="mt-5 max-w-2xl text-[15px] leading-8 text-[#51514a] dark:text-gray-300">
          如果你正在做一个产品、内容或增长项目，可以先把背景、卡点和想要的结果发给我。我会先判断自己能不能帮上忙；能做，我们再一起定目标、节奏和交付方式。
        </p>
      </header>

      <section className="mb-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#858876] dark:text-[#8e9ab0]">
              What I Can Help With
            </p>
            <h2 className="font-serif text-[1.45rem] font-semibold tracking-wide text-[#15140f] dark:text-gray-100">
              合作范围
            </h2>
          </div>
          <p className="mb-0 text-[12px] leading-6 text-[#76786c] dark:text-[#7f8aa0]">
            报价按具体范围确认，不在页面上写死。
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {cooperationAreas.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-[#dee0db] bg-white p-5 dark:border-[#252d36] dark:bg-[#121821]"
            >
              <h3 className="mb-2 text-[17px] font-semibold text-[#15140f] dark:text-gray-100">{item.title}</h3>
              <p className="mb-4 text-[13.5px] leading-7 text-[#51514a] dark:text-gray-300">{item.desc}</p>
              <div className="flex flex-wrap gap-2">
                {item.output.map((output) => (
                  <span
                    key={output}
                    className="rounded-full border border-[#d8d9ce] bg-[#f4f5f1] px-2.5 py-1 text-[12px] text-[#54554d] dark:border-[#303947] dark:bg-[#151c25] dark:text-[#c6ceda]"
                  >
                    {output}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-10 grid gap-6 md:grid-cols-[minmax(0,1fr)_280px]">
        <div className="rounded-2xl border border-[#dee0db] bg-[#f9faf7] p-5 dark:border-[#252d36] dark:bg-[#0f141b]">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#858876] dark:text-[#8e9ab0]">
            Boundaries
          </p>
          <h2 className="mb-4 font-serif text-[1.35rem] font-semibold tracking-wide text-[#15140f] dark:text-gray-100">
            合作边界
          </h2>
          <ul className="space-y-3">
            {boundaries.map((item) => (
              <li key={item} className="flex gap-2 text-[13px] leading-6 text-[#5d5d54] dark:text-[#9aa6b8]">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#b7791f] dark:bg-[#9ba475]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-[#dee0db] bg-white p-5 dark:border-[#252d36] dark:bg-[#121821]">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#858876] dark:text-[#8e9ab0]">
            Samples
          </p>
          <h2 className="mb-3 font-serif text-[1.25rem] font-semibold tracking-wide text-[#15140f] dark:text-gray-100">
            先看样本
          </h2>
          <p className="mb-4 text-[13px] leading-6 text-[#5d5d54] dark:text-[#9aa6b8]">
            站内内容基本能代表我的判断方式和写作密度。
          </p>
          <div className="flex flex-wrap gap-2">
            {sampleLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border border-[#d0d1c8] bg-[#f5f6f3] px-3 py-1.5 text-[12px] font-medium text-[#53554d] no-underline transition hover:border-[#818472] hover:text-[#15140f] dark:border-[#303947] dark:bg-[#151c25] dark:text-gray-300 dark:hover:border-[#435062]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-10">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#858876] dark:text-[#8e9ab0]">
          Related Products
        </p>
        <h2 className="mb-4 font-serif text-[1.35rem] font-semibold tracking-wide text-[#15140f] dark:text-gray-100">
          也可以直接看三个长期项目
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          {productLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className="no-external-arrow rounded-2xl border border-[#dee0db] bg-white p-4 no-underline transition hover:-translate-y-0.5 hover:border-[#c2c4b7] dark:border-[#252d36] dark:bg-[#121821] dark:hover:border-[#33404d]"
            >
              <div className="mb-1 text-[15px] font-semibold text-[#15140f] dark:text-gray-100">{item.label} ↗</div>
              <p className="mb-0 text-[13px] leading-6 text-[#5d5d54] dark:text-[#9aa6b8]">{item.desc}</p>
            </a>
          ))}
        </div>
      </section>

      <section
        id="contact"
        className="scroll-mt-24 rounded-2xl border border-[#dee0db] bg-[#f9faf7] p-5 dark:border-[#252d36] dark:bg-[#0f141b] md:p-6"
      >
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_190px] md:items-center">
          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#858876] dark:text-[#8e9ab0]">
              Contact
            </p>
            <h2 className="mb-3 font-serif text-[1.35rem] font-semibold tracking-wide text-[#15140f] dark:text-gray-100">
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
            <div className="flex flex-col items-center gap-2 rounded-xl border border-[#d9dad2] bg-white p-3 dark:border-[#303947] dark:bg-[#151c25]">
              <Image
                src="/qrcodewechat3.png"
                alt="微信二维码"
                width={96}
                height={96}
                className="h-24 w-24 rounded-sm border border-[#e5e5e5] bg-white dark:border-gray-800"
              />
              <span className="font-mono text-[10px] tracking-[0.14em] text-[#858779] dark:text-[#8e9ab0]">微信</span>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-xl border border-[#d9dad2] bg-white p-3 dark:border-[#303947] dark:bg-[#151c25]">
              <Image
                src="/qrcode_for_gh.jpg"
                alt="公众号二维码"
                width={96}
                height={96}
                className="h-24 w-24 rounded-sm border border-[#e5e5e5] bg-white dark:border-gray-800"
              />
              <span className="font-mono text-[10px] tracking-[0.14em] text-[#858779] dark:text-[#8e9ab0]">公众号</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
