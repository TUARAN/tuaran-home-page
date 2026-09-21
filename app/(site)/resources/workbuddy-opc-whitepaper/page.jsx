import Link from 'next/link'

import ArticleFooterCta from '../../components/ArticleFooterCta'
import ContentEngagement from '../../components/ContentEngagement'
import ContentPvBeacon from '../../components/ContentPvBeacon'
import PageContainer from '../../components/PageContainer'
import SharePageButton from '../../components/SharePageButton'

export const dynamic = 'force-static'

const slug = 'workbuddy-opc-whitepaper'
const path = `/resources/${slug}`
const url = `https://2aran.com${path}`
const sourceUrl = 'https://www.workbuddy.link/p/FVCdAodl3HBHMMPypCogBi'
const readerUrl = `${path}/whitepaper.html`
const title = 'WorkBuddy OPC 白皮书全文｜AI 一人公司商业模式、政策与实战案例'
const description = '在线阅读 WorkBuddy OPC 白皮书：梳理 AI 时代一人公司（One Person Company）的商业模式、超级个体、国内扶持政策、AI 工作台与实际案例，保留原版分页排版。'

const chapters = [
  'OPC 正在重塑创业版图',
  '从「雇人」到「调度算力」',
  '中国机遇：政策、产业园区与本地化生态',
  'WorkBuddy 解法：从一人公司到超级团队的 AI 操作系统',
  '实战图鉴：OPC × WorkBuddy 的 N 种打开方式',
  '共建生态：OPC 生产基础设施的建设路径',
]

export const metadata = {
  title,
  description,
  keywords: ['WorkBuddy OPC 白皮书', 'OPC 一人公司', 'AI 一人公司', '超级个体', '一人公司商业模式', 'WorkBuddy'],
  alternates: { canonical: path },
  openGraph: { type: 'article', title, description, url, locale: 'zh_CN' },
  twitter: { card: 'summary', title, description },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: title,
  description,
  url,
  inLanguage: 'zh-CN',
  isBasedOn: sourceUrl,
  mainEntity: {
    '@type': 'CreativeWork',
    name: 'WorkBuddy OPC 白皮书：AI 时代一人公司的商业与技术重构',
    author: { '@type': 'Organization', name: 'WorkBuddy' },
    url: sourceUrl,
  },
}

export default function WorkBuddyOpcWhitepaperPage() {
  return (
    <>
      <PageContainer width="wide" className="py-8 md:py-10">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
        <ContentPvBeacon category="resource" slug={slug} />

        <header className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900 dark:bg-emerald-950/30 md:p-9">
          <p className="text-sm text-emerald-800 dark:text-emerald-300">
            <Link href="/articles?tab=resources" className="underline underline-offset-4">资源库</Link> · 商业与 AI
          </p>
          <h1 className="mt-5 max-w-4xl font-serif text-3xl font-semibold leading-tight text-gray-950 dark:text-white md:text-5xl">
            WorkBuddy OPC 白皮书
          </h1>
          <p className="mt-3 text-lg text-emerald-900 dark:text-emerald-200">AI 时代一人公司的商业与技术重构</p>
          <p className="mt-5 max-w-3xl leading-8 text-gray-700 dark:text-gray-300">
            从超级个体和商业模式，到中国各地的 OPC 政策、WorkBuddy 产品架构与用户案例。原版白皮书按分页排版在下方完整呈现。
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
            <a href="#read" className="rounded-lg bg-emerald-800 px-4 py-2.5 font-medium text-white hover:bg-emerald-900">在线阅读</a>
            <a href={readerUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-emerald-700 px-4 py-2.5 font-medium text-emerald-900 hover:bg-emerald-100 dark:text-emerald-200 dark:hover:bg-emerald-900">新窗口阅读</a>
            <SharePageButton title={title} text={description} url={url} size="md" idleLabel="分享页面" />
          </div>
        </header>

        <section className="mt-9" aria-labelledby="chapters-heading">
          <h2 id="chapters-heading" className="font-serif text-2xl font-semibold text-gray-900 dark:text-white">内容目录</h2>
          <ol className="mt-4 grid gap-3 md:grid-cols-2">
            {chapters.map((chapter, index) => (
              <li key={chapter} className="rounded-xl border border-gray-200 px-4 py-3 text-sm leading-6 text-gray-700 dark:border-gray-800 dark:text-gray-300">
                <span className="mr-2 font-semibold text-emerald-700 dark:text-emerald-400">{String(index + 1).padStart(2, '0')}</span>
                {chapter}
              </li>
            ))}
          </ol>
        </section>

        <section id="read" className="mt-10 scroll-mt-20" aria-labelledby="read-heading">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="read-heading" className="font-serif text-2xl font-semibold text-gray-900 dark:text-white">白皮书原文</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">在阅读框内滚动，或在新窗口打开完整页面。</p>
            </div>
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-700 underline underline-offset-4 dark:text-emerald-400">查看 WorkBuddy 原始发布页 ↗</a>
          </div>
          <iframe
            title="WorkBuddy OPC 白皮书全文"
            src={readerUrl}
            loading="lazy"
            className="h-[75vh] min-h-[560px] w-full rounded-xl border border-gray-200 bg-white dark:border-gray-800"
          />
        </section>

        <ArticleFooterCta />
      </PageContainer>
      <ContentEngagement contentKey={`resource:${slug}`} width="wide" />
    </>
  )
}
