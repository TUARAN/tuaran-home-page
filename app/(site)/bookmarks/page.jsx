import Link from 'next/link'

export const dynamic = 'force-static'

export const metadata = {
  title: '收藏夹',
  description: '涂阿燃（tuaran）的收藏整理：推特资讯、大模型教程、优质资源汇总。',
  keywords: ['涂阿燃', 'tuaran', '收藏夹', '推特资讯', '大模型教程', 'AI 资源'],
  alternates: {
    canonical: '/bookmarks',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
}

const categories = [
  {
    slug: 'twitter',
    title: '推特资讯',
    description: 'Twitter/X 上值得关注的前沿动态、技术观点与行业洞察。',
    order: 1,
  },
  {
    slug: 'youtube',
    title: 'YouTube 收藏',
    description: '按主题整理的影像收藏：政治、历史、二战、纪录片与延伸资料。',
    order: 2,
  },
  {
    slug: 'llm-tutorials',
    title: '大模型教程',
    description: '大语言模型（LLM）相关的优质教程、实践指南与技术文档。',
    badge: 'v2026.05',
    order: 3,
  },
  {
    slug: 'ai-tools',
    title: 'AI 工具',
    description: '实用的 AI 工具、产品与服务推荐。',
    order: 4,
  },
  {
    slug: 'dev-resources',
    title: '开发资源',
    description: '前端、后端、DevOps 等开发相关的优质资源与工具链。',
    order: 5,
  },
]

export default function BookmarksIndexPage() {
  return (
    <main className="w-full max-w-4xl mx-auto px-4 py-10">
      <header className="mb-10 border-b border-[#eee] dark:border-gray-800 pb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-semibold tracking-wide text-[#222] dark:text-gray-100">收藏夹</h1>
            <p className="text-sm text-[#666] dark:text-gray-300 mt-2">
              精选资讯、教程与工具，按主题分类整理，持续更新中。
            </p>
          </div>
        </div>
      </header>

      <div>
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/bookmarks/${cat.slug}`}
              className="group border border-[#eee] bg-white dark:border-gray-800 dark:bg-gray-900 no-underline hover:no-underline opacity-90 hover:opacity-100 transition-all"
            >
              <div className="p-4">
                <div className="flex flex-wrap items-baseline gap-2 mb-2">
                  <span className="text-[#999] text-sm">▪</span>
                  <h2 className="text-lg font-semibold text-[#333] dark:text-gray-100 group-hover:text-[#111] dark:group-hover:text-white transition-colors">
                    {cat.title}
                  </h2>
                  {cat.badge ? (
                    <span className="inline-flex items-center rounded-full border border-[#cbd9ee] bg-[#eff4fc] px-2 py-[1px] text-[11px] text-[#3b5b8a] dark:border-[#2a3a55] dark:bg-[#152034] dark:text-[#9bb6df]">
                      {cat.badge}
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-[#666] dark:text-gray-300 ml-5 group-hover:text-[#333] dark:group-hover:text-gray-200 transition-colors">
                  {cat.description}
                </p>
              </div>
            </Link>
          ))}
        </section>

        <div className="mt-12 text-sm text-[#666] dark:text-gray-300 border-t border-[#eee] dark:border-gray-800 pt-6">
          <p>
            💡 这里整理了日常浏览中发现的优质内容，不定期更新。
          </p>
        </div>
      </div>
    </main>
  )
}
