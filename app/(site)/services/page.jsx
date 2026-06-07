import Image from 'next/image'
import Link from 'next/link'

export const dynamic = 'force-static'

export const metadata = {
  title: '商务合作 · AI 咨询与内容增长',
  description:
    '涂阿燃（tuaran）提供 AI 落地咨询、数字员工方案、调研定制、技术内容推广与企业内训合作。',
  keywords: [
    '涂阿燃',
    'tuaran',
    '商务合作',
    'AI 咨询',
    '数字员工',
    '调研定制',
    '内容推广',
    '技术博主',
    '矩联科技',
  ],
  alternates: { canonical: '/services' },
}

const serviceTracks = [
  {
    code: '01',
    title: 'AI 落地咨询',
    fit: '适合 CTO、产品负责人、业务负责人',
    summary: '把“想用 AI”拆成真实可做的场景、流程、技术路线和试点计划。',
    deliverables: ['AI 切入点清单', 'PoC 范围与排期', '模型 / 工具选型建议', '风险与投入评估'],
    price: '¥1,500 / 小时起',
  },
  {
    code: '02',
    title: '数字员工方案',
    fit: '适合政企、集团、运营型团队',
    summary: '围绕高重复、高规则、高协作成本的流程，设计可上线的 AI 数字员工方案。',
    deliverables: ['流程梳理', '方案原型', '信创 / 私有化建议', '培训与落地文档'],
    price: '¥80,000 / 项目起',
  },
  {
    code: '03',
    title: '深度调研定制',
    fit: '适合产品、投资、市场、战略团队',
    summary: '按公司、行业、人物或事项输出可引用的结构化调研，不只堆资料。',
    deliverables: ['Markdown / PDF 报告', '来源附录', '关键判断', '不确定性标注'],
    price: '¥5,000 / 篇起',
  },
  {
    code: '04',
    title: '技术内容推广',
    fit: '适合 AI 产品、开发者工具、云服务',
    summary: '通过技术博主矩阵和多平台内容，把产品讲给真正会用的人。',
    deliverables: ['选题策划', '文章 / 短内容', '博主矩阵发布', '复盘数据'],
    price: '¥3,000 / 条起',
  },
]

const proofItems = [
  { value: '60+', label: '站内公开调研' },
  { value: '400 万+', label: '多平台累计阅读' },
  { value: '50+', label: '可协作技术博主' },
  { value: '2-10 天', label: '常规调研交付周期' },
]

const cooperationSteps = [
  {
    title: '说明目标',
    desc: '告诉我你要解决的问题、预算范围、期望交付物和时间要求。',
  },
  {
    title: '判断是否适合',
    desc: '我会先判断是否能做、值不值得做，以及是否需要换更合适的合作方式。',
  },
  {
    title: '确认交付',
    desc: '明确范围、排期、付款与验收标准后开始执行，复杂项目分阶段推进。',
  },
]

const sampleLinks = [
  { href: '/articles?tab=topics', label: '事项调研样本' },
  { href: '/articles?tab=companies', label: '公司调研样本' },
  { href: '/ai-projects', label: '项目与工具' },
]

export default function ServicesPage() {
  return (
    <main className="mx-auto w-full max-w-[1120px] px-4 py-8 md:py-10">
      <header className="mb-8 border-b border-[#e8dfd0] pb-8 dark:border-gray-800">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#8f8069] dark:text-[#8e9ab0]">
              Services · 商务合作
            </p>
            <h1 className="mt-4 max-w-3xl font-serif text-[2rem] font-semibold leading-tight tracking-wide text-[#221f19] dark:text-gray-100 md:text-[2.7rem]">
              AI 咨询、调研定制、技术内容增长
            </h1>
            <p className="mt-5 max-w-2xl text-[15px] leading-8 text-[#5d554a] dark:text-gray-300">
              我适合处理“已经有真实业务目标，但还缺判断、方案、内容或执行网络”的合作。能帮你把模糊需求拆成可交付的方案，也能把技术产品讲给开发者和 AI 使用者。
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <a
                href="#contact"
                className="inline-flex items-center rounded-xl border border-[#3a2c14] bg-[#3a2c14] px-4 py-2.5 text-[13px] font-semibold text-[#fdf9ef] no-underline transition hover:bg-[#2a1f0e] dark:border-[#e8d4b4] dark:bg-[#e8d4b4] dark:text-[#1d1a16] dark:hover:bg-[#f5e3c4]"
              >
                发起合作 →
              </a>
              <Link
                href="/articles?tab=research"
                className="inline-flex items-center rounded-xl border border-[#d9d0c2] bg-white/75 px-4 py-2.5 text-[13px] font-semibold text-[#3d362b] no-underline transition hover:border-[#b9ad94] hover:bg-white dark:border-[#3a4757] dark:bg-[#151c25] dark:text-gray-100 dark:hover:border-[#5a6a7e]"
              >
                先看调研能力
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {proofItems.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-[#e8dfd0] bg-[#fcfbf7] p-4 dark:border-[#252d36] dark:bg-[#0f141b]"
              >
                <p className="mb-1 font-mono text-[20px] font-semibold text-[#3a2c14] dark:text-[#e8d4b4]">
                  {item.value}
                </p>
                <p className="mb-0 text-[12px] leading-5 text-[#786f61] dark:text-[#9aa6b8]">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <section className="mb-9">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#a09176] dark:text-[#8e9ab0]">
              Tracks
            </p>
            <h2 className="font-serif text-[1.45rem] font-semibold tracking-wide text-[#221f19] dark:text-gray-100">
              合作方向
            </h2>
          </div>
          <p className="mb-0 max-w-xl text-[13px] leading-6 text-[#756b59] dark:text-[#9aa6b8]">
            价格是起点，不是固定报价。复杂项目按范围、周期和交付深度重新确认。
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {serviceTracks.map((track) => (
            <article
              key={track.title}
              className="rounded-2xl border border-[#e8dfd0] bg-white p-5 shadow-[0_12px_36px_rgba(82,69,45,0.04)] dark:border-[#252d36] dark:bg-[#121821]"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="mb-2 font-mono text-[11px] tracking-[0.18em] text-[#a09176] dark:text-[#8e9ab0]">
                    {track.code}
                  </p>
                  <h3 className="mb-1 text-[18px] font-semibold text-[#221f19] dark:text-gray-100">{track.title}</h3>
                  <p className="mb-0 text-[12px] leading-5 text-[#8a7f6c] dark:text-[#7f8aa0]">{track.fit}</p>
                </div>
                <span className="shrink-0 rounded-full border border-[#e8dfd0] bg-[#fbf3e3] px-3 py-1 font-mono text-[11px] text-[#8a5a14] dark:border-[#3a2f1c] dark:bg-[#2a2115] dark:text-[#e2bd75]">
                  {track.price}
                </span>
              </div>
              <p className="mb-4 text-[14px] leading-7 text-[#5d554a] dark:text-gray-300">{track.summary}</p>
              <div className="flex flex-wrap gap-2">
                {track.deliverables.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-[#eadfce] bg-[#faf7f1] px-2.5 py-1 text-[12px] text-[#62594d] dark:border-[#303947] dark:bg-[#151c25] dark:text-[#c6ceda]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-9 grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#a09176] dark:text-[#8e9ab0]">
            Workflow
          </p>
          <h2 className="mb-4 font-serif text-[1.45rem] font-semibold tracking-wide text-[#221f19] dark:text-gray-100">
            合作流程
          </h2>
          <div className="space-y-3">
            {cooperationSteps.map((step, index) => (
              <div key={step.title} className="flex gap-3">
                <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#d8cfbf] bg-[#faf6ef] font-mono text-[11px] text-[#6f6048] dark:border-[#303947] dark:bg-[#151c25] dark:text-[#c6ceda]">
                  {index + 1}
                </span>
                <div>
                  <p className="mb-1 text-[14px] font-semibold text-[#221f19] dark:text-gray-100">{step.title}</p>
                  <p className="mb-0 text-[13px] leading-6 text-[#6d6254] dark:text-[#9aa6b8]">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#e8dfd0] bg-[#fcfbf7] p-5 dark:border-[#252d36] dark:bg-[#0f141b]">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#a09176] dark:text-[#8e9ab0]">
            Samples
          </p>
          <h2 className="mb-3 font-serif text-[1.35rem] font-semibold tracking-wide text-[#221f19] dark:text-gray-100">
            先看样本
          </h2>
          <p className="mb-4 text-[13px] leading-7 text-[#6d6254] dark:text-[#9aa6b8]">
            如果你还不确定是否匹配，可以先看站内调研与项目记录。它们基本代表我的判断方式、写作密度和交付风格。
          </p>
          <div className="flex flex-wrap gap-2">
            {sampleLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border border-[#ded6c8] bg-white px-3 py-1.5 text-[12px] font-medium text-[#5f5a4d] no-underline transition hover:border-[#9c8e72] hover:text-[#221f19] dark:border-[#303947] dark:bg-[#151c25] dark:text-gray-300 dark:hover:border-[#435062]"
              >
                {link.label} →
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section
        id="contact"
        className="scroll-mt-24 rounded-2xl border border-[#e8dfd0] bg-[#fcfbf7] p-5 dark:border-[#252d36] dark:bg-[#0f141b] md:p-6"
      >
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_190px] md:items-center">
          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#a09176] dark:text-[#8e9ab0]">
              Contact
            </p>
            <h2 className="mb-3 font-serif text-[1.45rem] font-semibold tracking-wide text-[#221f19] dark:text-gray-100">
              发起合作
            </h2>
            <p className="mb-3 text-[14px] leading-7 text-[#5d554a] dark:text-gray-300">
              加微信 <span className="font-mono font-semibold text-[#221f19] dark:text-gray-100">atar24</span>，
              备注“来自 2aran.com / 合作类型 / 公司或项目”。如果是正式项目，请直接附目标、预算、截止时间和期望交付物。
            </p>
            <p className="mb-0 text-[12px] leading-6 text-[#8a7f6c] dark:text-[#7f8aa0]">
              不适合的合作我会直接说明原因，避免双方浪费时间。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
            <div className="flex flex-col items-center gap-2 rounded-xl border border-[#e6dfd2] bg-white p-3 dark:border-[#303947] dark:bg-[#151c25]">
              <Image
                src="/qrcodewechat3.png"
                alt="微信二维码"
                width={96}
                height={96}
                className="h-24 w-24 rounded-sm border border-[#e5e5e5] bg-white dark:border-gray-800"
              />
              <span className="font-mono text-[10px] tracking-[0.14em] text-[#9c8f79] dark:text-[#8e9ab0]">微信</span>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-xl border border-[#e6dfd2] bg-white p-3 dark:border-[#303947] dark:bg-[#151c25]">
              <Image
                src="/qrcode_for_gh.jpg"
                alt="公众号二维码"
                width={96}
                height={96}
                className="h-24 w-24 rounded-sm border border-[#e5e5e5] bg-white dark:border-gray-800"
              />
              <span className="font-mono text-[10px] tracking-[0.14em] text-[#9c8f79] dark:text-[#8e9ab0]">公众号</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
