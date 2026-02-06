import BookmarksTocLayout from '../../components/BookmarksTocLayout'

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

const tocItems = resources.map((item, idx) => ({
  id: `resource-${idx}`,
  title: item.title,
  subItems: [{ id: `resource-${idx}-link`, label: '链接' }],
}))

export default function DevResourcesPage() {
  return (
    <BookmarksTocLayout
      title="开发资源"
      description="前端、后端、DevOps 等开发相关的优质资源与工具链。"
      tocItems={tocItems}
      footer={<p>这里会持续补充：优质文档、工具链与工程实践参考。</p>}
    >
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {resources.map((item, idx) => (
          <section
            key={item.url}
            className="border border-[#eee] bg-white dark:border-gray-800 dark:bg-gray-900 p-4"
          >
            <h2
              id={`resource-${idx}`}
              className="text-base font-semibold text-[#333] dark:text-gray-100 scroll-mt-24"
            >
              {item.title}
            </h2>
            <div className="text-sm text-[#666] dark:text-gray-300 mt-2">{item.description}</div>

            <div id={`resource-${idx}-link`} className="mt-4 text-sm text-[#666] dark:text-gray-300 scroll-mt-24">
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-[#444] dark:text-gray-200 opacity-90 hover:opacity-100 underline underline-offset-4"
              >
                打开链接
              </a>
              <div className="mt-1 text-xs text-[#999] dark:text-gray-400 break-all">{item.url}</div>
            </div>

            {item.tags && item.tags.length > 0 ? (
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
            ) : null}
          </section>
        ))}
      </div>
    </BookmarksTocLayout>
  )
}
