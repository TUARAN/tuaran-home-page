import Link from 'next/link'
import SettingsButton from '../../components/SettingsButton'

export const dynamic = 'force-static'

export const metadata = {
  title: 'AI 工具',
  description: '实用的 AI 工具、产品与服务推荐。',
}

const tools = [
  {
    title: 'ChatGPT',
    url: 'https://chat.openai.com/',
    description: 'OpenAI 推出的对话式 AI 助手，适用于写作、编程、分析等多种场景。',
    tags: ['OpenAI', 'Chat', 'GPT-4'],
  },
  {
    title: 'Claude',
    url: 'https://claude.ai/',
    description: 'Anthropic 的 AI 助手，擅长长文本理解和复杂推理。',
    tags: ['Anthropic', 'Chat', 'Analysis'],
  },
  {
    title: 'Midjourney',
    url: 'https://www.midjourney.com/',
    description: '顶级 AI 绘图工具，生成高质量的艺术作品和设计稿。',
    tags: ['Image', 'Design', 'Art'],
  },
  {
    title: 'Cursor',
    url: 'https://www.cursor.com/',
    description: '集成 AI 的代码编辑器，提升编程效率。',
    tags: ['IDE', 'Coding', 'Productivity'],
  },
  {
    title: 'Perplexity',
    url: 'https://www.perplexity.ai/',
    description: 'AI 搜索引擎，提供带引用来源的问答服务。',
    tags: ['Search', 'Research', 'Citations'],
  },
  {
    title: 'GitHub Copilot',
    url: 'https://github.com/features/copilot',
    description: 'GitHub 推出的 AI 编程助手，支持多种编辑器。',
    tags: ['GitHub', 'Coding', 'Autocomplete'],
  },
]

export default function AIToolsPage() {
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
            <h1 className="text-[#555] dark:text-gray-200">AI 工具</h1>
            <p className="text-sm text-[#666] dark:text-gray-300 mt-2">
              实用的 AI 工具、产品与服务推荐。
            </p>
          </div>
          <SettingsButton />
        </div>
      </header>

      <main>
        <section className="border border-[#eee] bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {tools.map((item) => (
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
            💡 这些工具已经成为日常工作的重要组成部分，推荐尝试。
          </p>
        </footer>
      </main>
    </div>
  )
}
