import { articles } from './articlesData'

export const dynamic = 'force-static'

export default function ArticlesPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <header className="mb-10 border-b border-[#eee] pb-4">
        <h1 className="text-[#555]">文章列表</h1>
        <p className="text-sm text-[#666] mt-2">
          精选技术观察、实践复盘与周刊内容。
          <span className="ml-2 inline-flex items-center gap-2">
            <a
              href="https://juejin.cn/user/1521379823340792/posts"
              target="_blank"
              rel="noreferrer"
              className="opacity-80 hover:opacity-100 underline underline-offset-4"
            >
              掘金历史文章
            </a>
            <span aria-hidden="true">·</span>
            <a
              href="https://juejin.cn/user/1521379823340792/columns"
              target="_blank"
              rel="noreferrer"
              className="opacity-80 hover:opacity-100 underline underline-offset-4"
            >
              掘金历史专栏
            </a>
          </span>
        </p>
      </header>

      <div className="space-y-6">
        {articles.map((article) => (
          <article
            key={article.slug}
            className="border border-[#eee] bg-white p-5 hover:border-[#ddd] transition-colors"
          >
            <div className="flex flex-col gap-2">
              <div className="text-xs text-[#999]">{article.date}</div>
              <h2 className="text-lg text-[#444]">{article.title}</h2>
              <p className="text-sm text-[#666] leading-relaxed">{article.summary}</p>
              <div className="text-sm text-[#666] flex flex-wrap gap-4 pt-2">
                <a
                  href={`/articles/${article.slug}`}
                  className="opacity-80 hover:opacity-100 underline underline-offset-4"
                >
                  阅读全文
                </a>
                <a
                  href={article.href}
                  target="_blank"
                  rel="noreferrer"
                  className="opacity-80 hover:opacity-100 underline underline-offset-4"
                >
                  原文链接
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
