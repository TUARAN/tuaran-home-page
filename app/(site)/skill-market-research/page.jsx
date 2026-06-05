import Link from 'next/link'

import SharePageButton from '../components/SharePageButton'

export const dynamic = 'force-static'

const PAGE_URL = 'https://2aran.com/skill-market-research'

export const metadata = {
  title: 'Skill 上架、宣发与回流工程调研',
  description:
    '围绕 Codex / Claude / OpenClaw / ClawHub / GitHub / X 的 Skill 制作、上架、宣发与回流路径调研，整理成可执行的工程作品打法。',
  alternates: {
    canonical: '/skill-market-research',
  },
  openGraph: {
    type: 'article',
    siteName: '2aran.com',
    title: 'Skill 上架、宣发与回流工程调研',
    description:
      '从 GitHub、X、ClawHub 与主流 Skill marketplace 观察出发，拆解一个 Skill 如何从文件变成工程作品。',
    url: PAGE_URL,
    publishedTime: '2026-06-05T00:00:00.000Z',
    authors: ['涂阿燃 / Tuaran'],
    locale: 'zh_CN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Skill 上架、宣发与回流工程调研',
    description: '一个 Skill 如何从文件变成工程作品：制作、上架、宣发、回流。',
    creator: '@Anthony404',
    site: '@Anthony404',
  },
}

const ECOSYSTEMS = [
  {
    name: 'Codex / OpenAI',
    role: '能力封装',
    signal: '目录化 SKILL.md，可叠加 scripts / references / assets；description 会影响自动触发。',
    href: 'https://developers.openai.com/codex/skills',
    tone: 'amber',
  },
  {
    name: 'GitHub',
    role: '信任与分发',
    signal: 'README、stars、issues、release、license 构成外部用户判断一个 Skill 是否值得安装的第一入口。',
    href: 'https://github.com/openai/skills',
    tone: 'slate',
  },
  {
    name: 'ClawHub',
    role: '市场与安装',
    signal: '像 npm 一样提供搜索、发布、版本、安装命令、tag、评论、star 与下载信号。',
    href: 'https://clawhub.ai/',
    tone: 'emerald',
  },
  {
    name: 'X / 社交传播',
    role: '首发与放大',
    signal: '主流形式是痛点开头、30 秒 demo、安装命令、GitHub 链接、评论区补案例。',
    href: 'https://x.com/search?q=SKILL.md%20Codex%20skill&src=typed_query',
    tone: 'sky',
  },
]

const MARKET_PATTERNS = [
  {
    title: '官方样板库',
    examples: ['anthropics/skills', 'openai/skills'],
    conclusion: '建立格式权威：目录标准、安装说明、示例清楚，适合被其他项目引用和 fork。',
  },
  {
    title: '强痛点工具',
    examples: ['Skills Manager', '跨 Claude / Codex / Cursor 同步'],
    conclusion: '传播重点不是 Skill 本身，而是解决一类麻烦：重复配置、重复 prompt、重复复制文件。',
  },
  {
    title: '方法论封装',
    examples: ['code maintenance', 'frontend review', 'research workflow'],
    conclusion: '把个人经验写成可执行流程：什么时候触发、看哪些文件、做哪些检查、如何验收。',
  },
  {
    title: '轻量 prompt 型',
    examples: ['写作风格', '审美判断', '输出规范'],
    conclusion: '很多高杠杆 Skill 不需要 API 或 MCP；高质量 SKILL.md 本身就是产品。',
  },
  {
    title: 'Benchmark / 榜单型',
    examples: ['Kaggle 风格任务', '公开 eval'],
    conclusion: '用可量化结果制造可信度：得分、通过率、案例库、失败样本，比口头承诺更能回流。',
  },
]

const RELEASE_FUNNEL = [
  {
    stage: '01',
    title: '选题',
    output: '一句话痛点 + 目标用户 + 高频场景',
    checklist: ['每周至少重复 3 次', 'AI 经常做不稳', '验收标准可写清'],
  },
  {
    stage: '02',
    title: '制作',
    output: '标准 Skill 目录',
    checklist: ['SKILL.md', 'examples/', 'scripts/ 按需', 'references/ 按需'],
  },
  {
    stage: '03',
    title: '验证',
    output: '真实案例和失败样本',
    checklist: ['5-10 个任务样本', '触发测试', '输出对比', '边界说明'],
  },
  {
    stage: '04',
    title: '上架',
    output: 'GitHub + ClawHub / marketplace',
    checklist: ['README', 'release tag', 'license', 'changelog', '安装命令'],
  },
  {
    stage: '05',
    title: '宣发',
    output: 'X thread + demo + 社区贴',
    checklist: ['痛点开头', 'before / after', '动图或截图', '评论区补充安装'],
  },
  {
    stage: '06',
    title: '回流',
    output: '统一落地页和指标面板',
    checklist: ['GitHub star', '下载量', 'issue', '用户案例', '二次传播'],
  },
]

const X_PLAYBOOK = [
  '第一句不要介绍技术栈，先说痛点：这个 Skill 把哪件反复做、反复错的事变成一次调用。',
  '主贴放 20-40 秒 demo，正文只保留三件事：做什么、怎么装、到哪里看源码。',
  'thread 拆成 6 条：痛点、目录结构、触发方式、真实案例、限制、安全说明。',
  '评论区置顶安装命令、GitHub 链接、ClawHub 链接和一个最小 prompt。',
  '第 2-7 天继续发修复记录、用户案例、失败样本和下载 / star 数变化。',
]

const GITHUB_PACKAGE = [
  ['README.md', '价值主张、安装方式、示例 prompt、demo 截图、FAQ。'],
  ['skills/<name>/SKILL.md', '真正的 Skill 主体，写清触发、输入、步骤、输出和验收。'],
  ['examples/', '真实输入、期望输出、前后对比。'],
  ['evals/', '自动或半自动验证脚本，证明它不是一次性 prompt。'],
  ['CHANGELOG.md', '每次版本发布的行为变化。'],
  ['SECURITY.md', '权限、联网、依赖、隐私和恶意使用边界。'],
]

const METRICS = [
  ['触达', 'X impressions、转发、收藏、社区贴点击。'],
  ['信任', 'GitHub stars、watch、fork、issue 质量、PR。'],
  ['安装', 'ClawHub downloads、CLI install、release 下载。'],
  ['使用', '用户贴出的真实任务、失败样本、复用频率。'],
  ['回流', '站点 PV、newsletter 订阅、社群加入、咨询线索。'],
]

const SOURCES = [
  ['OpenAI Codex Skills', 'https://developers.openai.com/codex/skills'],
  ['OpenAI skills GitHub', 'https://github.com/openai/skills'],
  ['Anthropic skills GitHub', 'https://github.com/anthropics/skills'],
  ['ClawHub', 'https://clawhub.ai/'],
  ['openclaw/clawhub', 'https://github.com/openclaw/clawhub'],
  ['Skillta marketplace', 'https://skillta.com/'],
  ['SkillsMP marketplace', 'https://skillsmp.com/'],
  ['ClawHub 安全风险报道', 'https://www.tomshardware.com/tech-industry/cyber-security/malicious-moltbot-skill-targets-crypto-users-on-clawhub'],
]

function ToneBar({ tone }) {
  const toneClass = {
    amber: 'bg-amber-500',
    slate: 'bg-slate-500',
    emerald: 'bg-emerald-500',
    sky: 'bg-sky-500',
  }[tone]

  return <span className={`mt-1 h-10 w-1.5 rounded-full ${toneClass}`} />
}

function Pill({ children }) {
  return (
    <span className="inline-flex rounded-full border border-[#dfd3c2] bg-[#fff8eb] px-2.5 py-1 text-[11px] text-[#725b3d] dark:border-[#334052] dark:bg-[#131d29] dark:text-[#c9d6e5]">
      {children}
    </span>
  )
}

export default function SkillMarketResearchPage() {
  return (
    <main className="min-h-screen bg-[#fbf7ef] text-[#231f18] dark:bg-[#0b1017] dark:text-gray-100">
      <section className="border-b border-[#e8dfd0] bg-[#f6eddf] dark:border-[#202938] dark:bg-[#0f1620]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:py-14">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-[#766958] dark:text-gray-400">
                <Link href="/works" className="underline-offset-4 hover:underline">
                  工程作品
                </Link>
                <span>/</span>
                <span>Skill 市场调研</span>
              </div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#8b5a1f] dark:text-[#f0c776]">
                Skill Market Research · 2026-06-05
              </p>
              <h1 className="mt-3 max-w-4xl font-serif text-[32px] font-semibold leading-tight tracking-normal text-[#201b15] dark:text-gray-100 sm:text-[44px]">
                一个 Skill 如何从文件变成工程作品
              </h1>
              <p className="mt-5 max-w-3xl text-[15px] leading-8 text-[#51483b] dark:text-gray-300">
                调研 Codex、GitHub、ClawHub、X 与第三方 marketplace 的主流做法后，可以把 Skill 的生命周期拆成四件事：
                做成可执行能力，包装成可信开源项目，上架到可安装市场，再通过社交传播与用户案例持续回流。
              </p>
            </div>
            <SharePageButton
              title="Skill 上架、宣发与回流工程调研"
              text="一个 Skill 如何从文件变成工程作品：制作、上架、宣发、回流。"
              url="/skill-market-research"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            {[
              ['生态入口', 'Codex / Claude / OpenClaw'],
              ['分发阵地', 'GitHub + ClawHub'],
              ['宣发阵地', 'X + 社区 + awesome list'],
              ['回流目标', 'star / install / issue / lead'],
            ].map(([label, value]) => (
              <div key={label} className="border-l-2 border-[#cbb796] bg-white/55 px-4 py-3 dark:border-[#334052] dark:bg-white/[0.04]">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8f8069] dark:text-[#8e9ab0]">
                  {label}
                </p>
                <p className="mt-1 text-sm font-semibold text-[#2b251d] dark:text-gray-100">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8f8069] dark:text-[#8e9ab0]">
              Ecosystem
            </p>
            <h2 className="mt-1 font-serif text-2xl font-semibold text-[#221f19] dark:text-gray-100">
              四个入口，各自承担不同职责
            </h2>
          </div>
          <Pill>调研口径：公开资料 + 社交发布样式 + marketplace 页面</Pill>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {ECOSYSTEMS.map((item) => (
            <a
              key={item.name}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className="flex gap-4 rounded-lg border border-[#e4d9c8] bg-white p-5 no-underline transition hover:border-[#cbb796] hover:shadow-[0_8px_28px_rgba(63,53,39,0.08)] dark:border-[#283443] dark:bg-[#101820] dark:hover:border-[#3a4a5d]"
            >
              <ToneBar tone={item.tone} />
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#8b5a1f] dark:text-[#f0c776]">
                  {item.role}
                </p>
                <h3 className="mt-1 font-serif text-xl font-semibold text-[#231f18] dark:text-gray-100">
                  {item.name}
                </h3>
                <p className="mt-2 text-sm leading-7 text-[#5c5144] dark:text-gray-300">{item.signal}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="border-y border-[#e8dfd0] bg-white dark:border-[#202938] dark:bg-[#0f1620]">
        <div className="mx-auto w-full max-w-6xl px-4 py-8">
          <div className="mb-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8f8069] dark:text-[#8e9ab0]">
              Popular Patterns
            </p>
            <h2 className="mt-1 font-serif text-2xl font-semibold text-[#221f19] dark:text-gray-100">
              热门 Skill 的五种包装方式
            </h2>
          </div>

          <div className="grid gap-3 lg:grid-cols-5">
            {MARKET_PATTERNS.map((pattern, index) => (
              <article
                key={pattern.title}
                className="rounded-lg border border-[#e4d9c8] bg-[#fdfaf5] p-4 dark:border-[#283443] dark:bg-[#121a24]"
              >
                <p className="font-mono text-[10px] text-[#8f8069] dark:text-[#8e9ab0]">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className="mt-2 font-serif text-lg font-semibold leading-tight text-[#231f18] dark:text-gray-100">
                  {pattern.title}
                </h3>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {pattern.examples.map((example) => (
                    <Pill key={example}>{example}</Pill>
                  ))}
                </div>
                <p className="mt-3 text-sm leading-7 text-[#5c5144] dark:text-gray-300">
                  {pattern.conclusion}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="mb-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8f8069] dark:text-[#8e9ab0]">
            Release Funnel
          </p>
          <h2 className="mt-1 font-serif text-2xl font-semibold text-[#221f19] dark:text-gray-100">
            从制作到回流的六段工程漏斗
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {RELEASE_FUNNEL.map((step) => (
            <article
              key={step.stage}
              className="rounded-lg border border-[#e4d9c8] bg-white p-5 dark:border-[#283443] dark:bg-[#101820]"
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-mono text-[11px] text-[#8f8069] dark:text-[#8e9ab0]">{step.stage}</p>
                <Pill>{step.output}</Pill>
              </div>
              <h3 className="mt-2 font-serif text-xl font-semibold text-[#231f18] dark:text-gray-100">
                {step.title}
              </h3>
              <ul className="mt-4 space-y-2">
                {step.checklist.map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-6 text-[#5c5144] dark:text-gray-300">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#a16207] dark:bg-[#f0c776]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[#e8dfd0] bg-[#f6eddf] dark:border-[#202938] dark:bg-[#0f1620]">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8f8069] dark:text-[#8e9ab0]">
              X Launch Playbook
            </p>
            <h2 className="mt-1 font-serif text-2xl font-semibold text-[#221f19] dark:text-gray-100">
              X 上更容易传播的写法
            </h2>
            <ol className="mt-5 space-y-3">
              {X_PLAYBOOK.map((item, index) => (
                <li key={item} className="flex gap-3 rounded-lg bg-white/70 p-4 text-sm leading-7 text-[#51483b] dark:bg-white/[0.04] dark:text-gray-300">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e8d8bd] font-mono text-[11px] text-[#6f5e45] dark:bg-[#1a2533] dark:text-gray-300">
                    {index + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-lg border border-[#d8c8ad] bg-white p-5 dark:border-[#283443] dark:bg-[#101820]">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8f8069] dark:text-[#8e9ab0]">
              Launch Copy
            </p>
            <h3 className="mt-1 font-serif text-xl font-semibold text-[#231f18] dark:text-gray-100">
              首发文案骨架
            </h3>
            <div className="mt-4 rounded-md border border-[#eee4d5] bg-[#fdfaf5] p-4 font-mono text-[12px] leading-7 text-[#463b2c] dark:border-[#263241] dark:bg-[#121a24] dark:text-gray-300">
              <p>I built a [task] skill for [agent].</p>
              <p className="mt-3">It turns [repeated painful workflow] into one command: $skill-name.</p>
              <p className="mt-3">What it does: ...</p>
              <p>Install: clawhub install ...</p>
              <p>Source: github.com/...</p>
            </div>
            <p className="mt-4 text-sm leading-7 text-[#5c5144] dark:text-gray-300">
              首发不是功能说明书，重点是让用户在 10 秒内判断：它是否解决我真实遇到的问题，是否值得安装，是否有源码可审计。
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 lg:grid-cols-2">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8f8069] dark:text-[#8e9ab0]">
            GitHub Package
          </p>
          <h2 className="mt-1 font-serif text-2xl font-semibold text-[#221f19] dark:text-gray-100">
            仓库要像一个小型开源产品
          </h2>
          <div className="mt-5 overflow-hidden rounded-lg border border-[#e4d9c8] bg-white dark:border-[#283443] dark:bg-[#101820]">
            {GITHUB_PACKAGE.map(([file, desc]) => (
              <div key={file} className="grid gap-2 border-b border-[#eee4d5] px-4 py-3 last:border-b-0 dark:border-[#263241] sm:grid-cols-[180px_1fr]">
                <code className="font-mono text-[12px] text-[#8b5a1f] dark:text-[#f0c776]">{file}</code>
                <p className="text-sm leading-6 text-[#5c5144] dark:text-gray-300">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8f8069] dark:text-[#8e9ab0]">
            Return Metrics
          </p>
          <h2 className="mt-1 font-serif text-2xl font-semibold text-[#221f19] dark:text-gray-100">
            回流不要只看发布当天
          </h2>
          <div className="mt-5 grid gap-3">
            {METRICS.map(([name, desc]) => (
              <div key={name} className="rounded-lg border border-[#e4d9c8] bg-white p-4 dark:border-[#283443] dark:bg-[#101820]">
                <h3 className="font-serif text-lg font-semibold text-[#231f18] dark:text-gray-100">{name}</h3>
                <p className="mt-1 text-sm leading-7 text-[#5c5144] dark:text-gray-300">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[#e8dfd0] bg-white dark:border-[#202938] dark:bg-[#0f1620]">
        <div className="mx-auto w-full max-w-6xl px-4 py-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8f8069] dark:text-[#8e9ab0]">
            Sources
          </p>
          <h2 className="mt-1 font-serif text-2xl font-semibold text-[#221f19] dark:text-gray-100">
            调研来源
          </h2>
          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {SOURCES.map(([name, href]) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-[#e4d9c8] bg-[#fdfaf5] px-4 py-3 text-sm text-[#5c5144] no-underline transition hover:border-[#cbb796] hover:text-[#8b5a1f] dark:border-[#283443] dark:bg-[#121a24] dark:text-gray-300 dark:hover:border-[#3a4a5d] dark:hover:text-[#f0c776]"
              >
                {name} →
              </a>
            ))}
          </div>
          <p className="mt-6 text-sm leading-7 text-[#5c5144] dark:text-gray-300">
            结论：Skill 的机会不在于把提示词另存为文件，而在于把可复用工作能力做成有版本、有验证、有安装路径、有传播材料、有用户反馈闭环的工程资产。
          </p>
        </div>
      </section>
    </main>
  )
}
