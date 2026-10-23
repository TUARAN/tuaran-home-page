'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'

import styles from './whitepaper.module.css'

export default function PlateExhibition({ plates }) {
  const trackRef = useRef(null)
  const [active, setActive] = useState(0)

  function goTo(index) {
    const next = Math.max(0, Math.min(index, plates.length - 1))
    const track = trackRef.current
    const card = track?.children[next]
    if (!track || !card) return
    const left = card.getBoundingClientRect().left - track.getBoundingClientRect().left + track.scrollLeft
    track.scrollTo({ left, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
    setActive(next)
  }

  function updateActive() {
    const track = trackRef.current
    if (!track) return
    const positions = Array.from(track.children, (card) => Math.abs(card.getBoundingClientRect().left - track.getBoundingClientRect().left))
    setActive(positions.indexOf(Math.min(...positions)))
  }

  return (
    <section id="plates" className={styles.exhibition} aria-label="大互动图版展览">
      <div className={styles.exhibitionHeader}>
        <div>
          <p className={styles.sectionIndex}>THE EXHIBITION / 01—04</p>
          <h2>四张图，四个观点。</h2>
          <p>左右滑动浏览图版。每一张图都指向一次从观察到行动的推进。</p>
        </div>
        <div className={styles.exhibitionControls} aria-label="图版切换">
          <span aria-live="polite">{String(active + 1).padStart(2, '0')} <i>/</i> {String(plates.length).padStart(2, '0')}</span>
          <button type="button" onClick={() => goTo(active - 1)} disabled={active === 0} aria-label="上一张图版">←</button>
          <button type="button" onClick={() => goTo(active + 1)} disabled={active === plates.length - 1} aria-label="下一张图版">→</button>
        </div>
      </div>
      <div className={styles.exhibitionTrack} ref={trackRef} onScroll={updateActive}>
        {plates.map((plate, index) => (
          <figure className={styles.exhibit} key={plate.src}>
            <div className={styles.exhibitImage}>
              <span className={styles.exhibitNumber}>PLATE {String(index + 1).padStart(2, '0')}</span>
              <a href={plate.src} target="_blank" rel="noopener noreferrer" aria-label={`查看${plate.title}原图`}>
                <Image src={plate.src} width={plate.width} height={plate.height} alt={`${plate.title}：${plate.caption}`} sizes="(max-width: 700px) 84vw, 530px" priority={index === 0} />
              </a>
            </div>
            <figcaption>
              <span>观点 {String(index + 1).padStart(2, '0')} / {plate.title}</span>
              <strong>{plate.viewpoint}</strong>
              <p>{plate.caption}</p>
            </figcaption>
          </figure>
        ))}
      </div>
      <div className={styles.exhibitionProgress} aria-hidden="true"><span style={{ transform: `translateX(${active * 100}%)`, width: `${100 / plates.length}%` }} /></div>
    </section>
  )
}
