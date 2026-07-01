'use client'

import { useMemo, useState } from 'react'

import { RESEARCH_STYLE_TEMPLATES, UNIVERSAL_BAN_PHRASES } from '../../../../lib/researchStyleTemplates'
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
      className={`relative flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition ${
        active
          ? 'border-[#15140f] bg-[#15140f] text-white shadow-sm dark:border-gray-100 dark:bg-gray-100 dark:text-[#0e0e0a]'
          : 'border-[#caccc0] bg-white text-[#15140f] hover:border-[#818472] dark:border-[#2d3744] dark:bg-[#10161f] dark:text-gray-200 dark:hover:border-[#4a5568]'
      }`}
    >
      <span className={`font-mono text-[10px] uppercase tracking-[0.16em] ${active ? 'opacity-70' : 'text-[#858779] dark:text-[#8e9ab0]'}`}>
        {style.category}
      </span>
      <span className="flex flex-1 flex-col gap-1">
        <span className="text-[13px] font-semibold leading-tight">{style.label}</span>
        <span className={`text-[11px] leading-snug ${active ? 'opacity-80' : 'text-[#73746a] dark:text-[#9aa3b3]'}`}>
          {style.summary}
        </span>
        <span className="mt-1 flex items-center gap-2">
          <StatusChip status={style.status} />
          <span className={`font-mono text-[10px] ${active ? 'opacity-70' : 'text-[#858779] dark:text-[#8e9ab0]'}`}>{style.id}</span>
        </span>
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
  const selected = styles.find((t) => t.id === selectedId) || initial

  return (
    <AdminPage
      title="调研风格库"
      maxWidth="1180px"
      description="调研按风格选择：默认调研、人味调研、周刊解释、投研备忘、资料档案。动笔前先选风格，用户也可以直接说“用 XX 风格调研”。"
    >
      <div className="mb-6 rounded-2xl border border-rose-300 bg-rose-50/60 p-5 dark:border-rose-900/60 dark:bg-rose-950/20">
        <SectionTitle>公理 · 所有风格通用禁语</SectionTitle>
        <p className="mb-3 text-[12px] leading-relaxed text-[#73746a] dark:text-[#9aa3b3]">
          与选哪种风格无关：任何调研 / 文章都不应出现下列 AI 腔套话。先满足「不像 AI 写的」，再谈风格。
          有些（如「不是 X，而是 Y」）是合法中文结构，禁的是「删掉后不损失意思」的假深刻用法——写时自检，不做机械删除。
        </p>
        <PhraseList items={UNIVERSAL_BAN_PHRASES} accent="text-rose-700 dark:text-rose-300" />
      </div>

      <div className="grid gap-6 md:grid-cols-[300px_minmax(0,1fr)] md:items-start">
        <aside className="space-y-4 md:sticky md:top-[72px] md:self-start">
          <div>
            <SectionTitle>风格列表</SectionTitle>
            <ol className="space-y-2">
              {styles.map((style) => (
                <li key={style.id}>
                  <StylePill style={style} active={style.id === selectedId} onClick={() => setSelectedId(style.id)} />
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-xl border border-dashed border-[#caccc0] bg-transparent p-4 text-[12px] leading-relaxed text-[#73746a] dark:border-[#2d3744] dark:text-[#9aa3b3]">
            <p className="mb-1 font-semibold text-[#51514a] dark:text-gray-300">使用原则</p>
            <p className="m-0">
              这里是调研写作风格的唯一正本。需要变化时新增或修改一个风格配置。
              写作指令里直接说「用人味调研风格」「用投研备忘风格」即可。
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
