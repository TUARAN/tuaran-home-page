'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'

const OPENCLAW_ACHIEVEMENTS = [
  {
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
  const [activeAchievement, setActiveAchievement] = useState(null)

  useEffect(() => {
    if (!activeAchievement) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event) {
      if (event.key === 'Escape') setActiveAchievement(null)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeAchievement])

  return (
    <>
      {OPENCLAW_ACHIEVEMENTS.map((achievement) => (
        <button
          key={achievement.number}
          type="button"
          className="home-achievement-button"
          onClick={() => setActiveAchievement(achievement)}
        >
          <span className="home-achievement-proof" aria-hidden="true">
            <Image
              src={achievement.image}
              alt=""
              width={achievement.imageWidth}
              height={achievement.imageHeight}
              sizes="80px"
            />
          </span>
          <span className="min-w-0 flex-1">
            <span className="home-achievement-kicker">开源贡献 · PR #{achievement.number}</span>
            <strong>{achievement.title}</strong>
            <small>{achievement.summary}</small>
          </span>
        </button>
      ))}

      {activeAchievement ? createPortal(
        <div className="home-achievement-modal" role="dialog" aria-modal="true" aria-labelledby="openclaw-proof-title">
          <button
            type="button"
            className="home-achievement-modal-backdrop"
            aria-label="关闭 OpenClaw 合并截图"
            onClick={() => setActiveAchievement(null)}
          />
          <div className="home-achievement-modal-panel">
            <div className="home-achievement-modal-head">
              <div>
                <p>OpenClaw 合并证明</p>
                <h2 id="openclaw-proof-title">{activeAchievement.title}</h2>
              </div>
              <button type="button" onClick={() => setActiveAchievement(null)} aria-label="关闭弹窗">
                ×
              </button>
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
