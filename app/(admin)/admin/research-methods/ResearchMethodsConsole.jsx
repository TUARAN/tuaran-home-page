'use client'

import { useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import {
  getResearchMethod,
  listResearchMethodItems,
  RESEARCH_METHOD_NAV,
} from '../../../../lib/research/researchMethodCatalog'
import { AdminButton, AdminPage } from '../../components/ui'
import ResearchStyleClient from '../research-style/ResearchStyleClient'

const METHOD_IDS = new Set(listResearchMethodItems().map((item) => item.id))

function useMethodSelection() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const raw = searchParams.get('method')
  const method = METHOD_IDS.has(raw) ? raw : ''

  function setMethod(next) {
    const params = new URLSearchParams(searchParams.toString())
    if (!next) params.delete('method')
    else params.set('method', next)
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  return [method, setMethod]
}

function MethodNav({ method, onSelect }) {
  return (
    <nav className="space-y-5" aria-label="调研方法">
      <button
        type="button"
        onClick={() => onSelect('')}
        className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-[13px] font-semibold transition ${
          method
            ? 'border-[#e2e5da] bg-white text-[#15140f] hover:border-[#818472] dark:border-[#2d3744] dark:bg-[#10161f] dark:text-gray-100'
            : 'border-[#15140f] bg-[#15140f] text-white dark:border-gray-100 dark:bg-gray-100 dark:text-[#0e0e0a]'
        }`}
      >
        全部方法
        <span className={`font-mono text-[10px] ${method ? 'text-[#858779]' : 'opacity-70'}`}>
          {listResearchMethodItems().length}
        </span>
      </button>
      {RESEARCH_METHOD_NAV.map((group) => (
        <div key={group.id}>
          <p className="mb-2 px-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#8b8d82] dark:text-[#8e9ab0]">
            {group.label}
          </p>
          <div className="space-y-2">
            {group.items.map((item) => {
              const active = item.id === method
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left transition ${
                    active
                      ? 'border-[#15140f] bg-[#15140f] text-white shadow-sm dark:border-gray-100 dark:bg-gray-100 dark:text-[#0e0e0a]'
                      : 'border-[#e2e5da] bg-white text-[#15140f] hover:border-[#818472] dark:border-[#2d3744] dark:bg-[#10161f] dark:text-gray-100'
                  }`}
                >
                  <span className="text-[13px] font-semibold leading-tight">{item.title}</span>
                  {item.version ? (
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] ${active ? 'border-white/30' : 'border-[#d7dacf] text-[#5f6158] dark:border-[#3a4656] dark:text-gray-400'}`}>
                      {item.version === '现行风格' ? '风格' : `v${item.version}`}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}

function Overview({ onSelect }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {RESEARCH_METHOD_NAV.map((group) => (
        <section key={group.id} className="rounded-2xl border border-[#e2e5da] bg-[#fafbf7] p-4 dark:border-[#2b3745] dark:bg-[#111923]">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#8b8d82] dark:text-[#8e9ab0]">{group.label}</h2>
          <div className="mt-3 space-y-2">
            {group.items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className="block w-full rounded-xl border border-[#e6e6dc] bg-white px-3 py-3 text-left hover:border-[#15140f] dark:border-[#2d3744] dark:bg-[#10161f] dark:hover:border-gray-200"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-serif text-[1.05rem] font-semibold text-[#15140f] dark:text-gray-100">{item.title}</span>
                  {item.version ? (
                    <span className="font-mono text-[10px] text-[#6f7168] dark:text-gray-400">
                      {item.version === '现行风格' ? '随风格' : `v${item.version}`}
                    </span>
                  ) : null}
                </span>
                <span className="mt-1 block text-[12.5px] leading-6 text-[#55574f] dark:text-gray-400">{item.summary}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function MethodDetail({ method }) {
  const [copied, setCopied] = useState(false)

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(method.prompt)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <article className="rounded-2xl border border-[#caccc0] bg-white p-5 shadow-sm dark:border-[#2d3744] dark:bg-[#10161f] md:p-7">
      <header className="border-b border-[#e6e6dc] pb-4 dark:border-[#2d3744]">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#858779] dark:text-[#8e9ab0]">
          {method.styleId} · {method.sourcePath}
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-serif text-[1.55rem] font-semibold text-[#15140f] dark:text-gray-100">{method.title}</h2>
          <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 font-mono text-[10px] text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
            {method.version === '现行风格' ? '跟随现行风格' : `现行 v${method.version}`}
            {method.updated ? ` · ${method.updated}` : ''}
          </span>
        </div>
        <p className="mt-3 max-w-3xl text-[14px] leading-7 text-[#51514a] dark:text-gray-300">{method.summary}</p>
      </header>

      <dl className="mt-4 grid gap-3 text-[12.5px] leading-6 sm:grid-cols-2">
        <div className="rounded-lg border border-[#e6e6dc] bg-[#fafaf6] px-3 py-2 dark:border-[#2d3744] dark:bg-[#0e131c]">
          <dt className="text-[#8a8c82] dark:text-gray-500">正本</dt>
          <dd className="font-mono text-[#15140f] dark:text-gray-200">{method.sourcePath}</dd>
        </div>
        <div className="rounded-lg border border-[#e6e6dc] bg-[#fafaf6] px-3 py-2 dark:border-[#2d3744] dark:bg-[#0e131c]">
          <dt className="text-[#8a8c82] dark:text-gray-500">成稿位置</dt>
          <dd className="font-mono text-[#15140f] dark:text-gray-200">{method.outputPath}</dd>
        </div>
      </dl>

      {method.workbenchHref ? (
        <div className="mt-4">
          <AdminButton href={method.workbenchHref} size="sm" variant="primary">{method.workbenchLabel}</AdminButton>
        </div>
      ) : null}

      <section className="mt-6">
        <h3 className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[#858779] dark:text-[#8e9ab0]">现行步骤</h3>
        <ol className="space-y-2">
          {method.steps.map((step, index) => (
            <li key={step} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 rounded-lg border border-[#e6e6dc] px-3 py-2.5 dark:border-[#2d3744]">
              <span className="font-mono text-[12px] text-[#8a8c82]">{String(index + 1).padStart(2, '0')}</span>
              <span className="text-[13.5px] leading-6 text-[#33342e] dark:text-gray-200">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      {method.platforms?.length ? (
        <section className="mt-6">
          <h3 className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[#858779] dark:text-[#8e9ab0]">要打开的平台</h3>
          <ul className="flex flex-wrap gap-2">
            {method.platforms.map((platform) => (
              <li key={platform} className="rounded-full border border-[#d7dacf] bg-[#fafaf6] px-3 py-1 text-[12px] text-[#3f413a] dark:border-[#3a4656] dark:bg-[#0e131c] dark:text-gray-300">
                {platform}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {method.sections?.length ? (
        <section className="mt-6">
          <h3 className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[#858779] dark:text-[#8e9ab0]">成稿章节</h3>
          <ol className="grid gap-2 sm:grid-cols-2">
            {method.sections.map((section, index) => (
              <li key={section} className="rounded-lg border border-[#e6e6dc] px-3 py-2 text-[13px] text-[#33342e] dark:border-[#2d3744] dark:text-gray-200">
                <span className="mr-2 font-mono text-[11px] text-[#8a8c82]">{String(index + 1).padStart(2, '0')}</span>
                {section}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {method.prompt ? (
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#858779] dark:text-[#8e9ab0]">只有姓名时的提示词</h3>
            <button
              type="button"
              onClick={copyPrompt}
              className="rounded-full border border-[#d7dacf] px-3 py-1 text-[12px] text-[#33342e] hover:border-[#15140f] dark:border-[#3a4656] dark:text-gray-200"
            >
              {copied ? '已复制' : '复制提示词'}
            </button>
          </div>
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-xl border border-[#e6e6dc] bg-[#fafaf6] p-4 font-mono text-[12px] leading-6 text-[#2c2d28] dark:border-[#2d3744] dark:bg-[#0e131c] dark:text-gray-200">
            {method.prompt}
          </pre>
        </section>
      ) : null}
    </article>
  )
}

export default function ResearchMethodsConsole() {
  const [method, setMethod] = useMethodSelection()
  const selected = method ? getResearchMethod(method) : null

  return (
    <AdminPage
      title="调研方法"
      description="写作规范、调研风格和各类对象的现行方法都在这里。这些页面只给站长查阅，不作为前台调研文章发布。"
      stickyHeader
    >
      <div className="grid items-start gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-4 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto">
          <MethodNav method={method} onSelect={setMethod} />
        </aside>
        <div className="min-w-0">
          {!selected ? <Overview onSelect={setMethod} /> : null}
          {selected?.kind === 'embed' ? <ResearchStyleClient embedded view={selected.view} /> : null}
          {selected?.kind === 'method' ? <MethodDetail method={selected} /> : null}
        </div>
      </div>
    </AdminPage>
  )
}
