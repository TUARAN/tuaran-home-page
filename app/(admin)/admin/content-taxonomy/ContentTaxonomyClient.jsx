'use client'

import { useMemo, useState } from 'react'

import { CONTENT_GROUP_META, SUBJECT_META, getContentGroup, taxonomyForResearch } from '../../../../lib/contentTaxonomy'
import {
  SUBJECT_GOVERNANCE_LIST,
  TAXONOMY_DIMENSIONS,
  TAXONOMY_GOVERNANCE_RULES,
} from '../../../../lib/contentTaxonomyGovernance'
import { RESEARCH_ENTRY_META } from '../../../../lib/research/catalog'
import { AdminPage } from '../../components/ui'

function buildAuditEntries() {
  return Object.entries(RESEARCH_ENTRY_META).map(([key, entry]) => {
    const taxonomy = taxonomyForResearch(entry)
    return {
      key,
      ...entry,
      ...taxonomy,
      explicit: Array.isArray(entry.subjects) && entry.subjects.length > 0,
      href: `/articles/research/${entry.category}/${entry.slug}`,
    }
  })
}

function Stat({ label, value, note }) {
  return (
    <div className="rounded-xl border border-[#e1e1d6] bg-white px-4 py-3 dark:border-[#2d3744] dark:bg-[#10161f]">
      <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#858779] dark:text-[#8e9ab0]">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold text-[#15140f] dark:text-gray-100">{value}</dd>
      <p className="mb-0 mt-1 text-[11px] text-[#73746a] dark:text-[#9aa3b3]">{note}</p>
    </div>
  )
}

export default function ContentTaxonomyClient() {
  const entries = useMemo(buildAuditEntries, [])
  const [subject, setSubject] = useState('all')
  const [mode, setMode] = useState('all')
  const [query, setQuery] = useState('')

  const explicitCount = entries.filter((entry) => entry.explicit).length
  const subjectCounts = useMemo(() => Object.fromEntries(Object.keys(SUBJECT_META).map((id) => [
    id,
    {
      total: entries.filter((entry) => entry.subjects[0] === id).length,
    },
  ])), [entries])

  const filtered = entries.filter((entry) => {
    if (subject !== 'all' && !entry.subjects.includes(subject)) return false
    if (mode === 'explicit' && !entry.explicit) return false
    if (mode === 'inferred' && entry.explicit) return false
    const needle = query.trim().toLowerCase()
    return !needle || `${entry.title} ${entry.slug}`.toLowerCase().includes(needle)
  })

  return (
    <AdminPage
      title="分类管理"
      description="分类规则、主题边界与存量内容审计共用一个工作台。当前统计覆盖调研知识库；显式 subjects 是正本，推断结果进入治理队列。"
    >
      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="调研内容" value={entries.length} note="当前审计范围" />
        <Stat label="主题分类" value={SUBJECT_GOVERNANCE_LIST.length} note="全部使用稳定 ID" />
        <Stat label="显式分类" value={explicitCount} note={`${entries.length ? Math.round((explicitCount / entries.length) * 100) : 0}% 已人工落盘`} />
        <Stat label="待治理" value={entries.length - explicitCount} note="仍依赖旧字段推断" />
      </dl>

      <section className="mt-6 rounded-2xl border border-[#caccc0] bg-[#fafaf6] p-5 dark:border-[#2d3744] dark:bg-[#0e131c]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#858779]">受控词表</p>
            <h2 className="mt-1 text-lg font-semibold text-[#15140f] dark:text-gray-100">内容主题的定义与边界</h2>
          </div>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-mono text-[10px] text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">10 个启用主题</span>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {SUBJECT_GOVERNANCE_LIST.map((item) => (
            <article key={item.id} className="rounded-xl border border-[#e1e1d6] bg-white p-4 dark:border-[#2d3744] dark:bg-[#10161f]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-[15px] font-semibold text-[#15140f] dark:text-gray-100">{item.label}</h3>
                  <code className="text-[10px] text-[#858779]">{item.id}</code>
                </div>
                <span className="rounded-full bg-[#f0efe7] px-2 py-1 font-mono text-[10px] text-[#51514a] dark:bg-[#202936] dark:text-gray-300">
                  {subjectCounts[item.id].total} 条
                </span>
              </div>
              <p className="mt-3 text-[13px] leading-6 text-[#51514a] dark:text-gray-300">{item.definition}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div><p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">纳入</p><p className="mt-1 text-[11px] leading-5 text-[#73746a] dark:text-[#9aa3b3]">{item.includes.join('、')}</p></div>
                <div><p className="text-[11px] font-semibold text-rose-700 dark:text-rose-300">排除</p><p className="mt-1 text-[11px] leading-5 text-[#73746a] dark:text-[#9aa3b3]">{item.excludes.join('、')}</p></div>
              </div>
              <p className="mb-0 mt-3 text-[10px] text-[#858779]">别名：{item.aliases.join('、')}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-[#caccc0] bg-white p-5 dark:border-[#2d3744] dark:bg-[#10161f]">
        <h2 className="text-lg font-semibold text-[#15140f] dark:text-gray-100">存量内容审计</h2>
        <p className="mt-1 text-[12px] leading-6 text-[#73746a] dark:text-[#9aa3b3]">优先处理“系统推断”，把确认后的唯一主题写入 Markdown frontmatter。</p>
        <div className="mt-4 grid gap-2 md:grid-cols-[minmax(220px,1fr)_180px_160px]">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索标题或 slug" className="rounded-lg border border-[#caccc0] bg-white px-3 py-2 text-[13px] outline-none focus:border-[#15140f] dark:border-[#2d3744] dark:bg-[#0e131c]" />
          <select value={subject} onChange={(event) => setSubject(event.target.value)} className="rounded-lg border border-[#caccc0] bg-white px-3 py-2 text-[13px] dark:border-[#2d3744] dark:bg-[#0e131c]">
            <option value="all">全部主题</option>
            {Object.entries(SUBJECT_META).map(([id, meta]) => <option key={id} value={id}>{meta.label}</option>)}
          </select>
          <select value={mode} onChange={(event) => setMode(event.target.value)} className="rounded-lg border border-[#caccc0] bg-white px-3 py-2 text-[13px] dark:border-[#2d3744] dark:bg-[#0e131c]">
            <option value="all">全部来源</option>
            <option value="explicit">人工显式</option>
            <option value="inferred">系统推断</option>
          </select>
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-[#e1e1d6] dark:border-[#2d3744]">
          <div className="max-h-[560px] divide-y divide-[#e9e9df] overflow-y-auto dark:divide-[#2d3744]">
            {filtered.map((entry) => (
              <article key={entry.key} className="grid gap-2 px-4 py-3 hover:bg-[#fafaf6] dark:hover:bg-[#0e131c] md:grid-cols-[minmax(0,1fr)_220px_100px] md:items-center">
                <div className="min-w-0"><a href={entry.href} target="_blank" rel="noreferrer" className="block truncate text-[13px] font-semibold text-[#15140f] hover:underline dark:text-gray-100">{entry.title}</a><p className="mt-1 truncate font-mono text-[9px] text-[#858779]">{entry.key}</p></div>
                <div className="flex flex-wrap gap-1.5">{entry.subjects.map((id) => <span key={id} className="rounded-full border border-[#d8d8cc] px-2 py-0.5 text-[10px] text-[#51514a] dark:border-[#384352] dark:text-gray-300">{SUBJECT_META[id]?.label || id}</span>)}<span className="rounded-full border border-[#d8d8cc] px-2 py-0.5 text-[10px] text-[#858779] dark:border-[#384352]">{CONTENT_GROUP_META[getContentGroup(entry.contentKind)]?.label}</span></div>
                <span className={`w-fit rounded-full px-2 py-1 font-mono text-[9px] ${entry.explicit ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200' : 'bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200'}`}>{entry.explicit ? '人工显式' : '系统推断'}</span>
              </article>
            ))}
            {!filtered.length ? <p className="p-6 text-center text-[13px] text-[#858779]">没有符合条件的内容。</p> : null}
          </div>
        </div>
        <p className="mb-0 mt-3 text-right font-mono text-[10px] text-[#858779]">显示 {filtered.length} / {entries.length}</p>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-[#caccc0] bg-white p-5 dark:border-[#2d3744] dark:bg-[#10161f]">
          <h2 className="text-lg font-semibold text-[#15140f] dark:text-gray-100">分类维度</h2>
          <div className="mt-3 space-y-2">{TAXONOMY_DIMENSIONS.map((item) => <div key={item.id} className="rounded-lg bg-[#fafaf6] px-3 py-2.5 dark:bg-[#0e131c]"><div className="flex justify-between gap-3"><strong className="text-[12px]">{item.label}</strong><span className="font-mono text-[9px] text-[#858779]">{item.rule}</span></div><p className="mb-0 mt-1 text-[11px] leading-5 text-[#73746a] dark:text-[#9aa3b3]">{item.description}</p></div>)}</div>
        </div>
        <div className="rounded-2xl border border-[#caccc0] bg-white p-5 dark:border-[#2d3744] dark:bg-[#10161f]">
          <h2 className="text-lg font-semibold text-[#15140f] dark:text-gray-100">迭代规则</h2>
          <ol className="mt-3 space-y-2">{TAXONOMY_GOVERNANCE_RULES.map((rule, index) => <li key={rule} className="flex gap-3 text-[12px] leading-6 text-[#51514a] dark:text-gray-300"><span className="font-mono text-[10px] text-[#858779]">{String(index + 1).padStart(2, '0')}</span><span>{rule}</span></li>)}</ol>
        </div>
      </section>
    </AdminPage>
  )
}
