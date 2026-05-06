import BookmarksTocLayout from '../../components/BookmarksTocLayout'

export const dynamic = 'force-static'

export const metadata = {
  title: '大模型教程',
  description: '大语言模型（LLM）相关的优质教程、实践指南与技术文档。',
  alternates: {
    canonical: '/bookmarks/llm-tutorials',
  },
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

const tocItems = tutorials.map((item, idx) => ({
  id: `tutorial-${idx}`,
  title: item.title,
  subItems: [{ id: `tutorial-${idx}-link`, label: '链接' }],
}))

export default function LLMTutorialsPage() {
  return (
    <BookmarksTocLayout
      title="大模型教程"
      description="大语言模型（LLM）相关的优质教程、实践指南与技术文档。"
      tocItems={tocItems}
      footer={<p>从入门到进阶，这些教程能帮助你系统掌握大模型开发技能。</p>}
    >
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {tutorials.map((item, idx) => (
          <section
            key={item.url}
            className="border border-[#eee] bg-white dark:border-gray-800 dark:bg-gray-900 p-4"
          >
            <h2
              id={`tutorial-${idx}`}
              className="text-base font-semibold text-[#333] dark:text-gray-100 scroll-mt-24"
            >
              {item.title}
            </h2>
            <div className="text-sm text-[#666] dark:text-gray-300 mt-2">{item.description}</div>

            <div id={`tutorial-${idx}-link`} className="mt-4 text-sm text-[#666] dark:text-gray-300 scroll-mt-24">
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
