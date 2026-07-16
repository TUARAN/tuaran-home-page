'use client'

import { useState } from 'react'

export default function McpConfigActions({ config }) {
  const [state, setState] = useState('idle')

  async function copyConfig() {
    try {
      await navigator.clipboard.writeText(config)
      setState('copied')
    } catch {
      setState('error')
    }
    setTimeout(() => setState('idle'), 1600)
  }

  return (
    <button
      type="button"
      onClick={copyConfig}
      className="inline-flex items-center rounded-full border border-[#8b5a1f] bg-[#8b5a1f] px-3 py-1.5 font-mono text-xs text-white transition-colors hover:bg-[#724817] dark:border-[#a1ab76] dark:bg-[#a1ab76] dark:text-[#1a1207] dark:hover:bg-[#9ba475]"
    >
      {state === 'copied' ? '✓ 已复制配置' : state === 'error' ? '× 复制失败' : '⧉ 复制 MCP 配置'}
    </button>
  )
}
