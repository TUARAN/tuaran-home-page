export default function ArticleToc({ items = [], title = '文章目录' }) {
  if (items.length < 2) return null

  return (
    <nav className="toc-scroll-panel article-toc-panel hidden md:block" aria-label={title}>
      <div className="mb-3 border-b border-[#eee] pb-2 text-sm font-bold dark:border-gray-800 dark:text-gray-200">
        {title}
      </div>
      <ul className="article-toc-list space-y-2 text-sm text-[#666] dark:text-gray-300">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="text-[#444] underline opacity-90 underline-offset-4 hover:opacity-100 dark:text-gray-200"
            >
              {item.text || item.label || item.date}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function ArticleReadingLayout({ toc, support, children }) {
  return (
    <div className="flex flex-col gap-8 md:flex-row md:items-start">
      <aside className="order-2 flex w-full shrink-0 flex-col gap-4 md:order-1 md:sticky md:top-24 md:w-64 md:self-start">
        {toc}
        {support}
      </aside>
      <div className="article-body order-1 min-w-0 flex-1 md:order-2">
        {children}
      </div>
    </div>
  )
}
