import PageContainer from '../components/PageContainer'

export const dynamic = 'force-static'

export const metadata = {
  title: '关于我',
  description:
    '涂阿燃（tuaran / 掘金安东尼）：前端与 AI 工程化方向的开发者、技术写作者和产品实践者。',
  keywords: [
    '涂阿燃',
    'tuaran',
    'TUARAN',
    '掘金安东尼',
    '安东尼404',
    '关于我',
    '前端工程师',
    'AI Agent',
    '矩联科技',
    '博主联盟',
  ],
  alternates: { canonical: '/about' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
}

const identityTags = [
  '程序员',
  '项目经理',
  '技术博主',
  '出版作者',
  '矩联科技创始人',
  '茉莉奶爸',
]

const timeline = [
  { year: '2016', label: '大学入门编程' },
  { year: '2018', label: '华南师大毕业' },
  { year: '2019', label: '大厂 · 技术写作' },
  { year: '2020', label: '掘金优秀作者' },
  { year: '2021', label: '央企 · PMP' },
  { year: '2023', label: '《程序员成长手记》' },
  { year: '2024', label: '《AI Bots 通关指南》' },
  { year: '2025', label: '博主联盟 · 前端周刊' },
  { year: '2026', label: '矩联科技' },
]

const socialLinks = [
  { label: '掘金', href: 'https://juejin.cn/user/1521379823340792' },
  { label: '小红书', href: 'https://www.xiaohongshu.com/user/profile/68b313f9000000001901d07e' },
  { label: 'CSDN', href: 'https://blog.csdn.net/aifs2025' },
  { label: '51CTO', href: 'https://blog.51cto.com/u_15298598' },
  { label: 'GitHub', href: 'https://github.com/TUARAN' },
]

const contactItems = [
  { label: '主页', value: '2aran.com', href: 'https://2aran.com' },
  { label: '常用 ID', value: '掘金安东尼 · 安东尼404 · 安东尼与AI' },
  { label: '微信', value: 'atar24' },
  { label: '邮箱', value: 'tuaran666@gmail.com', href: 'mailto:tuaran666@gmail.com' },
]

const siteLinks = [
  { label: 'TUARAN 网络日志', href: 'https://2aran.com/', desc: '个人主页、技术笔记和长期内容索引' },
  { label: '矩联科技', href: 'https://matrixlink.tech/', desc: '技术服务、项目案例和公司信息' },
  { label: '博主联盟', href: 'https://blogger-alliance.cn/', desc: '技术博主协作与推广项目' },
  { label: '前端周看', href: 'https://frontendnext.com/', desc: '前端、AI 工程和工具动态整理' },
  { label: 'Open Claude Code', href: 'https://openclaudecode.site/', desc: 'Claude Code 与 Agent 工程笔记' },
  { label: 'PublishLab', href: 'https://publishlab.cc/', desc: 'AI 写作、内容整理和出版流程实验' },
]

const workingNotes = [
  '先把问题写清楚，再决定是否写代码；少做泛化，多做可验证交付。',
  '复杂事项尽量沉淀成文档、清单、脚本或页面，方便下次复用。',
  '关注 AI 进入真实工作流后的效果：能否减少重复劳动，能否稳定产出。',
  '写作不是包装自己，而是把做过的事、踩过的坑和判断依据留下来。',
]

const chipClassName =
  'inline-flex items-center rounded-full border border-[#d0d1c8] bg-white/90 px-2.5 py-1 text-[12px] text-[#53554d] no-underline transition hover:border-[#818472] hover:text-[#15140f] dark:border-[#2d3440] dark:bg-[#121821] dark:text-gray-300 dark:hover:border-[#4a5568]'

const externalChipClassName = `${chipClassName} no-external-arrow`
const socialChipClassName =
  'no-external-arrow inline-flex items-center rounded-full bg-[#eceee7] px-2.5 py-1 text-[12px] text-[#53554d] no-underline transition hover:bg-[#dcded3] hover:text-[#15140f] dark:bg-[#1a2430] dark:text-gray-300 dark:hover:bg-[#223040]'

export default function AboutPage() {
  return (
    <PageContainer className="flex flex-1 flex-col py-8 sm:py-5">
      <header className="shrink-0 border-b border-[#dee0db] pb-4 dark:border-gray-800">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#767869] dark:text-[#8e9ab0]">
          About · 关于我
        </p>
        <h1 className="mt-2 break-words font-serif text-xl font-semibold tracking-wide text-[#15140f] dark:text-gray-100 sm:text-2xl">
          涂阿燃 <span className="text-[#888] dark:text-gray-500">TUARAN</span>
        </h1>
        <p className="mt-1 break-words font-mono text-[11px] tracking-wide text-[#858878] dark:text-[#94a0b1]">
          掘金安东尼 · 安东尼404 · tuaran
        </p>
        <p className="mt-3 max-w-3xl text-[13px] leading-6 text-[#51514a] dark:text-gray-300">把混乱编程为系统，把想法变成产品。</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {identityTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[#dee0db] bg-[#f0f1ec] px-2.5 py-0.5 font-mono text-[11px] text-[#58594d] dark:border-[#2d3440] dark:bg-[#18202a] dark:text-[#acaf9d]"
            >
              {tag}
            </span>
          ))}
        </div>
      </header>

      <section className="mt-4 shrink-0" aria-label="成长时间线">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h2 className="font-serif text-[15px] font-semibold text-[#15140f] dark:text-gray-100">时间线</h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#858876] dark:text-[#8e9ab0]">
            2016 — 2026
          </span>
        </div>
        <ol className="grid grid-cols-2 gap-x-3 gap-y-3 min-[380px]:grid-cols-3 sm:grid-cols-5 lg:grid-cols-9">
          {timeline.map((item, i) => (
            <li key={`${item.year}-${item.label}`} className="relative min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-mono text-[11px] font-semibold tabular-nums text-[#b7791f] dark:text-[#9ba475]">
                  {item.year}
                </span>
                {i < timeline.length - 1 ? (
                  <span
                    className="hidden h-px flex-1 bg-[#dee0db] dark:bg-gray-700 lg:block"
                    aria-hidden="true"
                  />
                ) : null}
              </div>
              <p className="mt-0.5 line-clamp-2 text-[10px] leading-4 text-[#666] dark:text-gray-400 sm:text-[11px] sm:leading-snug">
                {item.label}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-4 grid grid-cols-1 items-start gap-3 sm:grid-cols-2 sm:gap-4">
        <section className="flex flex-col self-start rounded-xl bg-white/72 p-3 dark:bg-[#121821]/72 sm:rounded-2xl sm:p-4">
          <h2 className="mb-2 font-serif text-[15px] font-semibold text-[#15140f] dark:text-gray-100">公开入口</h2>
          <dl className="space-y-2 text-[12px] leading-5 text-[#51514a] dark:text-gray-300">
            {contactItems.map((item) => (
              <div key={item.label} className="flex flex-wrap gap-x-2 gap-y-0.5">
                <dt className="text-[#858878] dark:text-gray-500">{item.label}</dt>
                <dd className="min-w-0">
                  {item.href ? (
                    <a
                      href={item.href}
                      className="break-all text-[#5a4725] no-underline hover:underline dark:text-[#acaf9d]"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <span className="text-[#15140f] dark:text-gray-100">{item.value}</span>
                  )}
                </dd>
              </div>
            ))}
            <div>
              <dt className="mb-1.5 text-[#858878] dark:text-gray-500">内容平台</dt>
              <dd className="flex flex-wrap gap-1.5">
                {socialLinks.map((c) => (
                  <a key={c.href} href={c.href} target="_blank" rel="noreferrer" className={socialChipClassName}>
                    {c.label}
                  </a>
                ))}
              </dd>
            </div>
          </dl>
        </section>

        <section className="flex flex-col self-start rounded-xl bg-white/72 p-3 dark:bg-[#121821]/72 sm:rounded-2xl sm:p-4">
          <h2 className="mb-2 font-serif text-[15px] font-semibold text-[#15140f] dark:text-gray-100">正在维护的站点</h2>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {siteLinks.map((c) => (
              <div key={c.href} className="rounded-lg bg-white/65 px-2.5 py-2 dark:bg-[#18202a]/52">
                <a href={c.href} target="_blank" rel="noreferrer" className={`${externalChipClassName} !px-2 !py-0.5`}>
                  {c.label}
                </a>
                <p className="mt-1 text-[11px] leading-5 text-[#717367] dark:text-gray-400">{c.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-5 text-[#717367] dark:text-gray-400">
            有些是长期项目，有些还在实验阶段。这里先放公开入口，方便按主题找到对应内容。
          </p>
        </section>
      </div>

      <section className="mt-4 rounded-xl bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(252,248,240,0.82))] p-3 dark:bg-[linear-gradient(180deg,rgba(18,24,33,0.86),rgba(15,21,30,0.86))] sm:rounded-2xl sm:p-4">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2 pb-1">
          <h2 className="mb-0 font-serif text-[15px] font-semibold text-[#15140f] dark:text-gray-100">工作方式</h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#7f826f] dark:text-[#8e9ab0]">
            Working Notes
          </span>
        </div>
        <ul className="space-y-2.5">
          {workingNotes.map((line, idx) => (
            <li
              key={line}
              className="group flex items-start gap-2.5 rounded-xl bg-white/72 px-3 py-2.5 text-[12.5px] leading-6 text-[#51514a] transition-colors hover:bg-[#fafbf8] dark:bg-[#141b25]/72 dark:text-gray-300 dark:hover:bg-[#17202c]"
            >
              <span className="mt-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#dadccd] px-1.5 font-mono text-[10px] font-semibold text-[#8f6a34] transition-colors group-hover:bg-[#cacdb8] dark:bg-[#233143] dark:text-[#abb18f] dark:group-hover:bg-[#2a3a50]">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <span className="flex-1">{line}</span>
            </li>
          ))}
        </ul>
      </section>
    </PageContainer>
  )
}
