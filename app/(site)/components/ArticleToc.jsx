export default function ArticleToc({ items = [], title = '文章目录' }) {
  if (items.length < 2) return null

  return (
    <aside className="hidden shrink-0 md:sticky md:top-24 md:block md:w-52 md:self-start">
      <nav className="toc-scroll-panel md:static" aria-label={title}>
        <div className="mb-3 border-b border-[#eee] pb-2 text-sm font-bold dark:border-gray-800 dark:text-gray-200">
          {title}
        </div>
        <ul className="space-y-2 text-sm text-[#666] dark:text-gray-300">
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
    </aside>
  )
}
