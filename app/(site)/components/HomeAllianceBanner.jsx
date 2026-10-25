'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { T } from './LocaleProvider'

const ALLIANCE_URL = 'https://blogger-alliance.cn/'

const ALLIANCE_STATS = [
  { value: 41, suffix: '+', label: '技术博主', labelEn: 'Creators', aria: '41 位以上技术博主' },
  { value: 140, suffix: '万+', label: '科技粉丝', labelEn: 'Followers', aria: '覆盖 140 万以上科技粉丝' },
  { value: 300, suffix: '篇+', label: '累计投放', labelEn: 'Posts', aria: '累计投放 300 篇以上' },
  { value: 660, suffix: '万+', label: '累计曝光', labelEn: 'Impressions', aria: '累计 660 万以上曝光' },
  { value: 20, suffix: '+', label: '辐射社群', labelEn: 'Communities', aria: '辐射 20+ 社群' },
]

const ALLIANCE_COPIES = [
  {
    zh: 'AI/科技产品完成冷启动曝光、可信测评、商业线索获取和长期 GEO / 搜索占位 🚀',
    en: 'AI and tech products gain launch visibility, trusted reviews, business leads, and lasting GEO and search presence. 🚀',
    h5Zh: '冷启动曝光 · 可信测评 · 商业线索',
    h5En: 'Launch reach · trusted reviews · leads',
  },
  {
    zh: '40位+ 博主矩阵联动，一文内容分发 30+ 平台，帮你的产品拿下百万曝光 👀',
    en: '40+ creators distribute each story across 30+ platforms to help your product reach millions 👀',
    h5Zh: '40+ 博主 · 一文分发 30+ 平台',
    h5En: '40+ creators · 30+ platforms per story',
  },
]

function formatStat(value, suffix, progress) {
  return `${Math.round(value * progress)}${suffix}`
}

export default function HomeAllianceBanner() {
  const [open, setOpen] = useState(false)
  const [countProgress, setCountProgress] = useState(0)
  const [copyIndex, setCopyIndex] = useState(0)
  const [copyTurning, setCopyTurning] = useState(false)
  const bannerRef = useRef(null)
  const desktopTriggerRef = useRef(null)
  const mobileTriggerRef = useRef(null)
  const lastTriggerRef = useRef(null)
  const dialogRef = useRef(null)
  const closeRef = useRef(null)

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let turnTimer
    const interval = window.setInterval(() => {
      if (reduceMotion) {
        setCopyIndex((index) => 1 - index)
        return
      }
      setCopyTurning(true)
      turnTimer = window.setTimeout(() => {
        setCopyIndex((index) => 1 - index)
        setCopyTurning(false)
      }, 550)
    }, 5000)

    return () => {
      window.clearInterval(interval)
      window.clearTimeout(turnTimer)
    }
  }, [])

  useEffect(() => {
    const banner = bannerRef.current
    if (!banner) return undefined

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      setCountProgress(1)
      return undefined
    }

    let frame
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      const startedAt = performance.now()
      const tick = (now) => {
        const elapsed = Math.min((now - startedAt) / 750, 1)
        setCountProgress(1 - (1 - elapsed) ** 3)
        if (elapsed < 1) frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    }, { threshold: 0.25 })
    observer.observe(banner)

    return () => {
      observer.disconnect()
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  useEffect(() => {
    if (!open) return undefined

    const previousOverflow = document.body.style.overflow
    const trigger = lastTriggerRef.current
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false)
        return
      }
      if (event.key !== 'Tab') return

      const focusable = [...dialogRef.current.querySelectorAll('button, a[href]')]
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
      trigger?.focus()
    }
  }, [open])

  function openModal(trigger) {
    lastTriggerRef.current = trigger
    setOpen(true)
  }

  const copyClass = (index) => (
    copyIndex === index
      ? (copyTurning ? 'is-leaving' : 'is-current')
      : (copyTurning ? 'is-entering' : 'is-waiting')
  )

  return (
    <>
      <div ref={bannerRef} className="home-alliance-root">
        <section className="home-alliance-banner" aria-label="博主联盟合作">
          <div className="home-alliance-top">
            <div className="home-alliance-message">
              <span className="home-alliance-label"><T zh="合作计划" en="Partnership" /></span>
              <strong>
                <a href={ALLIANCE_URL} target="_blank" rel="noreferrer" className="no-external-arrow">
                  <T zh="博主联盟" en="Blogger Alliance" />
                </a>
              </strong>
              <span className="home-alliance-description">
                {ALLIANCE_COPIES.map((copy, index) => (
                  <span key={copy.zh} className={`home-alliance-copy ${copyClass(index)}`} aria-hidden={copyIndex !== index}>
                    <T zh={copy.zh} en={copy.en} />
                  </span>
                ))}
              </span>
            </div>
            <div className="home-alliance-stats" aria-label="博主联盟数据">
              {ALLIANCE_STATS.map((stat) => (
                <span key={stat.aria} aria-label={stat.aria}>
                  <strong aria-hidden="true">{formatStat(stat.value, stat.suffix, countProgress)}</strong>
                  <small><T zh={stat.label} en={stat.labelEn} /></small>
                </span>
              ))}
            </div>
            <div className="home-alliance-actions">
              <button
                ref={desktopTriggerRef}
                type="button"
                className="home-alliance-contact"
                onClick={() => openModal(desktopTriggerRef.current)}
              >
                <T zh="私人订制" en="Tailored plan" /> <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </section>

        <section className="home-alliance-banner-h5" aria-label="博主联盟合作">
          <div className="home-alliance-h5-card">
            <div className="home-alliance-h5-head">
              <div className="home-alliance-h5-title">
                <span className="home-alliance-h5-kicker"><T zh="合作" en="Partner" /></span>
                <a href={ALLIANCE_URL} target="_blank" rel="noreferrer" className="home-alliance-h5-name no-external-arrow">
                  <T zh="博主联盟" en="Blogger Alliance" />
                </a>
              </div>
              <a href={ALLIANCE_URL} target="_blank" rel="noreferrer" className="home-alliance-h5-link no-external-arrow">
                <T zh="详情" en="More" />
                <span aria-hidden="true">›</span>
              </a>
            </div>

            <p className="home-alliance-h5-desc">
              {ALLIANCE_COPIES.map((copy, index) => (
                <span key={copy.h5Zh} className={`home-alliance-copy ${copyClass(index)}`} aria-hidden={copyIndex !== index}>
                  <T zh={copy.h5Zh} en={copy.h5En} />
                </span>
              ))}
            </p>

            <div className="home-alliance-h5-metrics" aria-label="博主联盟数据">
              {ALLIANCE_STATS.map((stat) => (
                <span key={stat.aria} className="home-alliance-h5-chip" aria-label={stat.aria}>
                  <strong aria-hidden="true">{formatStat(stat.value, stat.suffix, countProgress)}</strong>
                  <small><T zh={stat.label} en={stat.labelEn} /></small>
                </span>
              ))}
            </div>

            <button
              ref={mobileTriggerRef}
              type="button"
              className="home-alliance-h5-cta"
              onClick={() => openModal(mobileTriggerRef.current)}
            >
              <T zh="私人订制合作方案" en="Get a tailored plan" />
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </section>
      </div>

      {open ? createPortal(
        <div className="home-alliance-modal" role="dialog" aria-modal="true" aria-labelledby="home-alliance-modal-title" ref={dialogRef}>
          <button type="button" className="home-alliance-modal-backdrop" tabIndex={-1} aria-label="关闭私人订制弹窗" onClick={() => setOpen(false)} />
          <div className="home-alliance-modal-panel">
            <button ref={closeRef} type="button" className="home-alliance-modal-close" aria-label="关闭弹窗" onClick={() => setOpen(false)}>×</button>
            <div className="home-alliance-modal-copy">
              <span className="home-alliance-modal-kicker">BLOGGER ALLIANCE</span>
              <h2 id="home-alliance-modal-title"><T zh="私人订制，先聊你的产品" en="A tailored plan starts with your product" /></h2>
              <p><T zh="博主联盟汇集来自技术社区的程序员博主，以专业视角理解产品、体验功能、拆解技术价值，让内容更准确地触达开发者与科技用户。" en="Blogger Alliance brings together developers from technical communities. They explore products firsthand and explain their technical value to developer and tech audiences." /></p>
              <p><T zh="扫码后，告诉我们你的产品、目标用户和推广目标。我们会据此匹配合适的博主、选题和分发平台，制定更有针对性的合作方案。" en="Tell us about your product, audience, and campaign goals. We can then match the right creators, topics, and channels to shape a focused partnership plan." /></p>
              <a href={ALLIANCE_URL} target="_blank" rel="noopener noreferrer" className="home-alliance-modal-more" onClick={() => setOpen(false)}><T zh="了解合作方式" en="See how we work" /> ↗</a>
            </div>
            <div className="home-alliance-modal-wechat">
              <span><T zh="扫码微信咨询合作" en="Scan on WeChat to discuss a partnership" /></span>
              <Image src="/qrcodewechat3.png" alt="合作咨询微信二维码" width={260} height={260} unoptimized loading="eager" sizes="260px" />
              <strong>atar24</strong>
              <small><T zh="备注“博主联盟”" en="Mention Blogger Alliance when adding us" /></small>
            </div>
          </div>
        </div>,
        document.body,
      ) : null}
    </>
  )
}
