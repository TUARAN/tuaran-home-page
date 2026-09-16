import Link from 'next/link'

import ArticleActionsDropdown from '../../components/ArticleActionsDropdown'
import ArticleFooterCta from '../../components/ArticleFooterCta'
import ContentEngagement from '../../components/ContentEngagement'
import ContentPvBeacon from '../../components/ContentPvBeacon'
import DistributeContentButton from '../../components/DistributeContentButton'
import PageContainer from '../../components/PageContainer'
import SharePageButton from '../../components/SharePageButton'
import { getResourceDocument, loadResourceMarkdown } from '../../../../lib/resourceDocuments'
import { buildEthereumWhitepaperArticle } from '../../../../lib/resourceMarkdown'
import ResourceLongformReader from '../ResourceLongformReader'

export const dynamic = 'force-static'

const RESOURCE_SLUG = 'ethereum-whitepaper'
const RESOURCE_PATH = `/resources/${RESOURCE_SLUG}`
const RESOURCE_URL = `https://2aran.com${RESOURCE_PATH}`
const SOURCE_URL = 'https://ethereum.org/zh/whitepaper/'
const ENGLISH_URL = 'https://ethereum.org/en/whitepaper/'
const LEARN_URL = 'https://ethereum.org/zh/learn/'
const TITLE = '以太坊白皮书中文全文｜Ethereum White Paper（Vitalik Buterin, 2014）'
const DESCRIPTION =
  'Vitalik Buterin 2014 年发表的以太坊白皮书简体中文全文：用图灵完备区块链解释账户、Gas、智能合约和去中心化应用。站内带完整目录，可跳转章节，并保留 ethereum.org 原文与 2014 年 12 月 PDF。'

const doc = getResourceDocument(RESOURCE_SLUG)
const article = buildEthereumWhitepaperArticle(loadResourceMarkdown(RESOURCE_SLUG))
const toc = article.toc || []
const chapterToc = toc.filter((item) => item.depth === 2)
const sectionCount = toc.filter((item) => item.depth === 3).length

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    '以太坊白皮书',
    '以太坊白皮书中文',
    'Ethereum White Paper',
    'Ethereum Whitepaper',
    'Vitalik Buterin',
    '智能合约',
    '去中心化应用',
    'DApp',
    'ETH',
    'EVM',
    'Gas',
    '图灵完备',
    '区块链',
    '在线阅读',
  ],
  alternates: { canonical: RESOURCE_PATH },
  openGraph: {
    type: 'article',
    locale: 'zh_CN',
    siteName: '2aran.com',
    title: '以太坊白皮书中文全文',
    description: DESCRIPTION,
    url: RESOURCE_URL,
  },
  twitter: {
    card: 'summary',
    title: '以太坊白皮书中文全文｜Vitalik Buterin, 2014',
    description: '带完整目录的简体中文全文：账户、Gas、智能合约与去中心化应用。',
  },
  robots: { index: true, follow: true },
}

const relatedLinks = [
  { href: SOURCE_URL, label: 'ethereum.org 中文原文', external: true },
  { href: ENGLISH_URL, label: 'English original', external: true },
  { href: doc.pdfHref, label: '2014 年 12 月 PDF', download: 'Ethereum_Whitepaper_Buterin_2014.pdf' },
  { href: '/articles/research/topics/crypto-ethereum', label: 'Ethereum（ETH）观察' },
]

const faqs = [
  {
    question: '以太坊白皮书讲了什么？',
    answer:
      'Vitalik Buterin 在 2014 年把以太坊写成一条内置图灵完备编程语言的区块链：账户之间可以转账、发消息，合约按代码改状态。正文从比特币的 UTXO、挖矿和脚本限制讲起，再展开账户、Gas、EVM、代币、DAO 和可扩展性。',
  },
  {
    question: '站内这份中文全文和 ethereum.org 是什么关系？',
    answer:
      '正文来自 ethereum.org 维护的简体中文译本，按 CC BY 4.0 转载。页面补了完整目录、脚注跳转和本地插图；协议后续变更请看 ethereum.org 的学习指南。需要 2014 年 12 月权威版本时，下载同页提供的 PDF。',
  },
  {
    question: '2014 年的白皮书还能用来理解现在的以太坊吗？',
    answer:
      '它仍是理解智能合约、账户模型和 Gas 的原始文本。主网此后改过共识、费用和市场结构，例如 2022 年合并改为权益证明。把它当设计原件读，不要当成 2026 年的运行手册。',
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'ScholarlyArticle',
      '@id': `${RESOURCE_URL}#paper`,
      name: '以太坊白皮书',
      alternateName: [
        'Ethereum White Paper',
        'A Next-Generation Smart Contract and Decentralized Application Platform',
      ],
      headline: TITLE,
      description: DESCRIPTION,
      inLanguage: 'zh-CN',
      datePublished: '2014-12-01',
      dateModified: '2026-09-16',
      url: RESOURCE_URL,
      author: { '@type': 'Person', name: 'Vitalik Buterin' },
      isBasedOn: SOURCE_URL,
      license: 'https://creativecommons.org/licenses/by/4.0/',
      encoding: {
        '@type': 'MediaObject',
        contentUrl: `https://2aran.com${doc.pdfHref}`,
        encodingFormat: 'application/pdf',
        name: 'Ethereum Whitepaper — Buterin 2014',
      },
    },
    {
      '@type': 'WebPage',
      '@id': `${RESOURCE_URL}#page`,
      url: RESOURCE_URL,
      name: TITLE,
      description: DESCRIPTION,
      inLanguage: 'zh-CN',
      datePublished: '2026-09-16',
      dateModified: '2026-09-16',
      isPartOf: { '@type': 'WebSite', name: '2aran.com', url: 'https://2aran.com' },
      mainEntity: { '@id': `${RESOURCE_URL}#paper` },
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

export default function EthereumWhitepaperPage() {
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
            <span>协议原文</span>
            <span>／</span>
            <ContentPvBeacon category="resource" slug={RESOURCE_SLUG} display />
          </div>

          <div className="mt-8 grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#7d725f] dark:text-[#b8aa91]">
                Ethereum White Paper · 2014
              </p>
              <h1 className="mt-3 max-w-3xl font-serif text-3xl font-semibold leading-tight tracking-tight text-[#202821] dark:text-white md:text-5xl">
                以太坊白皮书
                <span className="mt-2 block text-[#687168] dark:text-gray-300">
                  新一代智能合约和去中心化应用平台
                </span>
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-[#586258] dark:text-gray-300 md:text-base">
                Vitalik Buterin 在主网上线前写下的设计原文。站内提供简体中文全文、章节目录和 2014 年 12 月 PDF；协议后来的变更，以 ethereum.org 现行文档为准。
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-2xl border border-white/80 bg-white/65 px-5 py-3 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-900/65">
                <dt className="text-[11px] text-[#7b837b] dark:text-gray-400">主章</dt>
                <dd className="mt-1 text-2xl font-semibold text-[#26312a] dark:text-white">{chapterToc.length}</dd>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/65 px-5 py-3 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-900/65">
                <dt className="text-[11px] text-[#7b837b] dark:text-gray-400">小节</dt>
                <dd className="mt-1 text-2xl font-semibold text-[#26312a] dark:text-white">{sectionCount}</dd>
              </div>
            </dl>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#新一代智能合约和去中心化应用平台"
              className="inline-flex items-center justify-center rounded-lg bg-[#26352d] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#18221c] dark:bg-white dark:text-gray-950 dark:hover:bg-gray-200"
            >
              开始阅读
            </a>
            <a
              href={doc.pdfHref}
              download="Ethereum_Whitepaper_Buterin_2014.pdf"
              className="inline-flex items-center justify-center rounded-lg border border-[#c7cec7] bg-white/60 px-4 py-2.5 text-sm font-medium text-[#48544c] transition hover:border-[#89968d] dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-300"
            >
              下载 2014 PDF
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
                title="以太坊白皮书中文全文"
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
          <strong>版本与转载说明：</strong>
          作者 Vitalik Buterin，2014 年发表，早于 2015 年主网上线。中文译本取自
          <a href={SOURCE_URL} target="_blank" rel="noreferrer" className="mx-1 underline underline-offset-4">
            ethereum.org/zh/whitepaper
          </a>
          ，按 CC BY 4.0 转载。ethereum.org 仍在维护该页，作为设计愿景的参考；要核对当前协议，请读
          <a href={LEARN_URL} target="_blank" rel="noreferrer" className="mx-1 underline underline-offset-4">
            官方学习指南
          </a>
          。资料整理用于理解协议原文，不构成投资、开户或法律建议。
        </aside>

        <section className="mt-9" aria-labelledby="toc-heading">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#858876] dark:text-[#8e9ab0]">
            Table of Contents
          </p>
          <h2 id="toc-heading" className="mt-2 font-serif text-2xl font-semibold text-[#2b332d] dark:text-gray-100">
            章节目录
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {groups.map((group, index) => (
              <article
                key={group.heading.id}
                className="rounded-2xl border border-[#e1e4df] bg-[#fafbf9] p-5 dark:border-gray-800 dark:bg-gray-900/60"
              >
                <span className="font-mono text-xs text-[#8b7551] dark:text-amber-400">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-2 text-base font-semibold text-[#303a33] dark:text-gray-100">
                  <a href={`#${group.heading.id}`} className="underline-offset-4 hover:underline">
                    {group.heading.text}
                  </a>
                </h3>
                {group.sections.length ? (
                  <ul className="mt-3 space-y-1.5 text-sm leading-6 text-[#697169] dark:text-gray-400">
                    {group.sections.map((section) => (
                      <li key={section.id}>
                        <a href={`#${section.id}`} className="underline-offset-4 hover:underline">
                          {section.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm leading-6 text-[#697169] dark:text-gray-400">开篇总论，无小节。</p>
                )}
              </article>
            ))}
          </div>
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
                ethereum.org 原文
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
