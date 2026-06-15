'use client'

import { useMemo, useState } from 'react'

import { RESEARCH_STYLE_TEMPLATES } from '../../../../lib/researchStyleTemplates'
import { AdminPage } from '../../components/ui'

const STATUS_TONE = {
  active: 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200',
  historical: 'border-slate-300 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300',
  draft: 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
}

const STATUS_LABEL = {
  active: '当前生效',
  historical: '历史版本',
  draft: '草稿',
}

function StatusChip({ status }) {
  const tone = STATUS_TONE[status] || STATUS_TONE.historical
  return (
    <span className={`inline-flex h-6 items-center rounded-full border px-2.5 font-mono text-[10px] uppercase tracking-[0.18em] ${tone}`}>
      {STATUS_LABEL[status] || status}
    </span>
  )
}

function VersionPill({ version, active, onClick }) {
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
      <span className={`font-mono text-[11px] uppercase tracking-[0.18em] ${active ? 'opacity-70' : 'text-[#858779] dark:text-[#8e9ab0]'}`}>
        {version.id}
      </span>
      <span className="flex flex-1 flex-col gap-1">
        <span className="text-[13px] font-semibold leading-tight">{version.label}</span>
        <span className={`text-[11px] leading-snug ${active ? 'opacity-80' : 'text-[#73746a] dark:text-[#9aa3b3]'}`}>
          {version.summary}
        </span>
        <span className="mt-1 flex items-center gap-2">
          <StatusChip status={version.status} />
          <span className={`font-mono text-[10px] ${active ? 'opacity-70' : 'text-[#858779] dark:text-[#8e9ab0]'}`}>{version.date}</span>
        </span>
      </span>
    </button>
  )
}

function SectionTitle({ children }) {
  return (
    <h3 className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[#858779] dark:text-[#8e9ab0]">
      {children}
    </h3>
  )
}

function PhraseList({ items, accent }) {
  if (!items || items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-[#caccc0] bg-[#fafaf6] px-4 py-3 text-[13px] text-[#73746a] dark:border-[#2d3744] dark:bg-[#0e131c] dark:text-[#9aa3b3]">
        本版无示例。
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

export default function ResearchStyleClient() {
  const sorted = useMemo(
    () => [...RESEARCH_STYLE_TEMPLATES].sort((a, b) => a.id.localeCompare(b.id)),
    [],
  )

  const initial = sorted.find((t) => t.status === 'active') || sorted[sorted.length - 1]
  const [selectedId, setSelectedId] = useState(initial?.id)
  const [compareId, setCompareId] = useState('')

  const selected = sorted.find((t) => t.id === selectedId) || initial
  const compare = sorted.find((t) => t.id === compareId)

  return (
    <AdminPage
      title="调研风格模版"
      maxWidth="1180px"
      description="调研类内容（research/companies、research/topics）在分寸感、措辞、版式上的历代快照。保留全部历史版本，便于回看每条规则的来由——避免被悄悄回退。"
    >
      <div className="grid gap-6">
        {/* 版本时间线 */}
        <aside className="space-y-4">
          <div>
            <SectionTitle>版本时间线</SectionTitle>
            <ol className="space-y-2">
              {sorted.map((v) => (
                <li key={v.id}>
                  <VersionPill version={v} active={v.id === selectedId} onClick={() => setSelectedId(v.id)} />
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-xl border border-[#e6e6dc] bg-[#fafaf6] p-4 dark:border-[#2d3744] dark:bg-[#0e131c]">
            <SectionTitle>对照版本</SectionTitle>
            <select
              value={compareId}
              onChange={(e) => setCompareId(e.target.value)}
              className="w-full rounded-lg border border-[#caccc0] bg-white px-3 py-2 text-[13px] text-[#15140f] dark:border-[#2d3744] dark:bg-[#10161f] dark:text-gray-200"
            >
              <option value="">不对比（仅看主版本）</option>
              {sorted
                .filter((v) => v.id !== selectedId)
                .map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
            </select>
            <p className="mt-2 text-[11px] leading-relaxed text-[#73746a] dark:text-[#9aa3b3]">
              选择一个对照版本，主面板会切换为上下对照，看清两版差异。
            </p>
          </div>

          <div className="rounded-xl border border-dashed border-[#caccc0] bg-transparent p-4 text-[12px] leading-relaxed text-[#73746a] dark:border-[#2d3744] dark:text-[#9aa3b3]">
            <p className="mb-1 font-semibold text-[#51514a] dark:text-gray-300">同步状态</p>
            <p className="m-0">
              规则正本存放于站长本地 Claude 记忆库（措辞分寸：
              <code className="rounded bg-[#f0f0e6] px-1 font-mono dark:bg-[#1a2230]">feedback-research-tone.md</code>；全文范式：
              <code className="rounded bg-[#f0f0e6] px-1 font-mono dark:bg-[#1a2230]">research-style-template-v3.md</code>）。本页是它的历史快照，
              规则改动后请手动添加一个新版本到{' '}
              <code className="rounded bg-[#f0f0e6] px-1 font-mono dark:bg-[#1a2230]">lib/researchStyleTemplates.js</code>。
            </p>
          </div>
        </aside>

        {/* 主面板 */}
        <section className="space-y-6">
          {compare ? (
            <div className="grid gap-4">
              <VersionCard version={selected} />
              <VersionCard version={compare} />
            </div>
          ) : (
            <VersionCard version={selected} large />
          )}
        </section>
      </div>
    </AdminPage>
  )
}

function VersionCard({ version, large = false }) {
  if (!version) return null
  return (
    <article className={`rounded-2xl border border-[#caccc0] bg-white shadow-sm dark:border-[#2d3744] dark:bg-[#10161f] ${large ? 'p-6 md:p-8' : 'p-5'}`}>
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#e6e6dc] pb-4 dark:border-[#2d3744]">
        <div>
          <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.22em] text-[#858779] dark:text-[#8e9ab0]">
            {version.id} · {version.date}
          </p>
          <h2 className={`font-serif font-semibold text-[#15140f] dark:text-gray-100 ${large ? 'text-[1.5rem] md:text-[1.75rem]' : 'text-[1.15rem]'}`}>
            {version.label}
          </h2>
          <p className={`mt-1 text-[#51514a] dark:text-gray-300 ${large ? 'text-[14px] leading-7' : 'text-[12.5px] leading-6'}`}>
            {version.summary}
          </p>
        </div>
        <StatusChip status={version.status} />
      </header>

      <div className="grid gap-6">
        <div>
          <SectionTitle>触发事件</SectionTitle>
          <p className="rounded-lg border border-[#e6e6dc] bg-[#fafaf6] px-4 py-3 text-[13px] leading-relaxed text-[#51514a] dark:border-[#2d3744] dark:bg-[#0e131c] dark:text-gray-300">
            {version.origin}
          </p>
        </div>

        <div>
          <SectionTitle>核心原则</SectionTitle>
          <ul className="space-y-1.5">
            {version.principles.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-[13px] leading-relaxed text-[#15140f] dark:text-gray-100">
                <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#15140f] dark:bg-gray-100" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 grid gap-6">
        <div>
          <SectionTitle>禁用措辞</SectionTitle>
          <PhraseList items={version.badPhrases} accent="text-rose-700 dark:text-rose-300" />
        </div>
        <div>
          <SectionTitle>建议措辞</SectionTitle>
          <PhraseList items={version.goodPhrases} accent="text-emerald-700 dark:text-emerald-300" />
        </div>
      </div>

      <div className="mt-6">
        <SectionTitle>落地清单（How to apply）</SectionTitle>
        <ol className="space-y-1.5 pl-4">
          {version.howToApply.map((step, i) => (
            <li key={i} className="list-decimal text-[13px] leading-relaxed text-[#15140f] dark:text-gray-100">
              {step}
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-6">
        <SectionTitle>为什么这么定</SectionTitle>
        <p className="rounded-lg border border-[#e6e6dc] bg-[#fafaf6] px-4 py-3 text-[13px] leading-relaxed text-[#51514a] dark:border-[#2d3744] dark:bg-[#0e131c] dark:text-gray-300">
          {version.whyItMatters}
        </p>
      </div>

      {version.appliedTo && version.appliedTo.length > 0 ? (
        <div className="mt-6">
          <SectionTitle>应用过的文章</SectionTitle>
          <ul className="flex flex-wrap gap-2">
            {version.appliedTo.map((slug, i) => (
              <li
                key={i}
                className="rounded-full border border-[#caccc0] bg-white px-3 py-1 font-mono text-[11px] text-[#51514a] dark:border-[#2d3744] dark:bg-[#10161f] dark:text-gray-300"
              >
                {slug}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  )
}
