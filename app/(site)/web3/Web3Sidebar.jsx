'use client'

import { useEffect, useRef, useState } from 'react'
import { IconChevronRight, IconMenu2 } from '@tabler/icons-react'

const GROUPS = [
  {
    title: '内容分类',
    items: [
      { id: 'content', label: '内容概览' },
      { id: 'featured', label: '精选阅读' },
      { id: 'a-share', label: 'A 股调研' },
      { id: 'crypto', label: '加密资产' },
      { id: 'web3-content', label: 'Web3 内容' },
    ],
  },
  {
    title: '领域分类',
    items: [
      { id: 'cex', label: 'CEX' },
      { id: 'dex', label: 'DEX' },
      { id: 'defi', label: 'DeFi' },
      { id: 'stablecoins', label: '稳定币' },
      { id: 'chains', label: 'L1 / L2' },
      { id: 'wallets', label: '钱包与安全' },
      { id: 'data', label: '数据与查询' },
      { id: 'nft-gaming', label: 'NFT / 游戏 / Social' },
    ],
  },
  {
    title: '常用资源',
    items: [
      { id: 'exchanges', label: '交易入口' },
      { id: 'market-data', label: '行情与协议数据' },
      { id: 'explorers', label: '区块浏览器' },
      { id: 'safety', label: '安全与授权' },
    ],
  },
]

const SECTION_IDS = GROUPS.flatMap((group) => group.items.map((item) => item.id))

function jumpTo(id) {
  const target = document.getElementById(id)
  if (!target) return
  target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  window.history.replaceState(null, '', `#${id}`)
}

function DirectoryLinks({ activeId, onActivate, onNavigate }) {
  return GROUPS.map((group) => (
    <section key={group.title} className="border-t border-[var(--site-line)] py-4 first:border-t-0 first:pt-0">
      <p className="mb-2 px-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--site-faint)]">
        {group.title}
      </p>
      <div className="space-y-0.5">
        {group.items.map((item) => {
          const active = activeId === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onActivate?.(item.id)
                jumpTo(item.id)
                onNavigate?.()
              }}
              className={`group flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-[13px] transition ${active ? 'bg-[var(--site-panel-strong)] font-semibold text-[var(--site-ink)]' : 'text-[var(--site-muted)] hover:bg-[var(--site-panel)] hover:text-[var(--site-ink)]'}`}
              aria-current={active ? 'location' : undefined}
            >
              <span>{item.label}</span>
              <IconChevronRight size={13} className={active ? 'text-[var(--site-accent)]' : 'opacity-0 transition group-hover:opacity-50'} />
            </button>
          )
        })}
      </div>
    </section>
  ))
}

export default function Web3Sidebar() {
  const [activeId, setActiveId] = useState('content')
  const [mobileOpen, setMobileOpen] = useState(false)
  const manualActiveUntilRef = useRef(0)

  function activateFromMenu(id) {
    manualActiveUntilRef.current = Date.now() + 900
    setActiveId(id)
  }

  useEffect(() => {
    const sections = SECTION_IDS.map((id) => document.getElementById(id)).filter(Boolean)
    if (!sections.length) return undefined
    const observer = new IntersectionObserver((entries) => {
      if (Date.now() < manualActiveUntilRef.current) return
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      if (visible[0]?.target?.id) setActiveId(visible[0].target.id)
    }, { rootMargin: '-18% 0px -68% 0px', threshold: 0 })
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <aside className="sticky top-24 hidden max-h-[calc(100vh-7rem)] self-start overflow-y-auto rounded-2xl border border-[var(--site-line)] bg-[var(--site-panel)] p-3 lg:block">
        <div className="mb-4 flex items-center gap-2 px-2 pt-1">
          <IconMenu2 size={17} className="text-[var(--site-accent)]" />
          <strong className="text-sm text-[var(--site-ink)]">页面目录</strong>
        </div>
        <DirectoryLinks activeId={activeId} onActivate={activateFromMenu} />
      </aside>

      <div className="sticky top-[var(--site-header-height)] z-40 -mx-4 border-y border-[var(--site-line)] bg-[color:var(--page-bg)]/95 px-4 py-2 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className="flex w-full items-center justify-between rounded-xl bg-[var(--site-panel)] px-4 py-2.5 text-sm font-semibold text-[var(--site-ink)]"
          aria-expanded={mobileOpen}
        >
          <span className="flex items-center gap-2"><IconMenu2 size={17} /> 页面目录</span>
          <span className="text-xs font-normal text-[var(--site-faint)]">{GROUPS.flatMap((group) => group.items).find((item) => item.id === activeId)?.label}</span>
        </button>
        {mobileOpen ? (
          <div className="absolute left-4 right-4 top-[calc(100%+0.25rem)] max-h-[65vh] overflow-y-auto rounded-2xl border border-[var(--site-line)] bg-[var(--site-panel)] p-3 shadow-xl">
            <DirectoryLinks activeId={activeId} onActivate={activateFromMenu} onNavigate={() => setMobileOpen(false)} />
          </div>
        ) : null}
      </div>
    </>
  )
}
