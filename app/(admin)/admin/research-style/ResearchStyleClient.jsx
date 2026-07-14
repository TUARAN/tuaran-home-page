'use client'

import { useMemo, useState } from 'react'

import { RESEARCH_STYLE_TEMPLATES, UNIVERSAL_BAN_PHRASES } from '../../../../lib/researchStyleTemplates'
import { RESEARCH_STYLE_AUDIT } from '../../../../lib/research/styleAudit'
import { AdminPage } from '../../components/ui'

const STATUS_TONE = {
  active: 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200',
  available: 'border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200',
  draft: 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
}

const STATUS_LABEL = {
  active: '默认风格',
  available: '可选风格',
  draft: '草稿',
}

function StatusChip({ status }) {
  const tone = STATUS_TONE[status] || STATUS_TONE.available
  return (
    <span className={`inline-flex h-6 items-center rounded-full border px-2.5 font-mono text-[10px] uppercase tracking-[0.18em] ${tone}`}>
      {STATUS_LABEL[status] || status}
    </span>
  )
}

function SectionTitle({ children }) {
  return (
    <h3 className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[#858779] dark:text-[#8e9ab0]">
      {children}
    </h3>
  )
}

function StylePill({ style, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition ${
        active
          ? 'border-[#15140f] bg-[#15140f] text-white shadow-sm dark:border-gray-100 dark:bg-gray-100 dark:text-[#0e0e0a]'
          : 'border-[#caccc0] bg-white text-[#15140f] hover:border-[#818472] dark:border-[#2d3744] dark:bg-[#10161f] dark:text-gray-200 dark:hover:border-[#4a5568]'
      }`}
    >
      <span className={`mt-0.5 font-mono text-[9px] uppercase tracking-[0.12em] ${active ? 'opacity-70' : 'text-[#858779] dark:text-[#8e9ab0]'}`}>
        {style.category}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-center justify-between gap-2">
          <span className="text-[13px] font-semibold leading-tight">{style.label}</span>
          <StatusChip status={style.status} />
        </span>
        <span className={`truncate font-mono text-[9px] ${active ? 'opacity-70' : 'text-[#858779] dark:text-[#8e9ab0]'}`}>{style.id}</span>
      </span>
    </button>
  )
}

function PhraseList({ items, accent }) {
  if (!items || items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-[#caccc0] bg-[#fafaf6] px-4 py-3 text-[13px] text-[#73746a] dark:border-[#2d3744] dark:bg-[#0e131c] dark:text-[#9aa3b3]">
        本风格无专项示例。
      </p>
    )
  }
  return (
    <ul className="space-y-2">
      {items.map((it, idx) => (
        <li
          key={idx}
          className="rounded-lg border border-[#e6e6dc] bg-white px-4 py-3 dark:border-[#2d3744] dark:bg-[#10161f]"
        >
          <p className={`mb-1 text-[13px] font-semibold leading-snug ${accent}`}>{it.phrase}</p>
          <p className="text-[12px] leading-relaxed text-[#73746a] dark:text-[#9aa3b3]">{it.why}</p>
        </li>
      ))}
    </ul>
  )
}

function AxiomList({ items, auditById }) {
  return (
    <ol className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
      {items.map((it, idx) => (
        <li
          key={it.phrase}
          className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 rounded-lg border border-rose-200 bg-white px-3 py-2.5 dark:border-rose-900/60 dark:bg-[#10161f]"
        >
          <span className="flex h-7 w-9 items-center justify-center rounded-md bg-rose-100 font-mono text-[11px] font-semibold text-rose-800 dark:bg-rose-950/60 dark:text-rose-200">
            {String(idx + 1).padStart(2, '0')}
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] font-semibold leading-snug text-rose-700 dark:text-rose-300">
              {it.phrase}
            </span>
            <span className="mt-1 block text-[12px] leading-5 text-[#73746a] dark:text-[#9aa3b3]">
              {it.why}
            </span>
            {auditById.get(it.id)?.occurrences ? (
              <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 font-mono text-[9px] ${it.severity === 'review' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200'}`}>
                存量 {auditById.get(it.id).occurrences} 处{it.severity === 'review' ? '，待人工判断' : '，待修改'}
              </span>
            ) : null}
          </span>
        </li>
      ))}
    </ol>
  )
}

function TextList({ items, ordered = false }) {
  const Tag = ordered ? 'ol' : 'ul'
  return (
    <Tag className={`space-y-1.5 ${ordered ? 'pl-4' : ''}`}>
      {items.map((item, index) => (
        <li
          key={index}
          className={`${ordered ? 'list-decimal' : 'flex items-start gap-2'} text-[13px] leading-relaxed text-[#15140f] dark:text-gray-100`}
        >
          {ordered ? null : <span className="mt-2 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#15140f] dark:bg-gray-100" />}
          <span>{item}</span>
        </li>
      ))}
    </Tag>
  )
}

export default function ResearchStyleClient() {
  const styles = useMemo(() => [...RESEARCH_STYLE_TEMPLATES], [])
  const initial = styles.find((t) => t.status === 'active') || styles[0]
  const [selectedId, setSelectedId] = useState(initial?.id)
  const [showRules, setShowRules] = useState(false)
  const selected = styles.find((t) => t.id === selectedId) || initial
  const auditById = useMemo(() => new Map(RESEARCH_STYLE_AUDIT.rules.map((rule) => [rule.id, rule])), [])
  const totalFindings = RESEARCH_STYLE_AUDIT.fixCount + RESEARCH_STYLE_AUDIT.reviewCount

  return (
    <AdminPage
      title="内容风格库"
      maxWidth="1180px"
      description="先定写法，再写内容。这里既是风格配置，也是存量文章的措辞复核入口。"
    >
      <section className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-2xl border border-[#caccc0] bg-white p-5 dark:border-[#2d3744] dark:bg-[#10161f]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#858779] dark:text-[#8e9ab0]">执行状态</p>
              <h2 className="mt-1 text-[17px] font-semibold text-[#15140f] dark:text-gray-100">规则已入库，存量内容尚未完全收敛</h2>
              <p className="mt-1.5 max-w-2xl text-[12px] leading-6 text-[#73746a] dark:text-[#9aa3b3]">
                构建前会扫描文章 Markdown；它只报出待改与待人工判断项，不会把有必要的对比句误判成错误。
              </p>
            </div>
            <span className="inline-flex shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-mono text-[10px] text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
              {totalFindings} 项待复核
            </span>
          </div>
          <dl className="mt-4 grid grid-cols-3 divide-x divide-[#e6e6dc] rounded-xl border border-[#e6e6dc] bg-[#fafaf6] dark:divide-[#2d3744] dark:border-[#2d3744] dark:bg-[#0e131c]">
            <div className="px-3 py-2.5">
              <dt className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#858779] dark:text-[#8e9ab0]">已扫描</dt>
              <dd className="mt-1 text-lg font-semibold text-[#15140f] dark:text-gray-100">{RESEARCH_STYLE_AUDIT.scannedFiles}<span className="ml-1 text-[11px] font-normal text-[#73746a]">篇</span></dd>
            </div>
            <div className="px-3 py-2.5">
              <dt className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#858779] dark:text-[#8e9ab0]">待修改</dt>
              <dd className="mt-1 text-lg font-semibold text-rose-700 dark:text-rose-300">{RESEARCH_STYLE_AUDIT.fixCount}<span className="ml-1 text-[11px] font-normal text-[#73746a]">处</span></dd>
            </div>
            <div className="px-3 py-2.5">
              <dt className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#858779] dark:text-[#8e9ab0]">人工判断</dt>
              <dd className="mt-1 text-lg font-semibold text-amber-700 dark:text-amber-300">{RESEARCH_STYLE_AUDIT.reviewCount}<span className="ml-1 text-[11px] font-normal text-[#73746a]">处</span></dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-5 dark:border-rose-900/60 dark:bg-rose-950/20">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-800 dark:text-rose-200">所有风格的底线</p>
          <h2 className="mt-1 text-[17px] font-semibold text-[#15140f] dark:text-gray-100">先不像 AI 写的，再谈风格</h2>
          <p className="mt-1.5 text-[12px] leading-6 text-[#73746a] dark:text-[#9aa3b3]">{UNIVERSAL_BAN_PHRASES.length} 条通用措辞规则，风格自己的禁用表达只是补充。</p>
          <button
            type="button"
            onClick={() => setShowRules((value) => !value)}
            className="mt-4 inline-flex items-center rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-rose-800 transition hover:border-rose-400 dark:border-rose-900/60 dark:bg-[#10161f] dark:text-rose-200"
          >
            {showRules ? '收起通用规则' : '查看通用规则'}
          </button>
        </div>
      </section>

      {showRules ? (
        <section className="mb-6 rounded-2xl border border-rose-300 bg-rose-50/60 p-4 dark:border-rose-900/60 dark:bg-rose-950/20">
          <div className="mb-4">
            <SectionTitle>公理 · 所有风格通用禁语</SectionTitle>
            <p className="m-0 max-w-4xl text-[12px] leading-6 text-[#73746a] dark:text-[#9aa3b3]">
              规则扫描只负责发现候选句。特别是「不是 X，而是 Y」「换句话说」和宣传词，必须结合上下文人工判断，不做机械删除。
            </p>
          </div>
          <AxiomList items={UNIVERSAL_BAN_PHRASES} auditById={auditById} />
        </section>
      ) : null}

      <div className="grid gap-6 md:grid-cols-[260px_minmax(0,1fr)] md:items-start">
        <aside className="space-y-4 md:sticky md:top-[72px] md:self-start">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <SectionTitle>选择写作风格</SectionTitle>
              <span className="font-mono text-[10px] text-[#858779] dark:text-[#8e9ab0]">{styles.length} 种</span>
            </div>
            <ol className="space-y-2">
              {styles.map((style) => (
                <li key={style.id}>
                  <StylePill style={style} active={style.id === selectedId} onClick={() => setSelectedId(style.id)} />
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-xl border border-dashed border-[#caccc0] bg-transparent p-3 text-[11px] leading-relaxed text-[#73746a] dark:border-[#2d3744] dark:text-[#9aa3b3]">
            <p className="mb-1 font-semibold text-[#51514a] dark:text-gray-300">写作顺序</p>
            <p className="m-0">
              选风格 → 先列事实 → 写判断 → 跑一次措辞审计。规则正本在 <code>researchStyleTemplates.js</code>。
            </p>
          </div>
        </aside>

        <section>
          <StyleCard style={selected} />
        </section>
      </div>
    </AdminPage>
  )
}

function StyleCard({ style }) {
  if (!style) return null
  return (
    <article className="rounded-2xl border border-[#caccc0] bg-white p-6 shadow-sm dark:border-[#2d3744] dark:bg-[#10161f] md:p-8">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#e6e6dc] pb-4 dark:border-[#2d3744]">
        <div>
          <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.22em] text-[#858779] dark:text-[#8e9ab0]">
            {style.category} · {style.id}
          </p>
          <h2 className="font-serif text-[1.5rem] font-semibold text-[#15140f] dark:text-gray-100 md:text-[1.75rem]">
            {style.label}
          </h2>
          <p className="mt-1 text-[14px] leading-7 text-[#51514a] dark:text-gray-300">
            {style.summary}
          </p>
        </div>
        <StatusChip status={style.status} />
      </header>

      <div className="grid gap-6">
        <div>
          <SectionTitle>适用场景</SectionTitle>
          <p className="rounded-lg border border-[#e6e6dc] bg-[#fafaf6] px-4 py-3 text-[13px] leading-relaxed text-[#51514a] dark:border-[#2d3744] dark:bg-[#0e131c] dark:text-gray-300">
            {style.trigger}
          </p>
        </div>

        <div>
          <SectionTitle>调用指令</SectionTitle>
          <ul className="flex flex-wrap gap-2">
            {style.commandHints.map((hint) => (
              <li
                key={hint}
                className="rounded-full border border-[#caccc0] bg-white px-3 py-1.5 font-mono text-[11px] text-[#51514a] dark:border-[#2d3744] dark:bg-[#10161f] dark:text-gray-300"
              >
                {hint}
              </li>
            ))}
          </ul>
        </div>

        {style.sourceSkills?.length ? (
          <div>
            <SectionTitle>关联 Skill</SectionTitle>
            <ul className="flex flex-wrap gap-2">
              {style.sourceSkills.map((skill) => (
                <li
                  key={skill}
                  className="rounded-full border border-[#cfc3e2] bg-[#f3eff9] px-3 py-1.5 font-mono text-[11px] text-[#49345f] dark:border-[#3c2f57] dark:bg-[#1f1830] dark:text-[#d8c5f3]"
                >
                  {skill}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div>
          <SectionTitle>核心原则</SectionTitle>
          <TextList items={style.principles} />
        </div>

        <div>
          <SectionTitle>结构骨架</SectionTitle>
          <TextList items={style.structure} ordered />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <SectionTitle>禁用表达</SectionTitle>
          <PhraseList items={style.badPhrases} accent="text-rose-700 dark:text-rose-300" />
        </div>
        <div>
          <SectionTitle>建议表达</SectionTitle>
          <PhraseList items={style.goodPhrases} accent="text-emerald-700 dark:text-emerald-300" />
        </div>
      </div>

      <div className="mt-6">
        <SectionTitle>落地清单</SectionTitle>
        <TextList items={style.howToApply} ordered />
      </div>

      <div className="mt-6">
        <SectionTitle>为什么这么定</SectionTitle>
        <p className="rounded-lg border border-[#e6e6dc] bg-[#fafaf6] px-4 py-3 text-[13px] leading-relaxed text-[#51514a] dark:border-[#2d3744] dark:bg-[#0e131c] dark:text-gray-300">
          {style.whyItMatters}
        </p>
      </div>
    </article>
  )
}
