'use client'

import { useLocale } from './LocaleProvider'
import { SITE_HERO_GOAL_PARTS } from '../../../lib/siteIntro'

const SITE_HERO_GOAL_PARTS_EN = [
  'Turn chaos into ',
  { emphasis: '「systems」' },
  ', and ideas into ',
  { emphasis: '「products」' },
]

/**
 * 首页 hero 目标句（带强调上色）。zh 保留原双关「编程 / 变成」，en 用对应的英文措辞。
 * variant='polished' 用 home-emphasis class；variant='classic' 用渐变 class。
 */
export function HomeHeroGoal({ variant = 'polished' }) {
  const { locale } = useLocale()
  const parts = locale === 'en' ? SITE_HERO_GOAL_PARTS_EN : SITE_HERO_GOAL_PARTS
  const emphasisClass =
    variant === 'classic'
      ? 'bg-gradient-to-br from-[#4f4c38] via-[#355c6d] to-[#0d4a63] bg-clip-text font-semibold tracking-[0.06em] text-transparent dark:from-[#c6c9b4] dark:via-[#93b8d4] dark:to-[#7eb0ef]'
      : 'home-emphasis'

  return (
    <>
      {parts.map((part, i) =>
        typeof part === 'string' ? (
          <span key={i}>{part}</span>
        ) : (
          <span key={i} className={emphasisClass}>
            {part.emphasis}
          </span>
        )
      )}
    </>
  )
}
