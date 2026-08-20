'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { H5_PULL_THRESHOLD, getPullRefreshDistance, shouldTriggerPullRefresh } from '../../../lib/h5PullRefresh'

function isPhoneViewport() {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
}

export default function H5PullToRefresh({ onRefresh, disabled = false, children }) {
  const startYRef = useRef(0)
  const pullingRef = useRef(false)
  const distanceRef = useRef(0)
  const [distance, setDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  const reset = useCallback(() => {
    pullingRef.current = false
    startYRef.current = 0
    distanceRef.current = 0
    setDistance(0)
  }, [])

  useEffect(() => {
    if (disabled) return undefined

    function onTouchStart(event) {
      if (!isPhoneViewport() || refreshing) return
      if (window.scrollY > 0) return
      pullingRef.current = true
      startYRef.current = event.touches[0]?.clientY || 0
    }

    function onTouchMove(event) {
      if (!pullingRef.current || refreshing) return
      const next = getPullRefreshDistance(startYRef.current, event.touches[0]?.clientY || 0, window.scrollY)
      distanceRef.current = next > 0 ? Math.min(96, next) : 0
      if (next <= 0) {
        setDistance(0)
        return
      }
      if (event.cancelable && next > 8) event.preventDefault()
      setDistance(distanceRef.current)
    }

    async function onTouchEnd() {
      if (!pullingRef.current) return
      const shouldRefresh = shouldTriggerPullRefresh(distanceRef.current) && typeof onRefresh === 'function'
      pullingRef.current = false
      if (!shouldRefresh) {
        reset()
        return
      }
      setRefreshing(true)
      setDistance(H5_PULL_THRESHOLD)
      try {
        await onRefresh()
      } finally {
        window.setTimeout(() => {
          setRefreshing(false)
          reset()
        }, 240)
      }
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd)
    window.addEventListener('touchcancel', reset)
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', reset)
    }
  }, [disabled, onRefresh, refreshing, reset])

  const visible = distance > 6 || refreshing
  const ready = shouldTriggerPullRefresh(distance)

  return (
    <div className="h5-pull-root">
      <div
        className={`h5-pull-indicator md:hidden ${visible ? 'is-visible' : ''}`}
        aria-hidden={!visible}
        style={{ height: visible ? Math.max(28, distance * 0.55) : 0 }}
      >
        {refreshing ? '正在刷新' : ready ? '松开刷新' : '下拉刷新'}
      </div>
      {children}
    </div>
  )
}
