'use client'

import { useEffect } from 'react'

export default function HomeScrollSnap() {
  useEffect(() => {
    document.documentElement.classList.add('home-snap-page')
    document.body.classList.add('home-snap-page')

    return () => {
      document.documentElement.classList.remove('home-snap-page')
      document.body.classList.remove('home-snap-page')
    }
  }, [])

  return null
}
