'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'

const OPENCLAW_PR_URL = 'https://github.com/openclaw/openclaw/pull/90517#event-27417133330'

export default function HomeOpenClawAchievement() {
  const [open, setOpen] = useState(false)

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
      <button type="button" className="home-achievement-button" onClick={() => setOpen(true)}>
        <span className="home-achievement-proof" aria-hidden="true">
          <Image
            src="/images/openclaw/pr-90517-merged.png"
            alt=""
            width={320}
            height={178}
            sizes="96px"
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="home-achievement-kicker">站长成就 · 开源贡献</span>
          <strong>给全球最大开源项目OpenClaw🦞提代码，被官方合并。</strong>
          <small>PR #90517 · +153 −5</small>
        </span>
        <span className="home-achievement-meta">已合并</span>
      </button>

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
                <h2 id="openclaw-proof-title">给全球最大开源项目OpenClaw🦞提代码，被官方合并。</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="关闭弹窗">
                ×
              </button>
            </div>
            <a href={OPENCLAW_PR_URL} target="_blank" rel="noreferrer" className="no-external-arrow">
              <Image
                src="/images/openclaw/pr-90517-merged.png"
                alt="OpenClaw PR #90517 merged into main"
                width={1312}
                height={728}
                sizes="min(92vw, 1120px)"
                priority={false}
              />
            </a>
            <div className="home-achievement-modal-foot">
              <span>PR #90517</span>
              <span>+153 -5</span>
              <span>主分支已合并</span>
              <a href={OPENCLAW_PR_URL} target="_blank" rel="noreferrer" className="no-external-arrow">
                查看 PR →
              </a>
            </div>
          </div>
        </div>,
        document.body
      ) : null}
    </>
  )
}
