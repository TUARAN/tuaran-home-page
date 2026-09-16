'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconFocus2,
  IconLock,
  IconPlayerPause,
  IconPlayerPlay,
  IconRefresh,
} from '@tabler/icons-react'

import {
  CONTRACT_RENEWAL_DECK,
  CONTRACT_RENEWAL_NUMBERS,
  CONTRACT_RENEWAL_PAGES,
  CONTRACT_RENEWAL_QUESTIONS,
  CONTRACT_RENEWAL_TITLE,
  CONTRACT_RENEWAL_TOTAL_SECONDS,
} from '../../../../lib/contractRenewalBriefing'
import { AdminButton, AdminPage, StatusPill } from '../../components/ui'

const TABS = [
  { id: 'rehearse', label: '对稿' },
  { id: 'prompt', label: '提词' },
  { id: 'qa', label: '答问' },
  { id: 'numbers', label: '数字' },
]

function formatClock(ms) {
  const safe = Math.max(0, Math.round(ms / 1000))
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function clockTone(remainingMs, budgetMs) {
  if (remainingMs <= 0) return 'text-red-700 dark:text-red-300'
  if (remainingMs <= budgetMs * 0.2) return 'text-amber-700 dark:text-amber-300'
  return 'text-[#15140f] dark:text-gray-100'
}

export default function ContractRenewalClient() {
  const [index, setIndex] = useState(0)
  const [line, setLine] = useState(0)
  const [tab, setTab] = useState('rehearse')
  const [stage, setStage] = useState(false)
  const [running, setRunning] = useState(false)
  const [drill, setDrill] = useState(false)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [pageElapsedMs, setPageElapsedMs] = useState(0)
  const elapsedRef = useRef(0)
  const pageElapsedRef = useRef(0)
  const startedAtRef = useRef(0)
  const pageStartedAtRef = useRef(0)

  const page = CONTRACT_RENEWAL_PAGES[index]
  const lines = page.lines
  const totalRemainingMs = CONTRACT_RENEWAL_TOTAL_SECONDS * 1000 - elapsedMs
  const pageRemainingMs = page.seconds * 1000 - pageElapsedMs
  const late = elapsedMs > CONTRACT_RENEWAL_PAGES.slice(0, index).reduce((sum, item) => sum + item.seconds, 0) * 1000 + page.seconds * 1000
  const useCut = drill && late && page.cutLines?.length
  const displayLines = useCut ? page.cutLines : lines

  const goTo = useCallback((nextIndex, nextLine = 0) => {
    const bounded = Math.min(CONTRACT_RENEWAL_PAGES.length - 1, Math.max(0, nextIndex))
    setIndex(bounded)
    setLine(nextLine)
    pageElapsedRef.current = 0
    pageStartedAtRef.current = performance.now()
    setPageElapsedMs(0)
  }, [])

  const stepLine = useCallback((delta) => {
    setLine((current) => {
      const last = displayLines.length - 1
      if (delta > 0 && current >= last) {
        if (index < CONTRACT_RENEWAL_PAGES.length - 1) goTo(index + 1, 0)
        return current
      }
      if (delta < 0 && current <= 0) {
        if (index > 0) {
          const prev = CONTRACT_RENEWAL_PAGES[index - 1]
          goTo(index - 1, Math.max(0, prev.lines.length - 1))
        }
        return current
      }
      return Math.min(last, Math.max(0, current + delta))
    })
  }, [displayLines.length, goTo, index])

  const toggleRunning = useCallback(() => {
    setRunning((current) => {
      const now = performance.now()
      if (current) {
        elapsedRef.current += now - startedAtRef.current
        pageElapsedRef.current += now - pageStartedAtRef.current
        setElapsedMs(elapsedRef.current)
        setPageElapsedMs(pageElapsedRef.current)
        return false
      }
      startedAtRef.current = now
      pageStartedAtRef.current = now
      return true
    })
  }, [])

  const resetClock = useCallback(() => {
    elapsedRef.current = 0
    pageElapsedRef.current = 0
    startedAtRef.current = performance.now()
    pageStartedAtRef.current = performance.now()
    setElapsedMs(0)
    setPageElapsedMs(0)
  }, [])

  useEffect(() => {
    if (!running) return undefined
    const tick = () => {
      const now = performance.now()
      const nextElapsed = elapsedRef.current + (now - startedAtRef.current)
      const nextPageElapsed = pageElapsedRef.current + (now - pageStartedAtRef.current)
      setElapsedMs(nextElapsed)
      setPageElapsedMs(nextPageElapsed)
      if (drill && nextPageElapsed >= page.seconds * 1000 && index < CONTRACT_RENEWAL_PAGES.length - 1) {
        pageElapsedRef.current = 0
        pageStartedAtRef.current = now
        setIndex((current) => Math.min(CONTRACT_RENEWAL_PAGES.length - 1, current + 1))
        setLine(0)
        setPageElapsedMs(0)
      }
    }
    const id = window.setInterval(tick, 200)
    return () => window.clearInterval(id)
  }, [drill, index, page.seconds, running])

  useEffect(() => {
    const onKey = (event) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
      if (event.key === 'ArrowRight' || event.key === 'j') {
        event.preventDefault()
        goTo(index + 1)
      } else if (event.key === 'ArrowLeft' || event.key === 'k') {
        event.preventDefault()
        goTo(index - 1)
      } else if (event.key === 'ArrowDown' || event.key === 'n') {
        event.preventDefault()
        stepLine(1)
      } else if (event.key === 'ArrowUp' || event.key === 'p') {
        event.preventDefault()
        stepLine(-1)
      } else if (event.key === ' ') {
        event.preventDefault()
        toggleRunning()
      } else if (event.key === 'f') {
        event.preventDefault()
        setStage((value) => !value)
      } else if (event.key === 'r') {
        event.preventDefault()
        resetClock()
      } else if (event.key === 'Escape') {
        setStage(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goTo, index, resetClock, stepLine, toggleRunning])

  const overtimeHint = useMemo(() => {
    if (totalRemainingMs > 90 * 1000) return ''
    if (index <= 5) return '时间不够就砍第 5 页和第 8 页，第 7 页和第 9 页不能砍。'
    if (index === 7) return '这页收成一句，把时间留给不足和改进。'
    return ''
  }, [index, totalRemainingMs])

  return (
    <AdminPage compact>
      <div className="space-y-4 px-4 pb-8 pt-5 sm:px-5 md:px-6">
        <header className="flex flex-col gap-3 border-b border-[var(--admin-line-soft)] pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="mb-0 font-mono text-[11px] tracking-wide text-[#8b8d82]">{CONTRACT_RENEWAL_DECK}</p>
              <StatusPill tone="neutral"><IconLock size={13} />仅站长可见</StatusPill>
            </div>
            <h1 className="mt-1 font-serif text-[1.7rem] font-semibold tracking-[-0.02em] text-[#15140f] dark:text-gray-100">{CONTRACT_RENEWAL_TITLE}</h1>
            <p className="mb-0 mt-1 max-w-2xl text-[13px] leading-6 text-[#5f6158] dark:text-gray-400">对着页说。数字放慢。看人，不看稿。</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ClockCard label="总时长" value={formatClock(totalRemainingMs)} tone={clockTone(totalRemainingMs, CONTRACT_RENEWAL_TOTAL_SECONDS * 1000)} />
            <ClockCard label={`第 ${page.id} 页`} value={formatClock(pageRemainingMs)} tone={clockTone(pageRemainingMs, page.seconds * 1000)} />
            <AdminButton variant="primary" onClick={toggleRunning}>
              {running ? <IconPlayerPause size={16} /> : <IconPlayerPlay size={16} />}
              {running ? '暂停' : '开始计时'}
            </AdminButton>
            <AdminButton onClick={resetClock}><IconRefresh size={16} />复位</AdminButton>
            <AdminButton onClick={() => setStage(true)}><IconFocus2 size={16} />提词全屏</AdminButton>
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-2">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`rounded-full border px-3 py-1.5 text-[13px] ${
                tab === item.id
                  ? 'border-[#15140f] bg-[#15140f] text-white dark:border-gray-100 dark:bg-gray-100 dark:text-[#111827]'
                  : 'border-[#d4d6cc] text-[#5c5e55] hover:border-[#8b8d82] dark:border-[#2d3744] dark:text-gray-300'
              }`}
            >
              {item.label}
            </button>
          ))}
          <label className="ml-auto flex items-center gap-2 text-[12px] text-[#6a6c63]">
            <input type="checkbox" checked={drill} onChange={(event) => setDrill(event.target.checked)} />
            到点翻页
          </label>
        </div>

        {overtimeHint ? <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">{overtimeHint}</p> : null}

        {tab === 'rehearse' ? (
          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
            <SlidePanel page={page} />
            <NotesPanel page={page} line={line} lines={displayLines} cut={Boolean(useCut)} onPickLine={setLine} />
          </div>
        ) : null}

        {tab === 'prompt' ? <PromptPanel page={page} line={line} lines={displayLines} onPickLine={setLine} /> : null}
        {tab === 'qa' ? <QuestionPanel /> : null}
        {tab === 'numbers' ? <NumberPanel /> : null}

        <Pager index={index} onChange={goTo} />
        <p className="text-[11px] leading-5 text-[#8b8d82]">键盘：左右翻页，上下换句，空格计时，F 提词全屏，R 复位。</p>
      </div>

      {stage ? createPortal(
        <StageView
          page={page}
          line={line}
          lines={displayLines}
          totalLabel={formatClock(totalRemainingMs)}
          pageLabel={formatClock(pageRemainingMs)}
          running={running}
          onClose={() => setStage(false)}
          onToggle={toggleRunning}
          onPrev={() => goTo(index - 1)}
          onNext={() => goTo(index + 1)}
          onLine={stepLine}
        />,
        document.body
      ) : null}
    </AdminPage>
  )
}

function ClockCard({ label, value, tone }) {
  return (
    <div className="min-w-[7.5rem] rounded-xl border border-[#d9dbd1] bg-white px-3 py-2 dark:border-[#2c3744] dark:bg-[#10161f]">
      <p className="flex items-center gap-1 font-mono text-[10px] text-[#8b8d82]"><IconClock size={12} />{label}</p>
      <p className={`mt-0.5 font-mono text-2xl font-semibold leading-none ${tone}`}>{value}</p>
    </div>
  )
}

function SlidePanel({ page }) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-[#d7d9cf] bg-white dark:border-[#2c3744] dark:bg-[#10161f]">
      <img key={page.slideSrc} src={page.slideSrc} alt={`PPT 第 ${page.id} 页：${page.title}`} className="block h-auto w-full bg-white dark:bg-[#10161f]" />
      <figcaption className="flex items-center justify-between gap-3 border-t border-[#eceee6] bg-[#f7f7f2] px-3 py-2 text-[11px] text-[#5f6158] dark:border-[#303b48] dark:bg-[#161d27] dark:text-gray-400">
        <span>第 {page.id} / {CONTRACT_RENEWAL_PAGES.length} 页 · {page.title}</span>
        <span>{page.seconds} 秒</span>
      </figcaption>
    </figure>
  )
}

function NotesPanel({ page, line, lines, cut, onPickLine }) {
  return (
    <section className="rounded-2xl border border-[#d7d9cf] bg-white p-4 dark:border-[#2c3744] dark:bg-[#10161f]">
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill tone="info">{page.job}</StatusPill>
        <span className="text-[12px] text-[#6a6c63]">{page.stance}</span>
        {cut ? <StatusPill tone="warning">超时压缩</StatusPill> : null}
      </div>
      <ol className="mt-4 space-y-2">
        {lines.map((item, itemIndex) => (
          <li key={item}>
            <button
              type="button"
              onClick={() => onPickLine(itemIndex)}
              className={`block w-full rounded-xl px-3 py-2.5 text-left text-[15px] leading-7 ${
                itemIndex === line
                  ? 'bg-[#15140f] text-white dark:bg-gray-100 dark:text-[#111827]'
                  : 'text-[#2b2d26] hover:bg-[#f4f5ef] dark:text-gray-200 dark:hover:bg-[#161d27]'
              }`}
            >
              {item}
            </button>
          </li>
        ))}
      </ol>
      <dl className="mt-4 space-y-2 border-t border-dashed border-[#dcded4] pt-3 text-[12px] leading-6 text-[#5f6158] dark:border-[#303b48] dark:text-gray-400">
        <div><dt className="font-semibold text-[#15140f] dark:text-gray-200">手指</dt><dd className="mb-0">{page.point}</dd></div>
        <div><dt className="font-semibold text-[#15140f] dark:text-gray-200">别说</dt><dd className="mb-0">{page.avoid}</dd></div>
      </dl>
    </section>
  )
}

function PromptPanel({ page, line, lines, onPickLine }) {
  const current = lines[line] || ''
  const next = lines[line + 1]
  return (
    <section className="rounded-2xl border border-[#d7d9cf] bg-[#15140f] px-5 py-8 text-white dark:border-[#2c3744]">
      <p className="font-mono text-[12px] text-[#b7b9ae]">第 {page.id} 页 · {page.title} · {page.job}</p>
      <button type="button" onClick={() => onPickLine(Math.min(lines.length - 1, line + 1))} className="mt-6 block w-full text-left font-serif text-[clamp(1.7rem,4vw,3rem)] font-semibold leading-snug tracking-[-0.03em]">
        {current}
      </button>
      {next ? <p className="mt-6 text-[15px] leading-7 text-[#9a9c91]">下一句　{next}</p> : <p className="mt-6 text-[15px] text-[#9a9c91]">这页说完，往右翻。</p>}
    </section>
  )
}

function QuestionPanel() {
  const [openId, setOpenId] = useState(CONTRACT_RENEWAL_QUESTIONS[0].id)
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {CONTRACT_RENEWAL_QUESTIONS.map((item) => {
        const open = item.id === openId
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setOpenId(item.id)}
            className={`rounded-2xl border p-4 text-left ${open ? 'border-[#15140f] bg-white dark:border-gray-200 dark:bg-[#10161f]' : 'border-[#d7d9cf] bg-[#f7f7f2] dark:border-[#2c3744] dark:bg-[#0d141c]'}`}
          >
            <p className="text-[15px] font-semibold leading-6 text-[#15140f] dark:text-gray-100">{item.q}</p>
            {open ? <p className="mb-0 mt-3 text-[14px] leading-7 text-[#3f4139] dark:text-gray-300">{item.a}</p> : <p className="mb-0 mt-2 text-[12px] text-[#8b8d82]">点开看答法</p>}
          </button>
        )
      })}
    </div>
  )
}

function NumberPanel() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {CONTRACT_RENEWAL_NUMBERS.map((item) => (
        <article key={item.label} className="rounded-2xl border border-[#d7d9cf] bg-white p-4 dark:border-[#2c3744] dark:bg-[#10161f]">
          <p className="text-[11px] text-[#8b8d82]">{item.label}</p>
          <p className="mt-1 font-serif text-2xl font-semibold tracking-[-0.03em] text-[#15140f] dark:text-gray-100">{item.value}</p>
          <p className="mb-0 mt-2 text-[12px] leading-5 text-[#6a6c63] dark:text-gray-400">{item.note}</p>
        </article>
      ))}
    </div>
  )
}

function Pager({ index, onChange }) {
  return (
    <nav className="flex flex-wrap items-center gap-2" aria-label="PPT 页码">
      <AdminButton onClick={() => onChange(index - 1)} disabled={index === 0}><IconChevronLeft size={16} />上一页</AdminButton>
      {CONTRACT_RENEWAL_PAGES.map((item, itemIndex) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(itemIndex)}
          className={`h-9 min-w-9 rounded-lg px-2 font-mono text-[12px] ${
            itemIndex === index
              ? 'bg-[#15140f] text-white dark:bg-gray-100 dark:text-[#111827]'
              : 'border border-[#d4d6cc] text-[#5c5e55] dark:border-[#2d3744] dark:text-gray-300'
          }`}
        >
          {item.id}
        </button>
      ))}
      <AdminButton onClick={() => onChange(index + 1)} disabled={index === CONTRACT_RENEWAL_PAGES.length - 1}>下一页<IconChevronRight size={16} /></AdminButton>
    </nav>
  )
}

function StageView({ page, line, lines, totalLabel, pageLabel, running, onClose, onToggle, onPrev, onNext, onLine }) {
  const current = lines[line] || ''
  const next = lines[line + 1]
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-[#0e0f0c] text-white">
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-[12px] text-[#b7b9ae]">
        <p className="mb-0">第 {page.id} / {CONTRACT_RENEWAL_PAGES.length} 页 · {page.title}</p>
        <p className="mb-0 font-mono">总 {totalLabel}　本页 {pageLabel}　{running ? '计时中' : '已暂停'}</p>
      </div>
      <div className="grid flex-1 gap-4 overflow-auto px-4 pb-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <img key={page.slideSrc} src={page.slideSrc} alt="" className="w-full rounded-xl bg-white object-contain" />
        <div className="flex flex-col justify-center px-2">
          <p className="text-[13px] text-[#9a9c91]">{page.job}</p>
          <p className="mt-4 font-serif text-[clamp(1.8rem,4.4vw,3.4rem)] font-semibold leading-snug tracking-[-0.03em]">{current}</p>
          {next ? <p className="mt-6 text-[16px] leading-7 text-[#8d8f84]">下一句　{next}</p> : <p className="mt-6 text-[16px] text-[#8d8f84]">这页说完，往右翻。</p>}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-white/10 px-4 py-3">
        <AdminButton onClick={onPrev}>上一页</AdminButton>
        <AdminButton onClick={() => onLine(-1)}>上一句</AdminButton>
        <AdminButton variant="primary" onClick={onToggle}>{running ? '暂停' : '开始'}</AdminButton>
        <AdminButton onClick={() => onLine(1)}>下一句</AdminButton>
        <AdminButton onClick={onNext}>下一页</AdminButton>
        <AdminButton className="ml-auto" onClick={onClose}>退出全屏</AdminButton>
      </div>
    </div>
  )
}
