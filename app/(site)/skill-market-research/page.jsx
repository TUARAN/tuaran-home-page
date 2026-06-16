import Link from 'next/link'

import SharePageButton from '../components/SharePageButton'

export const dynamic = 'force-static'

const PAGE_URL = 'https://2aran.com/skill-market-research'

export const metadata = {
  title: 'Skill 上架、宣发与回流工程调研',
  description:
    '围绕 Codex / Claude / OpenClaw / ClawHub / GitHub / X 的 Skill 制作、上架、宣发与回流路径调研，整理成可执行的多维页面打法。',
  alternates: { canonical: '/skill-market-research' },
  openGraph: {
    type: 'article',
    siteName: '2aran.com',
    title: 'Skill 上架、宣发与回流工程调研',
    description: '一个 Skill 如何从文件变成多维页面：制作、上架、宣发、回流。',
    url: PAGE_URL,
    publishedTime: '2026-06-05T00:00:00.000Z',
    authors: ['涂阿燃 / Tuaran'],
    locale: 'zh_CN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Skill 上架、宣发与回流工程调研',
    description: '一个 Skill 如何从文件变成多维页面：制作、上架、宣发、回流。',
    creator: '@Anthony404',
    site: '@Anthony404',
  },
}

const FUNNEL = [
  ['选题', '高频痛点', '每周重复 3 次以上，AI 经常做不稳，且验收标准能写清。'],
  ['制作', '能力封装', 'SKILL.md 写触发、步骤、输出；复杂能力再补 scripts、references、assets。'],
  ['验证', '可信样本', '准备 5-10 个真实任务，记录成功样本、失败边界和 before / after。'],
  ['上架', '可安装资产', 'GitHub 承接信任，ClawHub / marketplace 承接搜索、版本和安装。'],
  ['宣发', '首发放大', 'X / 社区贴用痛点开头，30 秒 demo、安装命令和源码链接放在一屏内。'],
  ['回流', '持续经营', '跟踪 star、install、issue、用户案例、站点 PV、订阅和咨询线索。'],
]

const ECOSYSTEMS = [
  ['Codex / Claude', '能力运行层', '决定 Skill 的目录约定、触发描述和可组合边界。', 86],
  ['GitHub', '信任层', 'README、stars、issues、release、license 是安装前的审计入口。', 78],
  ['ClawHub', '市场层', '搜索、tag、评论、star、下载和安装命令让 Skill 从文件变成商品。', 72],
  ['X / 社区', '传播层', '痛点叙事、demo、案例复盘和下载数字决定首轮扩散。', 68],
]

const MARKET_MAP = [
  ['官方样板库', '格式权威', 'anthropics/skills、openai/skills', '适合被引用、fork、二次改造。'],
  ['强痛点工具', '效率解法', 'Skills Manager、跨客户端同步', '传播的是“少配一次、少错一次”。'],
  ['方法论封装', '经验产品化', 'review、research、maintenance workflow', '把个人经验变成可执行流程。'],
  ['轻量 prompt 型', '低成本高杠杆', '写作风格、输出规范、审美判断', '不一定要 API，好的 SKILL.md 本身就是产品。'],
  ['Benchmark 型', '结果证明', '公开 eval、案例库、失败样本', '用得分和通过率替代口头承诺。'],
]

const LAUNCH_STACK = [
  ['README.md', '价值主张、安装、demo 截图、示例 prompt、FAQ'],
  ['skills/<name>/SKILL.md', '触发条件、执行步骤、输入输出和验收标准'],
  ['examples/', '真实输入、期望输出、前后对比'],
  ['evals/', '自动或半自动验证脚本'],
  ['CHANGELOG.md', '每次版本的行为变化'],
  ['SECURITY.md', '权限、联网、依赖、隐私和恶意使用边界'],
]

const METRICS = [
  ['触达', 72, 'X impressions / 收藏 / 转发 / 社区贴点击'],
  ['信任', 64, 'GitHub stars / fork / watch / issue 质量'],
  ['安装', 58, 'ClawHub downloads / CLI install / release 下载'],
  ['使用', 46, '用户真实任务 / 失败样本 / 复用频率'],
  ['回流', 39, '站点 PV / newsletter / 社群加入 / 咨询线索'],
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

function SectionTitle({ eyebrow, title, desc }) {
  return (
    <div className="mb-6 max-w-3xl">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#788476] dark:text-[#9ca99a]">{eyebrow}</p>
      <h2 className="mt-2 font-serif text-2xl font-semibold text-[#1b1e19] dark:text-gray-100 md:text-3xl">{title}</h2>
      {desc ? <p className="mt-3 text-sm leading-7 text-[#5c5e56] dark:text-[#aab4c0]">{desc}</p> : null}
    </div>
  )
}

function MiniBar({ value }) {
  return (
    <span className="block h-2 overflow-hidden rounded-full bg-[#dbddd4] dark:bg-[#243140]">
      <span className="block h-full rounded-full bg-[#677963] dark:bg-[#96af91]" style={{ width: `${value}%` }} />
    </span>
  )
}

export default function SkillMarketResearchPage() {
  return (
    <main className="min-h-screen bg-[#f2f3ef] text-[#1c1d18] dark:bg-[#0b1017] dark:text-gray-100">
      <section className="border-b border-[#d7d8cf] bg-[#ebece6] dark:border-[#202938] dark:bg-[#101720]">
        <div className="mx-auto grid w-full max-w-[1120px] gap-8 px-4 py-10 md:grid-cols-[minmax(0,1fr)_320px] md:py-14">
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-2 text-xs text-[#65665c] dark:text-gray-400">
              <Link href="/works" className="underline-offset-4 hover:underline">多维页面</Link>
              <span>/</span>
              <span>Skill 市场调研</span>
            </div>
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#677963] dark:text-[#96af91]">
              Skill Market Research · 2026-06-05
            </p>
            <h1 className="mt-4 max-w-4xl font-serif text-[34px] font-semibold leading-tight text-[#1a1b17] dark:text-gray-100 md:text-[52px]">
              一个 Skill 如何从文件变成多维页面
            </h1>
            <p className="mt-5 max-w-3xl text-[15px] leading-8 text-[#464840] dark:text-gray-300">
              结论很直接：Skill 的竞争不在“提示词写得多漂亮”，而在能否形成一条闭环链路：
              有真实痛点、有可安装资产、有可信样本、有传播材料、有反馈指标。
            </p>
          </div>
          <div className="flex flex-col justify-between gap-5 rounded-2xl border border-[#cbcdc1] bg-white/62 p-5 dark:border-[#293544] dark:bg-white/[0.04]">
            <SharePageButton
              title="Skill 上架、宣发与回流工程调研"
              text="一个 Skill 如何从文件变成多维页面：制作、上架、宣发、回流。"
              url="/skill-market-research"
            />
            <div className="grid grid-cols-2 gap-3">
              {[
                ['4', '生态入口'],
                ['5', '包装类型'],
                ['6', '发布阶段'],
                ['30s', '首发 demo'],
              ].map(([value, label]) => (
                <div key={label} className="border-l border-[#b0b2a3] pl-3 dark:border-[#3b4a5b]">
                  <p className="font-mono text-2xl font-semibold text-[#252722] dark:text-gray-100">{value}</p>
                  <p className="mt-1 text-xs text-[#686a61] dark:text-[#9aa7b8]">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1120px] px-4 py-10">
        <SectionTitle eyebrow="Lifecycle" title="先看链路，不先看卡片" desc="把 Skill 当作一个小型产品：从选题、制作、验证、上架、宣发到回流，每一段都要能交付证据。" />
        <div className="relative grid gap-3 lg:grid-cols-6">
          {FUNNEL.map(([title, label, desc], index) => (
            <article key={title} className="relative rounded-lg border border-[#d3d5cb] bg-white p-4 dark:border-[#293544] dark:bg-[#101820]">
              <p className="font-mono text-[11px] text-[#78796d] dark:text-[#8e9ab0]">{String(index + 1).padStart(2, '0')}</p>
              <h3 className="mt-3 font-serif text-xl font-semibold text-[#1b1e19] dark:text-gray-100">{title}</h3>
              <p className="mt-1 text-xs font-semibold text-[#677963] dark:text-[#96af91]">{label}</p>
              <p className="mt-3 text-sm leading-7 text-[#52534b] dark:text-gray-300">{desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[#d7d8cf] bg-white dark:border-[#202938] dark:bg-[#0f1620]">
        <div className="mx-auto grid w-full max-w-[1120px] gap-8 px-4 py-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <SectionTitle eyebrow="Ecosystem" title="四层生态地图" desc="同一个 Skill 在不同平台承担的职责不同：运行、信任、市场、传播不能混在一起看。" />
            <div className="space-y-4">
              {ECOSYSTEMS.map(([name, role, desc, value]) => (
                <div key={name}>
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[#20211d] dark:text-gray-100">{name}</p>
                    <span className="text-xs text-[#6a6b63] dark:text-[#9aa7b8]">{role}</span>
                  </div>
                  <MiniBar value={value} />
                  <p className="mt-2 text-xs leading-5 text-[#66685f] dark:text-[#9aa7b8]">{desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-[#d3d5cb] bg-[#f2f3ef] p-5 dark:border-[#293544] dark:bg-[#101820]">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#788476] dark:text-[#9ca99a]">Market Map</p>
            <div className="mt-5 grid gap-3">
              {MARKET_MAP.map(([type, axis, examples, point]) => (
                <div key={type} className="grid gap-2 border-b border-[#d6d7cf] pb-3 last:border-b-0 last:pb-0 dark:border-[#263241] sm:grid-cols-[118px_1fr]">
                  <div>
                    <p className="text-sm font-semibold text-[#20211d] dark:text-gray-100">{type}</p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[#78796d] dark:text-[#8e9ab0]">{axis}</p>
                  </div>
                  <div>
                    <p className="text-sm leading-6 text-[#52534b] dark:text-gray-300">{point}</p>
                    <p className="mt-1 text-xs leading-5 text-[#72746a] dark:text-[#9aa7b8]">{examples}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1120px] gap-8 px-4 py-10 lg:grid-cols-[1fr_360px]">
        <div>
          <SectionTitle eyebrow="Launch Desk" title="发布作战台" desc="首发材料要让用户 10 秒内判断：它解决什么问题，怎么安装，源码在哪里，是否值得信任。" />
          <div className="overflow-hidden rounded-2xl border border-[#d3d5cb] bg-white dark:border-[#293544] dark:bg-[#101820]">
            {LAUNCH_STACK.map(([file, desc]) => (
              <div key={file} className="grid gap-2 border-b border-[#dfe0d7] px-4 py-3 last:border-b-0 dark:border-[#263241] sm:grid-cols-[180px_1fr]">
                <code className="font-mono text-[12px] text-[#677963] dark:text-[#96af91]">{file}</code>
                <p className="text-sm leading-6 text-[#52534b] dark:text-gray-300">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl border border-[#c5c7bb] bg-[#ebece6] p-5 dark:border-[#293544] dark:bg-[#101820]">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#788476] dark:text-[#9ca99a]">Launch Copy</p>
            <div className="mt-4 rounded-lg border border-[#d0d1c7] bg-white p-4 font-mono text-[12px] leading-7 text-[#3a3b34] dark:border-[#263241] dark:bg-[#121a24] dark:text-gray-300">
              <p>I built a [task] skill for [agent].</p>
              <p className="mt-3">It turns [repeated painful workflow] into one command: $skill-name.</p>
              <p className="mt-3">Demo / install / source / known limits.</p>
            </div>
          </div>
        </div>
        <aside className="rounded-2xl border border-[#d3d5cb] bg-white p-5 dark:border-[#293544] dark:bg-[#101820]">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#788476] dark:text-[#9ca99a]">Return Radar</p>
          <h2 className="mt-2 font-serif text-2xl font-semibold text-[#1b1e19] dark:text-gray-100">回流指标</h2>
          <div className="mt-5 space-y-4">
            {METRICS.map(([name, value, desc]) => (
              <div key={name}>
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#20211d] dark:text-gray-100">{name}</p>
                  <span className="font-mono text-[11px] text-[#78796d] dark:text-[#8e9ab0]">{value}</span>
                </div>
                <MiniBar value={value} />
                <p className="mt-1 text-xs leading-5 text-[#66685f] dark:text-[#9aa7b8]">{desc}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="border-t border-[#d7d8cf] bg-white dark:border-[#202938] dark:bg-[#0f1620]">
        <div className="mx-auto w-full max-w-[1120px] px-4 py-10">
          <SectionTitle eyebrow="Sources" title="调研来源" desc="来源保留为可继续追踪的入口，后续适合按 GitHub star、下载量、案例数继续补数据。" />
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {SOURCES.map(([name, href]) => (
              <a key={href} href={href} target="_blank" rel="noreferrer" className="rounded-lg border border-[#d3d5cb] bg-[#f2f3ef] px-4 py-3 text-sm text-[#52534b] no-underline transition hover:border-[#acae9f] hover:text-[#4c5e48] dark:border-[#293544] dark:bg-[#101820] dark:text-gray-300 dark:hover:border-[#3c4c5e] dark:hover:text-[#96af91]">
                {name} →
              </a>
            ))}
          </div>
          <p className="mt-6 text-sm leading-7 text-[#52534b] dark:text-gray-300">
            最终判断：Skill 要被当作工程资产经营。单个文件只是起点，真正的护城河来自持续版本、真实案例、可验证边界和稳定分发路径。
          </p>
        </div>
      </section>
    </main>
  )
}
