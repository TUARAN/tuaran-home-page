'use client'

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from 'react'

export default function FestivalBanner() {
  const [banner, setBanner] = useState(null)

  useEffect(() => {
    let active = true
    fetch('/api/festival-banner', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (active) setBanner(data?.banner || null) })
      .catch(() => {})
    return () => { active = false }
  }, [])

  if (!banner) return null

  const accessibleTitle = [banner.title, banner.badgeValue, banner.badgeLabel].filter(Boolean).join(' ')
  return (
    <section
      className="home-national-day"
      data-festival-theme={banner.theme || 'red-gold'}
      aria-label={accessibleTitle}
    >
      {banner.leftImage ? (
        <span className={`home-national-day-flag-art${banner.animateLeft ? ' is-animated' : ''}`} aria-hidden="true">
          <img
            className="home-national-day-flag home-national-day-flag-pole"
            src={banner.leftImage}
            alt=""
          />
          {banner.animateLeft ? (
            <img
              className="home-national-day-flag home-national-day-flag-cloth"
              src={banner.leftImage}
              alt=""
            />
          ) : null}
        </span>
      ) : null}
      <div className="home-national-day-copy">
        <span className="home-national-day-title home-national-day-title-full">{banner.title}</span>
        <span className="home-national-day-title home-national-day-title-compact">{banner.compactTitle || banner.title}</span>
        {banner.subtitle ? (
          <span className="home-national-day-years">
            <i aria-hidden="true" />
            {banner.subtitle}
            <i aria-hidden="true" />
          </span>
        ) : null}
      </div>
      {banner.badgeValue || banner.badgeLabel ? (
        <span className="home-national-day-anniversary" aria-hidden="true">
          {banner.badgeValue ? <strong>{banner.badgeValue}</strong> : null}
          {banner.badgeLabel ? <small>{banner.badgeLabel}</small> : null}
        </span>
      ) : null}
      {banner.rightImage ? (
        <img
          className="home-national-day-tiananmen"
          src={banner.rightImage}
          alt=""
          aria-hidden="true"
        />
      ) : null}
    </section>
  )
}
