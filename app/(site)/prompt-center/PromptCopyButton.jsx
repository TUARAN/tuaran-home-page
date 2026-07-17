'use client'

import { useEffect, useRef, useState } from 'react'

export default function PromptCopyButton({ prompt }) {
  const [state, setState] = useState('idle')

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt)
      setState('copied')
    } catch {
      setState('error')
    }
    setTimeout(() => setState('idle'), 1600)
  }

  return (
    <button
      type="button"
      onClick={copyPrompt}
      className="inline-flex shrink-0 items-center rounded-full border border-[#8b5a1f] bg-[#8b5a1f] px-3 py-1.5 font-mono text-xs text-white transition-colors hover:bg-[#724817] dark:border-[#a1ab76] dark:bg-[#a1ab76] dark:text-[#1a1207] dark:hover:bg-[#9ba475]"
    >
      {state === 'copied' ? '✓ 已复制' : state === 'error' ? '× 复制失败' : '⧉ 复制 Prompt'}
    </button>
  )
}

export function PromptDetailButton({ id, title, description, prompt }) {
  const [open, setOpen] = useState(false)
  const [copyState, setCopyState] = useState('idle')
  const closeButtonRef = useRef(null)
  const titleId = `prompt-detail-${id}`

  useEffect(() => {
    if (!open) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()
    function onKeyDown(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopyState('copied')
    } catch {
      setCopyState('error')
    }
    setTimeout(() => setCopyState('idle'), 1600)
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1 text-xs font-medium text-[#8b5a1f] transition-colors hover:text-[#724817] dark:text-[#a1ab76] dark:hover:text-[#9ba475]">查看完整模板 →</button>

      {open ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 backdrop-blur-[2px] sm:items-center sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false) }}>
          <section role="dialog" aria-modal="true" aria-labelledby={titleId} className="flex h-full w-full flex-col bg-white shadow-2xl dark:bg-[#0d151e] sm:h-auto sm:max-h-[84vh] sm:max-w-3xl sm:rounded-xl">
            <header className="flex items-start justify-between gap-4 border-b border-[#dedfd5] px-4 py-4 dark:border-[#263241] sm:px-6">
              <div className="min-w-0">
                <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#8b5a1f] dark:text-[#a1ab76]">Prompt 完整模板</p>
                <h2 id={titleId} className="mb-1 border-b-0 pb-0 font-serif text-xl font-semibold text-[#1c1d18] dark:text-gray-100 sm:text-2xl">{title}</h2>
                <p className="mb-0 text-xs leading-5 text-[#6e7064] dark:text-gray-400">{description}</p>
              </div>
              <button ref={closeButtonRef} type="button" onClick={() => setOpen(false)} aria-label="关闭模板面板" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg text-[#555640] hover:bg-[#eaebe3] dark:text-gray-300 dark:hover:bg-[#17212d]">×</button>
            </header>

            <div className="flex min-h-0 flex-1 flex-col px-4 py-4 sm:px-6">
              <div className="flex justify-end">
                <button type="button" onClick={copyPrompt} className="inline-flex items-center rounded-full border border-[#8b5a1f] bg-[#8b5a1f] px-3 py-1.5 font-mono text-xs text-white hover:bg-[#724817] dark:border-[#a1ab76] dark:bg-[#a1ab76] dark:text-[#1a1207] dark:hover:bg-[#9ba475]">
                  {copyState === 'copied' ? '✓ 已复制模板' : copyState === 'error' ? '× 复制失败' : '⧉ 复制完整模板'}
                </button>
              </div>
              <pre className="mt-3 min-h-0 flex-1 overflow-auto whitespace-pre-wrap rounded-lg bg-[#f3f1ea] p-4 font-mono text-xs leading-6 text-[#33352d] dark:bg-[#091018] dark:text-gray-200 sm:max-h-[58vh]"><code>{prompt}</code></pre>
            </div>
          </section>
        </div>
      ) : null}
    </>
  )
}
