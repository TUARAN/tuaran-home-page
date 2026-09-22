'use client'

import { Children, useEffect, useRef, useState } from 'react'

export default function DownloadTabs({ groups, children }) {
  const [active, setActive] = useState(groups[0].anchor)
  const tabsRef = useRef([])
  const panels = Children.toArray(children)

  useEffect(() => {
    function syncHash() {
      const anchor = window.location.hash.slice(1)
      if (groups.some((group) => group.anchor === anchor)) setActive(anchor)
    }

    syncHash()
    window.addEventListener('hashchange', syncHash)
    return () => window.removeEventListener('hashchange', syncHash)
  }, [groups])

  function select(anchor) {
    setActive(anchor)
    window.history.replaceState(null, '', `#${anchor}`)
  }

  function handleKeyDown(event, index) {
    let next = index
    if (event.key === 'ArrowRight') next = (index + 1) % groups.length
    else if (event.key === 'ArrowLeft') next = (index - 1 + groups.length) % groups.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = groups.length - 1
    else return

    event.preventDefault()
    select(groups[next].anchor)
    tabsRef.current[next]?.focus()
  }

  return (
    <div className="mx-auto max-w-[1080px] px-4 sm:px-6 lg:px-8">
      <div role="tablist" aria-label="下载分类" className="inline-flex max-w-full gap-1 rounded-full border border-[#d8d1c4] bg-white/60 p-1 dark:border-[#27313d] dark:bg-[#101720]/70">
        {groups.map((group, index) => (
          <button
            key={group.id}
            ref={(node) => { tabsRef.current[index] = node }}
            type="button"
            role="tab"
            id={`${group.anchor}-tab`}
            aria-controls={group.anchor}
            aria-selected={active === group.anchor}
            tabIndex={active === group.anchor ? 0 : -1}
            onClick={() => select(group.anchor)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={`min-h-10 whitespace-nowrap rounded-full px-5 py-2 text-center text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current ${active === group.anchor ? 'bg-[#171611] text-white shadow-sm dark:bg-white dark:text-[#0d0f12]' : 'text-[#777268] hover:bg-[var(--site-panel)] hover:text-[#171611] dark:text-[#8994a3] dark:hover:bg-[#26313d] dark:hover:text-white'}`}
          >
            {group.title}
            <span className="ml-2 font-mono text-xs opacity-65">{group.items.length}</span>
          </button>
        ))}
      </div>
      {groups.map((group, index) => (
        <div
          key={group.id}
          id={group.anchor}
          role="tabpanel"
          aria-labelledby={`${group.anchor}-tab`}
          tabIndex={0}
          hidden={active !== group.anchor}
          className="scroll-mt-24"
        >
          {panels[index]}
        </div>
      ))}
    </div>
  )
}
