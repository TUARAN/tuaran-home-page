'use client'

import { useEffect, useRef, useState } from 'react'

const TAB_OPTIONS = [
  { id: 'json', label: '通用 JSON' },
  { id: 'toml', label: 'Codex TOML' },
]

export default function McpConfigActions({ title, config, codexConfig }) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('json')
  const [copyState, setCopyState] = useState('idle')
  const closeButtonRef = useRef(null)
  const activeConfig = activeTab === 'json' ? config : codexConfig

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

  async function copyConfig() {
    try {
      await navigator.clipboard.writeText(activeConfig)
      setCopyState('copied')
    } catch {
      setCopyState('error')
    }
    setTimeout(() => setCopyState('idle'), 1600)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-[#8b5a1f] bg-[#8b5a1f] px-3 py-1.5 font-mono text-xs text-white transition-colors hover:bg-[#724817] dark:border-[#a1ab76] dark:bg-[#a1ab76] dark:text-[#1a1207] dark:hover:bg-[#9ba475]"
      >
        查看客户端配置 →
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 backdrop-blur-[2px] sm:items-center sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false) }}>
          <section role="dialog" aria-modal="true" aria-labelledby="mcp-config-title" className="flex h-full w-full flex-col bg-white shadow-2xl dark:bg-[#0d151e] sm:h-auto sm:max-h-[84vh] sm:max-w-3xl sm:rounded-xl">
            <header className="flex items-start justify-between gap-4 border-b border-[#dedfd5] px-4 py-4 dark:border-[#263241] sm:px-6">
              <div className="min-w-0">
                <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#8b5a1f] dark:text-[#a1ab76]">MCP 客户端配置</p>
                <h2 id="mcp-config-title" className="mb-0 border-b-0 pb-0 font-serif text-xl font-semibold text-[#1c1d18] dark:text-gray-100 sm:text-2xl">{title}</h2>
              </div>
              <button ref={closeButtonRef} type="button" onClick={() => setOpen(false)} aria-label="关闭配置面板" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg text-[#555640] hover:bg-[#eaebe3] dark:text-gray-300 dark:hover:bg-[#17212d]">×</button>
            </header>

            <div className="flex min-h-0 flex-1 flex-col px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex rounded-lg bg-[#f3f3ee] p-1 dark:bg-[#121a24]" role="tablist" aria-label="配置格式">
                  {TAB_OPTIONS.map((tab) => (
                    <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} onClick={() => { setActiveTab(tab.id); setCopyState('idle') }} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${activeTab === tab.id ? 'bg-white text-[#1c1d18] shadow-sm dark:bg-[#263241] dark:text-white' : 'text-[#6e7064] hover:text-[#1c1d18] dark:text-gray-400 dark:hover:text-white'}`}>{tab.label}</button>
                  ))}
                </div>
                <button type="button" onClick={copyConfig} className="inline-flex shrink-0 items-center rounded-full border border-[#8b5a1f] bg-[#8b5a1f] px-3 py-1.5 font-mono text-xs text-white hover:bg-[#724817] dark:border-[#a1ab76] dark:bg-[#a1ab76] dark:text-[#1a1207] dark:hover:bg-[#9ba475]">
                  {copyState === 'copied' ? '✓ 已复制' : copyState === 'error' ? '× 复制失败' : `⧉ 复制 ${activeTab === 'json' ? 'JSON' : 'TOML'}`}
                </button>
              </div>
              <pre role="tabpanel" className="mt-4 min-h-0 flex-1 overflow-auto whitespace-pre rounded-lg bg-[#f3f1ea] p-4 font-mono text-xs leading-6 text-[#33352d] dark:bg-[#091018] dark:text-gray-200 sm:max-h-[55vh]"><code>{activeConfig}</code></pre>
              <p className="mb-0 mt-3 text-xs leading-5 text-[#6e7064] dark:text-gray-400">复制后粘贴到对应客户端的 MCP 配置文件；本地路径与环境变量请按设备实际情况修改。</p>
            </div>
          </section>
        </div>
      ) : null}
    </>
  )
}
