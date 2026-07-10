import Link from 'next/link'

import PageContainer from '../components/PageContainer'

export const dynamic = 'force-static'

export const metadata = {
  title: '联系方式',
  description:
    '联系涂阿燃（tuaran）：本站问题、内容合作、商务咨询、资源领取、隐私请求和技术服务联系入口。',
  keywords: ['联系方式', '涂阿燃', 'tuaran', '2aran.com', '商务合作', '内容合作'],
  alternates: { canonical: '/contact' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
}

const contactCards = [
  {
    title: '邮件',
    value: 'tuaran666@gmail.com',
    href: 'mailto:tuaran666@gmail.com',
    desc: '适合隐私请求、账号问题、合作邀约和需要留痕的正式沟通。',
  },
  {
    title: '微信',
    value: 'atar24',
    desc: '适合读者交流、资源领取、燃币调整和轻量合作沟通。',
  },
  {
    title: 'GitHub',
    value: 'github.com/TUARAN',
    href: 'https://github.com/TUARAN',
    desc: '适合开源项目、代码问题、Issue 和技术协作。',
  },
]

const topics = [
  ['站点问题', '页面打不开、链接失效、资源下载失败、评论或登录异常。'],
  ['内容合作', '调研、文章、技术内容共创、AI 产品体验和创作者合作。'],
  ['商务咨询', '前端工程化、AI 工程化、内容增长、自动化工作流和项目交付。'],
  ['隐私请求', '删除评论、取消订阅、账号关联、数据查询或其它隐私相关事项。'],
]

export default function ContactPage() {
  return (
    <PageContainer className="py-12">
      <header className="border-b border-[var(--site-line)] pb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7a5b1e] dark:text-amber-300">
          Contact
        </p>
        <h1 className="mt-3 font-serif text-[34px] leading-tight text-[var(--site-ink)] md:text-[44px]">
          联系方式
        </h1>
        <p className="mt-4 max-w-[760px] text-[15px] leading-8 text-[var(--site-muted)]">
          这里是联系涂阿燃和反馈本站问题的公开入口。请尽量说明来意、相关链接和期望结果，我会按优先级处理。
        </p>
      </header>

      <section className="grid gap-4 py-10 md:grid-cols-3">
        {contactCards.map((card) => (
          <article key={card.title} className="rounded-xl border border-[var(--site-line)] bg-[var(--site-panel)] p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7a5b1e] dark:text-amber-300">
              {card.title}
            </p>
            {card.href ? (
              <a
                href={card.href}
                target={card.href.startsWith('http') ? '_blank' : undefined}
                rel={card.href.startsWith('http') ? 'noreferrer' : undefined}
                className="mt-3 block break-all font-mono text-[18px] font-semibold text-[var(--site-ink)] no-underline hover:opacity-75"
              >
                {card.value}
              </a>
            ) : (
              <p className="mt-3 break-all font-mono text-[18px] font-semibold text-[var(--site-ink)]">
                {card.value}
              </p>
            )}
            <p className="mt-3 text-[13px] leading-6 text-[var(--site-muted)]">{card.desc}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-8 border-t border-[var(--site-line)] py-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7a5b1e] dark:text-amber-300">
            Scope
          </p>
          <h2 className="mt-2 font-serif text-[28px] text-[var(--site-ink)]">适合联系我的事项</h2>
          <p className="mt-3 text-[14px] leading-7 text-[var(--site-muted)]">
            如果是具体文章或资源的问题，也可以直接在对应页面评论。涉及账号、隐私、合作和付款的信息请优先发邮件。
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {topics.map(([title, body]) => (
            <div key={title} className="rounded-xl border border-[var(--site-line)] p-4">
              <h3 className="text-[15px] font-semibold text-[var(--site-ink)]">{title}</h3>
              <p className="mt-1.5 text-[13px] leading-6 text-[var(--site-muted)]">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-[#e2d9c4] bg-[#fbf7ee] p-6 dark:border-amber-900/40 dark:bg-amber-950/20">
        <h2 className="font-serif text-[26px] text-[#5f4617] dark:text-amber-100">也可以先看这些页面</h2>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/about" className="rounded-full border border-[#caa86a] bg-white px-4 py-2 text-sm font-medium text-[#7a5b1e] no-underline hover:bg-[#fffdf7] dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            关于站长
          </Link>
          <Link href="/services" className="rounded-full border border-[#caa86a] bg-white px-4 py-2 text-sm font-medium text-[#7a5b1e] no-underline hover:bg-[#fffdf7] dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            合作说明
          </Link>
          <Link href="/privacy" className="rounded-full border border-[#caa86a] bg-white px-4 py-2 text-sm font-medium text-[#7a5b1e] no-underline hover:bg-[#fffdf7] dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            隐私政策
          </Link>
        </div>
      </section>
    </PageContainer>
  )
}
