import Link from 'next/link'
import SettingsButton from '../../components/SettingsButton'

export const dynamic = 'force-static'

export const metadata = {
  title: '推特资讯',
  description: 'Twitter/X 上值得关注的前沿动态、技术观点与行业洞察。',
}

const bookmarks = [
  {
    title: 'Andrej Karpathy',
    handle: '@karpathy',
    url: 'https://twitter.com/karpathy',
    description: 'OpenAI 创始成员，Tesla AI 前负责人，深度学习领域的顶级专家。',
    tags: ['AI', 'Deep Learning', 'LLM'],
  },
  {
    title: 'Sam Altman',
    handle: '@sama',
    url: 'https://twitter.com/sama',
    description: 'OpenAI CEO，关注 AGI 发展、创业与技术趋势。',
    tags: ['OpenAI', 'AGI', 'Startup'],
  },
  {
    title: 'Yann LeCun',
    handle: '@ylecun',
    url: 'https://twitter.com/ylecun',
    description: 'Meta AI 首席科学家，图灵奖得主，CNN 之父。',
    tags: ['AI', 'Meta', 'Research'],
  },
  {
    title: 'Greg Brockman',
    handle: '@gdb',
    url: 'https://twitter.com/gdb',
    description: 'OpenAI 联合创始人兼总裁，分享技术进展与产品思考。',
    tags: ['OpenAI', 'Product', 'Engineering'],
  },
]

export default function TwitterBookmarksPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <header className="mb-8 border-b border-[#eee] dark:border-gray-800 pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[#555] dark:text-gray-200">推特资讯</h1>
            <p className="text-sm text-[#666] dark:text-gray-300 mt-2">
              Twitter/X 上值得关注的前沿动态、技术观点与行业洞察。
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#666] dark:text-gray-300">
              <Link href="/bookmarks" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                返回收藏夹
              </Link>
            </div>
          </div>
          <SettingsButton />
        </div>
      </header>

      <main>
        <section className="border border-[#eee] bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {bookmarks.map((item) => (
              <a
                key={item.handle}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="group border border-[#eee] bg-white dark:border-gray-800 dark:bg-gray-900 p-4 no-underline hover:no-underline opacity-90 hover:opacity-100 transition-all"
              >
                <div className="flex items-baseline gap-2 flex-wrap">
                  <div className="text-base font-semibold text-[#333] dark:text-gray-100 group-hover:text-[#111] dark:group-hover:text-white transition-colors">
                    {item.title}
                  </div>
                  <div className="text-xs text-[#999] dark:text-gray-400">{item.handle}</div>
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
            💡 以上账号定期分享 AI 领域的前沿进展，建议关注。
          </p>
        </footer>
      </main>
    </div>
  )
}
