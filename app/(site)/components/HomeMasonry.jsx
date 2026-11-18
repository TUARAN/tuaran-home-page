'use client'

import { Children, useEffect, useRef, useState } from 'react'
import {
  PLACEHOLDER_HEIGHT,
  PRELOAD_MARGIN,
  SSR_EAGER_COUNT,
  VIEWPORT_MARGIN,
  createEagerSet,
  mergeMounted,
  resolvePlaceholderClassName,
  resolveZone,
} from '../../../lib/home/homeMasonryLazy.mjs'
import styles from './HomeMasonry.module.css'

// 三区懒挂载：
// - load：视口内，内容已挂载
// - preload：预加载区内，提前挂载且加载后不再卸载（triggerOnce）
// - idle：更远，只保留等高占位，不挂载 React 子树
// 前 eagerCount 个卡片服务端直接渲染，保证首屏内容与静态 HTML。
export default function HomeMasonry({ children, eagerCount = SSR_EAGER_COUNT, preloadMargin = PRELOAD_MARGIN }) {
  const gridRef = useRef(null)
  const items = Children.toArray(children)
  const itemCount = items.length
  const [mounted, setMounted] = useState(() => createEagerSet(Math.min(eagerCount, itemCount)))

  // 浏览器不支持 IntersectionObserver 时降级为全量挂载，避免内容永远停留在占位。
  useEffect(() => {
    if (typeof IntersectionObserver !== 'undefined') return
    setMounted((prev) => mergeMounted(prev, Array.from({ length: itemCount }, (_, index) => index)))
  }, [itemCount])

  // 瀑布流测量：mounted 变化后内容节点被替换，需要重新观察并重新计算 gridRowEnd。
  useEffect(() => {
    const grid = gridRef.current
    if (!grid || typeof ResizeObserver === 'undefined') return undefined
    const nodes = [...grid.children].filter((item) => item.classList.contains('home-masonry-item'))
    let frame = 0

    function measure() {
      frame = 0
      const gridStyles = getComputedStyle(grid)
      const row = parseFloat(gridStyles.gridAutoRows) || 8
      const gap = parseFloat(gridStyles.rowGap) || 16
      for (const item of nodes) {
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
    for (const item of nodes) {
      if (item.firstElementChild) observer.observe(item.firstElementChild)
    }
    schedule()
    return () => {
      if (frame) cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [mounted])

  // 预加载区 observer 触发挂载；视口 observer 只更新 data-zone，不触发 React 重渲染。
  useEffect(() => {
    const grid = gridRef.current
    if (!grid || typeof IntersectionObserver === 'undefined') return undefined
    const nodes = [...grid.children].filter((item) => item.classList.contains('home-masonry-item'))

    nodes.forEach((node, index) => {
      node.dataset.lazyIndex = String(index)
      node.dataset.zone = resolveZone({
        inViewport: false,
        inPreload: false,
        mounted: mounted.has(index),
      })
    })

    const inPreload = new Set()
    const inViewport = new Set()

    const syncZone = (node) => {
      const index = Number(node.dataset.lazyIndex)
      node.dataset.zone = resolveZone({
        inViewport: inViewport.has(index),
        inPreload: inPreload.has(index),
        mounted: mounted.has(index),
      })
    }

    const preloadObserver = new IntersectionObserver((entries) => {
      const activated = []
      for (const entry of entries) {
        const index = Number(entry.target.dataset.lazyIndex)
        if (entry.isIntersecting) {
          inPreload.add(index)
          activated.push(index)
          preloadObserver.unobserve(entry.target)
        } else {
          inPreload.delete(index)
        }
        syncZone(entry.target)
      }
      if (activated.length) setMounted((prev) => mergeMounted(prev, activated))
    }, { rootMargin: preloadMargin })

    const viewportObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const index = Number(entry.target.dataset.lazyIndex)
        if (entry.isIntersecting) inViewport.add(index)
        else inViewport.delete(index)
        syncZone(entry.target)
      }
    }, { rootMargin: VIEWPORT_MARGIN })

    for (const node of nodes) {
      preloadObserver.observe(node)
      viewportObserver.observe(node)
    }

    return () => {
      preloadObserver.disconnect()
      viewportObserver.disconnect()
    }
  }, [mounted, preloadMargin])

  return (
    <div ref={gridRef} className="home-main-grid">
      {items.map((child, index) => {
        if (mounted.has(index)) return child
        // 占位继承原卡片的类名，保留 hidden lg:block 等响应式规则，避免移动端露出本应隐藏的侧栏。
        const placeholderClassName = resolvePlaceholderClassName(child?.props?.className)
        return (
          <div key={`home-lazy-placeholder-${index}`} className={placeholderClassName} aria-hidden="true">
            <div className={styles.placeholder} style={{ minHeight: PLACEHOLDER_HEIGHT }}>
              <span className={`${styles.bar} ${styles.barTitle}`} />
              <span className={styles.bar} />
              <span className={`${styles.bar} ${styles.barShort}`} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
