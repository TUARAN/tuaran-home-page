'use client'

import { useEffect } from 'react'

// 检测调研正文里的横向滚动表格（.table-scroll），溢出时给容器加右缘渐隐提示，
// 滚动到尽头自动收起（Issue #430）。样式见 globals.css 的
// `.prose-tuaran .table-scroll.is-scrollable`；渐变画在容器背景上，不随内容滚动。
const SELECTOR = '.prose-tuaran .table-scroll'

export default function TableScrollHint() {
  useEffect(() => {
    if (typeof document === 'undefined') return

    const cleanups = []
    for (const el of Array.from(document.querySelectorAll(SELECTOR))) {
      const update = () => {
        const overflow = el.scrollWidth > el.clientWidth + 1
        const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 1
        el.classList.toggle('is-scrollable', overflow && !atEnd)
      }
      update()
      el.addEventListener('scroll', update, { passive: true })
      window.addEventListener('resize', update)
      cleanups.push(() => {
        el.removeEventListener('scroll', update)
        window.removeEventListener('resize', update)
      })
    }
    return () => cleanups.forEach((fn) => fn())
  }, [])

  return null
}
