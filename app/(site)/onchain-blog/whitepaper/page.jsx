import Link from 'next/link'

import ArticleComments from '../../components/ArticleComments'
import ContentPvBeacon from '../../components/ContentPvBeacon'
import SharePageButton from '../../components/SharePageButton'
import { getResourceDocument, loadResourceMarkdown } from '../../../../lib/resourceDocuments'
import { buildCntWhitepaperArticle } from '../../../../lib/resourceMarkdown'
import ResourceLongformReader from '../../resources/ResourceLongformReader'

export const dynamic = 'force-static'

const RESOURCE_SLUG = 'cnt-whitepaper'
const RESOURCE_PATH = '/onchain-blog/whitepaper'
const RESOURCE_URL = `https://2aran.com${RESOURCE_PATH}`
const TITLE = 'CNT内容生态代币经济白皮书（正式完整版）'
const DESCRIPTION =
  'CNT（Content Token）内容生态代币经济白皮书正式完整版：总量 10 亿封顶、双因子衰减挖矿、质量加权贡献分、四层反女巫、销毁与持币分红、DAO 治理，以及 24 个智能合约模块清单。'

const doc = getResourceDocument(RESOURCE_SLUG)
const article = buildCntWhitepaperArticle(loadResourceMarkdown(RESOURCE_SLUG))
const toc = article.toc || []
const chapterToc = toc.filter((item) => item.depth === 2)

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ['CNT', 'Content Token', '白皮书', '内容上链', '代币经济', 'DAO', '行为挖矿', '万物上链'],
  alternates: { canonical: RESOURCE_PATH },
  openGraph: {
    type: 'article',
    locale: 'zh_CN',
    siteName: '2aran.com',
    title: 'CNT内容生态代币经济白皮书',
    description: DESCRIPTION,
    url: RESOURCE_URL,
  },
  twitter: {
    card: 'summary',
    title: TITLE,
    description: '总量封顶、质量挖矿、销毁分红与 DAO 治理的 CNT 完整规则。',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'TechArticle',
      '@id': `${RESOURCE_URL}#paper`,
      name: 'CNT内容生态代币经济白皮书',
      alternateName: ['Content Token Whitepaper', 'CNT Whitepaper'],
      headline: TITLE,
      description: DESCRIPTION,
      inLanguage: 'zh-CN',
      datePublished: '2026-09-21',
      dateModified: '2026-09-21',
      url: RESOURCE_URL,
      author: { '@type': 'Person', name: 'TUARAN', url: 'https://2aran.com' },
      encoding: {
        '@type': 'MediaObject',
        contentUrl: `https://2aran.com${doc.downloadHref}`,
        encodingFormat: 'text/markdown',
        name: doc.downloadName,
      },
    },
    {
      '@type': 'WebPage',
      '@id': `${RESOURCE_URL}#page`,
      url: RESOURCE_URL,
      name: TITLE,
      description: DESCRIPTION,
      inLanguage: 'zh-CN',
      isPartOf: { '@type': 'WebPage', name: '万物上链', url: 'https://2aran.com/onchain-blog' },
      mainEntity: { '@id': `${RESOURCE_URL}#paper` },
    },
  ],
}

export default function CntWhitepaperPage() {
  return (
    <main className="min-h-screen bg-[#f3f0e8] text-[#292620] dark:bg-[#0d1117] dark:text-[#eee9df]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replaceAll('<', '\\u003c') }} />
      <ContentPvBeacon category="resource" slug={RESOURCE_SLUG} />

      <section className="relative isolate overflow-hidden border-b border-[#55452d] bg-[#05080c] text-white">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(3,6,9,0.94)_0%,rgba(3,6,9,0.82)_42%,rgba(3,6,9,0.55)_100%)]" />
        <div className="mx-auto w-full max-w-[1180px] px-5 py-10 md:px-8 md:py-14">
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/55">
            <Link href="/" className="no-underline hover:text-white">TUARAN</Link>
            <span>/</span>
            <Link href="/onchain-blog" className="no-underline hover:text-white">万物上链</Link>
            <span>/</span>
            <span>WHITEPAPER</span>
          </div>

          <div className="mt-10 max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-[#d9b66c]/55 bg-black/35 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#f0cd88]">
                正式完整版
              </span>
              <span className="font-mono text-[11px] tracking-[0.16em] text-white/50">CONTENT TOKEN · CNT</span>
            </div>
            <h1 className="mt-6 font-serif text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-white md:text-6xl">
              CNT内容生态代币经济白皮书
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/[0.72] md:text-lg">
              创作、互动、确权、流通、治理写入同一套 CNT 规则。总量 10 亿封顶，挖矿按贡献分与信誉加权结算，销毁、分红和 DAO 由合约执行。
            </p>
            <dl className="mt-8 grid max-w-xl grid-cols-3 gap-3 text-center">
              <div className="rounded-xl border border-white/15 bg-white/[0.04] px-3 py-3">
                <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/45">主章</dt>
                <dd className="mt-1 font-serif text-2xl text-[#f2d59a]">{chapterToc.length}</dd>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/[0.04] px-3 py-3">
                <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/45">总量</dt>
                <dd className="mt-1 font-serif text-2xl text-[#f2d59a]">10 亿</dd>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/[0.04] px-3 py-3">
                <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/45">合约模块</dt>
                <dd className="mt-1 font-serif text-2xl text-[#f2d59a]">24</dd>
              </div>
            </dl>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={`#${chapterToc[0]?.id || '一项目摘要'}`} className="rounded-full bg-[#e0bb74] px-5 py-2.5 text-sm font-semibold text-[#171109] no-underline hover:bg-[#f1d397]">
                开始阅读
              </a>
              <a
                href={doc.downloadHref}
                download={doc.downloadName}
                className="rounded-full border border-white/30 px-5 py-2.5 text-sm font-semibold text-white no-underline hover:bg-white/10"
              >
                下载正式完整版
              </a>
              <SharePageButton title={TITLE} text={DESCRIPTION} url={RESOURCE_URL} size="md" idleLabel="分享" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1180px] px-5 py-12 md:py-16">
        <p className="mb-6 text-sm text-[#665f55] dark:text-[#aaa49a]">
          {doc.author} · {doc.wordCount} · 2026-09-21 · <ContentPvBeacon category="resource" slug={RESOURCE_SLUG} display />
        </p>
        {article.html ? (
          <ResourceLongformReader toc={toc} html={article.html} />
        ) : (
          <p className="rounded-xl border border-dashed border-[#cfc4b2] bg-[#faf8f2] p-6 text-sm dark:border-[#293441] dark:bg-[#121a23]">
            正文暂未就绪。
            <a href={doc.downloadHref} download={doc.downloadName} className="mx-1 underline underline-offset-4">
              下载 Markdown
            </a>
          </p>
        )}
      </section>

      <section className="border-t border-[#d8d0c2] bg-[#eae4d8] dark:border-[#2a313b] dark:bg-[#101720]">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col items-start justify-between gap-6 px-5 py-10 md:flex-row md:items-center">
          <div>
            <p className="font-serif text-2xl font-semibold">内容指纹与批次存证仍可在万物上链页核对。</p>
            <p className="mt-2 text-sm text-[#665f55] dark:text-[#aaa49a]">公开文章已有内容指纹、站点签名和测试网批次记录。</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href={doc.downloadHref}
              download={doc.downloadName}
              className="rounded-full border border-[#9d835b] px-5 py-3 text-sm font-semibold text-[#5d4523] no-underline hover:bg-[#f8f3e9] dark:border-[#8d774f] dark:text-[#dbbd86] dark:hover:bg-white/[0.05]"
            >
              下载白皮书
            </a>
            <Link href="/onchain-blog" className="rounded-full border border-[#9d835b] px-5 py-3 text-sm font-semibold text-[#5d4523] no-underline hover:bg-[#f8f3e9] dark:border-[#8d774f] dark:text-[#dbbd86] dark:hover:bg-white/[0.05]">
              返回万物上链 →
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1180px] px-5 pb-16 pt-10">
        <div id="comments" className="scroll-mt-24 rounded-2xl border border-[#d6cdbf] bg-[#faf8f2] px-5 py-6 dark:border-[#293441] dark:bg-[#121a23]">
          <h2 className="font-serif text-2xl font-semibold">阅读反馈</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[#625d54] dark:text-[#aaa49a]">分配、挖矿、销毁、治理或合约模块有哪一条需要改，直接写在这里。</p>
          <ArticleComments articleKey={`resource:${RESOURCE_SLUG}`} />
        </div>
      </section>
    </main>
  )
}
