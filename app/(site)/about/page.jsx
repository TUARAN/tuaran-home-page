import Image from 'next/image'

import { AVATAR_PATH } from '../../../lib/avatar'

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
  '项目经理 · PMP',
  '技术博主',
  '出版作者',
  '矩联科技创始人',
  '茉莉奶爸',
]

const introLines = [
  { icon: '📚', text: '《程序员成长手记》《AI Bots 通关指南》作者' },
  { icon: '💡', text: '专注前端工程化与 AI 智能体，深耕实战与技术社区共建' },
  { icon: '🌐', text: '个人主页：2aran.com', href: 'https://2aran.com' },
  {
    icon: '🤝',
    text: '加入博主联盟：blogger-alliance.cn — 连接 AI 产品与技术影响力',
    href: 'https://blogger-alliance.cn/',
  },
]

const stats = [
  { value: '500+', label: '技术文章' },
  { value: '400万+', label: '累计阅读' },
  { value: '2', label: '出版作品' },
  { value: '6', label: '在维护站点' },
  { value: '2016', label: '起步至今' },
]

const timeline = [
  { year: '2016', label: '大学入门编程' },
  { year: '2018', label: '华南师大毕业' },
  { year: '2019', label: '大厂 · 技术写作' },
  { year: '2020', label: '掘金优秀作者' },
  { year: '2021', label: '央企 · 拿下 PMP' },
  { year: '2023', label: '《程序员成长手记》' },
  { year: '2024', label: '《AI Bots 通关指南》' },
  { year: '2025', label: '博主联盟 · 前端周看' },
  { year: '2026', label: '创立矩联科技' },
]

const socialLinks = [
  { label: '掘金', href: 'https://juejin.cn/user/1521379823340792' },
  { label: '小红书', href: 'https://www.xiaohongshu.com/user/profile/68b313f9000000001901d07e' },
  { label: 'CSDN', href: 'https://blog.csdn.net/aifs2025' },
  { label: '51CTO', href: 'https://blog.51cto.com/u_15298598' },
  { label: 'GitHub', href: 'https://github.com/TUARAN' },
]

const contactItems = [
  { label: 'home', value: '2aran.com', href: 'https://2aran.com' },
  { label: 'wechat', value: 'atar24' },
  { label: 'email', value: 'tuaran666@gmail.com', href: 'mailto:tuaran666@gmail.com' },
  { label: 'alias', value: '掘金安东尼 · 安东尼404 · 安东尼与AI' },
]

const siteLinks = [
  { label: '矩联科技', href: 'https://matrixlink.tech/', desc: '技术服务、项目案例和公司信息' },
  { label: '博主联盟', href: 'https://blogger-alliance.cn/', desc: 'AI 产品方与技术博主的连接网络' },
  { label: '前端周看', href: 'https://frontendnext.com/', desc: '前端、AI Agent 与大模型工程情报' },
  { label: '内容同步智能体', href: 'https://syncblog.cn/', desc: '一次创作，多平台自动同步分发' },
  { label: 'Open Claude Code', href: 'https://openclaudecode.site/', desc: 'Claude Code 与 Agent 工程笔记' },
  { label: 'TUARAN 网络日志', href: 'https://2aran.com/', desc: '个人主页、技术笔记与长期内容索引' },
]

// 本页独立配色：不跟随站点明暗主题，固定一套深色「工程师终端」科技风
const GRID_BG = {
  backgroundColor: '#080c15',
  backgroundImage:
    'linear-gradient(rgba(120,200,220,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(120,200,220,0.045) 1px, transparent 1px)',
  backgroundSize: '34px 34px',
}

const kicker = 'font-mono text-[10px] uppercase tracking-[0.28em] text-[#5cd6c8]'
const sectionInner = 'mx-auto w-full max-w-[1120px] px-4'

export default function AboutPage() {
  return (
    <main className="min-h-screen text-[#dbe6f0]" style={GRID_BG}>
      {/* 霓虹光晕 */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -right-24 -top-24 h-72 w-72 rounded-full opacity-50 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(56,225,212,0.22), transparent 70%)' }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -bottom-32 -left-20 h-80 w-80 rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(139,124,246,0.2), transparent 70%)' }}
      />

      {/* 终端 chrome 顶栏 */}
      <header className="sticky top-0 z-10 border-b border-[#1c2a3c] bg-[#080c15]/90 backdrop-blur">
        <div className={`flex items-center gap-2 py-3 ${sectionInner}`}>
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#ff5f57]" aria-hidden="true" />
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#febc2e]" aria-hidden="true" />
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#28c840]" aria-hidden="true" />
          <span className="ml-2 font-mono text-[11px] text-[#5b6c82]">~/about/tuaran</span>
          <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[#5cd6c8]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#34e0d0]" aria-hidden="true" />
            online
          </span>
        </div>
      </header>

      {/* Hero：头像 + 介绍 */}
      <section>
        <div className={`flex flex-col gap-6 py-8 sm:flex-row sm:items-start sm:gap-7 ${sectionInner}`}>
          <div className="relative w-28 shrink-0 sm:w-32">
            <div
              aria-hidden="true"
              className="absolute -inset-1 rounded-2xl opacity-70 blur-md"
              style={{ background: 'linear-gradient(135deg, rgba(52,224,208,0.5), rgba(139,124,246,0.5))' }}
            />
            <div className="relative overflow-hidden rounded-2xl border border-[#2a3b50] bg-[#0b121d]">
              <Image
                src={AVATAR_PATH}
                alt="涂阿燃 TUARAN"
                width={240}
                height={288}
                priority
                sizes="128px"
                className="h-auto w-full object-cover"
              />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p className={kicker}>About · 关于我</p>
            <h1 className="mt-2 break-words font-mono text-[26px] font-bold tracking-tight sm:text-[32px]">
              <span className="bg-[linear-gradient(90deg,#5cf0e0,#8b9cff)] bg-clip-text text-transparent">
                涂阿燃
              </span>{' '}
              <span className="text-[#4d5e73]">TUARAN</span>
            </h1>
            <p className="mt-1 font-mono text-[11px] tracking-wide text-[#5b6c82]">
              掘金安东尼 · 安东尼404 · tuaran
            </p>

            <ul className="mt-5 space-y-2.5">
              {introLines.map((line) => (
                <li key={line.text} className="flex items-start gap-3 text-[13.5px] leading-6 text-[#c3d0de]">
                  <span className="mt-0.5 shrink-0 text-[15px]" aria-hidden="true">
                    {line.icon}
                  </span>
                  {line.href ? (
                    <a
                      href={line.href}
                      target="_blank"
                      rel="noreferrer"
                      className="no-external-arrow text-[#c3d0de] no-underline transition hover:text-[#5cf0e0]"
                    >
                      {line.text}
                    </a>
                  ) : (
                    <span>{line.text}</span>
                  )}
                </li>
              ))}
            </ul>

            <div className="mt-5 flex flex-wrap gap-1.5">
              {identityTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-[#243549] bg-[#0d1622] px-2.5 py-1 font-mono text-[11px] text-[#8ea3bb]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 数据带 */}
      <section className="border-t border-[#1c2a3c]" aria-label="一些数字">
        <div className={`grid grid-cols-2 gap-2.5 py-8 sm:grid-cols-3 lg:grid-cols-5 ${sectionInner}`}>
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-[#1d2c3e] bg-[#0b1320]/80 px-3 py-3.5 text-center"
            >
              <div className="font-mono text-[22px] font-bold tabular-nums text-[#5cf0e0]">{stat.value}</div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#5f7088]">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 横向时间线 */}
      <section className="border-t border-[#1c2a3c]" aria-label="成长时间线">
        <div className={`py-8 ${sectionInner}`}>
          <div className="mb-4 flex items-baseline justify-between gap-2">
            <h2 className="font-mono text-[14px] font-bold text-[#e2ecf6]">
              <span className="text-[#5cd6c8]">$</span> timeline
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#5f7088]">2016 — 2026</span>
          </div>
          <ol className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-5 lg:grid-cols-9">
            {timeline.map((item, i) => (
              <li key={`${item.year}-${item.label}`} className="relative min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-[#34e0d0] shadow-[0_0_8px_rgba(52,224,208,0.8)]" aria-hidden="true" />
                  {i < timeline.length - 1 ? (
                    <span
                      className="hidden h-px flex-1 bg-[linear-gradient(90deg,#2a4456,transparent)] lg:block"
                      aria-hidden="true"
                    />
                  ) : null}
                </div>
                <p className="mt-1.5 font-mono text-[12px] font-bold tabular-nums text-[#7fe6da]">{item.year}</p>
                <p className="mt-0.5 text-[11px] leading-4 text-[#9aabc0]">{item.label}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 联系方式 + 正在维护的站点 */}
      <section className="border-t border-[#1c2a3c]">
        <div className={`grid grid-cols-1 items-start gap-6 py-8 lg:grid-cols-[300px_minmax(0,1fr)] ${sectionInner}`}>
          <div className="rounded-2xl border border-[#1d2c3e] bg-[#0a1018]/70 p-4" aria-label="联系方式">
            <h2 className="mb-3 font-mono text-[14px] font-bold text-[#e2ecf6]">
              <span className="text-[#5cd6c8]">$</span> contact
            </h2>
            <dl className="space-y-2 font-mono text-[12px] leading-6">
              {contactItems.map((item) => (
                <div key={item.label} className="flex flex-wrap gap-x-2.5">
                  <dt className="text-[#566a82]">{item.label}</dt>
                  <dd className="min-w-0">
                    {item.href ? (
                      <a
                        href={item.href}
                        className="break-all text-[#7fe6da] no-underline hover:underline"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <span className="text-[#c3d0de]">{item.value}</span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 border-t border-[#15212f] pt-3">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#566a82]">platforms</p>
              <div className="flex flex-wrap gap-1.5">
                {socialLinks.map((c) => (
                  <a
                    key={c.href}
                    href={c.href}
                    target="_blank"
                    rel="noreferrer"
                    className="no-external-arrow inline-flex items-center rounded-md border border-[#243549] bg-[#0d1622] px-2.5 py-1 font-mono text-[11px] text-[#8ea3bb] no-underline transition hover:border-[#34e0d0] hover:text-[#5cf0e0]"
                  >
                    {c.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div aria-label="正在维护的站点">
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <h2 className="font-mono text-[14px] font-bold text-[#e2ecf6]">
                <span className="text-[#5cd6c8]">$</span> building
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {siteLinks.map((c) => (
                <a
                  key={c.href}
                  href={c.href}
                  target="_blank"
                  rel="noreferrer"
                  className="no-external-arrow group block rounded-xl border border-[#1d2c3e] bg-[#0a1018]/70 p-3.5 no-underline transition hover:border-[#2c4a5e] hover:bg-[#0d1826]"
                >
                  <div className="flex items-center gap-1.5 text-[13.5px] font-semibold text-[#dbe6f0] transition-colors group-hover:text-[#5cf0e0]">
                    {c.label}
                    <span className="font-mono text-[11px] text-[#4d5e73] transition-transform group-hover:translate-x-0.5 group-hover:text-[#5cf0e0]">
                      ↗
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] leading-5 text-[#7186a0]">{c.desc}</p>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
