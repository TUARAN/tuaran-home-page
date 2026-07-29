'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  IconArrowRight,
  IconBrandGithub,
  IconCheck,
  IconChevronDown,
  IconExternalLink,
  IconGitBranch,
  IconPlayerPlay,
  IconShieldCheck,
  IconSparkles,
} from '@tabler/icons-react'

import SharePageButton from '../components/SharePageButton'
import styles from './workbuddy-harness.module.css'

const PAGE_URL = 'https://2aran.com/workbuddy-harness'
const REPO_URL = 'https://github.com/zhuang-HE/workbuddy-harness'

const DIMENSIONS = [
  { id: 'D1', name: '身份', plugin: 'context-awareness', score: 60, group: '认知底座', note: '识别环境、项目与时间，让 Agent 知道自己正处在什么场景。' },
  { id: 'D2', name: '记忆', plugin: 'memory-decay · memory-git · memory-graph', score: 70, group: '认知底座', note: '用衰减、压缩、版本和关系图管理跨会话信息。' },
  { id: 'D3', name: '技能', plugin: 'skill-analyzer', score: 50, group: '认知底座', note: '分析技能质量、依赖关系和循环引用。' },
  { id: 'D4', name: '学习', plugin: 'learning-loop', score: 55, group: '认知底座', note: '把观察、行动、学习和评估组织成反馈闭环。' },
  { id: 'D5', name: '调度', plugin: 'task-orchestrator', score: 60, group: '行动系统', note: '把目标拆成 DAG，用优先队列、并发池和重试策略推动执行。' },
  { id: 'D6', name: '融合', plugin: 'fusion-router · fusion-sync-enhancer', score: 45, group: '行动系统', note: '负责领域路由、增量同步与冲突处理。' },
  { id: 'D7', name: '安全', plugin: 'runtime-guardian', score: 35, group: '治理闭环', note: '在工具调用前扫描高风险命令，并把告警持久化。' },
  { id: 'D8', name: '评测', plugin: 'eval-framework · eval-runner', score: 65, group: '治理闭环', note: '执行基准用例，保存结果，再做基线与回归比较。' },
  { id: 'D9', name: '协作', plugin: 'multi-agent-orchestrator', score: 50, group: '治理闭环', note: '用角色、团队模板与能力矩阵组织多个 Agent。' },
]

const PIPELINE = [
  ['01', '事件进入', '会话启动、提示提交、工具调用或文件变化'],
  ['02', 'HookRunner 匹配', '读取 hooks.json，检查事件类型和条件'],
  ['03', '模板解析', '把 session_id、tool_name 等运行变量注入参数'],
  ['04', '插件执行', '调度记忆、安全、学习或评测模块'],
  ['05', '留下记录', '结果、日志、告警与评测数据回到文件系统'],
]

const READINGS = [
  {
    title: '它不是一个更聪明的模型',
    body: 'WorkBuddy Harness 不负责生成下一个 token。它处在模型外部，管理事件、状态、工具调用和反馈。模型能力不变，但工作方式会变得更稳定。',
  },
  {
    title: '它也不只是 Prompt 合集',
    body: 'Prompt 只能告诉模型“应该怎么做”，Harness 则可以在运行时触发检查、阻断动作、保存记录和执行评测。前者是建议，后者更接近制度。',
  },
  {
    title: '它更像 Agent 的操作系统外壳',
    body: '身份、记忆、任务、权限、监控、评测都被放进同一层基础设施。这个类比并不严格，但足以说明它解决的是运行问题，而不是聊天问题。',
  },
]

const LIMITS = [
  ['数字口径还在变化', '仓库简介写“11 个插件、21 个 Hooks”，README 正文又出现 12 个核心插件、13 个插件目录和 17 个 Hooks。阅读时应以具体目录与配置为准，不必死记宣传数字。'],
  ['成熟度来自项目自评', '九维分数为仓库 README 的代码审查结果，不是第三方审计。它适合用来观察作者认为哪里薄弱，不适合当作行业基准。'],
  ['安全扫描不等于沙箱', '危险命令识别是重要的前置防线，但它不能替代操作系统权限、隔离环境、人工审批与可回滚机制。规则匹配永远会有漏网项。'],
  ['评测分数要看题目', '“95/100”只有在了解 30 条用例、评分逻辑和运行环境后才有意义。它证明评测链路能跑，并不直接证明 Agent 已达到生产级。'],
  ['框架完整不等于平台成熟', '项目已经具备 Engine、Plugins、Hooks、Dashboard 的分层，但生产系统还要处理身份鉴权、资源隔离、并发一致性、可观测性与长期运维。'],
]

const FAQ = [
  ['这个项目最值得看的部分是什么？', '首先看 engine/。v2.0 的关键不是又增加了几个插件，而是补上 HookRunner、EvalRunner、Daemon 和统一 CLI，让配置开始进入真实执行链路。'],
  ['可以把它直接接到任何 Agent 上吗？', '不能简单理解成“即插即用”。它使用 CommonJS 和 Node.js 标准库，迁移成本不高，但事件名称、目录约定、工具协议和宿主环境仍需要适配。'],
  ['为什么记忆层最成熟？', 'README 给 D2 的自评分最高，为 70%。这也符合 Agent 工程的现实：文件持久化、版本管理和衰减算法相对容易独立实现，比安全治理和跨 Agent 协作更容易形成闭环。'],
  ['它适合用来做什么？', '适合当作 Agent 基础设施的参考实现、内部原型或插件实验场。若要进入生产环境，建议逐层替换自评口径，补上外部测试、权限隔离和真实业务负载验证。'],
]

function DimensionCard({ item, active, onClick }) {
  return (
    <button
      type="button"
      className={`${styles.dimensionCard} ${active ? styles.dimensionCardActive : ''}`}
      onClick={onClick}
      aria-pressed={active}
    >
      <span className={styles.dimensionId}>{item.id}</span>
      <span className={styles.dimensionName}>{item.name}</span>
      <span className={styles.dimensionPlugin}>{item.plugin}</span>
      <span className={styles.scoreTrack} aria-label={`项目自评成熟度 ${item.score}%`}>
        <span style={{ width: `${item.score}%` }} />
      </span>
      <span className={styles.scoreText}>项目自评 {item.score}%</span>
    </button>
  )
}

export default function WorkBuddyHarnessClient() {
  const [activeDimension, setActiveDimension] = useState('D2')
  const [openFaq, setOpenFaq] = useState(0)
  const active = DIMENSIONS.find((item) => item.id === activeDimension)

  return (
    <main className={styles.page}>
      <div className={styles.ambient} aria-hidden="true" />

      <section className={styles.hero}>
        <div className={styles.heroGrid} aria-hidden="true" />
        <div className={styles.shell}>
          <nav className={styles.crumbs} aria-label="面包屑">
            <Link href="/articles">知识库</Link><span>/</span><Link href="/works">作品展厅</Link><span>/</span><span>WorkBuddy Harness</span>
          </nav>

          <div className={styles.heroLayout}>
            <div>
              <div className={styles.eyebrow}><IconSparkles size={14} /> Open-source agent infrastructure · 2026</div>
              <h1>模型负责思考，<br /><em>Harness 负责让它好好工作。</em></h1>
              <p className={styles.lead}>
                WorkBuddy Harness 试图给 AI Agent 补上一套运行制度：它要有身份、能记忆、会调度、受约束，还要留下可以复盘的评测结果。
              </p>
              <div className={styles.heroActions}>
                <a className={styles.primaryButton} href={REPO_URL} target="_blank" rel="noreferrer">
                  <IconBrandGithub size={18} /> 查看仓库 <IconExternalLink size={15} />
                </a>
                <a className={styles.textButton} href="#architecture">读懂九维架构 <IconArrowRight size={16} /></a>
                <SharePageButton title="WorkBuddy Harness：给 AI Agent 补上一套运行制度" text="九维基础设施、运行引擎与工程边界，一页讲清。" url={PAGE_URL} size="sm" />
              </div>
            </div>

            <div className={styles.heroPanel} aria-label="项目结构概览">
              <div className={styles.panelTop}><span>HARNESS / RUNTIME</span><span className={styles.liveDot}>v2.0</span></div>
              <div className={styles.runtimeCore}>
                <span>MODEL</span>
                <strong>ENGINE</strong>
                <small>HookRunner · EvalRunner · Daemon · Guardian</small>
              </div>
              <div className={styles.orbitGrid}>
                {DIMENSIONS.map((item) => <span key={item.id}>{item.id} {item.name}</span>)}
              </div>
              <div className={styles.panelFoot}>事件 → 条件 → 插件 → 记录 → 反馈</div>
            </div>
          </div>

          <div className={styles.stats}>
            <div><strong>9</strong><span>架构维度</span></div>
            <div><strong>5</strong><span>Engine 模块</span></div>
            <div><strong>30</strong><span>基准用例</span></div>
            <div><strong>42</strong><span>危险模式</span></div>
          </div>
          <p className={styles.snapshot}>数据来自仓库 README，核对日期：2026-07-16。项目仍在演进，数字以仓库最新版本为准。</p>
        </div>
      </section>

      <section className={styles.section} id="what-is-harness">
        <div className={styles.shell}>
          <div className={styles.sectionHeading}>
            <span>01 / 先说概念</span>
            <h2>Harness 到底是什么？</h2>
            <p>如果把大模型看作大脑，Harness 就是神经系统、工作台和规章制度的组合。</p>
          </div>
          <div className={styles.readingGrid}>
            {READINGS.map((item, index) => (
              <article key={item.title} className={styles.readingCard}>
                <span>0{index + 1}</span><h3>{item.title}</h3><p>{item.body}</p>
              </article>
            ))}
          </div>
          <div className={styles.comparison}>
            <div><span>模型</span><strong>决定能力上限</strong><p>理解、推理与生成</p></div>
            <b>+</b>
            <div><span>工具</span><strong>决定可执行动作</strong><p>读文件、写代码、调用服务</p></div>
            <b>+</b>
            <div className={styles.comparisonAccent}><span>Harness</span><strong>决定工作可靠性</strong><p>状态、流程、权限、评测与反馈</p></div>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.darkSection}`} id="engine">
        <div className={styles.shell}>
          <div className={styles.sectionHeading}>
            <span>02 / 真正的 v2.0</span>
            <h2>最重要的升级，不是插件更多，而是配置终于会跑。</h2>
            <p>早期版本已经有 hooks.json，但缺少统一执行引擎。v2.0 新增 engine/，把“写在纸上的自动化”接进运行时。</p>
          </div>
          <ol className={styles.pipeline}>
            {PIPELINE.map(([id, title, body], index) => (
              <li key={id}>
                <span className={styles.pipelineId}>{id}</span>
                <div><strong>{title}</strong><p>{body}</p></div>
                {index < PIPELINE.length - 1 ? <IconArrowRight className={styles.pipelineArrow} size={18} aria-hidden="true" /> : null}
              </li>
            ))}
          </ol>
          <div className={styles.codeWindow}>
            <div className={styles.codeTop}><span /><span /><span /><b>统一 CLI</b></div>
            <pre><code>{`# 查看整体健康状态\nnode engine/index.js health\n\n# 触发会话启动事件\nnode engine/index.js hook trigger session_start session_id=test\n\n# 跑完 30 条基准用例\nnode engine/index.js eval run all\n\n# 在执行前扫描危险命令\nnode engine/index.js guardian scan "rm -rf /"`}</code></pre>
          </div>
          <p className={styles.callout}><IconPlayerPlay size={18} /> 这一步让 WorkBuddy Harness 从“架构蓝图”跨进“可运行原型”。这是理解整个仓库的关键。</p>
        </div>
      </section>

      <section className={styles.section} id="architecture">
        <div className={styles.shell}>
          <div className={styles.sectionHeading}>
            <span>03 / 九维地图</span>
            <h2>一个 Agent，要补齐 9 类基础能力。</h2>
            <p>点击任一维度查看解释。成熟度为项目 README 的自评分，不是第三方测评。</p>
          </div>
          <div className={styles.architectureLayout}>
            <div className={styles.dimensionGrid}>
              {DIMENSIONS.map((item) => (
                <DimensionCard key={item.id} item={item} active={item.id === activeDimension} onClick={() => setActiveDimension(item.id)} />
              ))}
            </div>
            <aside className={styles.dimensionDetail} aria-live="polite">
              <span>{active.group} · {active.id}</span>
              <h3>{active.name}层</h3>
              <p>{active.note}</p>
              <div><small>对应模块</small><code>{active.plugin}</code></div>
              <div><small>项目自评成熟度</small><strong>{active.score}%</strong></div>
            </aside>
          </div>
          <div className={styles.layerReading}>
            <div><b>认知底座</b><p>D1—D4 解决“我是谁、记住什么、会做什么、如何变好”。</p></div>
            <div><b>行动系统</b><p>D5—D6 解决“任务怎么拆、能力怎么路由、状态怎么同步”。</p></div>
            <div><b>治理闭环</b><p>D7—D9 解决“什么不能做、做得怎样、多人怎么协作”。</p></div>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.softSection}`} id="deep-dive">
        <div className={styles.shell}>
          <div className={styles.sectionHeading}>
            <span>04 / 四个值得看的设计</span>
            <h2>这个仓库的价值，在于把抽象概念落成模块。</h2>
          </div>
          <div className={styles.featureGrid}>
            <article>
              <span className={styles.featureIcon}><IconGitBranch size={22} /></span>
              <small>MEMORY</small><h3>记忆不是越多越好</h3>
              <p>memory-decay 用衰减处理信息价值，memory-git 记录版本，memory-graph 保存关系。三者组合后，记忆才不只是不断膨胀的文本文件。</p>
            </article>
            <article>
              <span className={styles.featureIcon}><IconShieldCheck size={22} /></span>
              <small>GUARDIAN</small><h3>安全检查要发生在动作之前</h3>
              <p>Runtime Guardian 把 Unix 与 Windows 危险模式放进 pre-tool 阶段。即使规则并不完美，治理位置是对的：先判断，再执行。</p>
            </article>
            <article>
              <span className={styles.featureIcon}><IconCheck size={22} /></span>
              <small>EVAL</small><h3>从“感觉不错”走向可回归</h3>
              <p>EvalRunner 读取 30 条用例，保存分数，再与基线比较。真正重要的不是某次拿了多少分，而是每次修改后能否发现退步。</p>
            </article>
            <article>
              <span className={styles.featureIcon}><IconSparkles size={22} /></span>
              <small>ORCHESTRATION</small><h3>多 Agent 先从角色和依赖开始</h3>
              <p>项目提供团队模板、角色与能力矩阵。它还不是完整的分布式调度平台，但已经把“叫来几个 Agent”推进到“谁负责什么”。</p>
            </article>
          </div>
        </div>
      </section>

      <section className={styles.section} id="judgement">
        <div className={styles.shell}>
          <div className={styles.sectionHeading}>
            <span>05 / 工程判断</span>
            <h2>值得参考，但不要把“框架完整”误读成“已经生产可用”。</h2>
            <p>一个技术项目最有价值的介绍，不只是列优点，还要告诉读者边界在哪里。</p>
          </div>
          <div className={styles.limitList}>
            {LIMITS.map(([title, body], index) => (
              <article key={title}><span>{String(index + 1).padStart(2, '0')}</span><div><h3>{title}</h3><p>{body}</p></div></article>
            ))}
          </div>
          <div className={styles.verdict}>
            <span>我的判断</span>
            <blockquote>WorkBuddy Harness 最适合被看作一份“Agent 基础设施参考实现”：它的意义不是替你造出万能智能体，而是展示模型之外还要补哪些工程层。</blockquote>
            <p>对于个人开发者，它是一张可执行的检查清单。对于团队，它可以作为内部 Harness 的原型。对于生产系统，它仍然需要更严格的权限、隔离、观测和外部评测。</p>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.darkSection}`} id="who">
        <div className={styles.shell}>
          <div className={styles.sectionHeading}>
            <span>06 / 谁应该关注</span><h2>当 Agent 开始长期工作，Harness 就会从“可选项”变成“必需品”。</h2>
          </div>
          <div className={styles.audienceGrid}>
            <div><strong>01</strong><h3>正在做 Coding Agent</h3><p>需要统一工具前置检查、任务记录和回归评测。</p></div>
            <div><strong>02</strong><h3>正在搭多 Agent 团队</h3><p>需要从角色名称继续走向依赖、调度和协作规则。</p></div>
            <div><strong>03</strong><h3>正在治理企业 Agent</h3><p>需要先建立安全、审计和可观察的基础意识。</p></div>
          </div>
          <div className={styles.finalCta}>
            <div><small>THE REPOSITORY</small><h2>先看 Engine，再看九维插件。</h2><p>这样更容易分清哪些已经进入执行链路，哪些仍然是设计方向。</p></div>
            <a href={REPO_URL} target="_blank" rel="noreferrer"><IconBrandGithub size={20} /> 打开 workbuddy-harness <IconArrowRight size={17} /></a>
          </div>
        </div>
      </section>

      <section className={styles.section} id="faq">
        <div className={styles.shell}>
          <div className={styles.sectionHeading}><span>07 / 常见问题</span><h2>读完以后，可能还会问。</h2></div>
          <div className={styles.faqList}>
            {FAQ.map(([question, answer], index) => {
              const opened = openFaq === index
              return (
                <div key={question} className={styles.faqItem}>
                  <button type="button" onClick={() => setOpenFaq(opened ? -1 : index)} aria-expanded={opened}>
                    <span>{question}</span><IconChevronDown size={20} className={opened ? styles.rotate : ''} />
                  </button>
                  {opened ? <p>{answer}</p> : null}
                </div>
              )
            })}
          </div>
          <div className={styles.sources}>
            <span>资料来源</span>
            <a href={`${REPO_URL}#readme`} target="_blank" rel="noreferrer">项目 README <IconExternalLink size={13} /></a>
            <a href={`${REPO_URL}/tree/master/engine`} target="_blank" rel="noreferrer">Engine 目录 <IconExternalLink size={13} /></a>
            <a href={`${REPO_URL}/tree/master/plugins`} target="_blank" rel="noreferrer">Plugins 目录 <IconExternalLink size={13} /></a>
            <a href={`${REPO_URL}/tree/master/benchmarks`} target="_blank" rel="noreferrer">Benchmarks 目录 <IconExternalLink size={13} /></a>
          </div>
        </div>
      </section>
    </main>
  )
}
