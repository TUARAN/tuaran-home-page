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
  { label: '前端下一步', href: 'https://frontendnext.com/', desc: '前端工程师在 AI 时代的转向判断' },
  { label: 'Open Claude Code', href: 'https://openclaudecode.site/', desc: '系统拆解 Claude Code 的 Agent 方法论' },
  { label: 'PublishLab', href: 'https://publishlab.cc/', desc: 'AI 写作、内容创作与数字出版实验' },
]

const chipClassName =
  'inline-flex items-center rounded-full border border-[#ded6c8] bg-white/90 px-2.5 py-1 text-[12px] text-[#5f5a4d] no-underline transition hover:border-[#9c8e72] hover:text-[#221f19] dark:border-[#2d3440] dark:bg-[#121821] dark:text-gray-300 dark:hover:border-[#4a5568]'

const externalChipClassName = `${chipClassName} no-external-arrow`

export default function AboutPage() {
  return (
    <main className="mx-auto flex w-full max-w-[1080px] flex-1 flex-col px-4 py-8 sm:py-5">
      <header className="shrink-0 border-b border-[#e8dfd0] pb-4 dark:border-gray-800">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8f8069] dark:text-[#8e9ab0]">
          About · 关于我
        </p>
        <h1 className="mt-2 break-words font-serif text-xl font-semibold tracking-wide text-[#221f19] dark:text-gray-100 sm:text-2xl">
          涂阿燃 <span className="text-[#888] dark:text-gray-500">TUARAN</span>
        </h1>
        <p className="mt-1 break-words font-mono text-[11px] tracking-wide text-[#9d9078] dark:text-[#94a0b1]">
          掘金安东尼 · 安东尼404 · tuaran
        </p>
        <p className="mt-3 max-w-3xl text-[13px] leading-6 text-[#5d554a] dark:text-gray-300">
          专注前端工程化与 AI 智能体系统，参与技术社区共建；把混乱编程为系统，把想法变成产品。
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {identityTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[#e8dfd0] bg-[#f8f4ec] px-2.5 py-0.5 font-mono text-[11px] text-[#6b5f4d] dark:border-[#2d3440] dark:bg-[#18202a] dark:text-[#c8b99d]"
            >
              {tag}
            </span>
          ))}
        </div>
      </header>

      <section className="mt-4 shrink-0" aria-label="成长时间线">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h2 className="font-serif text-[15px] font-semibold text-[#221f19] dark:text-gray-100">时间线</h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#a09176] dark:text-[#8e9ab0]">
            2016 — 2026
          </span>
        </div>
        <ol className="grid grid-cols-2 gap-x-3 gap-y-3 min-[380px]:grid-cols-3 sm:grid-cols-5 lg:grid-cols-9">
          {timeline.map((item, i) => (
            <li key={item.year} className="relative min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-mono text-[11px] font-semibold tabular-nums text-[#b7791f] dark:text-[#e2bd75]">
                  {item.year}
                </span>
                {i < timeline.length - 1 ? (
                  <span
                    className="hidden h-px flex-1 bg-[#e8dfd0] dark:bg-gray-700 lg:block"
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
        <section className="flex flex-col self-start rounded-xl border border-[#e8dfd0] bg-white/80 p-3 dark:border-gray-800 dark:bg-[#121821]/80 sm:rounded-2xl sm:p-4">
          <h2 className="mb-2 font-serif text-[15px] font-semibold text-[#221f19] dark:text-gray-100">联系与数据</h2>
          <dl className="space-y-2 text-[12px] leading-5 text-[#5d554a] dark:text-gray-300">
            {contactItems.map((item) => (
              <div key={item.label} className="flex flex-wrap gap-x-2 gap-y-0.5">
                <dt className="text-[#9d9078] dark:text-gray-500">{item.label}</dt>
                <dd className="min-w-0">
                  {item.href ? (
                    <a
                      href={item.href}
                      className="break-all text-[#5a4725] no-underline hover:underline dark:text-[#c8b99d]"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <span className="text-[#221f19] dark:text-gray-100">{item.value}</span>
                  )}
                </dd>
              </div>
            ))}
            <div>
              <dt className="mb-1.5 text-[#9d9078] dark:text-gray-500">社交平台</dt>
              <dd className="flex flex-wrap gap-1.5">
                {socialLinks.map((c) => (
                  <a key={c.href} href={c.href} target="_blank" rel="noreferrer" className={externalChipClassName}>
                    {c.label}
                  </a>
                ))}
              </dd>
            </div>
          </dl>
        </section>

        <section className="flex flex-col self-start rounded-xl border border-[#e8dfd0] bg-white/80 p-3 dark:border-gray-800 dark:bg-[#121821]/80 sm:rounded-2xl sm:p-4">
          <h2 className="mb-2 font-serif text-[15px] font-semibold text-[#221f19] dark:text-gray-100">站点矩阵</h2>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {siteLinks.map((c) => (
              <div key={c.href} className="rounded-lg border border-[#e8dfd0] bg-white/70 px-2.5 py-2 dark:border-[#2d3440] dark:bg-[#18202a]/60">
                <a href={c.href} target="_blank" rel="noreferrer" className={`${externalChipClassName} !px-2 !py-0.5`}>
                  {c.label}
                </a>
                <p className="mt-1 text-[11px] leading-5 text-[#847a67] dark:text-gray-400">{c.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-5 text-[#847a67] dark:text-gray-400">
            系统优先 · 自动化优先 · 长期可复用 —— 倾向构建能长期稳定运行的系统，而非一次性工具。
          </p>
        </section>
      </div>

      <footer className="mt-3 shrink-0 border-t border-[#e8dfd0] pt-3 text-center text-[11px] leading-5 text-[#888] dark:border-gray-800 dark:text-gray-500">
        <p>
          欢迎微信注明「从 2aran.com 来」·{' '}
          <Link href="/" className="text-[#5a4725] hover:underline dark:text-[#c8b99d]">
            返回首页
          </Link>
        </p>
      </footer>
    </main>
  )
}
