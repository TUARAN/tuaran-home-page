import Link from 'next/link'

import PageContainer from '../components/PageContainer'
import RanbiBalance from '../components/RanbiBalance'
import { POINT_RULES } from '../../../lib/points'

export const dynamic = 'force-static'

export const metadata = {
  title: '关于本站 · 2aran.com',
  description:
    '2aran.com 是涂阿燃维护的个人内容与项目门户，不是 UGC 社区；这里支持围绕特定话题评论讨论、领取资源、参加活动，并用燃币做友好的留存和互动权益。',
  keywords: ['关于本站', '2aran.com', '涂阿燃', '燃币', '资源', '活动', '评论讨论'],
  alternates: { canonical: '/site' },
}

const cards = [
  {
    title: '内容先行',
    body: '这里首先是一个个人内容和项目门户：文章、调研、资源、作品和阶段性实验都由站长整理维护。',
  },
  {
    title: '轻互动',
    body: '本站不是 UGC 平台，不追求让所有人自由发帖；但支持围绕具体文章、资源和活动进行评论、补充线索和友好讨论。',
  },
  {
    title: '资源与活动',
    body: '部分资料、下载、专题页和活动入口会集中在这里，方便长期读者领取、回看和参与。',
  },
]

const participate = [
  ['评论讨论', '在文章、调研、资源页下补充观点、经验和问题，围绕具体话题交流。'],
  ['领取资源', '用燃币解锁或领取站内整理的资料、插件、下载和专题内容。'],
  ['参加活动', '例如竞猜、社群活动、问卷或线下连接，后续会按主题逐步开放。'],
  ['私聊站长', '燃币不足、资源打不开、理由充分想补额度，都可以直接联系站长处理。'],
]

export default function SiteAboutPage() {
  return (
    <PageContainer width="wide" className="py-12">
      <header className="border-b border-[var(--site-line)] pb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7a5b1e] dark:text-amber-300">
          About This Site
        </p>
        <h1 className="mt-3 font-serif text-[34px] leading-tight text-[var(--site-ink)] md:text-[46px]">
          关于本站
        </h1>
        <p className="mt-4 max-w-3xl text-[15px] leading-8 text-[var(--site-muted)]">
          2aran.com 是涂阿燃维护的个人内容、项目和资源门户。它不是一个 UGC 社区，也不以“收费阅读”为目标；
          更像一个长期开放的工作台：我负责持续整理内容和资源，读者可以围绕特定话题评论讨论、领取资料、参加活动，
          并通过燃币保留自己的参与记录和资源权益。
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="/articles"
            className="rounded-full bg-[var(--site-ink)] px-4 py-2 text-sm font-medium text-white no-underline shadow-sm transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--site-ink)] dark:text-[#0d0e0d]"
          >
            进入知识库
          </Link>
          <Link
            href="/ranbi"
            className="rounded-full border border-[var(--site-line)] px-4 py-2 text-sm font-medium text-[var(--site-ink)] no-underline hover:bg-[var(--site-panel)]"
          >
            了解燃币
          </Link>
          <Link
            href="/donate"
            className="rounded-full border border-[#caa86a] px-4 py-2 text-sm font-medium text-[#7a5b1e] no-underline hover:bg-[#fbf7ee] dark:border-amber-800 dark:text-amber-200 dark:hover:bg-amber-950/30"
          >
            支持本站
          </Link>
        </div>
        <div className="mt-5">
          <RanbiBalance />
        </div>
      </header>

      <section className="grid gap-4 py-10 md:grid-cols-3">
        {cards.map((card) => (
          <div key={card.title} className="rounded-xl border border-[var(--site-line)] bg-[var(--site-panel)] p-5">
            <h2 className="font-serif text-[20px] text-[var(--site-ink)]">{card.title}</h2>
            <p className="mt-2 text-[14px] leading-7 text-[var(--site-muted)]">{card.body}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-8 border-t border-[var(--site-line)] py-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7a5b1e] dark:text-amber-300">
            Participation
          </p>
          <h2 className="mt-2 font-serif text-[28px] text-[var(--site-ink)]">你可以怎样参与</h2>
          <p className="mt-3 text-[14px] leading-7 text-[var(--site-muted)]">
            参与不是来“生产内容给平台”，而是围绕已经存在的文章、资料和活动进行补充、讨论和连接。
            站点会尽量把入口做得轻一些，让认真交流的人更容易留下来。
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {participate.map(([title, body]) => (
            <div key={title} className="rounded-xl border border-[var(--site-line)] p-4">
              <h3 className="text-[15px] font-semibold text-[var(--site-ink)]">{title}</h3>
              <p className="mt-1.5 text-[13px] leading-6 text-[var(--site-muted)]">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-[#e2d9c4] bg-[#fbf7ee] p-6 dark:border-amber-900/40 dark:bg-amber-950/20">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7a5b1e] dark:text-amber-300">
          Ranbi
        </p>
        <h2 className="mt-2 font-serif text-[26px] text-[#5f4617] dark:text-amber-100">燃币不是收费墙</h2>
        <p className="mt-3 max-w-3xl text-[14px] leading-7 text-[#7f704e] dark:text-amber-300/85">
          燃币是本站的留存和友好交流机制：游客有 {POINT_RULES.guestSeed} 枚试用额度，登录后有 {POINT_RULES.register}{' '}
          枚起步额度，也可以通过签到、评论、活动或站长手动调整获得。它主要用来记录资源领取、活动参与和内容解锁，
          不是为了把阅读变成收费。图床、视频、模型请求、存储和带宽确实会有成本；如果你愿意支持本站，也可以在支持后私聊站长调整燃币。
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/ranbi"
            className="rounded-full bg-[#7a5b1e] px-4 py-2 text-sm font-medium text-white no-underline hover:bg-[#6a4f19] dark:bg-amber-700 dark:hover:bg-amber-600"
          >
            查看燃币说明
          </Link>
          <Link
            href="/donate"
            className="rounded-full border border-[#caa86a] bg-white px-4 py-2 text-sm font-medium text-[#7a5b1e] no-underline hover:bg-[#fffdf7] dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
          >
            支持并补充燃币
          </Link>
        </div>
      </section>
    </PageContainer>
  )
}
