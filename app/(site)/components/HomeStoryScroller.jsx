'use client'

import { useEffect, useRef } from 'react'

const PAGE_LOCK_MS = 760
const MIN_WHEEL_DELTA = 6

function getHeaderOffset() {
  const value = getComputedStyle(document.documentElement).getPropertyValue('--site-header-height')
  return Number.parseFloat(value) || 0
}

function getCurrentSlideIndex(slides, headerOffset) {
  return slides.reduce(
    (nearest, slide, index) => {
      const distance = Math.abs(slide.getBoundingClientRect().top - headerOffset)
      return distance < nearest.distance ? { index, distance } : nearest
    },
    { index: 0, distance: Number.POSITIVE_INFINITY },
  ).index
}

export default function HomeStoryScroller({ children, className = '' }) {
  const rootRef = useRef(null)

  useEffect(() => {
    const root = rootRef.current
    const desktopPointer = window.matchMedia('(hover: hover) and (pointer: fine)')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

    if (!root || !desktopPointer.matches) return undefined

    const slides = Array.from(root.children).filter((element) => element.classList.contains('home-story-slide'))
    let locked = false
    let unlockTimer

    const unlockAfterGesture = () => {
      window.clearTimeout(unlockTimer)
      unlockTimer = window.setTimeout(() => {
        locked = false
      }, PAGE_LOCK_MS)
    }

    const handleWheel = (event) => {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || Math.abs(event.deltaY) < MIN_WHEEL_DELTA) {
        return
      }

      event.preventDefault()

      if (locked) {
        unlockAfterGesture()
        return
      }

      const direction = Math.sign(event.deltaY)
      const currentIndex = getCurrentSlideIndex(slides, getHeaderOffset())
      const nextIndex = Math.min(Math.max(currentIndex + direction, 0), slides.length - 1)

      if (nextIndex === currentIndex) return

      locked = true
      unlockAfterGesture()

      const headerOffset = getHeaderOffset()
      const targetTop = window.scrollY + slides[nextIndex].getBoundingClientRect().top - headerOffset
      window.scrollTo({
        top: targetTop,
        behavior: reducedMotion.matches ? 'auto' : 'smooth',
      })
    }

    root.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      window.clearTimeout(unlockTimer)
      root.removeEventListener('wheel', handleWheel)
    }
  }, [])

  return (
    <main ref={rootRef} className={className}>
      {children}
    </main>
  )
}
