'use client'

import Image from 'next/image'
import { useCallback, useMemo, useState } from 'react'

import {
  getOpenClawAchievementCategory,
  getOpenClawAchievementFacts,
  getOpenClawAchievements,
  OPENCLAW_ACHIEVEMENT_CATEGORIES,
} from '../../../lib/site/openClawAchievements'

export default function OpenClawAchievementsCarousel({ achievements }) {
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('newest')
  const [activeIndex, setActiveIndex] = useState(0)
  const visibleAchievements = useMemo(
    () => getOpenClawAchievements(achievements, category, sort),
    [achievements, category, sort],
  )
  const activeItem = visibleAchievements[activeIndex]

  const move = useCallback(
    (direction) => {
      setActiveIndex((current) => (current + direction + visibleAchievements.length) % visibleAchievements.length)
    },
    [visibleAchievements.length],
  )

  if (!activeItem) return null

  return (
    <div
      className="mt-6"
      role="region"
      aria-roledescription="carousel"
      aria-label="OpenClaw 已合并贡献"
      onKeyDown={(event) => {
        if (event.target.tagName === 'SELECT') return
        if (event.key === 'ArrowLeft') move(-1)
        if (event.key === 'ArrowRight') move(1)
      }}
    >
      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-[#1d2c3e] bg-[#0a1018]/65 p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-[11px] text-[#9aabc0]">按问题领域查看</p>
          <label className="flex items-center gap-2 font-mono text-[11px] text-[#9aabc0]">
            排序
            <select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value)
                setActiveIndex(0)
              }}
              className="rounded-md border border-[#2d4d61] bg-[#0d1825] px-2 py-1.5 text-[#e2ecf6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#34e0d0]"
            >
              <option value="newest">最新合并优先</option>
              <option value="oldest">最早合并优先</option>
            </select>
          </label>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="筛选 OpenClaw 贡献领域">
          {[{ id: 'all', label: '全部' }, ...OPENCLAW_ACHIEVEMENT_CATEGORIES].map((option) => {
            const count = option.id === 'all'
              ? achievements.length
              : achievements.filter((achievement) => achievement.category === option.id).length
            if (!count) return null
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={category === option.id}
                onClick={() => {
                  setCategory(option.id)
                  setActiveIndex(0)
                }}
                className={`rounded-md border px-2.5 py-1.5 font-mono text-[11px] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#34e0d0] ${
                  category === option.id
                    ? 'border-[#34e0d0] bg-[#123b3d] text-[#a6fff5]'
                    : 'border-[#2d4d61] bg-[#0d1825] text-[#9bb0c6] hover:border-[#34e0d0] hover:text-[#e2ecf6]'
                }`}
              >
                {option.label} <span className="tabular-nums opacity-70">{count}</span>
              </button>
            )
          })}
        </div>
      </div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-mono text-[11px] tabular-nums text-[#6f839b]" aria-live="polite">
          <span className="text-[#7fe6da]">{String(activeIndex + 1).padStart(2, '0')}</span>
          <span aria-hidden="true"> / </span>
          {String(visibleAchievements.length).padStart(2, '0')}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => move(-1)}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-[#2d4d61] bg-[#0d1825] px-3 font-mono text-[11px] text-[#9bb0c6] transition hover:border-[#34e0d0] hover:text-[#7fe6da] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#34e0d0]"
            aria-label="查看上一个 OpenClaw PR"
          >
            <span aria-hidden="true">←</span>
            <span className="hidden sm:inline">上一项</span>
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-[#2d4d61] bg-[#0d1825] px-3 font-mono text-[11px] text-[#9bb0c6] transition hover:border-[#34e0d0] hover:text-[#7fe6da] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#34e0d0]"
            aria-label="查看下一个 OpenClaw PR"
          >
            <span className="hidden sm:inline">下一项</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      <article
        key={activeItem.number}
        className="grid grid-cols-1 gap-5 rounded-2xl border border-[#1d2c3e] bg-[#0a1018]/65 p-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(320px,1.08fr)] lg:p-5"
        aria-label={`第 ${activeIndex + 1} 项，共 ${visibleAchievements.length} 项：${activeItem.title}`}
      >
        <div className="min-w-0 self-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#5cd6c8]">
            Merged Pull Request · #{activeItem.number}
          </p>
          <h3 className="mt-2 border-b-0 pb-0 font-mono text-[18px] font-bold leading-7 text-[#e2ecf6] sm:text-[21px]">
            {activeItem.title}
          </h3>
          <p className="mt-3 text-[13.5px] leading-7 text-[#9aabc0]">{activeItem.summary}</p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {getOpenClawAchievementFacts(activeItem).map((fact) => (
              <span
                key={fact}
                className="rounded-md border border-[#243549] bg-[#0d1622] px-2.5 py-1 font-mono text-[11px] text-[#8ea3bb]"
              >
                {fact}
              </span>
            ))}
          </div>
          <a
            href={activeItem.url}
            target="_blank"
            rel="noreferrer"
            className="no-external-arrow mt-5 inline-flex items-center rounded-md border border-[#2d4d61] bg-[#102032] px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[#7fe6da] no-underline transition hover:border-[#34e0d0] hover:bg-[#13283d]"
          >
            查看 GitHub PR #{activeItem.number} ↗
          </a>
        </div>
        <a
          href={activeItem.url}
          target="_blank"
          rel="noreferrer"
          className="no-external-arrow group max-h-[360px] overflow-hidden rounded-xl border border-[#1d2c3e] bg-[#05090f] no-underline"
          aria-label={`查看 OpenClaw PR #${activeItem.number} 合并截图`}
        >
          <Image
            src={activeItem.image}
            alt={`OpenClaw PR #${activeItem.number} merged into main`}
            width={activeItem.imageWidth}
            height={activeItem.imageHeight}
            sizes="(min-width: 1024px) 520px, 100vw"
            unoptimized
            className="h-full min-h-[240px] w-full object-cover object-left-top opacity-95 transition duration-300 group-hover:scale-[1.012] group-hover:opacity-100"
            priority={activeIndex === 0}
          />
        </a>
      </article>

      <div className="mt-4 grid gap-2 sm:grid-cols-2" aria-label="选择 OpenClaw PR">
        {visibleAchievements.map((item, index) => (
          <button
            key={item.number}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`flex min-w-0 items-start gap-2 rounded-lg border px-3 py-2.5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#34e0d0] ${
              index === activeIndex
                ? 'border-[#34e0d0] bg-[#123b3d] text-[#e2ecf6]'
                : 'border-[#243549] bg-[#0a1018]/65 text-[#9aabc0] hover:border-[#34e0d0] hover:text-[#e2ecf6]'
            }`}
            aria-label={`查看 PR #${item.number}：${item.title}`}
            aria-current={index === activeIndex ? 'true' : undefined}
          >
            <span className="shrink-0 font-mono text-[11px] text-[#7fe6da]">#{item.number}</span>
            <span className="min-w-0 flex-1 text-[12px] leading-5">{item.title.split(' · ')[1]}</span>
            <span className="hidden shrink-0 font-mono text-[10px] text-[#6f839b] lg:inline">{getOpenClawAchievementCategory(item)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
