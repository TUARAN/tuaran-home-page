'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'

import {
  getOpenClawAchievementFacts,
  OPENCLAW_ACHIEVEMENT_COUNT,
  OPENCLAW_ACHIEVEMENTS,
} from '../../../lib/openClawAchievements'

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
          aria-label={`查看 ${OPENCLAW_ACHIEVEMENT_COUNT} 次 OpenClaw 合并证明`}
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
            开源贡献 · {OPENCLAW_ACHIEVEMENT_COUNT} 个 PR 已合入
          </span>
          <strong>开源贡献至全球 Star 数最多的开源软件项目 OpenClaw🦞，已有 {OPENCLAW_ACHIEVEMENT_COUNT} 次代码成功被合并。</strong>
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
              <p>切换查看 {OPENCLAW_ACHIEVEMENT_COUNT} 次合并证明</p>
              <div className="home-achievement-modal-switcher-options">
                {OPENCLAW_ACHIEVEMENTS.map((achievement, index) => (
                  <button
                    key={achievement.number}
                    type="button"
                    className={index === activeIndex ? 'home-achievement-proof-tab is-active' : 'home-achievement-proof-tab'}
                    aria-pressed={index === activeIndex}
                    onClick={() => setActiveIndex(index)}
                  >
                    <strong>第 {achievement.order} 次贡献</strong>
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
              {getOpenClawAchievementFacts(activeAchievement).map((fact) => <span key={fact}>{fact}</span>)}
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
