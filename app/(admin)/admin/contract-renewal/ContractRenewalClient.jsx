'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  IconArrowBackUp,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconDeviceFloppy,
  IconFocus2,
  IconLock,
  IconPlayerPause,
  IconPlayerPlay,
  IconPrinter,
  IconRefresh,
} from '@tabler/icons-react'

import {
  briefingEndingSoon,
  briefingMinutes,
  briefingRemainingMs,
  briefingTimedOut,
  buildContractRenewalPrintHtml,
  cloneContractRenewalBriefing,
  CONTRACT_RENEWAL_LOCAL_STORAGE_KEY,
  CONTRACT_RENEWAL_MAX_MINUTES,
  CONTRACT_RENEWAL_MIN_MINUTES,
  CONTRACT_RENEWAL_WARN_SECONDS,
  defaultContractRenewalBriefing,
  linesFromBriefingText,
  minutesToBriefingSeconds,
  serializeContractRenewalBriefing,
  textFromBriefingLines,
} from '../../../../lib/contractRenewalBriefing'
import { AdminButton, AdminPage, CollapsibleSection, StatusPill } from '../../components/ui'

const TABS = [
  { id: 'rehearse', label: '对稿' },
  { id: 'prompt', label: '提词' },
  { id: 'copy', label: '文案' },
  { id: 'qa', label: '答问' },
  { id: 'numbers', label: '数字' },
]

const fieldClass = 'w-full rounded-lg border border-[#d4d6cc] bg-white px-3 py-2 text-[14px] text-[#15140f] outline-none focus:border-[#15140f] dark:border-[#2d3744] dark:bg-[#0d141c] dark:text-gray-100 dark:focus:border-gray-200'
const textareaClass = `${fieldClass} min-h-[7.5rem] leading-7`

function formatClock(ms) {
  const safe = Math.max(0, Math.round(ms / 1000))
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function clockTone(remainingMs, warnMs) {
  if (remainingMs <= 0) return 'text-red-700 dark:text-red-300'
  if (remainingMs <= warnMs) return 'text-amber-700 dark:text-amber-300'
  return 'text-[#15140f] dark:text-gray-100'
}

async function readJson(response) {
  try { return await response.json() } catch { return null }
}

function readLocalBriefing() {
  try {
    const raw = window.localStorage.getItem(CONTRACT_RENEWAL_LOCAL_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeLocalBriefing(briefing) {
  window.localStorage.setItem(CONTRACT_RENEWAL_LOCAL_STORAGE_KEY, JSON.stringify(serializeContractRenewalBriefing(briefing)))
}

function clearLocalBriefing() {
  window.localStorage.removeItem(CONTRACT_RENEWAL_LOCAL_STORAGE_KEY)
}

function exportBriefingPdf(briefing) {
  const html = buildContractRenewalPrintHtml(briefing)
  const printScript = '<script>window.addEventListener("load",function(){window.setTimeout(function(){window.print()},350)});</script>'
  const printHtml = html.replace('</body>', `${printScript}</body>`)
  const blob = new Blob([printHtml], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const popup = window.open(url, '_blank')
  if (!popup) {
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${briefing.title || '续签述职'}-打印稿.html`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export default function ContractRenewalClient() {
  const [briefing, setBriefing] = useState(() => defaultContractRenewalBriefing())
  const [index, setIndex] = useState(0)
  const [line, setLine] = useState(0)
  const [tab, setTab] = useState('rehearse')
  const [stage, setStage] = useState(false)
  const [running, setRunning] = useState(false)
  const [drill, setDrill] = useState(false)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [pageElapsedMs, setPageElapsedMs] = useState(0)
  const [dirty, setDirty] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [persistent, setPersistent] = useState(true)
  const [source, setSource] = useState('default')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const elapsedRef = useRef(0)
  const pageElapsedRef = useRef(0)
  const startedAtRef = useRef(0)
  const pageStartedAtRef = useRef(0)

  const pages = briefing.pages
  const page = pages[Math.min(index, pages.length - 1)]
  const lines = page.lines
  const totalRemainingMs = briefingRemainingMs(elapsedMs, briefing.totalSeconds)
  const pageRemainingMs = briefingRemainingMs(pageElapsedMs, page.seconds)
  const late = elapsedMs > pages.slice(0, index).reduce((sum, item) => sum + item.seconds, 0) * 1000 + page.seconds * 1000
  const useCut = drill && late && page.cutLines?.length
  const displayLines = useCut ? page.cutLines : lines
  const endingSoon = briefingEndingSoon(totalRemainingMs)
  const timedOut = briefingTimedOut(totalRemainingMs)

  const markDirty = useCallback((next) => {
    setBriefing(next)
    setDirty(true)
    setMessage('')
  }, [])

  const updateBriefing = useCallback((patch) => {
    setBriefing((current) => ({ ...current, ...patch }))
    setDirty(true)
    setMessage('')
  }, [])

  const updatePage = useCallback((pageId, patch) => {
    setBriefing((current) => ({
      ...current,
      pages: current.pages.map((item) => item.id === pageId ? { ...item, ...patch } : item),
    }))
    setDirty(true)
    setMessage('')
  }, [])

  const goTo = useCallback((nextIndex, nextLine = 0) => {
    const bounded = Math.min(pages.length - 1, Math.max(0, nextIndex))
    setIndex(bounded)
    setLine(nextLine)
    pageElapsedRef.current = 0
    pageStartedAtRef.current = performance.now()
    setPageElapsedMs(0)
  }, [pages.length])

  const stepLine = useCallback((delta) => {
    setLine((current) => {
      const last = displayLines.length - 1
      if (delta > 0 && current >= last) {
        if (index < pages.length - 1) goTo(index + 1, 0)
        return current
      }
      if (delta < 0 && current <= 0) {
        if (index > 0) {
          const prev = pages[index - 1]
          goTo(index - 1, Math.max(0, prev.lines.length - 1))
        }
        return current
      }
      return Math.min(last, Math.max(0, current + delta))
    })
  }, [displayLines.length, goTo, index, pages])

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

  const applyState = useCallback((data, nextSource, options = {}) => {
    setBriefing(cloneContractRenewalBriefing(data?.briefing))
    setPersistent(data?.persistent !== false)
    setSource(nextSource || data?.source || 'default')
    setDirty(false)
    if (!options.keepPlace) {
      setIndex(0)
      setLine(0)
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/contract-renewal', { cache: 'no-store', credentials: 'same-origin' })
      const data = await readJson(response)
      if (response.ok && data?.briefing) {
        const local = data.persistent === false ? readLocalBriefing() : null
        if (local) {
          applyState({ briefing: local, persistent: false }, 'local')
        } else {
          applyState(data)
          if (data.persistent !== false) clearLocalBriefing()
        }
        return
      }
      if (response.status === 503) {
        const local = readLocalBriefing()
        setPersistent(false)
        if (local) applyState({ briefing: local, persistent: false }, 'local')
        else applyState({ briefing: defaultContractRenewalBriefing(), persistent: false }, 'default')
        return
      }
      throw new Error(data?.error || `HTTP_${response.status}`)
    } catch (reason) {
      const local = readLocalBriefing()
      if (local) {
        applyState({ briefing: local, persistent: false }, 'local')
        setError('')
      } else {
        setError(reason?.message || 'FETCH_FAILED')
      }
    } finally {
      setLoading(false)
    }
  }, [applyState])

  const save = useCallback(async () => {
    setSaving(true)
    setError('')
    setMessage('')
    const payload = serializeContractRenewalBriefing(briefing)
    try {
      const response = await fetch('/api/admin/contract-renewal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ briefing: payload }),
      })
      const data = await readJson(response)
      if (response.ok && data?.briefing) {
        applyState(data, 'saved', { keepPlace: true })
        clearLocalBriefing()
        setMessage('文案已保存，下次打开会读取这份稿。')
        return
      }
      if (response.status === 503) {
        writeLocalBriefing(payload)
        applyState({ briefing: payload, persistent: false }, 'local', { keepPlace: true })
        setMessage('当前没有 D1，已保存在本机浏览器。')
        return
      }
      throw new Error(data?.detail || data?.error || `HTTP_${response.status}`)
    } catch (reason) {
      if (reason instanceof TypeError) {
        writeLocalBriefing(payload)
        applyState({ briefing: payload, persistent: false }, 'local', { keepPlace: true })
        setMessage('保存接口不可用，已先写入本机浏览器。')
        return
      }
      setError(reason?.message || 'SAVE_FAILED')
    } finally {
      setSaving(false)
    }
  }, [applyState, briefing])

  const resetCopy = useCallback(async () => {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const response = await fetch('/api/admin/contract-renewal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ reset: true }),
      })
      const data = await readJson(response)
      if (response.ok && data?.briefing) {
        applyState(data, 'default')
        clearLocalBriefing()
        setMessage('已恢复默认口播稿。')
        return
      }
      if (response.status === 503) {
        clearLocalBriefing()
        applyState({ briefing: defaultContractRenewalBriefing(), persistent: false }, 'default')
        setMessage('已恢复默认口播稿。')
        return
      }
      throw new Error(data?.detail || data?.error || `HTTP_${response.status}`)
    } catch (reason) {
      setError(reason?.message || 'RESET_FAILED')
    } finally {
      setSaving(false)
    }
  }, [applyState])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!running) return undefined
    const tick = () => {
      const now = performance.now()
      const nextElapsed = elapsedRef.current + (now - startedAtRef.current)
      const nextPageElapsed = pageElapsedRef.current + (now - pageStartedAtRef.current)
      setElapsedMs(nextElapsed)
      setPageElapsedMs(nextPageElapsed)
      if (drill && nextPageElapsed >= page.seconds * 1000 && index < pages.length - 1) {
        pageElapsedRef.current = 0
        pageStartedAtRef.current = now
        setIndex((current) => Math.min(pages.length - 1, current + 1))
        setLine(0)
        setPageElapsedMs(0)
      }
    }
    const id = window.setInterval(tick, 200)
    return () => window.clearInterval(id)
  }, [drill, index, page.seconds, pages.length, running])

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

  const sourceLabel = useMemo(() => {
    if (dirty) return '未保存'
    if (source === 'saved') return '已保存稿'
    if (source === 'local') return '本机稿'
    return '默认稿'
  }, [dirty, source])

  return (
    <AdminPage compact>
      <div className="space-y-4 px-4 pb-8 pt-5 sm:px-5 md:px-6">
        <header className="flex flex-col gap-3 border-b border-[var(--admin-line-soft)] pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="mb-0 font-mono text-[11px] tracking-wide text-[#8b8d82]">{briefing.deck}</p>
              <StatusPill tone="neutral"><IconLock size={13} />仅站长可见</StatusPill>
              <StatusPill tone={dirty ? 'warning' : source === 'saved' ? 'success' : 'neutral'}>{sourceLabel}</StatusPill>
            </div>
            <h1 className="mt-1 font-serif text-[1.7rem] font-semibold tracking-[-0.02em] text-[#15140f] dark:text-gray-100">{briefing.title}</h1>
            <p className="mb-0 mt-1 max-w-2xl text-[13px] leading-6 text-[#5f6158] dark:text-gray-400">对着页说。数字放慢。看人，不看稿。</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex h-9 items-center gap-1.5 rounded-xl border border-[#d9dbd1] bg-white px-3 text-[12px] text-[#6a6c63] dark:border-[#2c3744] dark:bg-[#10161f]">
              倒计时
              <input
                type="number"
                min={CONTRACT_RENEWAL_MIN_MINUTES}
                max={CONTRACT_RENEWAL_MAX_MINUTES}
                value={briefingMinutes(briefing.totalSeconds)}
                onChange={(event) => updateBriefing({ totalSeconds: minutesToBriefingSeconds(event.target.value) })}
                className="h-7 w-12 rounded-md border-0 bg-transparent text-center font-mono text-sm text-[#15140f] outline-none dark:text-gray-100"
              />
              分钟
            </label>
            <ClockCard label="倒计时" value={formatClock(totalRemainingMs)} tone={clockTone(totalRemainingMs, CONTRACT_RENEWAL_WARN_SECONDS * 1000)} />
            <ClockCard label={`第 ${page.id} 页`} value={formatClock(pageRemainingMs)} tone={clockTone(pageRemainingMs, Math.min(CONTRACT_RENEWAL_WARN_SECONDS, Math.max(5, Math.round(page.seconds * 0.2))) * 1000)} />
            <AdminButton variant="primary" onClick={toggleRunning}>
              {running ? <IconPlayerPause size={16} /> : <IconPlayerPlay size={16} />}
              {running ? '暂停' : '开始计时'}
            </AdminButton>
            <AdminButton onClick={resetClock}><IconRefresh size={16} />复位</AdminButton>
            <AdminButton onClick={() => setStage(true)}><IconFocus2 size={16} />提词全屏</AdminButton>
            <AdminButton onClick={save} disabled={saving || loading}><IconDeviceFloppy size={16} />{saving ? '保存中…' : '保存'}</AdminButton>
            <AdminButton onClick={() => exportBriefingPdf(briefing)}><IconPrinter size={16} />导出 PDF</AdminButton>
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

        {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">{error}</p> : null}
        {message ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">{message}</p> : null}
        {!persistent ? <p className="rounded-lg border border-[#d4d6cc] bg-[#f7f7f2] px-3 py-2 text-[13px] text-[#5f6158] dark:border-[#2d3744] dark:bg-[#10161f] dark:text-gray-400">当前环境没有 D1，保存会写到本机浏览器。</p> : null}
        {endingSoon ? <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[14px] font-medium text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">还剩 {formatClock(totalRemainingMs)}，开始收束。</p> : null}
        {timedOut ? <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[14px] font-medium text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">时间到。</p> : null}

        {tab === 'rehearse' ? (
          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
            <SlidePanel page={page} pageCount={pages.length} />
            <NotesPanel page={page} line={line} lines={displayLines} cut={Boolean(useCut)} onPickLine={setLine} />
          </div>
        ) : null}

        {tab === 'prompt' ? <PromptPanel page={page} line={line} lines={displayLines} onPickLine={setLine} /> : null}
        {tab === 'copy' ? (
          <CopyPanel
            briefing={briefing}
            saving={saving}
            onBriefing={markDirty}
            onPage={updatePage}
            onReset={resetCopy}
            onSave={save}
            onExport={() => exportBriefingPdf(briefing)}
          />
        ) : null}
        {tab === 'qa' ? <QuestionPanel questions={briefing.questions} /> : null}
        {tab === 'numbers' ? <NumberPanel numbers={briefing.numbers} /> : null}

        <Pager pages={pages} index={index} onChange={goTo} />
        <p className="text-[11px] leading-5 text-[#8b8d82]">键盘：左右翻页，上下换句，空格计时，F 提词全屏，R 复位。剩 {CONTRACT_RENEWAL_WARN_SECONDS} 秒会提醒收束。</p>
      </div>

      {stage ? createPortal(
        <StageView
          page={page}
          pageCount={pages.length}
          line={line}
          lines={displayLines}
          totalLabel={formatClock(totalRemainingMs)}
          pageLabel={formatClock(pageRemainingMs)}
          running={running}
          endingSoon={endingSoon}
          timedOut={timedOut}
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

function SlidePanel({ page, pageCount }) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-[#d7d9cf] bg-white dark:border-[#2c3744] dark:bg-[#10161f]">
      <img key={page.slideSrc} src={page.slideSrc} alt={`PPT 第 ${page.id} 页：${page.title}`} className="block h-auto w-full bg-white dark:bg-[#10161f]" />
      <figcaption className="flex items-center justify-between gap-3 border-t border-[#eceee6] bg-[#f7f7f2] px-3 py-2 text-[11px] text-[#5f6158] dark:border-[#303b48] dark:bg-[#161d27] dark:text-gray-400">
        <span>第 {page.id} / {pageCount} 页 · {page.title}</span>
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
          <li key={`${itemIndex}-${item}`}>
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

function CopyPanel({ briefing, saving, onBriefing, onPage, onReset, onSave, onExport }) {
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-[#d7d9cf] bg-white p-4 dark:border-[#2c3744] dark:bg-[#10161f]">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-[12px] text-[#6a6c63]">标题
            <input className={`${fieldClass} mt-1`} value={briefing.title} onChange={(event) => onBriefing({ ...briefing, title: event.target.value })} />
          </label>
          <label className="text-[12px] text-[#6a6c63]">版本
            <input className={`${fieldClass} mt-1`} value={briefing.deck} onChange={(event) => onBriefing({ ...briefing, deck: event.target.value })} />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <AdminButton variant="primary" onClick={onSave} disabled={saving}><IconDeviceFloppy size={16} />保存文案</AdminButton>
          <AdminButton onClick={onExport}><IconPrinter size={16} />导出 PDF</AdminButton>
          <AdminButton onClick={onReset} disabled={saving}><IconArrowBackUp size={16} />恢复默认</AdminButton>
        </div>
      </section>

      {briefing.pages.map((page) => (
        <CollapsibleSection
          key={page.id}
          title={`第 ${page.id} 页 · ${page.title}`}
          description={`${page.seconds} 秒 · ${page.lines.length} 句`}
          defaultOpen={page.id === 1}
        >
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-[12px] text-[#6a6c63]">页标题
              <input className={`${fieldClass} mt-1`} value={page.title} onChange={(event) => onPage(page.id, { title: event.target.value })} />
            </label>
            <label className="text-[12px] text-[#6a6c63]">本页秒数
              <input type="number" min="5" max="180" className={`${fieldClass} mt-1`} value={page.seconds} onChange={(event) => onPage(page.id, { seconds: Number(event.target.value) })} />
            </label>
            <label className="text-[12px] text-[#6a6c63]">任务
              <input className={`${fieldClass} mt-1`} value={page.job} onChange={(event) => onPage(page.id, { job: event.target.value })} />
            </label>
            <label className="text-[12px] text-[#6a6c63]">姿态
              <input className={`${fieldClass} mt-1`} value={page.stance} onChange={(event) => onPage(page.id, { stance: event.target.value })} />
            </label>
            <label className="text-[12px] text-[#6a6c63]">手指
              <input className={`${fieldClass} mt-1`} value={page.point} onChange={(event) => onPage(page.id, { point: event.target.value })} />
            </label>
            <label className="text-[12px] text-[#6a6c63]">别说
              <input className={`${fieldClass} mt-1`} value={page.avoid} onChange={(event) => onPage(page.id, { avoid: event.target.value })} />
            </label>
          </div>
          <label className="mt-3 block text-[12px] text-[#6a6c63]">口播稿，一句一行
            <textarea className={`${textareaClass} mt-1`} value={textFromBriefingLines(page.lines)} onChange={(event) => onPage(page.id, { lines: linesFromBriefingText(event.target.value) })} />
          </label>
          <label className="mt-3 block text-[12px] text-[#6a6c63]">压缩稿，可留空
            <textarea className={`${textareaClass} mt-1`} value={textFromBriefingLines(page.cutLines || [])} onChange={(event) => onPage(page.id, { cutLines: linesFromBriefingText(event.target.value) })} />
          </label>
        </CollapsibleSection>
      ))}

      <CollapsibleSection title="答问" description={`${briefing.questions.length} 题`}>
        <div className="space-y-4">
          {briefing.questions.map((item, itemIndex) => (
            <div key={item.id} className="grid gap-3">
              <label className="text-[12px] text-[#6a6c63]">问题
                <input className={`${fieldClass} mt-1`} value={item.q} onChange={(event) => {
                  const questions = briefing.questions.map((question, index) => index === itemIndex ? { ...question, q: event.target.value } : question)
                  onBriefing({ ...briefing, questions })
                }} />
              </label>
              <label className="text-[12px] text-[#6a6c63]">答法
                <textarea className={`${textareaClass} mt-1 min-h-[5rem]`} value={item.a} onChange={(event) => {
                  const questions = briefing.questions.map((question, index) => index === itemIndex ? { ...question, a: event.target.value } : question)
                  onBriefing({ ...briefing, questions })
                }} />
              </label>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="数字" description={`${briefing.numbers.length} 项`}>
        <div className="grid gap-3 md:grid-cols-2">
          {briefing.numbers.map((item, itemIndex) => (
            <div key={`${item.label}-${itemIndex}`} className="rounded-xl border border-[#eceee6] p-3 dark:border-[#303b48]">
              <input className={`${fieldClass} mb-2`} value={item.label} onChange={(event) => {
                const numbers = briefing.numbers.map((entry, index) => index === itemIndex ? { ...entry, label: event.target.value } : entry)
                onBriefing({ ...briefing, numbers })
              }} />
              <input className={`${fieldClass} mb-2`} value={item.value} onChange={(event) => {
                const numbers = briefing.numbers.map((entry, index) => index === itemIndex ? { ...entry, value: event.target.value } : entry)
                onBriefing({ ...briefing, numbers })
              }} />
              <input className={fieldClass} value={item.note} onChange={(event) => {
                const numbers = briefing.numbers.map((entry, index) => index === itemIndex ? { ...entry, note: event.target.value } : entry)
                onBriefing({ ...briefing, numbers })
              }} />
            </div>
          ))}
        </div>
      </CollapsibleSection>
    </div>
  )
}

function QuestionPanel({ questions }) {
  const [openId, setOpenId] = useState(questions[0]?.id)
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {questions.map((item) => {
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

function NumberPanel({ numbers }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {numbers.map((item) => (
        <article key={item.label} className="rounded-2xl border border-[#d7d9cf] bg-white p-4 dark:border-[#2c3744] dark:bg-[#10161f]">
          <p className="text-[11px] text-[#8b8d82]">{item.label}</p>
          <p className="mt-1 font-serif text-2xl font-semibold tracking-[-0.03em] text-[#15140f] dark:text-gray-100">{item.value}</p>
          <p className="mb-0 mt-2 text-[12px] leading-5 text-[#6a6c63] dark:text-gray-400">{item.note}</p>
        </article>
      ))}
    </div>
  )
}

function Pager({ pages, index, onChange }) {
  return (
    <nav className="flex flex-wrap items-center gap-2" aria-label="PPT 页码">
      <AdminButton onClick={() => onChange(index - 1)} disabled={index === 0}><IconChevronLeft size={16} />上一页</AdminButton>
      {pages.map((item, itemIndex) => (
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
      <AdminButton onClick={() => onChange(index + 1)} disabled={index === pages.length - 1}>下一页<IconChevronRight size={16} /></AdminButton>
    </nav>
  )
}

function StageView({ page, pageCount, line, lines, totalLabel, pageLabel, running, endingSoon, timedOut, onClose, onToggle, onPrev, onNext, onLine }) {
  const current = lines[line] || ''
  const next = lines[line + 1]
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-[#0e0f0c] text-white">
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-[12px] text-[#b7b9ae]">
        <p className="mb-0">第 {page.id} / {pageCount} 页 · {page.title}</p>
        <p className={`mb-0 font-mono ${timedOut ? 'text-red-300' : endingSoon ? 'text-amber-300' : ''}`}>倒计时 {totalLabel}　本页 {pageLabel}　{running ? '计时中' : '已暂停'}{endingSoon ? '　开始收束' : ''}{timedOut ? '　时间到' : ''}</p>
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
