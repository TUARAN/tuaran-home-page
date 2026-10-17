'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { T } from './LocaleProvider'

export default function HomeAllianceBanner() {
  const [open, setOpen] = useState(false)
  const [countProgress, setCountProgress] = useState(0)
  const [copyIndex, setCopyIndex] = useState(0)
  const [copyTurning, setCopyTurning] = useState(false)
  const bannerRef = useRef(null)
  const triggerRef = useRef(null)
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
    const trigger = triggerRef.current
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

  return (
    <>
      <section ref={bannerRef} className="home-alliance-banner" aria-label="博主联盟合作">
        <div className="home-alliance-top">
          <div className="home-alliance-message">
            <span className="home-alliance-label"><T zh="合作计划" en="Partnership" /></span>
            <strong><a href="https://blogger-alliance.cn/" target="_blank" rel="noreferrer" className="no-external-arrow"><T zh="博主联盟" en="Blogger Alliance" /></a></strong>
            <span className="home-alliance-description">
              <span className={`home-alliance-copy ${copyIndex === 0 ? (copyTurning ? 'is-leaving' : 'is-current') : (copyTurning ? 'is-entering' : 'is-waiting')}`} aria-hidden={copyIndex !== 0}>
                <T zh="AI/科技产品完成冷启动曝光、可信测评、商业线索获取和长期 GEO / 搜索占位 🚀" en="AI and tech products gain launch visibility, trusted reviews, business leads, and lasting GEO and search presence. 🚀" />
              </span>
              <span className={`home-alliance-copy ${copyIndex === 1 ? (copyTurning ? 'is-leaving' : 'is-current') : (copyTurning ? 'is-entering' : 'is-waiting')}`} aria-hidden={copyIndex !== 1}>
                <T zh="40位+ 博主矩阵联动，一文内容分发 30+ 平台，帮你的产品拿下百万曝光 👀" en="40+ creators distribute each story across 30+ platforms to help your product reach millions 👀" />
              </span>
            </span>
          </div>
          <div className="home-alliance-stats" aria-label="博主联盟数据">
            <span aria-label="41 位以上技术博主"><strong aria-hidden="true">{Math.round(41 * countProgress)}+</strong><small><T zh="技术博主" en="Creators" /></small></span>
            <span aria-label="覆盖 140 万以上科技粉丝"><strong aria-hidden="true">{Math.round(140 * countProgress)}万+</strong><small><T zh="科技粉丝" en="Followers" /></small></span>
            <span aria-label="累计投放 300 篇以上"><strong aria-hidden="true">{Math.round(300 * countProgress)}篇+</strong><small><T zh="累计投放" en="Posts" /></small></span>
            <span aria-label="累计 660 万以上曝光"><strong aria-hidden="true">{Math.round(660 * countProgress)}万+</strong><small><T zh="累计曝光" en="Impressions" /></small></span>
            <span aria-label="辐射 20+ 社群"><strong aria-hidden="true">{Math.round(20 * countProgress)}+</strong><small><T zh="辐射社群" en="Communities" /></small></span>
          </div>
          <div className="home-alliance-actions">
            <button ref={triggerRef} type="button" className="home-alliance-contact" onClick={() => setOpen(true)}>
              <T zh="私人订制" en="Tailored plan" /> <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </section>

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
              <a href="https://blogger-alliance.cn/" target="_blank" rel="noopener noreferrer" className="home-alliance-modal-more" onClick={() => setOpen(false)}><T zh="了解合作方式" en="See how we work" /> ↗</a>
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
