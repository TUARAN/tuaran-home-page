import Link from 'next/link'
import SettingsButton from '../../components/SettingsButton'

export const dynamic = 'force-static'

export const metadata = {
  title: '开发资源',
  description: '前端、后端、DevOps 等开发相关的优质资源与工具链。',
}

const resources = [
  {
    title: 'MDN Web Docs',
    url: 'https://developer.mozilla.org/',
    description: 'Web 标准与前端基础能力的权威文档库。',
    tags: ['Web', 'Docs', 'Frontend'],
  },
  {
    title: 'Can I use',
    url: 'https://caniuse.com/',
    description: '快速查询浏览器兼容性与特性支持情况。',
    tags: ['Browser', 'Compatibility'],
  },
  {
    title: 'web.dev',
    url: 'https://web.dev/',
    description: 'Google 官方 Web 性能与最佳实践指南。',
    tags: ['Performance', 'Best Practices'],
  },
  {
    title: 'The Twelve-Factor App',
    url: 'https://12factor.net/',
    description: '构建可维护云原生应用的经典方法论。',
    tags: ['DevOps', 'Architecture'],
  },
]

export default function DevResourcesPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <header className="mb-8 border-b border-[#eee] dark:border-gray-800 pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                href="/bookmarks"
                className="text-sm text-[#666] dark:text-gray-400 hover:text-[#333] dark:hover:text-gray-200"
              >
                ← 返回收藏夹
              </Link>
            </div>
            <h1 className="text-[#555] dark:text-gray-200">开发资源</h1>
            <p className="text-sm text-[#666] dark:text-gray-300 mt-2">
              前端、后端、DevOps 等开发相关的优质资源与工具链。
            </p>
          </div>
          <SettingsButton />
        </div>
      </header>

      <main>
        <section className="border border-[#eee] bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {resources.map((item) => (
              <a
                key={item.url}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="group border border-[#eee] bg-white dark:border-gray-800 dark:bg-gray-900 p-4 no-underline hover:no-underline opacity-90 hover:opacity-100 transition-all"
              >
                <div className="text-base font-semibold text-[#333] dark:text-gray-100 group-hover:text-[#111] dark:group-hover:text-white transition-colors">
                  {item.title}
                </div>
                <div className="text-sm text-[#666] dark:text-gray-300 mt-2 group-hover:text-[#333] dark:group-hover:text-gray-200 transition-colors">
                  {item.description}
                </div>
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full border border-gray-200/70 bg-white/80 px-2 py-0.5 text-xs text-gray-600 dark:border-gray-700/60 dark:bg-gray-900/70 dark:text-gray-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </a>
            ))}
          </div>
        </section>

        <footer className="mt-12 text-sm text-[#666] dark:text-gray-300 border-t border-[#eee] dark:border-gray-800 pt-6">
          <p>
            这里会持续补充：优质文档、工具链与工程实践参考。
          </p>
        </footer>
      </main>
    </div>
  )
}
