'use client'

import { useEffect } from 'react'

/**
 * 首页恒为深色：全站默认浅色（文章/列表走纸感浅色），唯独首页强制深色门面。
 *
 * 顶栏/页脚是 layout 共用的，所以必须在文档级（<html>.dark）强制，而不是给首页内容套壳。
 * next-themes 水合后会按它自己的 theme（默认 light）把 .dark 改掉，这里用 MutationObserver
 * 守住——只要在首页且 .dark 被移除就立刻补回；离开首页时恢复成用户实际选择的主题。
 * 首屏不闪烁由 layout.jsx body 末尾的内联脚本（在 next-themes 脚本之后执行）兜底。
 */
export default function ForceDarkRoute() {
  useEffect(() => {
    const root = document.documentElement
    const apply = () => {
      if (!root.classList.contains('dark')) root.classList.add('dark')
      // 深色首页不要浅色阅读底色的内联 --page-bg（否则盖过深色 token 底）
      if (root.style.getPropertyValue('--page-bg')) root.style.removeProperty('--page-bg')
    }
    apply()
    const obs = new MutationObserver(apply)
    obs.observe(root, { attributes: true, attributeFilter: ['class', 'style'] })
    return () => {
      obs.disconnect()
      // 离开首页：恢复用户实际主题（无存储 = 默认浅色）
      try {
        if (localStorage.getItem('theme') === 'dark') root.classList.add('dark')
        else root.classList.remove('dark')
      } catch (e) {
        root.classList.remove('dark')
      }
    }
  }, [])

  return null
}
