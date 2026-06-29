'use client'

import { useEffect, useId, useRef, useState } from 'react'

export default function ArticleActionsDropdown({ label = '更多', children }) {
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }

    function onKeyDown(event) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="article-actions-dropdown">
      <button
        type="button"
        className="article-action-button px-3 py-1 text-xs"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <svg
          viewBox="0 0 14 14"
          aria-hidden="true"
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 5.5 7 9.5l4-4" />
        </svg>
        <span>{label}</span>
      </button>
      {open ? (
        <div id={menuId} role="menu" className="article-actions-dropdown-menu">
          {children}
        </div>
      ) : null}
    </div>
  )
}
