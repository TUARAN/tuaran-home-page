import Link from 'next/link'
import SettingsButton from '../../components/SettingsButton'

export const dynamic = 'force-static'

export const metadata = {
  title: '大模型教程',
  description: '大语言模型（LLM）相关的优质教程、实践指南与技术文档。',
}

const tutorials = [
  {
    title: 'LangChain 官方文档',
    url: 'https://python.langchain.com/',
    description: '构建 LLM 应用的主流框架，提供丰富的组件和集成方案。',
    tags: ['LangChain', 'Framework', 'Python'],
  },
  {
    title: 'OpenAI Cookbook',
    url: 'https://cookbook.openai.com/',
    description: 'OpenAI 官方示例代码库，涵盖 GPT API 的各种使用场景。',
    tags: ['OpenAI', 'GPT', 'Cookbook'],
  },
  {
    title: 'Prompt Engineering Guide',
    url: 'https://www.promptingguide.ai/',
    description: '全面的提示词工程指南，从基础到高级技巧。',
    tags: ['Prompt', 'Engineering', 'Guide'],
  },
  {
    title: 'Hugging Face Course',
    url: 'https://huggingface.co/course/',
    description: 'Transformers 库的完整教程，适合深入学习模型原理。',
    tags: ['Hugging Face', 'Transformers', 'Course'],
  },
  {
    title: 'LLM University by Cohere',
    url: 'https://docs.cohere.com/docs/llmu',
    description: 'Cohere 提供的 LLM 系统性学习资源。',
    tags: ['Cohere', 'LLM', 'Education'],
  },
  {
    title: 'ChatGPT Prompt Engineering for Developers',
    url: 'https://www.deeplearning.ai/short-courses/chatgpt-prompt-engineering-for-developers/',
    description: 'DeepLearning.AI 与 OpenAI 合作推出的免费课程。',
    tags: ['DeepLearning.AI', 'ChatGPT', 'Free'],
  },
]

export default function LLMTutorialsPage() {
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
            <h1 className="text-[#555] dark:text-gray-200">大模型教程</h1>
            <p className="text-sm text-[#666] dark:text-gray-300 mt-2">
              大语言模型（LLM）相关的优质教程、实践指南与技术文档。
            </p>
          </div>
          <SettingsButton />
        </div>
      </header>

      <main>
        <section className="border border-[#eee] bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {tutorials.map((item) => (
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
            💡 从入门到进阶，这些教程能帮助你系统掌握大模型开发技能。
          </p>
        </footer>
      </main>
    </div>
  )
}
