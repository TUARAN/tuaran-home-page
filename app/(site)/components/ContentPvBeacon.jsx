'use client'

import { useEffect } from 'react'

/**
 * 无界面的阅读统计探针：挂载时给 /api/research-pv 记一次访问，不渲染任何东西。
 * 用于资料/资源主题页与灵感流（调研文章用带展示的 ResearchPvCounter）。
 * 去重：服务端按「访客指纹 + 1 小时桶」幂等；客户端再用 sessionStorage 10 秒节流，避免同会话刷量。
 */
export default function ContentPvBeacon({ category, slug }) {
  useEffect(() => {
    if (!category || !slug) return
    try {
      const k = `content-pv-hit:${category}:${slug}`
      const now = Date.now()
      const last = Number(window.sessionStorage.getItem(k)) || 0
      if (now - last < 10_000) return
      window.sessionStorage.setItem(k, String(now))
      fetch('/api/research-pv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, slug }),
        keepalive: true,
      }).catch(() => {})
    } catch {
      // 统计失败不影响页面
    }
  }, [category, slug])

  return null
}
