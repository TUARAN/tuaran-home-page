'use client'

import { useEffect, useState } from 'react'

import { HOME_RECOMMENDATIONS } from '../../../lib/homeRecommendations'

function ArrowIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 17L17 7M9 7h8v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function randomInt(max) {
  if (max <= 1) return 0
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const values = new Uint32Array(1)
    crypto.getRandomValues(values)
    return values[0] % max
  }
  return Math.floor(Math.random() * max)
}

function randomOtherIndex(current, max) {
  if (max <= 1) return 0
  const next = randomInt(max - 1)
  return next >= current ? next + 1 : next
}

export default function HomeRecommendationCard() {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    setActiveIndex(randomInt(HOME_RECOMMENDATIONS.length))
  }, [])

  const item = HOME_RECOMMENDATIONS[activeIndex] || HOME_RECOMMENDATIONS[0]

  return (
    <article className="home-focus-card" aria-live="polite">
      <div className="home-focus-top">
        <span className="home-focus-kicker">{item.eyebrow}</span>
        <button
          type="button"
          className="home-focus-swap"
          onClick={() => setActiveIndex((current) => randomOtherIndex(current, HOME_RECOMMENDATIONS.length))}
        >
          换一个
        </button>
      </div>
      <h2>{item.title}</h2>
      <p>{item.desc}</p>
      <span className="home-focus-points">
        {item.points.map((point) => (
          <span key={point}>{point}</span>
        ))}
      </span>
      <a href={item.href} target="_blank" rel="noreferrer" className="home-focus-action no-external-arrow">
        {item.actionLabel}
        <ArrowIcon />
      </a>
    </article>
  )
}
