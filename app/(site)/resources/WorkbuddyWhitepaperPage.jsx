import Link from 'next/link'

import ArticleFooterCta from '../components/ArticleFooterCta'
import ContentEngagement from '../components/ContentEngagement'
import ContentPvBeacon from '../components/ContentPvBeacon'
import PageContainer from '../components/PageContainer'
import SharePageButton from '../components/SharePageButton'
import ResourceLongformReader from './ResourceLongformReader'
import './workbuddy-whitepaper.css'

export default function WorkbuddyWhitepaperPage({ slug, title, subtitle, description, category, html, toc, jsonLd }) {
  const url = `https://2aran.com/resources/${slug}`
  const chapterCount = toc.filter((item) => item.depth === 2).length
  const sectionCount = toc.filter((item) => item.depth === 3).length

  return (
    <>
      <PageContainer width="standard" className="py-8 md:py-10">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
        <ContentPvBeacon category="resource" slug={slug} />

        <header className="overflow-hidden rounded-3xl border border-[#d9ded9] bg-[linear-gradient(145deg,#f7f8f5_0%,#f3f0ea_55%,#eef2f4_100%)] p-6 dark:border-gray-800 dark:bg-[linear-gradient(145deg,#151815_0%,#1b1c17_55%,#15181d_100%)] md:p-9">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-[#6f786f] dark:text-gray-400">
            <Link href="/articles?group=resource" className="hover:text-[#26352d] dark:hover:text-white">资源库</Link>
            <span>／</span>
            <span>{category}</span>
            <span>／</span>
            <ContentPvBeacon category="resource" slug={slug} display />
          </div>

          <div className="mt-8 grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#7d725f] dark:text-[#b8aa91]">WorkBuddy · White Paper</p>
              <h1 className="mt-3 max-w-3xl font-serif text-3xl font-semibold leading-tight tracking-tight text-[#202821] dark:text-white md:text-5xl">
                {title}
              </h1>
              <p className="mt-3 text-base font-medium text-[#687168] dark:text-gray-300 md:text-lg">{subtitle}</p>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-[#586258] dark:text-gray-300 md:text-base">{description}</p>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-2xl border border-white/80 bg-white/65 px-5 py-3 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-900/65">
                <dt className="text-[11px] text-[#7b837b] dark:text-gray-400">主章</dt>
                <dd className="mt-1 text-2xl font-semibold text-[#26312a] dark:text-white">{chapterCount}</dd>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/65 px-5 py-3 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-900/65">
                <dt className="text-[11px] text-[#7b837b] dark:text-gray-400">小节</dt>
                <dd className="mt-1 text-2xl font-semibold text-[#26312a] dark:text-white">{sectionCount}</dd>
              </div>
            </dl>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href="#read" className="inline-flex items-center justify-center rounded-lg bg-[#26352d] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#18221c] dark:bg-white dark:text-gray-950 dark:hover:bg-gray-200">开始阅读</a>
            <SharePageButton title={title} text={description} url={url} size="md" idleLabel="分享页面" />
          </div>
        </header>

        <section id="read" className="workbuddy-paper mt-8 scroll-mt-24" aria-label={`${title}全文`}>
          <ResourceLongformReader toc={toc} html={html} />
        </section>

        <ArticleFooterCta />
      </PageContainer>
      <ContentEngagement contentKey={`resource:${slug}`} width="standard" />
    </>
  )
}
