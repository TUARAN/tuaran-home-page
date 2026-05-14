'use client'

import { useState } from 'react'

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
  const [done, setDone] = useState(false)

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(text)
      setDone(true)
      window.setTimeout(() => setDone(false), 2000)
    } catch {
      setDone(false)
    }
  }

  const base =
    'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#d9d0c2] bg-white/90 text-[#5f5a4d] shadow-sm transition hover:border-[#c4b8a4] hover:bg-[#faf7f2] dark:border-[#3a4757] dark:bg-[#151c25] dark:text-[#c8d0dc] dark:hover:border-[#4f5f73] dark:hover:bg-[#1a2430]'

  return (
    <button
      type="button"
      onClick={handleClick}
      className={[base, className].filter(Boolean).join(' ')}
      aria-label={done ? '已复制到剪贴板' : '复制完整自我介绍（社群、文章 CTA）'}
      title={done ? '已复制' : '复制完整自我介绍（社群、文章 CTA）'}
    >
      {done ? <IconCheck className="text-emerald-600 dark:text-emerald-400" /> : <IconCopy />}
    </button>
  )
}
