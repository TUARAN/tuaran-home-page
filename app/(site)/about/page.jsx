import Image from 'next/image'
import Link from 'next/link'

import { AVATAR_PATH } from '../../../lib/avatar'
import SharePageButton from '../components/SharePageButton'

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
  'OpenClaw Contributor',
  '矩联科技创始人',
  '茉莉奶爸',
]

const introLines = [
  { icon: '📚', text: '《程序员成长手记》《AI Bots 通关指南》作者' },
  { icon: '💡', text: '专注前端工程化与 AI 智能体，深耕实战与技术社区共建' },
  {
    icon: '🧩',
    text: 'OpenClaw 开源贡献者：2 个 PR 已合并至 openclaw:main',
    href: 'https://github.com/openclaw/openclaw/pulls?q=is%3Apr+author%3ATUARAN+is%3Amerged',
  },
  { icon: '🌐', text: '个人主页：2aran.com', href: 'https://2aran.com' },
  {
    icon: '🤝',
    text: '加入博主联盟：blogger-alliance.cn — 连接 AI 产品与技术影响力',
    href: 'https://blogger-alliance.cn/',
  },
]

const stats = [
  { value: '1500+', label: '公开内容/发帖' },
  { value: '600w+', label: '全网阅读' },
  { value: '2', label: '出版作品' },
  { value: '6', label: '在维护站点' },
  { value: '2', label: 'OpenClaw 合并 PR' },
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
  { year: '2026.07', label: 'OpenClaw 两个 PR 合入 main' },
]

const openSourceHighlight = {
  href: 'https://github.com/openclaw/openclaw/pull/98320',
  title: '梅开二度 · OpenClaw PR #98320 merged into main',
  summary:
    '修复 Feishu 图片和文件回复在引用消息被撤回或删除后无法送达的问题，让受安全条件保护的回退逻辑把媒体恢复为顶层消息。这是又一个值得珍藏的开源里程碑：珍视每一次贡献被接纳的荣誉，也会坚定地在开源路上走下去。',
  facts: ['3 commits', '+168 -35', '5 files', 'Feishu', 'steipete merged', 'main'],
}

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
  { label: 'AI分发大师', href: 'https://syncblog.cn/', desc: '一次创作，多平台自动同步分发' },
  { label: 'Open Claude Code', href: 'https://openclaudecode.site/', desc: 'Claude Code 与 Agent 工程笔记' },
  { label: 'TUARAN 网络日志', href: 'https://2aran.com/', desc: '个人主页、技术笔记与长期内容索引' },
]

const friendLinks = [
  {
    label: '阮一峰的网络日志',
    href: 'https://www.ruanyifeng.com/blog/',
    desc: '中文技术圈经典个人博客与《科技爱好者周刊》，长期稳定更新。',
    tag: '技术 / 周刊',
  },
  {
    label: '我的 RSS 订阅墙',
    href: '/resources/rss',
    desc: '我长期订阅和推荐的博客入口，也欢迎互换 RSS 与个人站链接。',
    tag: 'Blogroll',
    internal: true,
  },
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
    <main className="about-page min-h-screen text-[#dbe6f0]" style={GRID_BG}>
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
          <span className="ml-2 min-w-0 truncate font-mono text-[11px] text-[#5b6c82]">~/about/tuaran</span>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Link href="/" aria-label="返回首页" className="article-action-button px-3.5 py-1.5 text-sm no-underline">
              返回
            </Link>
            <SharePageButton
              title="关于我 · 涂阿燃 TUARAN"
              text="涂阿燃（tuaran / 掘金安东尼）：前端与 AI 工程化方向的开发者、技术写作者和产品实践者。"
              url="/about"
              exactUrl
              size="md"
              idleLabel="分享"
            />
          </div>
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
        <div className={`grid grid-cols-2 gap-2.5 py-8 sm:grid-cols-3 lg:grid-cols-6 ${sectionInner}`}>
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
          <ol className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-5 lg:grid-cols-10">
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

      {/* 开源贡献 */}
      <section className="border-t border-[#1c2a3c]" aria-label="开源贡献">
        <div className={`grid grid-cols-1 gap-5 py-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(320px,1.08fr)] ${sectionInner}`}>
          <div className="min-w-0">
            <p className={kicker}>Open Source · 开源贡献</p>
            <h2 className="mt-2 border-b-0 pb-0 font-mono text-[20px] font-bold leading-8 text-[#e2ecf6] sm:text-[24px]">
              {openSourceHighlight.title}
            </h2>
            <p className="mt-3 text-[13.5px] leading-7 text-[#9aabc0]">{openSourceHighlight.summary}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {openSourceHighlight.facts.map((fact) => (
                <span
                  key={fact}
                  className="rounded-md border border-[#243549] bg-[#0d1622] px-2.5 py-1 font-mono text-[11px] text-[#8ea3bb]"
                >
                  {fact}
                </span>
              ))}
            </div>
            <a
              href={openSourceHighlight.href}
              target="_blank"
              rel="noreferrer"
              className="no-external-arrow mt-5 inline-flex items-center rounded-md border border-[#2d4d61] bg-[#102032] px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[#7fe6da] no-underline transition hover:border-[#34e0d0] hover:bg-[#13283d]"
            >
              查看合并记录 ↗
            </a>
          </div>
          <a
            href={openSourceHighlight.href}
            target="_blank"
            rel="noreferrer"
            className="no-external-arrow group overflow-hidden rounded-2xl border border-[#1d2c3e] bg-[#05090f] no-underline shadow-[0_18px_56px_rgba(0,0,0,0.24)]"
            aria-label="查看 OpenClaw PR #98320 合并截图"
          >
            <Image
              src="/images/openclaw/pr-98320-merged.png"
              alt="OpenClaw PR #98320 merged into main"
              width={1880}
              height={1466}
              sizes="(min-width: 1024px) 540px, 100vw"
              className="h-full min-h-[240px] w-full object-cover object-left-top opacity-95 transition duration-300 group-hover:scale-[1.015] group-hover:opacity-100"
            />
          </a>
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

      {/* 友链 */}
      <section className="border-t border-[#1c2a3c]" aria-label="友链">
        <div className={`py-8 ${sectionInner}`}>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className={kicker}>Friend Links · 友链</p>
              <h2 className="mt-2 border-b-0 pb-0 font-mono text-[20px] font-bold leading-8 text-[#e2ecf6] sm:text-[24px]">
                <span className="text-[#5cd6c8]">$</span> friends
              </h2>
              <p className="mt-2 max-w-[680px] text-[13px] leading-6 text-[#8ea3bb]">
                这里放长期阅读、互相知道、或者值得推荐给本站读者的个人站和博客。
              </p>
            </div>
            <a
              href="mailto:tuaran666@gmail.com?subject=%E4%BA%A4%E6%8D%A2%E5%8F%8B%E9%93%BE"
              className="no-external-arrow inline-flex w-fit items-center rounded-md border border-[#2d4d61] bg-[#102032] px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[#7fe6da] no-underline transition hover:border-[#34e0d0] hover:bg-[#13283d]"
            >
              交换友链
            </a>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {friendLinks.map((link) => {
              const cardClass =
                'no-external-arrow group block rounded-xl border border-[#1d2c3e] bg-[#0a1018]/70 p-3.5 no-underline transition hover:border-[#2c4a5e] hover:bg-[#0d1826]'
              const card = (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13.5px] font-semibold text-[#dbe6f0] transition-colors group-hover:text-[#5cf0e0]">
                        {link.label}
                      </p>
                      <p className="mt-1 break-all font-mono text-[10px] text-[#4d5e73]">{link.href}</p>
                    </div>
                    <span className="shrink-0 rounded-md border border-[#243549] bg-[#0d1622] px-2 py-0.5 font-mono text-[10px] text-[#8ea3bb]">
                      {link.tag}
                    </span>
                  </div>
                  <p className="mt-2 text-[12px] leading-5 text-[#7186a0]">{link.desc}</p>
                </>
              )

              return link.internal ? (
                <Link key={link.href} href={link.href} className={cardClass}>
                  {card}
                </Link>
              ) : (
                <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className={cardClass}>
                  {card}
                </a>
              )
            })}

            <a
              href="mailto:tuaran666@gmail.com?subject=%E4%BA%A4%E6%8D%A2%E5%8F%8B%E9%93%BE&body=%E7%AB%99%E7%82%B9%E5%90%8D%EF%BC%9A%0A%E9%93%BE%E6%8E%A5%EF%BC%9A%0A%E7%AE%80%E4%BB%8B%EF%BC%9A"
              className="no-external-arrow flex min-h-[126px] flex-col justify-between rounded-xl border border-dashed border-[#2d4d61] bg-[#07101a]/70 p-3.5 no-underline transition hover:border-[#34e0d0] hover:bg-[#0c1a28]"
            >
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#5cd6c8]">Open Slot</p>
                <p className="mt-2 text-[13.5px] font-semibold text-[#dbe6f0]">你的个人站 / 博客</p>
                <p className="mt-2 text-[12px] leading-5 text-[#7186a0]">
                  技术、AI、独立开发、长期写作方向优先。发我站名、链接和一句简介即可。
                </p>
              </div>
              <span className="mt-3 font-mono text-[11px] text-[#7fe6da]">mailto →</span>
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
