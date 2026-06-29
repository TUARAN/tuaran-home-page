import BookmarksTocLayout from '../../components/BookmarksTocLayout'
import ContentPvBeacon from '../../components/ContentPvBeacon'
import RanbiPaywall from '../../components/RanbiPaywall'

export const dynamic = 'force-static'

const RESOURCE_VERSION = 'v2026.05'

export const metadata = {
  title: `大模型教程 · ${RESOURCE_VERSION}`,
  description: '大语言模型（LLM）相关的优质教程、实践指南与技术文档：官方文档、课程、RAG、Agent、评测、部署与中文资源。',
  alternates: {
    canonical: '/bookmarks/llm-tutorials',
  },
}

const tutorialGroups = [
  {
    id: 'official-platforms',
    title: '官方平台与模型文档',
    description: '优先看官方文档，避免被二手教程带偏；这里是 API、模型能力、工具调用和安全边界的一手入口。',
    items: [
      {
        title: 'OpenAI API Docs',
        url: 'https://platform.openai.com/docs',
        description: 'OpenAI API 官方文档，覆盖模型、Responses API、工具调用、结构化输出、文件搜索、图像与语音等能力。',
        tags: ['OpenAI', 'API', 'Official'],
      },
      {
        title: 'OpenAI Cookbook',
        url: 'https://cookbook.openai.com/',
        description: 'OpenAI 官方示例库，包含 GPT-5.x、Agents、Evals、RAG、结构化输出、微调、批处理等实践案例。',
        tags: ['OpenAI', 'Cookbook', 'Examples'],
        version: RESOURCE_VERSION,
      },
      {
        title: 'OpenAI Agents SDK',
        url: 'https://openai.github.io/openai-agents-python/',
        description: 'OpenAI 官方 Agent SDK 文档，适合学习工具调用、handoff、guardrails、tracing 与多 Agent 编排。',
        tags: ['OpenAI', 'Agents', 'SDK'],
        version: RESOURCE_VERSION,
      },
      {
        title: 'Anthropic Claude Docs',
        url: 'https://docs.anthropic.com/',
        description: 'Claude 官方文档，覆盖消息 API、工具使用、提示词工程、computer use、MCP 与长上下文实践。',
        tags: ['Anthropic', 'Claude', 'Official'],
      },
      {
        title: 'Google Gemini API Docs',
        url: 'https://ai.google.dev/gemini-api/docs',
        description: 'Gemini API 官方文档，覆盖多模态、函数调用、结构化输出、长上下文、嵌入、文件和 Grounding。',
        tags: ['Google', 'Gemini', 'Official'],
      },
      {
        title: 'Gemini Prompting Guide',
        url: 'https://ai.google.dev/gemini-api/docs/prompting-intro',
        description: 'Google 官方提示词指南，适合系统整理 Gemini 系列模型的 prompt 设计、输出格式和多轮任务拆解。',
        tags: ['Google', 'Prompting', 'Guide'],
      },
      {
        title: 'Azure OpenAI Documentation',
        url: 'https://learn.microsoft.com/azure/ai-services/openai/',
        description: '微软 Azure OpenAI 官方文档，适合企业场景学习部署、身份权限、内容安全、RAG 和生产化治理。',
        tags: ['Azure', 'OpenAI', 'Enterprise'],
      },
      {
        title: 'Mistral AI Docs',
        url: 'https://docs.mistral.ai/',
        description: 'Mistral 官方文档，覆盖模型 API、函数调用、Agents、OCR、嵌入与自托管相关能力。',
        tags: ['Mistral', 'API', 'Official'],
      },
      {
        title: 'Cohere Docs',
        url: 'https://docs.cohere.com/',
        description: 'Cohere 官方文档，重点关注企业检索、Rerank、Embed、Command 系列模型与 RAG 方案。',
        tags: ['Cohere', 'Rerank', 'RAG'],
      },
      {
        title: 'xAI API Docs',
        url: 'https://docs.x.ai/',
        description: 'xAI Grok API 官方文档，适合跟踪 Grok 模型、工具能力和实时信息相关能力。',
        tags: ['xAI', 'Grok', 'API'],
      },
    ],
  },
  {
    id: 'courses',
    title: '系统课程与学习路径',
    description: '从 prompt、Transformer、RAG 到 Agent 的系统课程，适合建立完整知识地图。',
    items: [
      {
        title: 'Hugging Face Course',
        url: 'https://huggingface.co/course/',
        description: 'Transformers、Datasets、Tokenizers、微调和开源模型生态的经典系统课程。',
        tags: ['Hugging Face', 'Transformers', 'Course'],
      },
      {
        title: 'LLM University by Cohere',
        url: 'https://docs.cohere.com/docs/llmu',
        description: 'Cohere 提供的大模型系统学习资源，覆盖语义搜索、RAG、嵌入、评测和应用开发。',
        tags: ['Cohere', 'LLM', 'Education'],
      },
      {
        title: 'Prompt Engineering Guide',
        url: 'https://www.promptingguide.ai/',
        description: '提示词工程综合指南，覆盖基础 prompt、CoT、RAG、Agent、红队、安全和论文索引。',
        tags: ['Prompt', 'Engineering', 'Guide'],
      },
      {
        title: 'ChatGPT Prompt Engineering for Developers',
        url: 'https://www.deeplearning.ai/short-courses/chatgpt-prompt-engineering-for-developers/',
        description: 'DeepLearning.AI 与 OpenAI 合作课程，适合入门 prompt、迭代、摘要、推理、转换和扩展任务。',
        tags: ['DeepLearning.AI', 'Prompt', 'Free'],
      },
      {
        title: 'DeepLearning.AI Short Courses',
        url: 'https://www.deeplearning.ai/short-courses/',
        description: '密集型 AI 短课集合，覆盖 RAG、LangChain、LlamaIndex、评测、Agentic design 和多模态应用。',
        tags: ['DeepLearning.AI', 'Courses', 'Applied AI'],
      },
      {
        title: 'Stanford CS324: Large Language Models',
        url: 'https://stanford-cs324.github.io/winter2022/',
        description: '斯坦福大语言模型课程，适合理解模型能力、训练数据、缩放、法律伦理与社会影响。',
        tags: ['Stanford', 'LLM', 'Theory'],
      },
      {
        title: 'Berkeley CS 294/194: Large Language Model Agents',
        url: 'https://rdi.berkeley.edu/llm-agents/f24',
        description: '伯克利 LLM Agent 课程，适合系统学习规划、工具、记忆、多 Agent、环境交互与评测。',
        tags: ['Berkeley', 'Agents', 'Course'],
        version: RESOURCE_VERSION,
      },
      {
        title: 'MIT 6.S191: Introduction to Deep Learning',
        url: 'https://introtodeeplearning.com/',
        description: 'MIT 深度学习入门课程，适合补 Transformer 和大模型前置基础。',
        tags: ['MIT', 'Deep Learning', 'Foundation'],
      },
    ],
  },
  {
    id: 'frameworks',
    title: '应用框架与 Agent 编排',
    description: '做应用时重点看框架的抽象边界：Prompt、Tool、Memory、Graph、Retriever、Evaluator 如何组合。',
    items: [
      {
        title: 'LangChain Docs',
        url: 'https://docs.langchain.com/',
        description: 'LangChain v1 文档入口，覆盖模型、工具、Agent、RAG、流式、记忆、部署和 LangSmith 可观测性。',
        tags: ['LangChain', 'Framework', 'v1'],
        version: 'v1.x',
      },
      {
        title: 'LangGraph Docs',
        url: 'https://langchain-ai.github.io/langgraph/',
        description: '图式 Agent 编排框架，适合构建可控、可恢复、可观察的多步骤 Agent 工作流。',
        tags: ['LangGraph', 'Agents', 'Graph'],
        version: 'v1.x',
      },
      {
        title: 'LlamaIndex Docs',
        url: 'https://docs.llamaindex.ai/',
        description: '面向数据连接、索引、检索、RAG、Agent 和 workflow 的应用框架。',
        tags: ['LlamaIndex', 'RAG', 'Data'],
      },
      {
        title: 'DSPy Docs',
        url: 'https://dspy.ai/',
        description: 'Stanford NLP 团队推动的声明式 LLM 编程框架，强调模块、优化器和自动 prompt/program 优化。',
        tags: ['DSPy', 'Optimization', 'Programming'],
      },
      {
        title: 'Semantic Kernel Docs',
        url: 'https://learn.microsoft.com/semantic-kernel/',
        description: '微软开源的 AI 编排 SDK，适合企业应用、插件、Planner、Agent 与 .NET/Python/Java 生态。',
        tags: ['Microsoft', 'Semantic Kernel', 'SDK'],
      },
      {
        title: 'AutoGen Docs',
        url: 'https://microsoft.github.io/autogen/',
        description: 'Microsoft Research 多 Agent 框架文档，适合学习 Agent 会话、团队协作和自动化任务执行。',
        tags: ['AutoGen', 'Multi-Agent', 'Microsoft'],
      },
      {
        title: 'CrewAI Docs',
        url: 'https://docs.crewai.com/',
        description: '面向角色、任务、流程和团队协作的 Agent 框架，适合快速搭建多 Agent 自动化。',
        tags: ['CrewAI', 'Agents', 'Workflow'],
      },
      {
        title: 'Haystack Docs',
        url: 'https://docs.haystack.deepset.ai/',
        description: 'deepset 的 LLM/RAG pipeline 框架，适合构建企业检索、问答和生产级 NLP 系统。',
        tags: ['Haystack', 'RAG', 'Pipeline'],
      },
    ],
  },
  {
    id: 'rag',
    title: 'RAG、检索与知识库',
    description: 'RAG 的关键不是“接个向量库”，而是切分、检索、重排、引用、评测和权限治理。',
    items: [
      {
        title: 'OpenAI Retrieval & File Search Docs',
        url: 'https://platform.openai.com/docs/guides/tools-file-search',
        description: 'OpenAI 官方文件搜索工具文档，适合学习托管向量检索、引用和工具化 RAG。',
        tags: ['OpenAI', 'File Search', 'RAG'],
      },
      {
        title: 'LlamaIndex RAG Guides',
        url: 'https://docs.llamaindex.ai/en/stable/understanding/rag/',
        description: 'LlamaIndex RAG 原理与实践指南，覆盖 ingestion、indexing、querying 和 response synthesis。',
        tags: ['LlamaIndex', 'RAG', 'Guide'],
      },
      {
        title: 'LangChain RAG Tutorials',
        url: 'https://python.langchain.com/docs/tutorials/rag/',
        description: 'LangChain RAG 教程入口，覆盖文档加载、切分、向量存储、检索链和 Agentic RAG。',
        tags: ['LangChain', 'RAG', 'Tutorial'],
      },
      {
        title: 'Pinecone Learning Center',
        url: 'https://www.pinecone.io/learn/',
        description: '向量数据库与语义搜索学习中心，适合补 embedding、hybrid search、rerank 和 RAG 基础。',
        tags: ['Pinecone', 'Vector DB', 'Search'],
      },
      {
        title: 'Weaviate Academy',
        url: 'https://weaviate.io/developers/academy',
        description: 'Weaviate 官方学院，覆盖向量搜索、混合检索、生成式搜索和生产化知识库。',
        tags: ['Weaviate', 'Vector DB', 'Academy'],
      },
      {
        title: 'Qdrant RAG Tutorials',
        url: 'https://qdrant.tech/documentation/tutorials/',
        description: 'Qdrant 官方教程，覆盖向量检索、混合搜索、过滤、量化和 RAG 应用案例。',
        tags: ['Qdrant', 'Vector DB', 'RAG'],
      },
      {
        title: 'Vespa Documentation',
        url: 'https://docs.vespa.ai/',
        description: '适合学习大规模检索、排序、向量检索、混合搜索和在线 serving 的工程化搜索系统。',
        tags: ['Vespa', 'Search', 'Ranking'],
      },
    ],
  },
  {
    id: 'evals',
    title: '评测、可观测性与安全',
    description: '模型应用上线后，核心问题会从“能不能答”变成“稳定性、成本、安全、可解释和回归评测”。',
    items: [
      {
        title: 'OpenAI Evals Guide',
        url: 'https://platform.openai.com/docs/guides/evals',
        description: 'OpenAI 官方评测指南，适合构建任务评估、回归测试和模型选择流程。',
        tags: ['OpenAI', 'Evals', 'Testing'],
      },
      {
        title: 'LangSmith Docs',
        url: 'https://docs.smith.langchain.com/',
        description: 'LangChain 官方可观测与评测平台，覆盖 tracing、dataset、feedback、evaluation 和 prompt 版本管理。',
        tags: ['LangSmith', 'Observability', 'Evaluation'],
      },
      {
        title: 'Ragas Docs',
        url: 'https://docs.ragas.io/',
        description: '面向 RAG 应用的评测框架，覆盖 faithfulness、answer relevancy、context precision/recall 等指标。',
        tags: ['Ragas', 'RAG Eval', 'Metrics'],
      },
      {
        title: 'DeepEval Docs',
        url: 'https://docs.confident-ai.com/',
        description: 'LLM 应用评测框架，适合单元测试、RAG 评估、Agent 评估和 CI 集成。',
        tags: ['DeepEval', 'Testing', 'CI'],
      },
      {
        title: 'Promptfoo Docs',
        url: 'https://www.promptfoo.dev/docs/intro/',
        description: 'Prompt 与 LLM 输出回归测试工具，适合做 prompt 对比、红队、安全测试和自动化评测。',
        tags: ['Promptfoo', 'Prompt Testing', 'Red Team'],
      },
      {
        title: 'OpenAI Safety Best Practices',
        url: 'https://platform.openai.com/docs/guides/safety-best-practices',
        description: 'OpenAI 官方安全最佳实践，覆盖滥用防护、内容安全、人工审核和上线风控。',
        tags: ['OpenAI', 'Safety', 'Best Practices'],
      },
      {
        title: 'OWASP Top 10 for LLM Applications',
        url: 'https://owasp.org/www-project-top-10-for-large-language-model-applications/',
        description: 'LLM 应用安全风险清单，覆盖 prompt injection、数据泄漏、供应链、过度代理等风险。',
        tags: ['OWASP', 'Security', 'LLM Apps'],
      },
    ],
  },
  {
    id: 'open-source',
    title: '开源模型、微调与本地部署',
    description: '学习开源模型时要同时看模型卡、推理服务、量化、微调、评测和硬件约束。',
    items: [
      {
        title: 'Hugging Face Transformers Docs',
        url: 'https://huggingface.co/docs/transformers/',
        description: 'Transformers 官方文档，覆盖模型加载、推理、训练、微调、量化和多模态模型。',
        tags: ['Transformers', 'Hugging Face', 'Open Source'],
      },
      {
        title: 'Hugging Face TRL Docs',
        url: 'https://huggingface.co/docs/trl/',
        description: '强化学习与偏好优化训练库，适合学习 SFT、DPO、PPO、GRPO 等后训练方法。',
        tags: ['TRL', 'Fine-tuning', 'RLHF'],
      },
      {
        title: 'PEFT Docs',
        url: 'https://huggingface.co/docs/peft/',
        description: '参数高效微调文档，覆盖 LoRA、QLoRA、Adapter 等低成本微调技术。',
        tags: ['PEFT', 'LoRA', 'Fine-tuning'],
      },
      {
        title: 'vLLM Docs',
        url: 'https://docs.vllm.ai/',
        description: '高吞吐 LLM 推理服务文档，适合学习 PagedAttention、OpenAI-compatible server 和生产部署。',
        tags: ['vLLM', 'Serving', 'Inference'],
      },
      {
        title: 'SGLang Docs',
        url: 'https://docs.sglang.ai/',
        description: '高性能结构化生成与服务框架，适合学习推理加速、并发、约束解码和多模态 serving。',
        tags: ['SGLang', 'Serving', 'Structured Generation'],
      },
      {
        title: 'Ollama Docs',
        url: 'https://github.com/ollama/ollama/tree/main/docs',
        description: '本地运行开源模型的常用工具文档，适合快速上手本地模型、Modelfile 和 API。',
        tags: ['Ollama', 'Local LLM', 'Docs'],
      },
      {
        title: 'llama.cpp Docs',
        url: 'https://github.com/ggml-org/llama.cpp',
        description: '本地 CPU/GPU 推理核心项目，适合学习 GGUF、量化、边缘设备推理和跨平台部署。',
        tags: ['llama.cpp', 'GGUF', 'Local Inference'],
      },
      {
        title: 'MLC LLM Docs',
        url: 'https://llm.mlc.ai/docs/',
        description: '面向浏览器、移动端和边缘端的 LLM 编译与部署方案，适合学习 WebGPU 和本地端侧推理。',
        tags: ['MLC LLM', 'WebGPU', 'Edge'],
      },
    ],
  },
  {
    id: 'multimodal',
    title: '多模态、语音与实时应用',
    description: '多模态应用要关注输入输出格式、延迟、流式、工具调用和跨模态检索。',
    items: [
      {
        title: 'OpenAI Image & Vision Guides',
        url: 'https://platform.openai.com/docs/guides/images',
        description: 'OpenAI 图像生成与视觉能力文档，适合学习图像输入、图像生成、编辑和多模态应用。',
        tags: ['OpenAI', 'Vision', 'Images'],
      },
      {
        title: 'OpenAI Realtime API Guide',
        url: 'https://platform.openai.com/docs/guides/realtime',
        description: '实时语音和低延迟交互文档，适合做语音助手、实时翻译、语音 Agent 和流式对话。',
        tags: ['OpenAI', 'Realtime', 'Voice'],
        version: RESOURCE_VERSION,
      },
      {
        title: 'Gemini Multimodal Guides',
        url: 'https://ai.google.dev/gemini-api/docs/vision',
        description: 'Gemini 多模态文档入口，覆盖图片、视频、音频、文档理解与结构化输出。',
        tags: ['Gemini', 'Multimodal', 'Vision'],
      },
      {
        title: 'Anthropic Vision Docs',
        url: 'https://docs.anthropic.com/en/docs/build-with-claude/vision',
        description: 'Claude 视觉能力文档，适合学习图片理解、图文问答和多模态 prompt 设计。',
        tags: ['Claude', 'Vision', 'Multimodal'],
      },
      {
        title: 'Hugging Face Tasks',
        url: 'https://huggingface.co/tasks',
        description: 'Hugging Face 任务索引，覆盖文本、图像、音频、视频和多模态任务的模型入口。',
        tags: ['Hugging Face', 'Tasks', 'Models'],
      },
    ],
  },
  {
    id: 'chinese',
    title: '中文与国内生态',
    description: '中文模型、国产云和中文教程适合作为本地化应用、私有部署和中文语料能力补充。',
    items: [
      {
        title: '阿里云百炼文档',
        url: 'https://help.aliyun.com/zh/model-studio/',
        description: '通义千问/百炼平台文档，覆盖模型调用、应用构建、知识库、插件、Agent 和企业接入。',
        tags: ['通义千问', '阿里云百炼', '中文'],
      },
      {
        title: '智谱 AI 开放平台文档',
        url: 'https://docs.bigmodel.cn/',
        description: 'GLM 系列模型官方文档，覆盖模型调用、工具、智能体、知识库、多模态和开放 API。',
        tags: ['智谱', 'GLM', '中文'],
      },
      {
        title: 'DeepSeek API Docs',
        url: 'https://api-docs.deepseek.com/',
        description: 'DeepSeek 官方 API 文档，适合学习对话、推理模型、上下文缓存、函数调用和兼容接口。',
        tags: ['DeepSeek', 'API', '中文'],
      },
      {
        title: 'Moonshot AI Platform Docs',
        url: 'https://platform.moonshot.cn/docs',
        description: 'Kimi/Moonshot 平台文档，适合学习长上下文、文件理解、模型调用和中文应用场景。',
        tags: ['Kimi', 'Moonshot', '中文'],
      },
      {
        title: '火山引擎方舟文档',
        url: 'https://www.volcengine.com/docs/82379',
        description: '豆包/方舟平台文档，覆盖模型调用、知识库、Agent、评测、精调和企业部署能力。',
        tags: ['豆包', '方舟', '中文'],
      },
      {
        title: '腾讯云混元文档',
        url: 'https://cloud.tencent.com/document/product/1729',
        description: '腾讯混元大模型文档，适合了解国内云厂商大模型 API、插件和企业集成。',
        tags: ['混元', '腾讯云', '中文'],
      },
      {
        title: '百度智能云千帆文档',
        url: 'https://cloud.baidu.com/doc/WENXINWORKSHOP/index.html',
        description: '文心/千帆平台文档，覆盖模型服务、应用开发、知识库、精调和企业场景。',
        tags: ['文心', '千帆', '中文'],
      },
    ],
  },
]

const tocItems = tutorialGroups.map((group) => ({
  id: group.id,
  title: group.title,
  subItems: group.items.slice(0, 5).map((item, idx) => ({
    id: `${group.id}-${idx}`,
    label: item.title,
  })),
}))

export default function LLMTutorialsPage() {
  const total = tutorialGroups.reduce((sum, group) => sum + group.items.length, 0)

  return (
    <>
      <ContentPvBeacon category="resource" slug="bookmarks-llm-tutorials" />
      <RanbiPaywall resourceKey="resource:bookmarks-llm-tutorials" unitLabel="资源">
        <BookmarksTocLayout
          title="大模型教程"
          description={`大语言模型（LLM）教程、官方文档与工程实践资源库。当前版本：${RESOURCE_VERSION}。`}
          tocItems={tocItems}
          footer={<p>当前收录 {total} 个入口。后续新增资源会继续按版本标记，避免资源库失去时间上下文。</p>}
        >
      <div className="mb-5 flex flex-wrap items-center gap-2 text-xs text-[#777] dark:text-gray-400">
        <span className="rounded-full border border-[#d1d3cb] bg-white/70 px-2 py-1 text-[#53554d] dark:border-[#2d3440] dark:bg-[#121821] dark:text-gray-300">
          {RESOURCE_VERSION}
        </span>
        <span>{total} 个资源</span>
        <span aria-hidden="true">·</span>
        <span>官方文档优先，其次课程与工程实践</span>
      </div>

      <div className="space-y-6">
        {tutorialGroups.map((group) => (
          <section
            key={group.id}
            id={group.id}
            className="scroll-mt-24 border border-[#eee] bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
          >
            <header className="border-b border-[#eee] pb-3 dark:border-gray-800">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-[#333] dark:text-gray-100">{group.title}</h2>
                <span className="rounded-full border border-[#d1d3cb] bg-white/70 px-2 py-[1px] text-[11px] text-[#777] dark:border-[#2d3440] dark:bg-[#121821] dark:text-gray-300">
                  {group.items.length}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-[#666] dark:text-gray-300">{group.description}</p>
            </header>

            <div className="mt-4 grid grid-cols-1 gap-4">
              {group.items.map((item, idx) => (
                <article key={item.url} className="rounded-md border border-[#dee0db] bg-[#fafbf9] p-4 dark:border-gray-800 dark:bg-gray-950/50">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      id={`${group.id}-${idx}`}
                      className="scroll-mt-24 text-[15px] font-semibold text-[#333] dark:text-gray-100"
                    >
                      {item.title}
                    </h3>
                    {item.version ? (
                      <span className="rounded-full border border-[#cbd9ee] bg-[#eff4fc] px-2 py-[1px] text-[11px] text-[#3b5b8a] dark:border-[#2a3a55] dark:bg-[#152034] dark:text-[#9bb6df]">
                        {item.version}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#666] dark:text-gray-300">{item.description}</p>

                  <div className="mt-3 text-sm">
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

                  {item.tags?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <span
                          key={`${item.url}-${tag}`}
                          className="inline-flex items-center rounded-full border border-gray-200/70 bg-white/80 px-2 py-0.5 text-xs text-gray-600 dark:border-gray-700/60 dark:bg-gray-900/70 dark:text-gray-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
        </BookmarksTocLayout>
      </RanbiPaywall>
    </>
  )
}
