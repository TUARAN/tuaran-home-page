import BookmarksTocLayout from '../../components/BookmarksTocLayout'
import ContentPvBeacon from '../../components/ContentPvBeacon'
import RanbiPaywall from '../../components/RanbiPaywall'

export const dynamic = 'force-static'

export const metadata = {
  title: 'AI 工具',
  description: '实用的 AI 工具、产品与服务推荐。',
  alternates: {
    canonical: '/bookmarks/ai-tools',
  },
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

const tocItems = tools.map((item, idx) => ({
  id: `tool-${idx}`,
  title: item.title,
  subItems: [{ id: `tool-${idx}-link`, label: '链接' }],
}))

export default function AIToolsPage() {
  return (
    <>
      <ContentPvBeacon category="resource" slug="bookmarks-ai-tools" />
      <RanbiPaywall resourceKey="resource:bookmarks-ai-tools" unitLabel="资源">
        <BookmarksTocLayout
          title="AI 工具"
          description="实用的 AI 工具、产品与服务推荐。"
          tocItems={tocItems}
          footer={<p>这些工具已经成为日常工作的重要组成部分，推荐尝试。</p>}
        >
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {tools.map((item, idx) => (
              <section
                key={item.url}
                className="border border-[#eee] bg-white dark:border-gray-800 dark:bg-gray-900 p-4"
              >
                <h2 id={`tool-${idx}`} className="text-base font-semibold text-[#333] dark:text-gray-100 scroll-mt-24">
                  {item.title}
                </h2>
                <div className="text-sm text-[#666] dark:text-gray-300 mt-2">{item.description}</div>

                <div id={`tool-${idx}-link`} className="mt-4 text-sm text-[#666] dark:text-gray-300 scroll-mt-24">
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
      </RanbiPaywall>
    </>
  )
}
