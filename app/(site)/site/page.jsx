import Link from 'next/link'

import PageContainer from '../components/PageContainer'
import RanbiBalance from '../components/RanbiBalance'

export const dynamic = 'force-static'

export const metadata = {
  title: '关于本站',
  description:
    '2aran.com 是涂阿燃维护的个人内容与项目门户，集中提供原创文章、专题分析、工程实践、资源权益与参与入口。',
  keywords: ['关于本站', '2aran.com', '涂阿燃', '燃币', '资源', '活动', '评论讨论'],
  alternates: { canonical: '/site' },
}

const principles = [
  {
    title: '内容先行',
    body: '这里首先是一个个人内容和项目门户：文章、调研、资源、作品和阶段性实验都由站长整理维护。',
  },
  {
    title: '轻互动',
    body: '讨论围绕具体文章、资源和活动展开，读者可以评论、补充线索和交流经验；站点不开放自由发帖。',
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

const contentGroups = [
  ['文章与观点', '个人判断、写作方法与长期主题。', '/articles?tab=posts'],
  ['分析与观察', '公司、人物、技术、市场与公共议题。', '/articles?tab=research'],
  ['工程案例', '真实项目中的架构、部署、权限与性能实践。', '/articles?tab=engineering-cases'],
  ['建站日志', '2aran.com 的产品选择、改造过程与阶段复盘。', '/articles?tab=build-logs'],
  ['作品与实验', '可交互页面、工具、自动化与个人项目。', '/works'],
]

function SectionIntro({ index, eyebrow, title, children }) {
  return <aside className="lg:pr-8">
    <p className="text-[11px] font-bold tracking-[0.18em] text-[#7a5b1e] dark:text-amber-300">{index} / {eyebrow}</p>
    <h2 className="mt-2 font-serif text-[27px] leading-tight text-[var(--site-ink)]">{title}</h2>
    {children ? <div className="mt-3 text-[14px] leading-7 text-[var(--site-muted)]">{children}</div> : null}
  </aside>
}

export default function SiteAboutPage() {
  return (
    <PageContainer className="py-12 md:py-16">
      <header className="border-b border-[var(--site-line)] pb-10 md:pb-12">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7a5b1e] dark:text-amber-300">
          About This Site
        </p>
        <h1 className="mt-3 font-serif text-[34px] leading-tight text-[var(--site-ink)] md:text-[46px]">
          关于本站
        </h1>
        <p className="mt-4 max-w-[760px] text-[15px] leading-8 text-[var(--site-muted)]">
          2aran.com 是涂阿燃维护的个人内容、项目和资源门户，也是一张持续更新的个人工作台。
          我负责整理内容和资源；读者可以阅读、评论、领取资料、参加活动，并通过燃币保留参与记录和资源权益。
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link href="/articles" className="rounded-full bg-[var(--site-ink)] px-4 py-2 text-sm font-medium text-white no-underline shadow-sm transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--site-ink)] dark:text-[#0d0e0d]">
            进入知识库
          </Link>
          <Link href="/ranbi" className="rounded-full border border-[var(--site-line)] px-4 py-2 text-sm font-medium text-[var(--site-ink)] no-underline hover:bg-[var(--site-panel)]">
            了解燃币
          </Link>
          <Link href="/donate" className="rounded-full border border-[#caa86a] px-4 py-2 text-sm font-medium text-[#7a5b1e] no-underline hover:bg-[#fbf7ee] dark:border-amber-800 dark:text-amber-200 dark:hover:bg-amber-950/30">
            支持本站
          </Link>
        </div>
        <RanbiBalance className="mt-5" />
      </header>

      <section className="grid gap-8 border-b border-[var(--site-line)] py-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
        <SectionIntro index="01" eyebrow="POSITION" title="这是一个怎样的站点" />
        <ol className="border-t border-[var(--site-line)]">
          {principles.map((item, index) => <li key={item.title} className="grid gap-2 border-b border-[var(--site-line)] py-5 sm:grid-cols-[40px_minmax(0,1fr)] sm:gap-5">
            <span className="font-mono text-xs text-[#8a7a55] dark:text-amber-300/70">0{index + 1}</span>
            <div>
              <h3 className="font-serif text-[21px] text-[var(--site-ink)]">{item.title}</h3>
              <p className="mt-2 max-w-2xl text-[14px] leading-7 text-[var(--site-muted)]">{item.body}</p>
            </div>
          </li>)}
        </ol>
      </section>

      <section id="originals" className="scroll-mt-24 grid gap-8 border-b border-[var(--site-line)] py-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
        <SectionIntro index="02" eyebrow="CONTENT" title="内容从哪里进入">
          <p>原创内容、资料整理与个人实验按实际形态分开呈现，避免把所有长文都包装成同一种研究。</p>
        </SectionIntro>
        <div className="border-t border-[var(--site-line)]">
          {contentGroups.map(([title, body, href]) => (
            <Link key={title} href={href} className="grid gap-2 border-b border-[var(--site-line)] py-5 no-underline sm:grid-cols-[9rem_minmax(0,1fr)_auto] sm:items-center sm:gap-5">
              <h3 className="font-serif text-[20px] text-[var(--site-ink)]">{title}</h3>
              <p className="text-[14px] leading-7 text-[var(--site-muted)]">{body}</p>
              <span className="text-xs font-medium text-[var(--site-accent)]">进入 →</span>
            </Link>
          ))}
        </div>
      </section>

      <section id="participation" className="scroll-mt-24 grid gap-8 border-b border-[var(--site-line)] py-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
        <SectionIntro index="03" eyebrow="PARTICIPATION" title="你可以怎样参与">
          <p>参与入口附着在具体文章、资料和活动上，用于补充、讨论和连接。</p>
          <p className="mt-3">站点会尽量把入口做得轻一些，让认真交流的人更容易留下来。</p>
        </SectionIntro>
        <dl className="border-t border-[var(--site-line)]">
          {participate.map(([title, body], index) => <div key={title} className="grid gap-2 border-b border-[var(--site-line)] py-5 sm:grid-cols-[40px_minmax(0,1fr)] sm:gap-5">
            <dt className="font-mono text-xs text-[#8a7a55] dark:text-amber-300/70">0{index + 1}</dt>
            <dd>
              <h3 className="text-[15px] font-semibold text-[var(--site-ink)]">{title}</h3>
              <p className="mt-1.5 max-w-2xl text-[14px] leading-7 text-[var(--site-muted)]">{body}</p>
            </dd>
          </div>)}
        </dl>
      </section>

      <section id="reader-rights" className="scroll-mt-24 grid gap-8 border-b border-[var(--site-line)] py-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
        <SectionIntro index="04" eyebrow="RANBI" title="读者资源权益" />
        <div>
          <p className="max-w-3xl text-[15px] leading-8 text-[var(--site-muted)]">
            燃币是本站的留存和友好交流机制：游客有试用额度，登录后有起步额度，也可以通过签到、评论、活动或站长手动调整获得。它主要用来记录资源领取、活动参与和内容解锁，
            公开阅读不受影响；已解锁内容和已领取资源会保留在账号权益中。
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/ranbi" className="rounded-full bg-[#7a5b1e] px-4 py-2 text-sm font-medium text-white no-underline hover:bg-[#6a4f19] dark:bg-amber-700 dark:hover:bg-amber-600">
              查看燃币说明
            </Link>
            <Link href="/donate" className="rounded-full border border-[#caa86a] px-4 py-2 text-sm font-medium text-[#7a5b1e] no-underline hover:bg-[#fbf7ee] dark:border-amber-800 dark:text-amber-200 dark:hover:bg-amber-950/30">
              支持并补充燃币
            </Link>
          </div>
        </div>
      </section>

      <section id="editorial" className="scroll-mt-24 grid gap-8 py-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
        <SectionIntro index="05" eyebrow="POLICY" title="作者、来源与更正" />
        <div className="max-w-3xl">
          <p className="text-[15px] leading-8 text-[var(--site-muted)]">
            署名内容由涂阿燃最终确认并承担发布责任。第三方材料保留来源；健康、金融和法律内容保留必要边界；影响主要结论的修订会留下说明。
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/editorial" className="rounded-full bg-[var(--site-ink)] px-4 py-2 text-sm font-medium text-white no-underline dark:text-[#0d0e0d]">
              查看内容与更正政策
            </Link>
            <Link href="/help" className="rounded-full border border-[var(--site-line)] px-4 py-2 text-sm font-medium text-[var(--site-ink)] no-underline">
              查看使用帮助
            </Link>
          </div>
        </div>
      </section>
    </PageContainer>
  )
}
