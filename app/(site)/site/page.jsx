import Link from 'next/link'

import PageContainer from '../components/PageContainer'

export const dynamic = 'force-static'

export const metadata = {
  title: '关于本站',
  description:
    '2aran.com 是涂阿燃维护的前端与 AI 工程个人站，集中呈现原创文章、项目复盘、专题分析和交互作品。',
  keywords: ['关于本站', '2aran.com', '涂阿燃', '前端工程', 'AI 工程', '原创文章', '项目复盘'],
  alternates: { canonical: '/site' },
}

const principles = [
  {
    title: '内容先行',
    body: '文章、分析、作品和阶段性实验都由站长选题、核验、维护，并尽量给出来源或工程证据。',
  },
  {
    title: '轻互动',
    body: '讨论围绕具体文章、资源和活动展开，读者可以评论、补充线索和交流经验；站点不开放自由发帖。',
  },
  {
    title: '持续更正',
    body: '事实变化、来源失效或主要判断需要修订时，会更新正文并保留必要说明。',
  },
]

const participate = [
  ['补充事实', '在具体文章下补充一手经历、公开资料和可核验线索。'],
  ['指出错误', '通过联系方式说明错误位置和依据，重要更正会同步到正文。'],
  ['讨论实践', '围绕架构、部署、性能、内容工程和 AI 工具链交流具体问题。'],
  ['联系合作', '技术咨询、内容分析、工程协作和出版相关事项可以直接联系站长。'],
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
          2aran.com 是涂阿燃维护的前端与 AI 工程个人站，记录真实项目、开源贡献、技术选型和长期专题。
          内容由我选题、核验并承担最终责任；辅助工具用于资料整理、校对和表达，不替代作者判断。
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link href="/articles" className="rounded-full bg-[var(--site-ink)] px-4 py-2 text-sm font-medium text-white no-underline shadow-sm transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--site-ink)] dark:text-[#0d0e0d]">
            进入知识库
          </Link>
          <Link href="/editorial" className="rounded-full border border-[var(--site-line)] px-4 py-2 text-sm font-medium text-[var(--site-ink)] no-underline hover:bg-[var(--site-panel)]">
            内容说明
          </Link>
          <Link href="/contact" className="rounded-full border border-[#caa86a] px-4 py-2 text-sm font-medium text-[#7a5b1e] no-underline hover:bg-[#fbf7ee] dark:border-amber-800 dark:text-amber-200 dark:hover:bg-amber-950/30">
            联系站长
          </Link>
        </div>
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
        <SectionIntro index="04" eyebrow="READING" title="阅读与引用" />
        <div>
          <p className="max-w-3xl text-[15px] leading-8 text-[var(--site-muted)]">
            精选文章和专题分析可直接阅读。引用时请保留作者、标题和原始链接；涉及第三方数据、图片或代码时，
            还需要遵守原始来源的许可。隐私、Cookie 和广告相关处理以隐私政策为准。
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/privacy" className="rounded-full bg-[#7a5b1e] px-4 py-2 text-sm font-medium text-white no-underline hover:bg-[#6a4f19] dark:bg-amber-700 dark:hover:bg-amber-600">
              查看隐私政策
            </Link>
            <Link href="/contact" className="rounded-full border border-[#caa86a] px-4 py-2 text-sm font-medium text-[#7a5b1e] no-underline hover:bg-[#fbf7ee] dark:border-amber-800 dark:text-amber-200 dark:hover:bg-amber-950/30">
              联系与更正
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
            <Link href="/contact" className="rounded-full border border-[var(--site-line)] px-4 py-2 text-sm font-medium text-[var(--site-ink)] no-underline">
              提交问题
            </Link>
          </div>
        </div>
      </section>
    </PageContainer>
  )
}
