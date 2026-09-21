import AgentCenterHero from '../components/AgentCenterHero'
import PageContainer from '../components/PageContainer'
import PromptCopyButton, { PromptDetailButton } from './PromptCopyButton'
import { IconMessage2Code } from '@tabler/icons-react'

export const dynamic = 'force-static'

export const metadata = {
  title: 'Prompt 中心',
  description: '面向 AI Agent 的 Prompt 经验与模板中心：从任务定义、上下文组织到输出约束、验证与迭代。',
  keywords: ['Prompt', '提示词工程', 'AI Agent', '智能体', '上下文工程', 'Prompt 模板'],
  alternates: { canonical: '/prompt-center' },
}

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

function Pill({ children }) {
  return <span className="inline-flex rounded-full bg-[#eeefe9] px-2.5 py-1 text-[11px] leading-4 text-[#626653] dark:bg-[#25303a] dark:text-[#c9d6e5]">{children}</span>
}

function PromptCard({ item }) {
  return (
    <article id={item.id} className="flex min-w-0 scroll-mt-28 flex-col rounded-2xl border border-[#d8d9d5] bg-white/80 p-5 transition duration-200 hover:-translate-y-1 hover:border-[#aeb1aa] hover:shadow-[0_14px_34px_rgba(34,31,25,0.10)] dark:border-[#2b333e] dark:bg-[#111821]/80 dark:hover:border-[#4d5967] sm:p-6">
      <header>
        <div className="mb-5 flex items-start justify-between gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#f0e9d9] text-[#8b682c] dark:bg-[#332b1d] dark:text-[#e0cc94]"><IconMessage2Code size={23} stroke={1.7} /></span>
          <Pill>{item.category}</Pill>
        </div>
        <p className="mb-1 truncate font-mono text-[11px] text-[var(--site-faint)]">{item.name}</p>
        <h2 className="mb-2 border-b-0 pb-0 text-xl font-bold leading-snug text-[var(--site-ink)]">{item.title}</h2>
        <p className="mb-4 text-sm leading-6 text-[var(--site-muted)]">{item.desc}</p>
        <Pill>{item.level}</Pill>
      </header>
      <footer className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[#e8e6e0] pt-4 dark:border-[#2a333d]">
        <PromptDetailButton id={item.id} title={item.title} description={item.desc} prompt={item.prompt} />
        <PromptCopyButton prompt={item.prompt} />
      </footer>
    </article>
  )
}

export default function PromptCenterPage() {
  return (
    <PageContainer className="py-6 md:py-10">
      <AgentCenterHero
        current="/prompt-center"
        eyebrow="Prompt · 怎么说"
        title="把任务说清楚，结果才更可靠"
        description="挑选一个适合当前任务的模板，复制后填入自己的目标和资料。每个模板都包含输入边界与可检查的输出要求。"
        shareText="面向 AI Agent 的 Prompt 经验、模板与工程参考。"
        count={PROMPTS.length}
        countLabel="个可复制模板"
        actionLabel="挑选模板"
      />

      <section id="items" className="scroll-mt-28">
        <div className="mb-5">
          <p className="mb-1 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#9a6b2f] dark:text-[#d1aa6c]">Explore prompts</p>
          <h2 className="mb-0 border-b-0 pb-0 text-2xl font-black tracking-tight text-[var(--site-ink)] sm:text-3xl">选择一个任务模板</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {PROMPTS.map((item) => <PromptCard key={item.id} item={item} />)}
        </div>
      </section>
    </PageContainer>
  )
}
