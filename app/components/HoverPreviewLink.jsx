'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const PREVIEW_W = 176
const PREVIEW_H = 234
const PADDING = 8
const OFFSET_X = 14
const OFFSET_Y = 14

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export default function HoverPreviewLink({ href, previewSrc, previewAlt, children, className }) {
  const [isHovering, setIsHovering] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  const style = useMemo(() => {
    if (!isHovering) return { display: 'none' }

    const maxX = typeof window !== 'undefined' ? window.innerWidth - PREVIEW_W - PADDING : 0
    const maxY = typeof window !== 'undefined' ? window.innerHeight - PREVIEW_H - PADDING : 0

    const left = clamp(pos.x + OFFSET_X, PADDING, maxX)
    const top = clamp(pos.y - OFFSET_Y - PREVIEW_H, PADDING, maxY)

    return { left, top }
  }, [isHovering, pos.x, pos.y])

  return (
    <>
      <Link
        href={href}
        className={className}
        onMouseEnter={(e) => {
          setIsHovering(true)
          setPos({ x: e.clientX, y: e.clientY })
        }}
        onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}
        onMouseLeave={() => setIsHovering(false)}
      >
        {children}
      </Link>

      <div
        className="pointer-events-none fixed z-50 border border-[#eee] bg-white dark:border-gray-800 dark:bg-gray-900"
        style={style}
      >
        <div className="relative" style={{ width: PREVIEW_W, height: PREVIEW_H }}>
          <Image src={previewSrc} alt={previewAlt} fill className="object-cover" sizes="176px" />
        </div>
      </div>
    </>
  )
}
