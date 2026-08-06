import Script from 'next/script'

import ArticlePostBody, { getArticlePostToc } from '../../components/ArticlePostBody'
import ArticleDetailHeader from '../../components/ArticleDetailHeader'
import ArticleEngagementPanel from '../../components/ArticleEngagementPanel'
import ArticleToc from '../../components/ArticleToc'
import ArticleHeaderActions from '../../components/ArticleHeaderActions'
import ArticleComments from '../../components/ArticleComments'
import ContentPvBeacon from '../../components/ContentPvBeacon'
import ArticleFooterCta from '../../components/ArticleFooterCta'
import DistributeContentButton from '../../components/DistributeContentButton'
import CopyMarkdownButton from '../research/[category]/[slug]/CopyMarkdownButton'

function dateLabel(value) {
  if (!value) return ''
  const date = new Date(value)
  const parts = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)
  const valueOf = (type) => parts.find((part) => part.type === type)?.value || ''
  return `${valueOf('year')}-${valueOf('month')}-${valueOf('day')} ${valueOf('hour')}:${valueOf('minute')}`
}

function readingMinutes(text) {
  const length = String(text || '').replace(/\s+/g, '').length
  return Math.max(1, Math.ceil(length / 500))
}

export default function PublishedArticle({ article, siteUrl }) {
  const url = `${siteUrl}/articles/${article.slug}`
  const publishedTime = article.publishedAt ? new Date(article.publishedAt).toISOString() : undefined
  const markdown = [
    `# ${article.title}`,
    article.summary || '',
    article.contentText || '',
    `原文：${url}`,
  ].filter(Boolean).join('\n\n')
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.summary || article.contentText.slice(0, 160),
    image: article.coverUrl ? [article.coverUrl] : undefined,
    datePublished: publishedTime,
    dateModified: article.updatedAt ? new Date(article.updatedAt).toISOString() : publishedTime,
    author: { '@type': 'Person', name: '涂阿燃', url: siteUrl },
    publisher: { '@type': 'Person', name: '涂阿燃', url: siteUrl },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  }
  const articleKey = `article:${article.slug}`
  const tocItems = getArticlePostToc(article.content)

  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 py-6 sm:py-8">
      <Script id={`article-jsonld-db-${article.id}`} type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(structuredData)}
      </Script>
      <ArticleDetailHeader
        categoryHref="/articles?tab=posts"
        categoryLabel="精选文章"
        dateLabel={dateLabel(article.publishedAt)}
        dateTime={publishedTime}
        readingMinutes={readingMinutes(article.contentText)}
        pvNode={<ContentPvBeacon category="article" slug={article.slug} display />}
        ownerMeta={{ author: '涂阿燃（TUARAN）' }}
        actions={(
          <ArticleHeaderActions
            title={article.title}
            text={article.summary || article.contentText.slice(0, 160)}
            url={url}
            className="mt-2 sm:ml-auto sm:mt-0 lg:flex-nowrap"
          >
            <CopyMarkdownButton markdown={markdown} />
            <DistributeContentButton
              title={article.title}
              summary={article.summary || article.contentText.slice(0, 160)}
              markdown={markdown}
              images={article.coverUrl ? [article.coverUrl] : []}
              url={url}
              category="article"
              slug={article.slug}
              tags={article.tags}
              kindLabel="文章"
              allowArticle
            />
          </ArticleHeaderActions>
        )}
        title={article.title}
        summary={article.summary}
        summaryLabel="TL;DR"
        tags={article.tags}
      />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <main className="min-w-0">
          {article.coverUrl ? (
            <figure className="mb-10">
              {/* 后台文章封面可以来自 Owner 自定义的 HTTPS/R2 域名，不限制在 Next Image 白名单。 */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={article.coverUrl} alt={`${article.title} 封面`} className="h-auto w-full rounded-lg border border-[#eee] object-cover dark:border-gray-800" />
            </figure>
          ) : null}
          <div className="flex flex-col gap-6 md:flex-row">
            <ArticleToc items={tocItems} />
            <ArticlePostBody content={article.content} className="min-w-0 flex-1" />
          </div>
        </main>
        <ArticleEngagementPanel articleKey={articleKey} />
      </div>
      <div id="comments" className="scroll-mt-24">
        <ArticleComments articleKey={articleKey} />
      </div>
      <ArticleFooterCta />
    </div>
  )
}
