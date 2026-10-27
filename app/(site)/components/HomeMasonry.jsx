'use client'

import { useEffect, useRef } from 'react'

export default function HomeMasonry({ children }) {
  const gridRef = useRef(null)

  useEffect(() => {
    const grid = gridRef.current
    if (!grid || typeof ResizeObserver === 'undefined') return undefined
    const items = [...grid.children].filter((item) => item.classList.contains('home-masonry-item'))
    let frame = 0

    function measure() {
      frame = 0
      const styles = getComputedStyle(grid)
      const row = parseFloat(styles.gridAutoRows) || 8
      const gap = parseFloat(styles.rowGap) || 16
      for (const item of items) {
        const content = item.firstElementChild
        if (!content || !item.getClientRects().length) continue
        const height = content.getBoundingClientRect().height
        item.style.gridRowEnd = `span ${Math.max(1, Math.ceil((height + gap) / (row + gap)))}`
      }
      grid.dataset.masonryReady = 'true'
    }

    function schedule() {
      if (frame) cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    }

    const observer = new ResizeObserver(schedule)
    for (const item of items) {
      if (item.firstElementChild) observer.observe(item.firstElementChild)
    }
    schedule()
    return () => {
      if (frame) cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [])

  return <div ref={gridRef} className="home-main-grid">{children}</div>
}
