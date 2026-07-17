import AgentCenterHero from '../components/AgentCenterHero'
import PageContainer from '../components/PageContainer'
import PromptCopyButton, { PromptDetailButton } from './PromptCopyButton'

export const dynamic = 'force-static'

export const metadata = {
  title: 'Prompt 中心',
  description: '面向 AI Agent 的 Prompt 经验与模板中心：从任务定义、上下文组织到输出约束、验证与迭代。',
  keywords: ['Prompt', '提示词工程', 'AI Agent', '智能体', '上下文工程', 'Prompt 模板'],
  alternates: { canonical: '/prompt-center' },
}

const PRINCIPLES = [
  { title: '任务说清楚', desc: '先写目标、受众与成功标准，再补语气；避免只丢一句“帮我优化”。', examples: ['目标', '受众', '验收'] },
  { title: '上下文有边界', desc: '用标题或分隔符区分指令、资料与示例，明确哪些内容只作数据处理。', examples: ['背景', '资料', '边界'] },
  { title: '输出可检查', desc: '约定字段、篇幅、格式和禁止项，让结果可以被人或程序直接验收。', examples: ['格式', '约束', '反例'] },
  { title: '复杂任务分阶段', desc: '先分析再产出，关键节点暴露假设与风险，必要时让 Agent 使用工具验证。', examples: ['拆解', '工具', '复核'] },
]

const PROMPTS = [
  {
    id: 'task-brief',
    name: 'task-brief',
    title: '五段式任务简报',
    category: '通用任务',
    level: '入门',
    desc: '用目标、背景、约束、输出与验收五段，把模糊请求改成可执行任务。',
    prompt: `你要完成的任务：\n[写清最终目标]\n\n背景与受众：\n[提供必要上下文，以及结果给谁使用]\n\n约束：\n- [必须遵守的范围、语气、长度或技术限制]\n- 不要：[明确禁止项]\n\n输出格式：\n[列出标题、字段、表格或代码结构]\n\n验收标准：\n1. [可检查标准一]\n2. [可检查标准二]\n\n如果关键信息缺失且会改变结果，先指出缺口；否则做合理假设并明确标注。`,
  },
  {
    id: 'research',
    name: 'evidence-research',
    title: '有证据的专题调研',
    category: '研究分析',
    level: '进阶',
    desc: '把事实、推断和建议分开，降低“资料很多、结论很虚”的问题。',
    prompt: `围绕“[研究问题]”完成一份决策型调研。\n\n范围：\n- 时间：[时间范围]\n- 地区/市场：[范围]\n- 优先来源：官方文档、论文、项目仓库与一手数据\n\n工作方式：\n1. 先定义判断维度和仍待验证的假设。\n2. 搜集证据并记录发布日期，遇到冲突时并列展示。\n3. 明确区分“来源事实”“基于来源的推断”“行动建议”。\n4. 不要用搜索摘要代替原始来源。\n\n输出：执行摘要、关键发现、证据表、风险与未知项、下一步建议。每个关键事实附可访问链接。`,
  },
  {
    id: 'coding',
    name: 'repo-change',
    title: '代码仓库变更',
    category: '研发交付',
    level: '进阶',
    desc: '约束 Agent 先理解现状、保护已有改动，再实现并给出成比例的验证结果。',
    prompt: `请在当前仓库实现：[需求]。\n\n完成标准：\n- [用户能看到或调用到的结果]\n- 保持现有架构、命名和视觉语言。\n- 不覆盖与任务无关的未提交改动。\n\n执行要求：\n1. 先定位入口、数据流、复用组件和现有测试。\n2. 只做满足需求所需的最小完整改动。\n3. 处理加载、空状态、错误状态与响应式行为（适用时）。\n4. 运行与风险相匹配的构建或测试；失败时说明是新问题还是既有问题。\n\n交付时简述结果、改动位置、验证情况和仍存在的边界。`,
  },
  {
    id: 'rewrite',
    name: 'constraint-rewrite',
    title: '保留事实的内容改写',
    category: '内容创作',
    level: '入门',
    desc: '把“润色一下”变成有受众、边界和事实保护的编辑任务。',
    prompt: `请改写下方内容，目标读者是[受众]，使用[语气/平台]风格。\n\n必须保留：人名、数字、日期、链接、核心判断与因果关系。\n可以调整：标题、段落顺序、句式、过渡和重复表达。\n禁止：编造案例、扩大结论、加入原文没有的引语。\n\n输出要求：\n- 标题不超过[字数]字\n- 正文约[字数]字，每段只表达一个重点\n- 最后列出“主要改动”与“需要作者确认的事实”\n\n原文：\n---\n[粘贴原文]\n---`,
  },
  {
    id: 'structured',
    name: 'structured-extraction',
    title: '结构化信息抽取',
    category: '数据处理',
    level: '工程化',
    desc: '先定义 schema 与缺失值策略，适合把文本稳定交给下一段程序。',
    prompt: `从“输入资料”中抽取信息，只输出符合下方结构的 JSON，不要 Markdown。\n\nSchema：\n{\n  "title": "string | null",\n  "date": "YYYY-MM-DD | null",\n  "entities": [{ "name": "string", "type": "person | org | product" }],\n  "claims": [{ "text": "string", "evidence": "原文短句" }]\n}\n\n规则：\n- 不推测缺失信息，缺失时使用 null 或空数组。\n- 日期无法确定到日时填 null，并在 claims 中保留原始表述。\n- evidence 必须能在原文逐字找到。\n\n输入资料：\n<data>\n[粘贴资料]\n</data>`,
  },
  {
    id: 'review',
    name: 'adversarial-review',
    title: '反方审查与修订',
    category: '质量验证',
    level: '进阶',
    desc: '让模型先按风险审查，再只修真正影响结果的问题，避免无意义重写。',
    prompt: `审查下方方案，目标不是挑语病，而是找出会导致决策或执行失败的问题。\n\n依次检查：\n1. 隐含假设是否成立；\n2. 证据能否支撑结论；\n3. 是否遗漏关键角色、成本、依赖或失败路径；\n4. 建议是否具体、可执行、可验证；\n5. 是否存在安全、隐私或权限风险。\n\n先输出最多 5 个高影响问题，按严重度排序，并说明依据。再给出“最小修订版”，只修改与这些问题相关的部分。不要为了显得更完整而扩写。\n\n待审查内容：\n---\n[粘贴方案]\n---`,
  },
]

const REFERENCES = [
  { title: 'Prompt Engineering Guide', source: 'GitHub · DAIR.AI', href: 'https://github.com/dair-ai/Prompt-Engineering-Guide', desc: '从基础提示、RAG 到 Agent 的系统化开放指南。' },
  { title: 'Fabric', source: 'GitHub · danielmiessler', href: 'https://github.com/danielmiessler/fabric', desc: '把可复用 AI 工作模式组织成 patterns，强调真实任务与命令行调用。' },
  { title: 'Awesome ChatGPT Prompts', source: 'GitHub · f', href: 'https://github.com/f/awesome-chatgpt-prompts', desc: '社区提示词集合，适合观察角色、任务和输出结构的表达方式。' },
  { title: 'promptfoo', source: 'GitHub / npm', href: 'https://github.com/promptfoo/promptfoo', desc: '用测试用例、断言和模型对比，把 Prompt 从文案推进到可回归工程。' },
  { title: '@prompt-template/core', source: 'npm', href: 'https://www.npmjs.com/package/@prompt-template/core', desc: '类型安全的变量与嵌套模板设计，适合 TypeScript 项目参考。' },
  { title: '@llms-sdk/prompt', source: 'npm', href: 'https://www.npmjs.com/package/@llms-sdk/prompt', desc: '基于目录约定组织多步骤 Prompt 工作流的工程化示例。' },
]

const REVIEW_RULES = [
  '模板必须有明确适用场景，不能只依赖“扮演专家”一类角色设定。',
  '把资料视作数据而非指令，涉及外部内容时防范 Prompt Injection。',
  '高风险结论要求来源、工具验证或人工确认，不让模型自己给自己背书。',
  'Prompt、模型、参数与测试样例一起版本化；改动后回放代表性用例。',
]

function Pill({ children }) {
  return <span className="inline-flex rounded-sm bg-[#eceae2] px-2 py-0.5 font-mono text-[10px] leading-5 text-[#666653] dark:bg-[#17212d] dark:text-[#c9d6e5]">{children}</span>
}

function PromptCard({ item }) {
  return (
    <article id={item.id} className="flex min-w-0 flex-col py-6">
      <header>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="mb-0.5 truncate font-mono text-[11px] text-[#8b5a1f] dark:text-[#a1ab76]">{item.name}</p>
            <h2 className="mb-1.5 border-b-0 pb-0 font-serif text-xl font-semibold leading-tight text-[#1c1d18] dark:text-gray-100">{item.title}</h2>
            <div className="flex flex-wrap gap-1.5"><Pill>{item.category}</Pill><Pill>{item.level}</Pill><Pill>Agent 可用</Pill></div>
          </div>
          <PromptCopyButton prompt={item.prompt} />
        </div>
        <p className="mb-0 mt-3 text-sm leading-6 text-[#4c4c44] dark:text-gray-300">{item.desc}</p>
      </header>
      <footer className="mt-4">
        <PromptDetailButton id={item.id} title={item.title} description={item.desc} prompt={item.prompt} />
      </footer>
    </article>
  )
}

export default function PromptCenterPage() {
  return (
    <PageContainer className="py-6 md:py-8">
      <AgentCenterHero
        current="/prompt-center"
        eyebrow="Prompt 中心"
        title="把模糊想法写成可执行指令"
        description="Prompt 告诉智能体“这次具体要做什么”。这里不追求万能咒语，而是整理可复制、可验证、能和 Skill、MCP 一起工作的任务模板。"
        shareText="面向 AI Agent 的 Prompt 经验、模板与工程参考。"
      />

      <section className="grid grid-cols-2 gap-x-5 gap-y-7 lg:grid-cols-4">
        {PRINCIPLES.map((item, index) => (
          <article key={item.title} className="min-w-0">
            <span className="mb-3 block font-mono text-[10px] tracking-[0.16em] text-[#a06d2d] dark:text-[#a1ab76]">0{index + 1}</span>
            <h2 className="mb-1 border-b-0 pb-0 text-sm font-semibold text-[#1c1d18] dark:text-gray-100">{item.title}</h2>
            <p className="mb-2 text-xs leading-5 text-[#4c4c44] dark:text-gray-300">{item.desc}</p>
            <div className="flex flex-wrap gap-1">{item.examples.map((example) => <Pill key={example}>{example}</Pill>)}</div>
          </article>
        ))}
      </section>

      <div className="mb-3 mt-6 flex items-center justify-between gap-3">
        <h2 className="mb-0 border-b-0 pb-0 font-serif text-2xl font-semibold text-[#1c1d18] dark:text-gray-100">实用 Prompt 模板</h2>
        <Pill>{PROMPTS.length} 个</Pill>
      </div>
      <section className="divide-y divide-[#d8d7cf] border-y border-[#d8d7cf] dark:divide-[#283443] dark:border-[#283443]">
        {PROMPTS.map((item) => <PromptCard key={item.id} item={item} />)}
      </section>

      <section className="mt-8 bg-[#efede5] px-5 py-6 dark:bg-[#111a24] md:px-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="mb-1 border-b-0 pb-0 font-serif text-xl font-semibold text-[#1c1d18] dark:text-gray-100">GitHub / npm 参考设计</h2>
            <p className="mb-0 text-xs leading-5 text-[#4c4c44] dark:text-gray-300">学习组织方式、版本管理与评测思路；使用前仍需检查许可证、维护状态和数据边界。</p>
          </div>
          <Pill>开放项目</Pill>
        </div>
        <div className="mt-2 grid gap-x-8 md:grid-cols-2 xl:grid-cols-3">
          {REFERENCES.map((item) => (
            <a key={item.href} href={item.href} target="_blank" rel="noreferrer" className="group py-3 text-[#34362e] no-underline hover:!no-underline dark:text-gray-200">
              <span className="block text-sm font-semibold">{item.title} ↗</span>
              <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.08em] text-[#8b5a1f] dark:text-[#a1ab76]">{item.source}</span>
              <span className="mt-2 block text-xs leading-5 text-[#4c4c44] dark:text-gray-300">{item.desc}</span>
            </a>
          ))}
        </div>
      </section>

      <section className="mt-8 px-1 py-2">
        <h2 className="mb-3 border-b-0 pb-0 font-serif text-xl font-semibold text-[#1c1d18] dark:text-gray-100">上架与使用标准</h2>
        <ol className="grid gap-x-5 gap-y-2 md:grid-cols-2">
          {REVIEW_RULES.map((rule, index) => (
            <li key={rule} className="flex gap-2 text-xs leading-5 text-[#43433b] dark:text-gray-300">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e1e2d8] font-mono text-[10px] text-[#545545] dark:bg-[#17212d] dark:text-gray-300">{index + 1}</span>
              <span>{rule}</span>
            </li>
          ))}
        </ol>
      </section>
    </PageContainer>
  )
}
