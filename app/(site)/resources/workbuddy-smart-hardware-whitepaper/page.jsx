import Link from 'next/link'

import ArticleFooterCta from '../../components/ArticleFooterCta'
import ContentEngagement from '../../components/ContentEngagement'
import ContentPvBeacon from '../../components/ContentPvBeacon'
import PageContainer from '../../components/PageContainer'
import SharePageButton from '../../components/SharePageButton'
import { loadWorkbuddyWhitepaper } from '../../../../lib/workbuddyWhitepapers'
import './whitepaper.css'

export const dynamic = 'force-static'

const slug = 'workbuddy-smart-hardware-whitepaper'
const path = `/resources/${slug}`
const url = `https://2aran.com${path}`
const sourceUrl = 'https://www.workbuddy.link/p/JVM0gKdRyl8k9EgElw5TxA'
const title = '智能硬件接入 WorkBuddy 白皮书全文｜合作模式、OAuth 2.0 与 API 接入指南'
const description = '在线阅读 WorkBuddy 智能硬件接入白皮书：涵盖硬件接入价值、六类硬件触点、合作模式、产品能力、OAuth 2.0 授权、API 调用、端到端示例和联合运营。'
const whitepaperHtml = loadWorkbuddyWhitepaper(slug)

const sections = [
  '战略与商务：硬件接入价值、硬件触点与合作模式',
  '产品与能力：Agent 架构、场景能力矩阵与开放能力',
  '技术接入：OAuth 2.0 授权、接口调用与端到端示例',
  '落地与运营：接入流程、合作准入、售后与联合运营',
  '附录：OpenAPI 规范与术语表',
]

export const metadata = {
  title,
  description,
  keywords: ['WorkBuddy 智能硬件接入', '智能硬件接入白皮书', 'WorkBuddy API', 'OAuth 2.0', 'AI Agent 硬件', 'OpenAPI', '硬件合作模式'],
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
    name: 'WorkBuddy 智能硬件接入白皮书',
    author: { '@type': 'Organization', name: 'WorkBuddy 开放平台' },
    url: sourceUrl,
  },
}

export default function WorkBuddySmartHardwareWhitepaperPage() {
  return (
    <>
      <PageContainer width="wide" className="py-8 md:py-10">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
        <ContentPvBeacon category="resource" slug={slug} />

        <header className="rounded-3xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-950/30 md:p-9">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <Link href="/articles?tab=resources" className="underline underline-offset-4">资源库</Link> · AI 与智能硬件
          </p>
          <h1 className="mt-5 max-w-4xl font-serif text-3xl font-semibold leading-tight text-gray-950 dark:text-white md:text-5xl">
            智能硬件接入 WorkBuddy 白皮书
          </h1>
          <p className="mt-5 max-w-3xl leading-8 text-gray-700 dark:text-gray-300">
            汇集智能硬件与 WorkBuddy 对接所需的合作、产品和技术资料，包括 OAuth 2.0 授权、API 调用、接入示例以及合作落地流程。下方可直接阅读全文与章节目录。
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
            <a href="#read" className="rounded-lg bg-blue-700 px-4 py-2.5 font-medium text-white hover:bg-blue-800">在线阅读</a>
            <SharePageButton title={title} text={description} url={url} size="md" idleLabel="分享页面" />
          </div>
        </header>

        <section className="mt-9" aria-labelledby="sections-heading">
          <h2 id="sections-heading" className="font-serif text-2xl font-semibold text-gray-900 dark:text-white">内容概览</h2>
          <ol className="mt-4 grid gap-3 md:grid-cols-2">
            {sections.map((section, index) => (
              <li key={section} className="rounded-xl border border-gray-200 px-4 py-3 text-sm leading-6 text-gray-700 dark:border-gray-800 dark:text-gray-300">
                <span className="mr-2 font-semibold text-blue-700 dark:text-blue-400">{String(index + 1).padStart(2, '0')}</span>
                {section}
              </li>
            ))}
          </ol>
        </section>

        <section id="read" className="mt-10 scroll-mt-20" aria-labelledby="read-heading">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="read-heading" className="font-serif text-2xl font-semibold text-gray-900 dark:text-white">白皮书原文</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">直接向下滚动阅读，并使用原文目录跳转章节。</p>
            </div>
          </div>
          <div className="workbuddy-hardware-document" dangerouslySetInnerHTML={{ __html: whitepaperHtml }} />
        </section>

        <ArticleFooterCta />
      </PageContainer>
      <ContentEngagement contentKey={`resource:${slug}`} width="wide" />
    </>
  )
}
