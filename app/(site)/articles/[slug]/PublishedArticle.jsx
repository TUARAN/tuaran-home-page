import Link from 'next/link'
import Script from 'next/script'

import ArticlePostBody, { getArticlePostToc } from '../../components/ArticlePostBody'
import ArticleEngagementPanel from '../../components/ArticleEngagementPanel'
import ArticleToc from '../../components/ArticleToc'
import ArticleHeaderActions from '../../components/ArticleHeaderActions'
import { AuthorByline } from '../../components/ArticleAuthorIntro'
import ArticleComments from '../../components/ArticleComments'
import ArticleFooterCta from '../../components/ArticleFooterCta'
import DistributeContentButton from '../../components/DistributeContentButton'
import CopyMarkdownButton from '../research/[category]/[slug]/CopyMarkdownButton'

function dateLabel(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(value))
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
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Script id={`article-jsonld-db-${article.id}`} type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(structuredData)}
      </Script>
      <header className="mb-8 border-b border-[#eee] pb-5 dark:border-gray-800">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-serif text-3xl font-semibold leading-snug text-[#333] dark:text-gray-100">{article.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[#888] dark:text-gray-400">
              <time dateTime={publishedTime}>{dateLabel(article.publishedAt)}</time>
              {article.tags.map((tag) => <span key={tag} className="rounded-full border border-[#ddd] px-2 py-0.5 text-xs dark:border-gray-700">{tag}</span>)}
            </div>
            {article.summary ? <p className="mt-4 text-sm leading-7 text-[#666] dark:text-gray-300">{article.summary}</p> : null}
            <div className="mt-4">
              <Link href="/articles?tab=posts" className="text-sm text-[#666] underline underline-offset-4 dark:text-gray-300">返回精选文章</Link>
            </div>
          </div>
          <ArticleHeaderActions
            title={article.title}
            text={article.summary || article.contentText.slice(0, 160)}
            url={url}
            className="mt-3 shrink-0 sm:mt-0"
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
        </div>
      </header>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <main className="min-w-0">
          <aside className="mb-8 border-l-2 border-[#b7791f] bg-[#ebede3] px-4 py-3 dark:border-[#9ba475] dark:bg-[#1c1d15]">
            <AuthorByline />
          </aside>
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
