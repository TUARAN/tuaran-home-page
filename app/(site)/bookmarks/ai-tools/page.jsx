import BookmarksTocLayout from '../../components/BookmarksTocLayout'
import ContentEngagement from '../../components/ContentEngagement'
import ContentPvBeacon from '../../components/ContentPvBeacon'
import RanbiPaywall from '../../components/RanbiPaywall'

export const dynamic = 'force-static'

export const metadata = {
  title: 'AI 工具',
  description: '常用 AI 工具、产品与服务收集：对话大模型、编程 Agent、图像与视频、语音、搜索、自动化与本地部署。',
  alternates: {
    canonical: '/bookmarks/ai-tools',
  },
}

// 按用途分组的 AI 工具清单。描述只做中性介绍，链接为各产品官方入口。
const toolGroups = [
  {
    category: '对话与通用大模型',
    items: [
      {
        title: 'ChatGPT',
        url: 'https://chatgpt.com/',
        description: 'OpenAI 的对话助手，支持多模态、联网搜索、Canvas 与 Agent 模式。',
        tags: ['OpenAI', '对话', '多模态'],
      },
      {
        title: 'Claude',
        url: 'https://claude.ai/',
        description: 'Anthropic 的助手，擅长长文本、代码与复杂推理，内置 Projects 与 Artifacts。',
        tags: ['Anthropic', '长文本', '代码'],
      },
      {
        title: 'Gemini',
        url: 'https://gemini.google.com/',
        description: 'Google 的多模态助手，深度整合搜索与 Workspace。',
        tags: ['Google', '多模态'],
      },
      {
        title: 'Grok',
        url: 'https://grok.com/',
        description: 'xAI 的助手，深度整合 X 平台，偏好实时信息。',
        tags: ['xAI', '实时'],
      },
      {
        title: 'DeepSeek',
        url: 'https://chat.deepseek.com/',
        description: '深度求索的对话产品，中文友好，配套开源模型生态活跃。',
        tags: ['国产', '开源'],
      },
      {
        title: '通义千问 Qwen',
        url: 'https://chat.qwen.ai/',
        description: '阿里的大模型与对话产品，开源版本生态广泛。',
        tags: ['阿里', '开源'],
      },
      {
        title: 'Kimi',
        url: 'https://kimi.moonshot.cn/',
        description: '月之暗面的助手，以长上下文处理见长。',
        tags: ['国产', '长上下文'],
      },
      {
        title: '智谱清言 GLM',
        url: 'https://chatglm.cn/',
        description: '智谱 AI 的对话产品，配套 GLM 系列开源模型。',
        tags: ['国产', '开源'],
      },
    ],
  },
  {
    category: '编程与 Agent 开发',
    items: [
      {
        title: 'Claude Code',
        url: 'https://www.anthropic.com/claude-code',
        description: 'Anthropic 官方命令行编码 Agent，可读写代码库、跑命令、改文件。',
        tags: ['Anthropic', 'CLI', 'Agent'],
      },
      {
        title: 'Codex',
        url: 'https://openai.com/codex/',
        description: 'OpenAI 的编码 Agent，提供 App 与 CLI 两种形态。',
        tags: ['OpenAI', 'Agent', '编码'],
      },
      {
        title: 'Cursor',
        url: 'https://www.cursor.com/',
        description: '集成 AI 的代码编辑器，支持多文件编辑与 Agent。',
        tags: ['IDE', '编码'],
      },
      {
        title: 'GitHub Copilot',
        url: 'https://github.com/features/copilot',
        description: 'GitHub 的编程助手，支持主流编辑器与 Agent 模式。',
        tags: ['GitHub', '编码'],
      },
      {
        title: 'Windsurf',
        url: 'https://windsurf.com/',
        description: 'agentic AI IDE，强调自主多步开发体验。',
        tags: ['IDE', 'Agent'],
      },
      {
        title: 'Cline',
        url: 'https://cline.bot/',
        description: 'VS Code 内的开源自主编码 Agent，可自带模型 API。',
        tags: ['开源', 'VS Code'],
      },
      {
        title: 'v0',
        url: 'https://v0.app/',
        description: 'Vercel 的前端/UI 生成工具，从描述直接产出可运行界面。',
        tags: ['Vercel', '前端'],
      },
      {
        title: 'bolt.new',
        url: 'https://bolt.new/',
        description: 'StackBlitz 的全栈应用生成，浏览器内即写即跑、即部署。',
        tags: ['全栈', '生成'],
      },
    ],
  },
  {
    category: '图像生成与设计',
    items: [
      {
        title: 'Midjourney',
        url: 'https://www.midjourney.com/',
        description: '高质量 AI 绘图，风格化与画面质感见长。',
        tags: ['绘图', '艺术'],
      },
      {
        title: 'Ideogram',
        url: 'https://ideogram.ai/',
        description: '文字渲染准确的图像生成，适合海报与排版。',
        tags: ['文字', '海报'],
      },
      {
        title: 'Recraft',
        url: 'https://www.recraft.ai/',
        description: '面向设计的图像生成，支持矢量与统一品牌风格。',
        tags: ['设计', '矢量'],
      },
      {
        title: 'ComfyUI',
        url: 'https://www.comfy.org/',
        description: '开源节点式图像/视频生成工作流，可自由编排模型链路。',
        tags: ['开源', '工作流'],
      },
      {
        title: '即梦 Jimeng',
        url: 'https://jimeng.jianying.com/',
        description: '字节的图像与视频创作平台。',
        tags: ['字节', '国产'],
      },
    ],
  },
  {
    category: '视频生成',
    items: [
      {
        title: 'Sora',
        url: 'https://sora.com/',
        description: 'OpenAI 的文生/图生视频产品。',
        tags: ['OpenAI', '视频'],
      },
      {
        title: 'Runway',
        url: 'https://runwayml.com/',
        description: 'Gen 系列视频生成与编辑工具，面向影视创作。',
        tags: ['视频', '编辑'],
      },
      {
        title: '可灵 Kling',
        url: 'https://klingai.com/',
        description: '快手的视频生成模型与产品。',
        tags: ['快手', '国产'],
      },
      {
        title: '海螺 Hailuo',
        url: 'https://hailuoai.video/',
        description: 'MiniMax 的视频生成产品。',
        tags: ['MiniMax', '国产'],
      },
      {
        title: 'Pika',
        url: 'https://pika.art/',
        description: '面向创作者的轻量视频生成。',
        tags: ['视频'],
      },
    ],
  },
  {
    category: '音频与语音',
    items: [
      {
        title: 'ElevenLabs',
        url: 'https://elevenlabs.io/',
        description: '高拟真语音合成与配音，支持多语言与声音克隆。',
        tags: ['TTS', '配音'],
      },
      {
        title: 'Suno',
        url: 'https://suno.com/',
        description: 'AI 音乐生成，可产出带人声的完整歌曲。',
        tags: ['音乐', '生成'],
      },
      {
        title: 'Udio',
        url: 'https://www.udio.com/',
        description: 'AI 音乐生成，偏好高音质与精细控制。',
        tags: ['音乐'],
      },
    ],
  },
  {
    category: '搜索与研究',
    items: [
      {
        title: 'Perplexity',
        url: 'https://www.perplexity.ai/',
        description: '带引用来源的 AI 搜索，支持 Deep Research。',
        tags: ['搜索', '研究'],
      },
      {
        title: '秘塔搜索 Metaso',
        url: 'https://metaso.cn/',
        description: '国产 AI 搜索，结果附结构化大纲与脑图。',
        tags: ['国产', '搜索'],
      },
      {
        title: 'NotebookLM',
        url: 'https://notebooklm.google.com/',
        description: 'Google 的资料库问答，支持音频概述（播客式摘要）。',
        tags: ['Google', '资料库'],
      },
      {
        title: 'Elicit',
        url: 'https://elicit.com/',
        description: '面向学术文献的 AI 研究助手，做综述与证据提取。',
        tags: ['学术', '研究'],
      },
    ],
  },
  {
    category: '生产力与写作',
    items: [
      {
        title: 'Notion AI',
        url: 'https://www.notion.com/product/ai',
        description: '笔记与文档内的 AI 写作、问答与知识检索。',
        tags: ['笔记', '写作'],
      },
      {
        title: 'Obsidian',
        url: 'https://obsidian.md/',
        description: '本地优先的 Markdown 知识库，常作为 AI 记忆系统底座。',
        tags: ['笔记', '本地'],
      },
      {
        title: 'Raycast',
        url: 'https://www.raycast.com/',
        description: 'Mac 启动器，内置 AI 与丰富扩展生态。',
        tags: ['Mac', '效率'],
      },
      {
        title: 'Gamma',
        url: 'https://gamma.app/',
        description: 'AI 生成幻灯片、文档与网页。',
        tags: ['PPT', '生成'],
      },
    ],
  },
  {
    category: 'Agent 平台与自动化',
    items: [
      {
        title: 'Dify',
        url: 'https://dify.ai/',
        description: '开源 LLM 应用与 Agent 编排平台，可视化搭建工作流。',
        tags: ['开源', '编排'],
      },
      {
        title: 'Coze 扣子',
        url: 'https://www.coze.cn/',
        description: '字节的 Bot / Agent 搭建平台，低代码接入插件与知识库。',
        tags: ['字节', 'Agent'],
      },
      {
        title: 'n8n',
        url: 'https://n8n.io/',
        description: '开源工作流自动化，内置 AI 节点与大量集成。',
        tags: ['开源', '自动化'],
      },
      {
        title: 'LangChain',
        url: 'https://www.langchain.com/',
        description: 'LLM 应用开发框架，配套 LangSmith 可观测与评测。',
        tags: ['框架', '开发'],
      },
      {
        title: 'Zapier',
        url: 'https://zapier.com/',
        description: 'SaaS 自动化连接器，支持在流程中嵌入 AI 步骤。',
        tags: ['自动化'],
      },
    ],
  },
  {
    category: '本地与开源运行',
    items: [
      {
        title: 'Ollama',
        url: 'https://ollama.com/',
        description: '本地运行开源大模型的命令行工具，一行命令拉起模型。',
        tags: ['本地', '开源'],
      },
      {
        title: 'LM Studio',
        url: 'https://lmstudio.ai/',
        description: '桌面端运行与管理本地模型，带图形界面。',
        tags: ['本地', '桌面'],
      },
      {
        title: 'Hugging Face',
        url: 'https://huggingface.co/',
        description: '模型与数据集社区，开源 AI 生态的中心枢纽。',
        tags: ['社区', '模型'],
      },
      {
        title: 'OpenRouter',
        url: 'https://openrouter.ai/',
        description: '统一多家模型的 API 路由，一个接口切换不同供应商。',
        tags: ['API', '路由'],
      },
    ],
  },
]

const tocItems = toolGroups.map((group, gi) => ({
  id: `cat-${gi}`,
  title: group.category,
  subItems: group.items.map((item, ti) => ({ id: `tool-${gi}-${ti}`, label: item.title })),
}))

export default function AIToolsPage() {
  return (
    <>
      <ContentPvBeacon category="resource" slug="bookmarks-ai-tools" />
      <RanbiPaywall resourceKey="resource:bookmarks-ai-tools" unitLabel="资源">
        <BookmarksTocLayout
          title="AI 工具"
          description="常用 AI 工具、产品与服务收集，按用途分组。链接均为官方入口，部分产品在国内可能需要相应网络条件。"
          tocItems={tocItems}
          footer={<p>清单会随产品迭代不定期更新；介绍仅作中性参考，选型请以各自官方信息为准。</p>}
        >
          <div className="flex flex-col gap-10">
            {toolGroups.map((group, gi) => (
              <section key={group.category}>
                <h2
                  id={`cat-${gi}`}
                  className="scroll-mt-24 border-b border-[#eee] pb-2 text-lg font-semibold text-[#333] dark:border-gray-800 dark:text-gray-100"
                >
                  {group.category}
                </h2>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:gap-6">
                  {group.items.map((item, ti) => (
                    <section
                      key={item.url}
                      id={`tool-${gi}-${ti}`}
                      className="scroll-mt-24 border border-[#eee] bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
                    >
                      <h3 className="text-base font-semibold text-[#333] dark:text-gray-100">
                        {item.title}
                      </h3>
                      <div className="mt-2 text-sm text-[#666] dark:text-gray-300">{item.description}</div>

                      <div className="mt-4 text-sm text-[#666] dark:text-gray-300">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-[#444] underline underline-offset-4 opacity-90 hover:opacity-100 dark:text-gray-200"
                        >
                          打开链接
                        </a>
                        <div className="mt-1 break-all text-xs text-[#999] dark:text-gray-400">{item.url}</div>
                      </div>

                      {item.tags && item.tags.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
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
              </section>
            ))}
          </div>
        </BookmarksTocLayout>
      </RanbiPaywall>
      <ContentEngagement contentKey="resource:bookmarks-ai-tools" width="standard" />
    </>
  )
}
