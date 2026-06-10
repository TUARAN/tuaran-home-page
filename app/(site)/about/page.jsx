import Link from 'next/link'

export const dynamic = 'force-static'

export const metadata = {
  title: '关于我',
  description:
    '涂阿燃（tuaran / 掘金安东尼）：前端工程化与 AI 智能体，技术博主与出版作者，矩联科技创始人。',
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
  { label: '社区 ID', value: '掘金安东尼 · 安东尼404 · 安东尼与AI' },
  { label: '微信', value: 'atar24' },
  { label: '邮箱', value: 'tuaran666@gmail.com', href: 'mailto:tuaran666@gmail.com' },
  { label: '影响力', value: '全网 500+ 篇 · 阅读 400 万+' },
]

const siteLinks = [
  { label: 'TUARAN 网络日志', href: 'https://2aran.com/', desc: '个人技术主页 · AI × 工程 × 思考' },
  { label: '矩联科技', href: 'https://matrixlink.tech/', desc: '公司官网 · 技术服务与品牌展示' },
  { label: '博主联盟', href: 'https://blogger-alliance.cn/', desc: '技术博主联盟与推广协作网络' },
  { label: '前端周看', href: 'https://frontendnext.com/', desc: '推动前端工程师向 AI Agent 工程师转型' },
  { label: 'Open Claude Code', href: 'https://openclaudecode.site/', desc: '系统拆解 Claude Code 的 Agent 方法论' },
  { label: 'PublishLab', href: 'https://publishlab.cc/', desc: 'AI 写作、内容创作与数字出版实验' },
]

const badassThings = [
  '马斯克的第一性原理 + 工程化执行：不是喊口号，而是把“不可能”拆成可交付系统。',
  '詹姆斯·韦伯望远镜：二十多年、全球协作、长期主义，最终把宇宙看得更深更远。',
  '把复杂问题抽象成流程、标准和自动化，让个人能力变成可复制系统。',
  '长期高质量写作与公开复盘：内容是认知资产，不是一次性流量消耗。',
]

const chipClassName =
  'inline-flex items-center rounded-full border border-[#d0d1c8] bg-white/90 px-2.5 py-1 text-[12px] text-[#53554d] no-underline transition hover:border-[#818472] hover:text-[#15140f] dark:border-[#2d3440] dark:bg-[#121821] dark:text-gray-300 dark:hover:border-[#4a5568]'

const externalChipClassName = `${chipClassName} no-external-arrow`
const socialChipClassName =
  'no-external-arrow inline-flex items-center rounded-full bg-[#eceee7] px-2.5 py-1 text-[12px] text-[#53554d] no-underline transition hover:bg-[#dcded3] hover:text-[#15140f] dark:bg-[#1a2430] dark:text-gray-300 dark:hover:bg-[#223040]'

export default function AboutPage() {
  return (
    <main className="mx-auto flex w-full max-w-[1080px] flex-1 flex-col px-4 py-8 sm:py-5">
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
          <h2 className="mb-2 font-serif text-[15px] font-semibold text-[#15140f] dark:text-gray-100">联系与数据</h2>
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
              <dt className="mb-1.5 text-[#858878] dark:text-gray-500">社交平台</dt>
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
          <h2 className="mb-2 font-serif text-[15px] font-semibold text-[#15140f] dark:text-gray-100">站点矩阵</h2>
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
            系统优先 · 自动化优先 · 长期可复用 —— 倾向构建能长期稳定运行的系统，而非一次性工具。
          </p>
        </section>
      </div>

<section className="mt-4 rounded-xl bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(252,248,240,0.82))] p-3 dark:bg-[linear-gradient(180deg,rgba(18,24,33,0.86),rgba(15,21,30,0.86))] sm:rounded-2xl sm:p-4">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2 pb-1">
          <h2 className="mb-0 font-serif text-[15px] font-semibold text-[#15140f] dark:text-gray-100">我认可的硬核范式</h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#7f826f] dark:text-[#8e9ab0]">
            Values / Principles
          </span>
        </div>
        <ul className="space-y-2.5">
          {badassThings.map((line, idx) => (
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

    </main>
  )
}
