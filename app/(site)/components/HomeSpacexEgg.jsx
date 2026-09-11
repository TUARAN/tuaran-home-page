'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { IconRocket } from '@tabler/icons-react'

const SPACEX_HREF = '/spacex'
const FLIGHT_MS = 1160

function shouldSkipLaunch(event) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function HomeSpacexEgg() {
  const router = useRouter()
  const padRef = useRef(null)
  const [flight, setFlight] = useState(null)
  const launchedRef = useRef(false)

  useEffect(() => {
    if (!flight) return undefined

    const timer = window.setTimeout(() => {
      if (launchedRef.current) return
      launchedRef.current = true
      router.push(SPACEX_HREF)
    }, FLIGHT_MS)

    return () => window.clearTimeout(timer)
  }, [flight, router])

  function handleClick(event) {
    if (shouldSkipLaunch(event) || launchedRef.current) return
    if (prefersReducedMotion()) return

    event.preventDefault()
    const rect = padRef.current?.getBoundingClientRect()
    if (!rect) {
      router.push(SPACEX_HREF)
      return
    }

    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    setFlight({
      x,
      y,
      dy: Math.round(-window.innerHeight * 1.18),
    })
  }

  function handleFlightEnd(event) {
    if (event.target !== event.currentTarget) return
    if (launchedRef.current) return
    launchedRef.current = true
    router.push(SPACEX_HREF)
  }

  return (
    <>
      <Link
        href={SPACEX_HREF}
        className={`home-profile-spacex-launch${flight ? ' is-launching' : ''}`}
        aria-label="SpaceX"
        onClick={handleClick}
        data-analytics-event="entry_click"
        data-analytics-surface="home_profile"
        data-analytics-destination-kind="page"
        data-analytics-destination-id="/spacex"
      >
        <span ref={padRef} className="home-profile-spacex-craft" aria-hidden="true">
          <IconRocket className="home-profile-spacex-icon" size={16} stroke={1.7} />
          <span className="home-profile-spacex-flame" />
        </span>
      </Link>
      {flight
        ? createPortal(
            <div
              className="home-spacex-flight"
              style={{
                '--pad-x': `${flight.x}px`,
                '--pad-y': `${flight.y}px`,
                '--dy': `${flight.dy}px`,
              }}
              aria-hidden="true"
            >
              <div
                className="home-spacex-flight-craft"
                style={{ left: flight.x, top: flight.y }}
                onAnimationEnd={handleFlightEnd}
              >
                <IconRocket className="home-profile-spacex-icon" size={18} stroke={1.6} />
                <span className="home-profile-spacex-flame is-boost" />
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
