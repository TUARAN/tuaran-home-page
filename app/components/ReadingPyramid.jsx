
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

const PADDING = 8
const OFFSET_X = 14
const OFFSET_Y = 14

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export default function ReadingPyramid({ levels }) {
  const [hovered, setHovered] = useState(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [tipSize, setTipSize] = useState({ w: 0, h: 0 })
  const tooltipRef = useRef(null)
  const svgRef = useRef(null)

  const drawLevels = useMemo(() => [...levels].reverse(), [levels])

  const pyramid = {
    topX: 490,
    topY: 80,
    bottomLeftX: 260,
    bottomLeftY: 610,
    bottomRightX: 720,
    bottomRightY: 610,
  }

  const leftPanelX = 40
  const rightPanelX = 780

  const leftTextX = leftPanelX + 60
  const circleCX = leftPanelX + 26
  const rightTextX = rightPanelX

  const noFontSize = 14
  const sideFontSize = 16
  const sideLineHeight = 18
  const rightFontSize = 14
  const rightLineHeight = 18
  const centerFontSize = 18

  const n = drawLevels.length
  const totalH = pyramid.bottomLeftY - pyramid.topY
  const layerH = totalH / n

  const leftXAt = (y) => {
    const t = (y - pyramid.topY) / (pyramid.bottomLeftY - pyramid.topY)
    return pyramid.topX + t * (pyramid.bottomLeftX - pyramid.topX)
  }
  const rightXAt = (y) => {
    const t = (y - pyramid.topY) / (pyramid.bottomRightY - pyramid.topY)
    return pyramid.topX + t * (pyramid.bottomRightX - pyramid.topX)
  }

  useEffect(() => {
    if (!hovered) {
      setTipSize({ w: 0, h: 0 })
      return
    }

    const id = requestAnimationFrame(() => {
      const el = tooltipRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      setTipSize({ w: rect.width, h: rect.height })
    })

    return () => cancelAnimationFrame(id)
  }, [hovered, hovered?.slug])

  const previewStyle = useMemo(() => {
    if (!hovered) return { display: 'none' }

    const svgRect = svgRef.current?.getBoundingClientRect()
    if (!svgRect) return { display: 'none' }

    const desiredLeft = svgRect.right + OFFSET_X
    const desiredTop = svgRect.top + (pos.y - svgRect.top) - tipSize.h / 2

    const maxX = typeof window !== 'undefined' ? window.innerWidth - tipSize.w - PADDING : 0
    const maxY = typeof window !== 'undefined' ? window.innerHeight - tipSize.h - PADDING : 0

    const left = clamp(desiredLeft, PADDING, maxX)
    const top = clamp(desiredTop, PADDING, maxY)

    return { left, top }
  }, [hovered, pos.x, pos.y, tipSize.h, tipSize.w])

  return (
    <>
      <svg
        ref={svgRef}
        width="100%"
        viewBox="0 0 980 680"
        xmlns="http://www.w3.org/2000/svg"
        className="text-[#333] dark:text-gray-200"
        aria-label="读书顺序金字塔"
        role="img"
      >
        <polygon
          points={`${pyramid.topX},${pyramid.topY} ${pyramid.bottomRightX},${pyramid.bottomRightY} ${pyramid.bottomLeftX},${pyramid.bottomLeftY}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        />

        {Array.from({ length: n - 1 }).map((_, i) => {
          const y = pyramid.topY + layerH * (i + 1)
          return (
            <line
              key={`divider-${i}`}
              x1={leftXAt(y)}
              y1={y}
              x2={rightXAt(y)}
              y2={y}
              stroke="currentColor"
              strokeWidth="1.8"
            />
          )
        })}

        {drawLevels.map((lv, idx) => {
          const yTop = pyramid.topY + layerH * idx
          const yBot = pyramid.topY + layerH * (idx + 1)
          const yMid = (yTop + yBot) / 2

          const xL = leftXAt(yMid)
          const xR = rightXAt(yMid)
          const xC = (xL + xR) / 2

          const layerPoly = `${leftXAt(yTop)},${yTop} ${rightXAt(yTop)},${yTop} ${rightXAt(yBot)},${yBot} ${leftXAt(yBot)},${yBot}`
          const href = lv.slug ? `/reading/${lv.slug}` : undefined

          const leftLines = String(lv.leftTitle || '').split('\n')
          const rightLines = String(lv.rightTitle || '').split('\n')

          return (
            <a
              key={lv.no}
              href={href}
              className="group"
              aria-label={`阅读：${lv.centerTitle || ''}`}
              onMouseEnter={(e) => {
                setHovered({ slug: lv.slug, title: lv.centerTitle })
                setPos({ x: e.clientX, y: e.clientY })
              }}
              onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}
              onMouseLeave={() => setHovered(null)}
            >
              <g className="cursor-pointer">
                <polygon
                  points={layerPoly}
                  className="fill-transparent group-hover:fill-black/5 dark:group-hover:fill-white/5"
                />

                <circle
                  cx={circleCX}
                  cy={yMid - 8}
                  r={12}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                />
                <text
                  x={circleCX}
                  y={yMid - 2}
                  textAnchor="middle"
                  fontSize={noFontSize}
                  fontWeight="900"
                  fill="currentColor"
                >
                  {lv.no}
                </text>

                <text
                  x={leftTextX}
                  y={yMid - 18}
                  textAnchor="start"
                  fontSize={sideFontSize}
                  fontWeight="800"
                  fill="currentColor"
                >
                  {leftLines.map((line, lineIdx) => (
                    <tspan key={`${lv.no}-l-${lineIdx}`} x={leftTextX} dy={lineIdx === 0 ? 0 : sideLineHeight}>
                      {line}
                    </tspan>
                  ))}
                </text>

                <text
                  x={xC}
                  y={yMid + 6}
                  textAnchor="middle"
                  fontSize={centerFontSize}
                  fontWeight="800"
                  fill="currentColor"
                >
                  {lv.centerTitle}
                </text>

                <g className="text-[#666] dark:text-gray-400">
                  <text
                    x={rightTextX}
                    y={yMid - 18}
                    textAnchor="start"
                    fontSize={rightFontSize}
                    fontWeight="600"
                    fill="currentColor"
                  >
                    {rightLines.map((line, lineIdx) => (
                      <tspan key={`${lv.no}-r-${lineIdx}`} x={rightTextX} dy={lineIdx === 0 ? 0 : rightLineHeight}>
                        {line}
                      </tspan>
                    ))}
                  </text>
                </g>
              </g>
            </a>
          )
        })}

        <line x1={950} y1={600} x2={950} y2={90} stroke="currentColor" strokeWidth={3} />
        <polygon points="950,70 940,90 960,90" fill="currentColor" />
      </svg>

      <div
        ref={tooltipRef}
        className="pointer-events-none fixed z-50 border border-[#eee] bg-white dark:border-gray-800 dark:bg-gray-900"
        style={previewStyle}
      >
        {hovered?.slug ? (
          <img
            src={`/reading/${hovered.slug}.png`}
            alt={hovered.title || ''}
            className="block w-auto h-auto max-w-[240px] max-h-[320px] object-contain"
            onLoad={() => {
              const el = tooltipRef.current
              if (!el) return
              const rect = el.getBoundingClientRect()
              setTipSize({ w: rect.width, h: rect.height })
            }}
          />
        ) : null}
      </div>
    </>
  )
}
