import Link from 'next/link'

import PageContainer from '../components/PageContainer'

export const dynamic = 'force-static'

export const metadata = {
  title: '隐私政策',
  description:
    '2aran.com 的隐私政策：说明本站收集哪些信息、如何使用评论/登录/访问统计数据，以及如何联系站长处理隐私请求。',
  keywords: ['隐私政策', '2aran.com', '涂阿燃', 'Cookie', '访问统计', 'AdSense'],
  alternates: { canonical: '/privacy' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
}

const sections = [
  {
    title: '我们收集哪些信息',
    body: [
      '访问本站时，服务器和第三方统计服务可能记录基础访问数据，例如访问时间、页面路径、浏览器类型、设备信息、来源页面和近似地区。这些数据用于理解站点使用情况、排查故障和改进内容结构。',
      '当你注册、登录、评论、留言、订阅或使用站内互动功能时，本站可能保存你主动提交的昵称、邮箱、头像、评论内容、登录提供方标识、燃币记录和资源解锁记录。',
    ],
  },
  {
    title: 'Cookie 与本地存储',
    body: [
      '本站会使用 Cookie 或浏览器本地存储保存语言、主题、登录状态、阅读偏好等必要设置，以便提供稳定的浏览体验。',
      '第三方服务也可能通过 Cookie 或类似技术进行统计、广告展示、反作弊或安全验证。你可以在浏览器中清除或限制 Cookie，但部分登录、评论和偏好功能可能因此不可用。',
    ],
  },
  {
    title: '第三方服务',
    body: [
      '本站可能使用 Google AdSense 展示广告，使用 Umami 等工具做访问统计，并接入 GitHub、Google OAuth、Resend、Cloudflare 等服务完成登录、邮件、部署、安全和存储能力。',
      '这些第三方服务会按照其各自的隐私政策处理相关数据。本站不会出售你的个人信息，也不会将你的站内评论、邮箱或登录信息主动提供给无关第三方。',
    ],
  },
  {
    title: '数据用途',
    body: [
      '收集到的数据主要用于：维护登录和评论系统、提供资源领取与燃币权益、分析页面表现、识别滥用行为、修复故障、优化内容和展示更相关的广告。',
      '如果出现安全事件、滥用、法律合规或平台审核要求，本站可能在必要范围内检查相关日志和记录。',
    ],
  },
  {
    title: '你的选择',
    body: [
      '你可以选择不登录、不评论、不订阅邮件，也可以通过浏览器设置限制 Cookie 或广告个性化。',
      '如果你希望删除、修改或查询自己在本站留下的评论、留言、账号关联或订阅信息，可以通过联系页面找到站长邮箱。',
    ],
  },
]

export default function PrivacyPage() {
  return (
    <PageContainer width="narrow" className="py-12">
      <header className="border-b border-[var(--site-line)] pb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7a5b1e] dark:text-amber-300">
          Privacy Policy
        </p>
        <h1 className="mt-3 font-serif text-[34px] leading-tight text-[var(--site-ink)] md:text-[44px]">
          隐私政策
        </h1>
        <p className="mt-4 text-[15px] leading-8 text-[var(--site-muted)]">
          本政策适用于 2aran.com。它说明本站如何处理访问统计、登录、评论、资源领取、广告和联系信息。
          最后更新：2026 年 7 月 3 日。
        </p>
      </header>

      <div className="divide-y divide-[var(--site-line)]">
        {sections.map((section) => (
          <section key={section.title} className="py-8">
            <h2 className="font-serif text-[25px] text-[var(--site-ink)]">{section.title}</h2>
            <div className="mt-4 space-y-4">
              {section.body.map((paragraph) => (
                <p key={paragraph} className="text-[15px] leading-8 text-[var(--site-muted)]">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="rounded-xl border border-[var(--site-line)] bg-[var(--site-panel)] p-5">
        <h2 className="font-serif text-[24px] text-[var(--site-ink)]">联系我们</h2>
        <p className="mt-3 text-[14px] leading-7 text-[var(--site-muted)]">
          如需处理隐私、账号、评论、订阅或数据删除请求，请通过联系页面发送邮件。
        </p>
        <Link
          href="/contact"
          className="mt-4 inline-flex rounded-full bg-[var(--site-ink)] px-4 py-2 text-sm font-medium text-white no-underline transition hover:opacity-90 dark:text-[#0d0e0d]"
        >
          联系站长
        </Link>
      </section>
    </PageContainer>
  )
}
