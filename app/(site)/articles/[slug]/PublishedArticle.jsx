import Link from 'next/link'
import Script from 'next/script'

import ArticlePostBody from '../../components/ArticlePostBody'
import { AuthorByline } from '../../components/ArticleAuthorIntro'
import ArticleComments from '../../components/ArticleComments'
import ArticleFooterCta from '../../components/ArticleFooterCta'

function dateLabel(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(value))
}

export default function PublishedArticle({ article, siteUrl }) {
  const url = `${siteUrl}/articles/${article.slug}`
  const publishedTime = article.publishedAt ? new Date(article.publishedAt).toISOString() : undefined
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Script id={`article-jsonld-db-${article.id}`} type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(structuredData)}
      </Script>
      <header className="mb-8 border-b border-[#eee] pb-5 dark:border-gray-800">
        <h1 className="font-serif text-3xl font-semibold leading-snug text-[#333] dark:text-gray-100">{article.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[#888] dark:text-gray-400">
          <time dateTime={publishedTime}>{dateLabel(article.publishedAt)}</time>
          {article.tags.map((tag) => <span key={tag} className="rounded-full border border-[#ddd] px-2 py-0.5 text-xs dark:border-gray-700">{tag}</span>)}
        </div>
        {article.summary ? <p className="mt-4 text-sm leading-7 text-[#666] dark:text-gray-300">{article.summary}</p> : null}
        <Link href="/articles?tab=posts" className="mt-4 inline-block text-sm text-[#666] underline underline-offset-4 dark:text-gray-300">返回精选文章</Link>
      </header>
      <aside className="mb-8 border-l-2 border-[#b7791f] bg-[#ebede3] px-4 py-3 dark:border-[#9ba475] dark:bg-[#1c1d15]">
        <AuthorByline />
      </aside>
      {article.coverUrl ? <figure className="mb-10">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={article.coverUrl} alt={`${article.title} 封面`} className="h-auto w-full rounded-lg border border-[#eee] object-cover dark:border-gray-800" /></figure> : null}
      <ArticlePostBody content={article.content} />
      <div id="comments" className="scroll-mt-24">
        <ArticleComments articleKey={`article:${article.slug}`} />
      </div>
      <ArticleFooterCta />
    </div>
  )
}
