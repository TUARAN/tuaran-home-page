import Link from 'next/link'

import ArticleActionsDropdown from '../../components/ArticleActionsDropdown'
import ArticleFooterCta from '../../components/ArticleFooterCta'
import ContentEngagement from '../../components/ContentEngagement'
import ContentPvBeacon from '../../components/ContentPvBeacon'
import DistributeContentButton from '../../components/DistributeContentButton'
import PageContainer from '../../components/PageContainer'
import SharePageButton from '../../components/SharePageButton'
import { getResourceDocument, loadResourceMarkdown } from '../../../../lib/resourceDocuments'
import { buildJianguoFanglyeArticle } from '../../../../lib/resourceMarkdown'
import ResourceLongformReader from '../ResourceLongformReader'

export const dynamic = 'force-static'

const RESOURCE_SLUG = 'jianguo-fanglye'
const RESOURCE_PATH = `/resources/${RESOURCE_SLUG}`
const RESOURCE_URL = `https://2aran.com${RESOURCE_PATH}`
const SOURCE_URL = 'https://zh.wikisource.org/zh-hans/%E5%BB%BA%E5%9B%BD%E6%96%B9%E7%95%A5'
const TITLE = '《建国方略》全文原文：孙文学说、实业计划、民权初步'
const DESCRIPTION =
  '孙文 1917–1921 年写成的《建国方略》简体全文：心理建设《孙文学说》、物质建设《实业计划》、社会建设《民权初步》。站内带三卷目录，并保留中国国家图书馆扫描件。'

const doc = getResourceDocument(RESOURCE_SLUG)
const article = buildJianguoFanglyeArticle(loadResourceMarkdown(RESOURCE_SLUG))
const toc = article.toc || []
const chapterToc = toc.filter((item) => item.depth === 2)
const sectionCount = toc.filter((item) => item.depth === 3).length

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    '建国方略',
    '孙中山',
    '孙文',
    '孙文学说',
    '实业计划',
    '民权初步',
    '知难行易',
    '物质建设',
    '心理建设',
    '社会建设',
    '在线阅读',
  ],
  alternates: { canonical: RESOURCE_PATH },
  openGraph: {
    type: 'article',
    locale: 'zh_CN',
    siteName: '2aran.com',
    title: '《建国方略》全文原文',
    description: DESCRIPTION,
    url: RESOURCE_URL,
  },
  twitter: {
    card: 'summary',
    title: '《建国方略》全文｜孙文 1917–1921',
    description: '心理建设、物质建设、社会建设三卷简体全文，附国图扫描件。',
  },
  robots: { index: true, follow: true },
}

const relatedLinks = [
  { href: SOURCE_URL, label: '维基文库《建国方略》', external: true },
  { href: doc.pdfHref, label: '国图扫描 PDF', download: '建国方略.pdf' },
  { href: '/articles/research/topics/jianguo-fanglye', label: '《建国方略》解析' },
  { href: '/articles/research/topics/sun-yat-sen-qinzhou-seaport', label: '孙中山为何选钦州出海口' },
]

const faqs = [
  {
    question: '《建国方略》是一本书还是三本书？',
    answer:
      '合订本。社会建设《民权初步》1917 年完稿，原名《会议通则》；心理建设《孙文学说》1918 年 12 月 30 日自序于上海；物质建设《实业计划》英文本 1918–1920 年写成，中文自序 1921 年 10 月 10 日于广州。三篇后来合称《建国方略》。他还列过第四部分「国家建设」，没有按原计划出齐。',
  },
  {
    question: '站内这份全文和国图 PDF 是什么关系？',
    answer:
      '在线阅读用的是维基文库公有领域整理本，已转成简体并做成可跳转目录。PDF 是中国国家图书馆数字资源 NLC416-01jh003731-18241 的 508 页扫描件，无文字层，用来对照版式。孙文 1925 年逝世，著作本身已进入公有领域。维基文库标注校对质量约 50%，关键引文请对照扫描件或通行校订本。',
  },
  {
    question: '今天还该把它当施工图读吗？',
    answer:
      '适合当 1917–1921 年的重建说明书来读：心理上要先破「行难」，物质上要港口、铁路、水道和矿业同时铺，社会上要从开会规则学起。港口和铁路后来有一批功能对得上，国际共同投资那一套没有按原方案落地。工程细节以当代可研为准，解析见站内配套文章。',
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Book',
      '@id': `${RESOURCE_URL}#book`,
      name: '建国方略',
      alternateName: ['孙文学说', '实业计划', '民权初步', 'The International Development of China'],
      headline: TITLE,
      description: DESCRIPTION,
      inLanguage: 'zh-CN',
      datePublished: '1921-10-10',
      dateModified: '2026-09-19',
      url: RESOURCE_URL,
      author: { '@type': 'Person', name: '孙文', alternateName: '孙中山' },
      isBasedOn: SOURCE_URL,
      copyrightNotice: '作者 1925 年逝世，著作已进入公有领域。',
      encoding: {
        '@type': 'MediaObject',
        contentUrl: `https://2aran.com${doc.pdfHref}`,
        encodingFormat: 'application/pdf',
        name: '建国方略 — 中国国家图书馆扫描件 NLC416-01jh003731-18241',
      },
    },
    {
      '@type': 'WebPage',
      '@id': `${RESOURCE_URL}#page`,
      url: RESOURCE_URL,
      name: TITLE,
      description: DESCRIPTION,
      inLanguage: 'zh-CN',
      datePublished: '2026-09-19',
      dateModified: '2026-09-19',
      isPartOf: { '@type': 'WebSite', name: '2aran.com', url: 'https://2aran.com' },
      mainEntity: { '@id': `${RESOURCE_URL}#book` },
    },
    {
      '@type': 'FAQPage',
      mainEntity: faqs.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    },
  ],
}

function groupedToc(items) {
  const groups = []
  let current = null
  for (const item of items) {
    if (item.depth === 2) {
      current = { heading: item, sections: [] }
      groups.push(current)
      continue
    }
    if (item.depth === 3 && current) current.sections.push(item)
  }
  return groups
}

export default function JianguoFanglyePage() {
  const groups = groupedToc(toc)

  return (
    <>
      <PageContainer width="standard" className="py-8 md:py-10">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
        <ContentPvBeacon category="resource" slug={RESOURCE_SLUG} />

        <header className="overflow-hidden rounded-3xl border border-[#d9ded9] bg-[linear-gradient(145deg,#f7f8f5_0%,#f3f0ea_55%,#eef2f4_100%)] p-6 dark:border-gray-800 dark:bg-[linear-gradient(145deg,#151815_0%,#1b1c17_55%,#15181d_100%)] md:p-9">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-[#6f786f] dark:text-gray-400">
            <Link href="/articles?group=resource" className="hover:text-[#26352d] dark:hover:text-white">
              资源库
            </Link>
            <span>／</span>
            <span>历史原文</span>
            <span>／</span>
            <ContentPvBeacon category="resource" slug={RESOURCE_SLUG} display />
          </div>

          <div className="mt-8 grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#7d725f] dark:text-[#b8aa91]">
                孙文 · 1917–1921
              </p>
              <h1 className="mt-3 max-w-3xl font-serif text-3xl font-semibold leading-tight tracking-tight text-[#202821] dark:text-white md:text-5xl">
                建国方略
                <span className="mt-2 block text-[#687168] dark:text-gray-300">
                  心理建设、物质建设、社会建设
                </span>
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-[#586258] dark:text-gray-300 md:text-base">
                孙文把《孙文学说》《实业计划》《民权初步》合成一套建国说明书。站内提供简体全文、三卷目录和国图扫描 PDF；配套解析另页。
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-2xl border border-white/80 bg-white/65 px-5 py-3 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-900/65">
                <dt className="text-[11px] text-[#7b837b] dark:text-gray-400">卷</dt>
                <dd className="mt-1 text-2xl font-semibold text-[#26312a] dark:text-white">{chapterToc.length}</dd>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/65 px-5 py-3 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-900/65">
                <dt className="text-[11px] text-[#7b837b] dark:text-gray-400">章</dt>
                <dd className="mt-1 text-2xl font-semibold text-[#26312a] dark:text-white">{sectionCount}</dd>
              </div>
            </dl>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#第一卷心理建设孙文学说"
              className="inline-flex items-center justify-center rounded-lg bg-[#26352d] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#18221c] dark:bg-white dark:text-gray-950 dark:hover:bg-gray-200"
            >
              开始阅读
            </a>
            <a
              href={doc.pdfHref}
              download="建国方略.pdf"
              className="inline-flex items-center justify-center rounded-lg border border-[#c7cec7] bg-white/60 px-4 py-2.5 text-sm font-medium text-[#48544c] transition hover:border-[#89968d] dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-300"
            >
              下载扫描 PDF
            </a>
            <SharePageButton
              title={TITLE}
              text={DESCRIPTION}
              url={RESOURCE_URL}
              size="md"
              idleLabel="分享页面"
            />
            <ArticleActionsDropdown label="更多">
              <DistributeContentButton
                title="《建国方略》全文原文"
                summary={DESCRIPTION}
                url={RESOURCE_URL}
                category="resource"
                slug={RESOURCE_SLUG}
                tags={doc.tags}
                kindLabel="资源"
              />
            </ArticleActionsDropdown>
          </div>
        </header>

        <aside className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/25 dark:text-amber-200">
          <strong>版本与公有领域说明：</strong>
          作者孙文（孙中山），1925 年逝世，著作已进入公有领域。在线正文取自
          <a href={SOURCE_URL} target="_blank" rel="noreferrer" className="mx-1 underline underline-offset-4">
            维基文库
          </a>
          整理本并转为简体；维基文库标注校对质量约 50%。PDF 为中国国家图书馆数字资源
          NLC416-01jh003731-18241，508 页扫描、无文字层。资料用于阅读原书，不构成政治、投资或工程决策建议。
        </aside>

        <section className="mt-9" aria-labelledby="toc-heading">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#858876] dark:text-[#8e9ab0]">
            Table of Contents
          </p>
          <h2 id="toc-heading" className="mt-2 font-serif text-2xl font-semibold text-[#2b332d] dark:text-gray-100">
            章节目录
          </h2>
          <nav className="mt-5 border-t border-[#ddd8cc] pt-5 dark:border-gray-800" aria-label="章节目录">
            <ol className="columns-1 gap-x-16 md:columns-2 md:[column-rule:1px_solid_#ece8de] dark:md:[column-rule-color:#1f2937]">
              {groups.map((group, index) => (
                <li key={group.heading.id} className="mb-5 break-inside-avoid last:mb-0">
                  <a
                    href={`#${group.heading.id}`}
                    className="flex items-baseline gap-3 text-[#2b332d] dark:text-gray-100"
                  >
                    <span className="w-6 shrink-0 font-mono text-[11px] tabular-nums text-[#8b7551] dark:text-amber-400">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="font-serif text-[17px] font-semibold leading-snug underline-offset-4 hover:underline">
                      {group.heading.text}
                    </span>
                  </a>
                  {group.sections.length ? (
                    <ol className="mt-1.5 ml-9 space-y-0.5">
                      {group.sections.map((section) => (
                        <li key={section.id}>
                          <a
                            href={`#${section.id}`}
                            className="text-[13.5px] leading-6 text-[#6a736a] underline-offset-4 hover:underline dark:text-gray-400"
                          >
                            {section.text}
                          </a>
                        </li>
                      ))}
                    </ol>
                  ) : null}
                </li>
              ))}
            </ol>
          </nav>
        </section>

        <section className="mt-10" aria-labelledby="paper-heading">
          <h2 id="paper-heading" className="font-serif text-2xl font-semibold text-[#2b332d] dark:text-gray-100">
            全文
          </h2>
          <p className="mt-2 mb-6 text-sm text-[#666] dark:text-gray-400">
            {doc.author} · {doc.wordCount} · 文本来源
            <a href={SOURCE_URL} target="_blank" rel="noreferrer" className="mx-1 underline underline-offset-4">
              {doc.sourceLabel}
            </a>
          </p>
          {article.html ? (
            <ResourceLongformReader toc={toc} html={article.html} />
          ) : (
            <p className="rounded-xl border border-dashed border-[#ccc] bg-[#fafaf8] p-6 text-sm dark:border-[#3a3a32] dark:bg-[#121410]">
              正文暂未就绪。可先阅读
              <a href={SOURCE_URL} target="_blank" rel="noreferrer" className="mx-1 underline underline-offset-4">
                维基文库原文
              </a>
              。
            </p>
          )}
        </section>

        <section className="mt-12" aria-labelledby="related-heading">
          <h2 id="related-heading" className="font-serif text-xl font-semibold text-[#2b332d] dark:text-gray-100">
            原文、PDF 与延伸阅读
          </h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {relatedLinks.map((item) => {
              const className =
                'block rounded-lg border border-[#e1e4df] px-3 py-2 text-sm underline-offset-4 hover:underline dark:border-gray-800'
              if (item.external || item.download) {
                return (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      target={item.external ? '_blank' : undefined}
                      rel={item.external ? 'noreferrer' : undefined}
                      download={item.download}
                      className={className}
                    >
                      {item.label}
                    </a>
                  </li>
                )
              }
              return (
                <li key={item.href}>
                  <Link href={item.href} className={className}>
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="mt-10" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="font-serif text-xl font-semibold text-[#2b332d] dark:text-gray-100">
            常见问题
          </h2>
          <dl className="mt-4 space-y-4">
            {faqs.map((item) => (
              <div key={item.question} className="rounded-2xl border border-[#e1e4df] bg-[#fafbf9] p-5 dark:border-gray-800 dark:bg-gray-900/60">
                <dt className="font-semibold text-[#303a33] dark:text-gray-100">{item.question}</dt>
                <dd className="mt-2 text-sm leading-7 text-[#586258] dark:text-gray-300">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        <ArticleFooterCta />
      </PageContainer>

      <ContentEngagement contentKey={`resource:${RESOURCE_SLUG}`} width="standard" />
    </>
  )
}
