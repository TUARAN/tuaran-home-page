'use client'

import { useEffect, useRef, useState } from 'react'

function IconCopy({ className }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M8 5.818A2 2 0 0110.818 3h6.364A2 2 0 0120 5.818v6.364A2 2 0 0117.182 15h-6.364A2 2 0 018 12.182V5.818z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.818 9H5a2 2 0 00-2 2v6.364A2 2 0 005 19.818h6.364A2 2 0 0014 17.818V16"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconCheck({ className }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function CopyIntroButton({ text, className }) {
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setDone(true)
      window.setTimeout(() => setDone(false), 2000)
    } catch {
      setDone(false)
    }
  }

  const triggerBase =
    'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#d9d0c2] bg-white/90 text-[#5f5a4d] shadow-sm transition hover:border-[#c4b8a4] hover:bg-[#faf7f2] dark:border-[#3a4757] dark:bg-[#151c25] dark:text-[#c8d0dc] dark:hover:border-[#4f5f73] dark:hover:bg-[#1a2430]'

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={[triggerBase, className].filter(Boolean).join(' ')}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="预览并复制完整自我介绍"
        title="预览并复制完整自我介绍"
      >
        <IconCopy />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="自我介绍预览"
          className="absolute right-0 top-[calc(100%+8px)] z-30 w-[min(86vw,360px)] rounded-2xl border border-[#e2d9c8] bg-white/98 p-3 text-[13px] shadow-[0_18px_48px_rgba(82,69,45,0.16)] backdrop-blur dark:border-[#36404f] dark:bg-[#10161f]/98 dark:shadow-[0_18px_48px_rgba(0,0,0,0.55)]"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#9c8f79] dark:text-[#93a0b3]">
              Preview · 自我介绍
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 rounded-full border border-[#d9d0c2] bg-[#faf7f2] px-2.5 py-1 font-mono text-[11px] tracking-[0.08em] text-[#5f4a2a] transition hover:border-[#c4b8a4] hover:bg-[#f3ede1] dark:border-[#3a4757] dark:bg-[#19212b] dark:text-[#d8c8a8] dark:hover:border-[#4f5f73] dark:hover:bg-[#1c2531]"
            >
              {done ? (
                <>
                  <IconCheck className="text-emerald-600 dark:text-emerald-400" />
                  已复制
                </>
              ) : (
                <>
                  <IconCopy />
                  复制
                </>
              )}
            </button>
          </div>
          <pre className="m-0 max-h-[42vh] overflow-auto whitespace-pre-wrap break-words rounded-xl bg-[#fbf8f2] p-3 font-sans text-[12.5px] leading-[1.7] text-[#3a352c] dark:bg-[#0c1219] dark:text-[#d4cdbe]">
{text}
          </pre>
        </div>
      ) : null}
    </div>
  )
}
