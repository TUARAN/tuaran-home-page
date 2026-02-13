import Link from 'next/link'

import SettingsButton from './SettingsButton'

export default function BookmarksTocLayout({
  title,
  description,
  backHref = '/bookmarks',
  backText = '返回收藏夹',
  tocTitle = '目录',
  tocItems = [],
  children,
  footer,
}) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <header className="mb-10 border-b border-[#eee] dark:border-gray-800 pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[#555] dark:text-gray-200">{title}</h1>
            {description ? (
              <p className="text-sm text-[#666] dark:text-gray-300 mt-2">{description}</p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#666] dark:text-gray-300">
              <Link href={backHref} className="opacity-80 hover:opacity-100 underline underline-offset-4">
                {backText}
              </Link>
            </div>
          </div>
          <SettingsButton />
        </div>
      </header>

      <main>
        <div className="flex flex-col gap-6 md:flex-row">
          <aside className="hidden md:block md:w-52 shrink-0">
            <nav className="border border-[#eee] bg-white p-4 dark:border-gray-800 dark:bg-gray-900 md:sticky md:top-6">
              <div className="text-sm font-bold border-b border-[#eee] pb-2 mb-3 dark:border-gray-800 dark:text-gray-200">
                {tocTitle}
              </div>
              <ul className="text-sm text-[#666] space-y-2 dark:text-gray-300">
                {tocItems.map((item) => (
                  <li
                    key={item.id}
                    className="pb-2 border-b border-[#eee] dark:border-gray-800 last:border-b-0 last:pb-0"
                    data-toc-item-id={item.id}
                  >
                    <a
                      href={`#${item.id}`}
                      className="font-bold text-[#444] dark:text-gray-200 opacity-90 hover:opacity-100 underline underline-offset-4"
                      data-toc-link-id={item.id}
                    >
                      {item.title}
                    </a>

                    {item.subItems && item.subItems.length > 0 ? (
                      <ul className="mt-2 space-y-2 pl-3 border-l border-[#eee] dark:border-gray-800 text-xs text-[#666] dark:text-gray-400">
                        {item.subItems.map((sub) => (
                          <li key={sub.id} data-toc-subitem-id={sub.id}>
                            <a
                              href={`#${sub.id}`}
                              className="opacity-80 hover:opacity-100 underline underline-offset-4"
                              data-toc-sublink-id={sub.id}
                            >
                              {sub.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <div className="flex-1 min-w-0">{children}</div>
        </div>

        {footer ? (
          <footer className="mt-12 text-sm text-[#666] dark:text-gray-300 border-t border-[#eee] dark:border-gray-800 pt-6">
            {footer}
          </footer>
        ) : null}
      </main>
    </div>
  )
}
