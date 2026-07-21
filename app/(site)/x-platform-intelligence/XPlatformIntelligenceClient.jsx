'use client'

import { useCallback, useMemo, useState } from 'react'
import {
  IconArrowRight as ArrowRight,
  IconCheck as Check,
  IconChevronRight as ChevronRight,
  IconAlertCircle as CircleAlert,
  IconWorld as Globe2,
  IconBroadcast as Radio,
  IconShieldCheck as ShieldCheck,
  IconSparkles as Sparkles,
  IconUsers as Users,
} from '@tabler/icons-react'

import SharePageButton from '../components/SharePageButton'
import { X_INTELLIGENCE_REPOSITORY as repository } from './data.mjs'
import { DEFAULT_FILTERS } from './filters.mjs'
import { getEvidenceBundle } from './model.mjs'
import { selectEvidenceRows } from './selectors.mjs'
import EvidenceDrawer from './components/EvidenceDrawer'
import EvidenceLedger from './components/EvidenceLedger'

const PAGE_URL = 'https://2aran.com/x-platform-intelligence'

const LENSES = [
  {
    id: 'influence',
    label: '建立影响力',
    eyebrow: '适合',
    title: '用观点进入全球科技对话',
    summary: '围绕发布、行业变化和争议给出快速判断。X 的价值不只是曝光，而是让观点进入公开回复、引用和转帖形成的关系链。',
    actions: ['优先发布有明确判断的短内容', '在事件发生后的窗口期参与讨论', '主动回复同行，而不是只等自然推荐'],
    evidenceId: 'x-creator-fit-primary',
  },
  {
    id: 'relationships',
    label: '连接同行',
    eyebrow: '最值得投入',
    title: '把账号当作公开关系网络',
    summary: '技术创作者真正稀缺的不是再多一个内容仓库，而是与开发者、创始人和研究者产生持续公开互动的场所。',
    actions: ['建立 30–50 个核心同行关注列表', '用回复补充事实、经验或反例', '把高质量对话沉淀成后续内容'],
    evidenceId: 'x-relationship-propagation',
  },
  {
    id: 'conversion',
    label: '业务转化',
    eyebrow: '需要组合',
    title: '在 X 建立信任，在自有阵地完成转化',
    summary: '外链路径存在，但平台没有为稳定长尾流量或站内交易闭环提供足够证据。产品、通讯和社群仍应由自己的落地页承接。',
    actions: ['主页只保留一个清晰的主行动', '内容先提供价值，再给出自然延伸', '用网站或邮件列表保存可迁移关系'],
    evidenceId: 'x-monetization-external-conversion',
  },
]

const OPERATING_STEPS = [
  {
    number: '01',
    label: 'Signal',
    title: '发出信号',
    copy: '每周 2–3 条原创判断：一个事实、一个立场、一个可以继续讨论的问题。',
    meta: '原创内容 · 30%',
  },
  {
    number: '02',
    label: 'Conversation',
    title: '进入对话',
    copy: '围绕同行内容补充案例、数据与反例。高质量回复本身就是内容，也是关系的起点。',
    meta: '回复与引用 · 50%',
  },
  {
    number: '03',
    label: 'Compound',
    title: '带回阵地',
    copy: '把一周里验证过的观点扩写成文章、产品说明或通讯，再把完整版本带回自有渠道。',
    meta: '沉淀与转化 · 20%',
  },
]

const PORTFOLIO = [
  { id: 'x', name: 'X', role: '发现与关系', accent: 'bg-[#181818] text-white', insightId: 'x-creator-fit-primary' },
  { id: 'linkedin', name: 'LinkedIn', role: '职业信用', accent: 'bg-[#2867b2] text-white', insightId: 'linkedin-professional-graph' },
  { id: 'reddit', name: 'Reddit', role: '主题社区', accent: 'bg-[#ff4500] text-white', insightId: 'reddit-community-depth' },
  { id: 'wechat-oa', name: '公众号', role: '自有受众', accent: 'bg-[#07c160] text-white', insightId: 'wechat-oa-owned-audience' },
]

const GEO_ROWS = [
  { name: '日本', value: 65.2, observationId: 'x-japan-internet-penetration-2025-01' },
  { name: '英国', value: 33.7, observationId: 'x-uk-internet-penetration-2025-01' },
  { name: '美国', value: 32.2, observationId: 'x-us-internet-penetration-2025-01' },
]

function EvidenceLink({ kind = 'insight', id, children, onOpen, className = '' }) {
  return (
    <button
      type="button"
      onClick={() => onOpen({ kind, id })}
      className={`group inline-flex items-center gap-1.5 text-left underline decoration-black/25 underline-offset-4 transition hover:decoration-black dark:decoration-white/25 dark:hover:decoration-white ${className}`}
    >
      {children}
      <ChevronRight size={14} strokeWidth={1.7} className="transition-transform group-hover:translate-x-0.5" />
    </button>
  )
}

function SectionIntro({ index, eyebrow, title, description }) {
  return (
    <div className="grid gap-5 border-t border-black/15 pt-5 dark:border-white/15 lg:grid-cols-[9rem_1fr_1fr] lg:items-start">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#807b70] dark:text-gray-500">{index} / {eyebrow}</p>
      <h2 className="font-serif text-[28px] font-semibold leading-tight text-[#191917] dark:text-gray-100 sm:text-[36px]">{title}</h2>
      <p className="max-w-xl text-sm leading-7 text-[#625f57] dark:text-gray-400">{description}</p>
    </div>
  )
}

export default function XPlatformIntelligenceClient() {
  const [activeLens, setActiveLens] = useState('influence')
  const [evidenceRef, setEvidenceRef] = useState(null)
  const insightById = useMemo(() => new Map(repository.insights.map((item) => [item.id, item])), [])
  const active = LENSES.find((item) => item.id === activeLens) || LENSES[0]
  const evidenceBundle = useMemo(() => evidenceRef ? getEvidenceBundle(repository, evidenceRef) : null, [evidenceRef])
  const evidenceRows = useMemo(() => selectEvidenceRows(repository, DEFAULT_FILTERS), [])
  const closeEvidence = useCallback(() => setEvidenceRef(null), [])

  return (
    <main className="overflow-hidden bg-[#f4f1e9] text-[#191917] dark:bg-[#111310] dark:text-gray-100">
      <div className="mx-auto w-full max-w-[1180px] px-5 pb-24 pt-8 sm:px-8 sm:pt-14">
        <header className="relative min-h-[540px] border-b border-black/15 pb-12 dark:border-white/15 lg:min-h-[610px]">
          <div className="flex items-start justify-between gap-5">
            <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[#6f6b62] dark:text-gray-500">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-current font-sans text-sm font-semibold">X</span>
              Creator intelligence · 2026 Q2
            </div>
            <SharePageButton
              title="X 值不值得做？｜科技创作者经营情报"
              text="一份面向中文科技创作者的 X 平台决策与经营指南。"
              url={PAGE_URL}
              size="md"
            />
          </div>

          <div className="mt-16 grid gap-12 lg:mt-24 lg:grid-cols-[minmax(0,1.55fr)_minmax(18rem,.7fr)] lg:items-end">
            <div>
              <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#c8ff65]/60 bg-[#c8ff65]/30 px-3 py-1.5 text-xs font-semibold text-[#30410f] dark:border-[#c8ff65]/30 dark:bg-[#c8ff65]/10 dark:text-[#d9ff91]">
                <Sparkles size={14} /> 给中文科技创作者的结论版
              </p>
              <h1 className="max-w-[820px] font-serif text-[48px] font-semibold leading-[1.02] tracking-[-0.035em] sm:text-[72px] lg:text-[88px]">
                X 值不值得做？
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-[#4f4c45] dark:text-gray-300 sm:text-xl sm:leading-9">
                值得。但不要把它当作另一个内容分发平台——<span className="font-semibold text-[#171715] dark:text-white">把它当作全球科技圈的公开关系网络。</span>
              </p>
            </div>

            <aside className="border-l border-black/20 pl-6 dark:border-white/20">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#777269] dark:text-gray-500">One-line strategy</p>
              <p className="mt-4 font-serif text-2xl font-semibold leading-9">在 X 发现人、建立关系；在自有阵地沉淀内容、完成转化。</p>
              <a href="#decision" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold underline decoration-black/25 underline-offset-4 dark:decoration-white/30">
                直接看经营判断 <ArrowRight size={16} />
              </a>
            </aside>
          </div>

          <div className="absolute bottom-0 right-0 hidden select-none font-sans text-[220px] font-black leading-[0.72] tracking-[-0.12em] text-black/[0.035] dark:text-white/[0.035] lg:block" aria-hidden="true">X</div>
        </header>

        <nav className="sticky top-0 z-20 -mx-5 flex gap-6 overflow-x-auto border-b border-black/10 bg-[#f4f1e9]/95 px-5 py-4 backdrop-blur dark:border-white/10 dark:bg-[#111310]/95 sm:-mx-8 sm:px-8" aria-label="页面目录">
          {[
            ['#decision', '经营判断'], ['#system', '经营系统'], ['#facts', '数据事实'], ['#portfolio', '渠道组合'], ['#risks', '风险与证据'],
          ].map(([href, label], index) => (
            <a key={href} href={href} className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-[#6c685f] transition hover:text-black dark:text-gray-500 dark:hover:text-white">
              0{index + 1} {label}
            </a>
          ))}
        </nav>

        <section id="decision" className="scroll-mt-20 py-20 sm:py-28">
          <SectionIntro
            index="01"
            eyebrow="Decision"
            title="先决定 X 在你的业务里负责什么"
            description="不是所有目标都值得用同一种打法。选择你当前最重要的目标，页面只给一个明确建议。"
          />

          <div className="mt-12 grid gap-0 border border-black/15 bg-[#faf8f2] dark:border-white/15 dark:bg-[#171916] lg:grid-cols-[18rem_1fr]">
            <div className="border-b border-black/15 p-2 dark:border-white/15 lg:border-b-0 lg:border-r">
              {LENSES.map((lens) => (
                <button
                  key={lens.id}
                  type="button"
                  onClick={() => setActiveLens(lens.id)}
                  aria-pressed={activeLens === lens.id}
                  className={`flex w-full items-center justify-between px-4 py-4 text-left text-sm font-semibold transition ${activeLens === lens.id ? 'bg-[#191917] text-white dark:bg-[#c8ff65] dark:text-[#172000]' : 'text-[#625f57] hover:bg-black/[0.04] dark:text-gray-400 dark:hover:bg-white/[0.05]'}`}
                >
                  {lens.label}
                  <ArrowRight size={16} />
                </button>
              ))}
            </div>

            <div className="p-6 sm:p-10 lg:p-12" aria-live="polite">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#6c685f] dark:text-gray-500">{active.eyebrow}</p>
              <h3 className="mt-3 max-w-2xl font-serif text-3xl font-semibold leading-tight sm:text-[42px]">{active.title}</h3>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-[#5f5b53] dark:text-gray-400">{active.summary}</p>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {active.actions.map((action) => (
                  <div key={action} className="border-t border-black/15 pt-3 text-sm leading-6 dark:border-white/15">
                    <Check size={16} className="mb-3 text-[#5f7c22] dark:text-[#c8ff65]" />
                    {action}
                  </div>
                ))}
              </div>
              <EvidenceLink id={active.evidenceId} onOpen={setEvidenceRef} className="mt-8 text-xs font-semibold text-[#4a5f1c] dark:text-[#c8ff65]">
                查看这条判断的证据
              </EvidenceLink>
            </div>
          </div>
        </section>

        <section id="system" className="scroll-mt-20 py-20 sm:py-28">
          <SectionIntro
            index="02"
            eyebrow="Operating system"
            title="一套比“每天发帖”更有效的经营系统"
            description="X 的核心循环是观点触发对话，对话建立关系，关系反过来验证下一轮内容。发布只是循环的起点。"
          />

          <div className="mt-14 grid gap-px overflow-hidden border border-black/15 bg-black/15 dark:border-white/15 dark:bg-white/15 lg:grid-cols-3">
            {OPERATING_STEPS.map((step) => (
              <article key={step.number} className="flex min-h-[320px] flex-col bg-[#faf8f2] p-7 dark:bg-[#171916] sm:p-9">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-4xl text-black/20 dark:text-white/20">{step.number}</span>
                  <span className="rounded-full border border-black/15 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.16em] dark:border-white/15">{step.label}</span>
                </div>
                <h3 className="mt-12 font-serif text-3xl font-semibold">{step.title}</h3>
                <p className="mt-4 text-sm leading-7 text-[#625f57] dark:text-gray-400">{step.copy}</p>
                <p className="mt-auto pt-8 font-mono text-[10px] uppercase tracking-[0.14em] text-[#596e2a] dark:text-[#c8ff65]">{step.meta}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 grid gap-5 rounded-[2rem] bg-[#c8ff65] p-7 text-[#172000] sm:p-10 lg:grid-cols-[1fr_1.4fr] lg:items-center">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em]">Minimum viable rhythm</p>
              <h3 className="mt-3 font-serif text-3xl font-semibold">最小可行节奏</h3>
            </div>
            <p className="text-base leading-8 sm:text-lg">每周 <strong>2–3 条原创</strong> + <strong>10 次高质量回复</strong> + <strong>1 次内容沉淀</strong>。先连续运行四周，再用实际对话、关注质量和外部转化判断是否加码。</p>
          </div>
        </section>

        <section id="facts" className="scroll-mt-20 py-20 sm:py-28">
          <SectionIntro
            index="03"
            eyebrow="Reality check"
            title="数据很多，但“X 有多少用户”没有一个答案"
            description="公司自报、移动端测量与广告可触达人数回答的是不同问题。把它们排成同一个增长数字，会得到错误结论。"
          />

          <div className="mt-14 grid gap-4 lg:grid-cols-3">
            {[
              { value: '600M', label: '公司自报全球 MAU', tag: '存疑', note: '未公开去重与机器人处理方法', id: 'x-global-mau-self-2025', tone: 'bg-[#191917] text-white' },
              { value: '313M', label: '独立移动端 MAU 估算', tag: '参考', note: '只包含 iOS 与 Android，不含 Web', id: 'x-global-mobile-mau-sensor-q4-2024', tone: 'bg-[#dce7ff] text-[#17233a] dark:bg-[#202c43] dark:text-[#dce7ff]' },
              { value: '586M', label: '广告可触达人数', tag: '参考', note: '不是 MAU，可能包含重复或非真人账户', id: 'x-global-ad-reach-2025-01', tone: 'bg-[#f1dfc8] text-[#372617] dark:bg-[#3b2d20] dark:text-[#f1dfc8]' },
            ].map((item) => (
              <article key={item.id} className={`flex min-h-[275px] flex-col rounded-[1.75rem] p-7 ${item.tone}`}>
                <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.15em] opacity-70">
                  <span>{item.label}</span><span>{item.tag}</span>
                </div>
                <EvidenceLink kind="observation" id={item.id} onOpen={setEvidenceRef} className="mt-9 w-fit font-sans text-6xl font-semibold tracking-[-0.06em] no-underline sm:text-7xl">
                  {item.value}
                </EvidenceLink>
                <p className="mt-auto pt-8 text-xs leading-6 opacity-75">{item.note}</p>
              </article>
            ))}
          </div>

          <div className="mt-12 grid gap-10 border-t border-black/15 pt-10 dark:border-white/15 lg:grid-cols-2">
            <div>
              <div className="flex items-center gap-3">
                <Globe2 size={22} strokeWidth={1.5} />
                <h3 className="font-serif text-2xl font-semibold">三个市场信号</h3>
              </div>
              <p className="mt-3 text-xs leading-6 text-[#706c63] dark:text-gray-500">X 广告可触达人数占当地互联网用户比例；不是活跃用户渗透率。</p>
              <div className="mt-7 grid gap-5">
                {GEO_ROWS.map((row) => (
                  <button key={row.name} type="button" onClick={() => setEvidenceRef({ kind: 'observation', id: row.observationId })} className="group text-left">
                    <div className="flex items-baseline justify-between"><span className="text-sm font-semibold">{row.name}</span><span className="font-mono text-sm">{row.value}%</span></div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10"><div className="h-full rounded-full bg-[#191917] transition-all group-hover:bg-[#668331] dark:bg-[#c8ff65]" style={{ width: `${row.value}%` }} /></div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3">
                <Users size={22} strokeWidth={1.5} />
                <h3 className="font-serif text-2xl font-semibold">美国样本告诉了什么</h3>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-black/10 dark:bg-white/10">
                {[
                  ['33%', '18–29 岁成年人使用 X', 'x-us-age-18-29-use-2025'],
                  ['24%', '大学毕业成年人使用 X', 'x-us-college-graduate-use-2025'],
                  ['65%', '受访 X 用户把新闻视为使用理由', 'x-us-news-reason-2024'],
                  ['62%', '受访 X 用户为共同兴趣而来', 'x-us-reason-shared-interests-2024'],
                ].map(([value, label, id]) => (
                  <button key={id} type="button" onClick={() => setEvidenceRef({ kind: 'observation', id })} className="bg-[#faf8f2] p-5 text-left transition hover:bg-white dark:bg-[#171916] dark:hover:bg-[#20231e]">
                    <span className="font-serif text-3xl font-semibold">{value}</span>
                    <span className="mt-2 block text-xs leading-5 text-[#68645c] dark:text-gray-400">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="portfolio" className="scroll-mt-20 py-20 sm:py-28">
          <SectionIntro
            index="04"
            eyebrow="Channel portfolio"
            title="别找一个全能平台，给每个平台一个岗位"
            description="X 最适合承担发现与关系。职业信用、深度社区和自有受众分别交给更擅长的渠道，组合会比单平台更稳。"
          />

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PORTFOLIO.map((item) => {
              const insight = insightById.get(item.insightId)
              return (
                <article key={item.id} className="flex min-h-[360px] flex-col rounded-[1.75rem] border border-black/15 bg-[#faf8f2] p-6 dark:border-white/15 dark:bg-[#171916]">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold ${item.accent}`}>{item.name.slice(0, 2)}</div>
                  <p className="mt-8 font-mono text-[9px] uppercase tracking-[0.16em] text-[#716d64] dark:text-gray-500">在组合里负责</p>
                  <h3 className="mt-2 font-serif text-2xl font-semibold">{item.role}</h3>
                  <p className="mt-4 text-xs leading-6 text-[#666259] dark:text-gray-400">{insight?.summary}</p>
                  <EvidenceLink id={item.insightId} onOpen={setEvidenceRef} className="mt-auto pt-7 text-xs font-semibold">依据</EvidenceLink>
                </article>
              )
            })}
          </div>
        </section>

        <section id="risks" className="scroll-mt-20 py-20 sm:py-28">
          <SectionIntro
            index="05"
            eyebrow="Risk & evidence"
            title="把不可控的部分说清楚"
            description="增长建议只有在风险边界清楚时才有意义。以下三项会直接影响是否值得长期投入。"
          />

          <div className="mt-14 divide-y divide-black/15 border-y border-black/15 dark:divide-white/15 dark:border-white/15">
            {[
              { icon: Radio, title: '不要把平台分成写进固定收入预测', copy: '收入分成依赖 Premium、三个月 500 万自然曝光、认证关注者与支付地区，且平台保留调整或取消权。', id: 'x-monetization-policy-stability' },
              { icon: ShieldCheck, title: '品牌与敏感议题需要额外审查', copy: '监管材料与地区测量说明内容治理、蓝标设计和品牌邻接仍需单独评估，尤其是商业账号。', id: 'x-platform-risk-brand-safety' },
              { icon: CircleAlert, title: '永远保留可迁移的受众资产', copy: '平台政策和可见性会变；网站、邮件列表或社群让关系不必从零开始。', id: 'x-creator-risk-channel-dependence' },
            ].map(({ icon: Icon, title, copy, id }, index) => (
              <article key={id} className="grid gap-5 py-7 sm:grid-cols-[4rem_1fr_1fr_auto] sm:items-center">
                <span className="font-mono text-xs text-[#807b70] dark:text-gray-500">0{index + 1}</span>
                <h3 className="flex items-center gap-3 font-serif text-xl font-semibold"><Icon size={20} strokeWidth={1.5} />{title}</h3>
                <p className="text-xs leading-6 text-[#68645c] dark:text-gray-400">{copy}</p>
                <EvidenceLink id={id} onOpen={setEvidenceRef} className="text-xs font-semibold">证据</EvidenceLink>
              </article>
            ))}
          </div>

          <details className="mt-12 rounded-[1.75rem] border border-black/15 bg-[#faf8f2] dark:border-white/15 dark:bg-[#171916]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6 sm:p-8">
              <span>
                <span className="block font-serif text-2xl font-semibold">研究附录与完整证据账本</span>
                <span className="mt-2 block text-xs leading-6 text-[#6b675f] dark:text-gray-400">{repository.sources.length} 个来源 · {repository.observations.length} 条观察值 · 可检索、排序与导出</span>
              </span>
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/20 dark:border-white/20"><ChevronRight size={18} /></span>
            </summary>
            <div className="border-t border-black/15 p-3 dark:border-white/15 sm:p-6">
              <EvidenceLedger rows={evidenceRows} repository={repository} snapshotId={DEFAULT_FILTERS.snapshotId} onOpenEvidence={setEvidenceRef} />
            </div>
          </details>

          <footer className="mt-12 flex flex-col gap-6 border-t border-black/15 pt-8 text-xs leading-6 text-[#6f6b62] dark:border-white/15 dark:text-gray-500 sm:flex-row sm:items-end sm:justify-between">
            <p className="max-w-2xl">本页是季度决策快照，不是实时监控。编辑判断与事实观察分开存储；口径冲突保持并列，证据不足保持为空。核验日期：2026-07-20。</p>
            <a href="#decision" className="inline-flex items-center gap-2 font-semibold text-[#292823] dark:text-gray-300">回到经营判断 <ArrowRight size={15} /></a>
          </footer>
        </section>
      </div>

      {evidenceRef ? (
        <EvidenceDrawer evidenceRef={evidenceRef} bundle={evidenceBundle} repository={repository} onClose={closeEvidence} />
      ) : null}
    </main>
  )
}
