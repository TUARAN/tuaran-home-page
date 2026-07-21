'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'

const OPENCLAW_ACHIEVEMENTS = [
  {
    sequence: '第 2 次贡献',
    number: '98320',
    url: 'https://github.com/openclaw/openclaw/pull/98320',
    image: '/images/openclaw/pr-98320-merged.png',
    imageWidth: 1880,
    imageHeight: 1466,
    title: '梅开二度：代码再次合入 OpenClaw 主分支，由「龙虾之父」steipete 亲自合并',
    summary: '又一个值得珍藏的开源里程碑。珍视每一次贡献被接纳的荣誉，也会坚定地在开源路上走下去。',
    facts: ['3 commits', '+168 -35', 'steipete merged', '主分支已合并'],
  },
  {
    sequence: '第 1 次贡献',
    number: '90517',
    url: 'https://github.com/openclaw/openclaw/pull/90517',
    image: '/images/openclaw/pr-90517-merged.png',
    imageWidth: 2624,
    imageHeight: 1456,
    title: '首次贡献代码至 OpenClaw，成功合入主分支',
    summary: '从真实问题出发，让修复通过评审并进入主线，留下第一枚开源贡献坐标。',
    facts: ['2 commits', '+153 -5', 'gateway', '主分支已合并'],
  },
]

export default function HomeOpenClawAchievement() {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const activeAchievement = OPENCLAW_ACHIEVEMENTS[activeIndex]

  useEffect(() => {
    if (!open) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event) {
      if (event.key === 'Escape') setOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <>
      <div className="home-achievement-button">
        <button
          type="button"
          className="home-achievement-open-button"
          aria-label="查看两次 OpenClaw 合并证明"
          onClick={() => {
            setActiveIndex(0)
            setOpen(true)
          }}
        />
        <span className="home-achievement-proof" aria-hidden="true">
          <Image
            src={OPENCLAW_ACHIEVEMENTS[0].image}
            alt=""
            width={OPENCLAW_ACHIEVEMENTS[0].imageWidth}
            height={OPENCLAW_ACHIEVEMENTS[0].imageHeight}
            sizes="80px"
          />
        </span>
        <span className="home-achievement-copy min-w-0 flex-1">
          <span className="home-achievement-kicker">
            开源贡献 · 2 个 PR 已合入
            <span className="home-achievement-pr-links" aria-label="OpenClaw 合并记录">
              （
              <a
                href={OPENCLAW_ACHIEVEMENTS[1].url}
                target="_blank"
                rel="noreferrer"
                className="no-external-arrow"
              >
                #90517
              </a>
              <span aria-hidden="true"> · </span>
              <a
                href={OPENCLAW_ACHIEVEMENTS[0].url}
                target="_blank"
                rel="noreferrer"
                className="no-external-arrow"
              >
                #98320
              </a>
              ）
            </span>
          </span>
          <strong>两次向全球 Star 数最多的开源软件项目 OpenClaw 贡献代码，均成功被合并</strong>
        </span>
      </div>

      {open ? createPortal(
        <div className="home-achievement-modal" role="dialog" aria-modal="true" aria-labelledby="openclaw-proof-title">
          <button
            type="button"
            className="home-achievement-modal-backdrop"
            aria-label="关闭 OpenClaw 合并截图"
            onClick={() => setOpen(false)}
          />
          <div className="home-achievement-modal-panel">
            <div className="home-achievement-modal-head">
              <div>
                <p>OpenClaw 合并证明</p>
                <h2 id="openclaw-proof-title">{activeAchievement.title}</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="关闭弹窗">
                ×
              </button>
            </div>
            <div className="home-achievement-modal-switcher">
              <p>切换查看两次合并证明</p>
              <div className="home-achievement-modal-switcher-options">
                {OPENCLAW_ACHIEVEMENTS.map((achievement, index) => (
                  <button
                    key={achievement.number}
                    type="button"
                    className={index === activeIndex ? 'home-achievement-proof-tab is-active' : 'home-achievement-proof-tab'}
                    aria-pressed={index === activeIndex}
                    onClick={() => setActiveIndex(index)}
                  >
                    <strong>{achievement.sequence}</strong>
                    <span>PR #{achievement.number}</span>
                  </button>
                ))}
              </div>
            </div>
            <a href={activeAchievement.url} target="_blank" rel="noreferrer" className="no-external-arrow">
              <Image
                src={activeAchievement.image}
                alt={`OpenClaw PR #${activeAchievement.number} merged into main`}
                width={activeAchievement.imageWidth}
                height={activeAchievement.imageHeight}
                sizes="min(92vw, 1120px)"
                priority={false}
              />
            </a>
            <div className="home-achievement-modal-foot">
              {activeAchievement.facts.map((fact) => <span key={fact}>{fact}</span>)}
              <a href={activeAchievement.url} target="_blank" rel="noreferrer" className="no-external-arrow">
                查看 openclaw/openclaw#{activeAchievement.number} →
              </a>
            </div>
          </div>
        </div>,
        document.body
      ) : null}
    </>
  )
}
