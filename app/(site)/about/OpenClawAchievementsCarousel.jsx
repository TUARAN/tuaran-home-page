'use client'

import Image from 'next/image'
import { useCallback, useState } from 'react'

import { getOpenClawAchievementFacts } from '../../../lib/openClawAchievements'

export default function OpenClawAchievementsCarousel({ achievements }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeItem = achievements[activeIndex]

  const move = useCallback(
    (direction) => {
      setActiveIndex((current) => (current + direction + achievements.length) % achievements.length)
    },
    [achievements.length],
  )

  if (!activeItem) return null

  return (
    <div
      className="mt-6"
      role="region"
      aria-roledescription="carousel"
      aria-label="OpenClaw 已合并贡献"
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') move(-1)
        if (event.key === 'ArrowRight') move(1)
      }}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-mono text-[11px] tabular-nums text-[#6f839b]" aria-live="polite">
          <span className="text-[#7fe6da]">{String(activeIndex + 1).padStart(2, '0')}</span>
          <span aria-hidden="true"> / </span>
          {String(achievements.length).padStart(2, '0')}
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
        aria-label={`第 ${activeIndex + 1} 项，共 ${achievements.length} 项：${activeItem.title}`}
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
            className="h-full min-h-[240px] w-full object-cover object-left-top opacity-95 transition duration-300 group-hover:scale-[1.012] group-hover:opacity-100"
            priority={activeIndex === 0}
          />
        </a>
      </article>

      <div className="mt-3 flex justify-center gap-2" aria-label="选择 OpenClaw PR">
        {achievements.map((item, index) => (
          <button
            key={item.number}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`h-1.5 rounded-full transition-all ${
              index === activeIndex ? 'w-8 bg-[#34e0d0]' : 'w-3 bg-[#2b3d52] hover:bg-[#54708c]'
            }`}
            aria-label={`查看第 ${index + 1} 项：PR #${item.number}`}
            aria-current={index === activeIndex ? 'true' : undefined}
          />
        ))}
      </div>
    </div>
  )
}
