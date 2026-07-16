'use client'

import { useEffect, useState } from 'react'

import ImageViewer from './ImageViewer'

const MEDIA_SELECTOR = '[data-research-lightbox="true"]'

function getMediaFromElement(element) {
  if (!element) return null

  if (element.tagName === 'IMG') {
    const src = element.currentSrc || element.src
    if (!src) return null
    return {
      src,
      alt: element.getAttribute('alt') || '',
    }
  }

  const svg = element.querySelector('svg')
  if (!svg) return null

  const alt =
    svg.getAttribute('aria-label') ||
    element.querySelector('figcaption')?.textContent?.trim() ||
    '文章图表'
  const svgMarkup = new XMLSerializer().serializeToString(svg)
  const src = URL.createObjectURL(new Blob([svgMarkup], { type: 'image/svg+xml' }))

  return { src, alt, svgMarkup, objectUrl: src }
}

export default function ZoomableResearchMedia({ contentKey, html }) {
  const [media, setMedia] = useState(null)

  useEffect(() => {
    return () => {
      if (media?.objectUrl) URL.revokeObjectURL(media.objectUrl)
    }
  }, [media])

  useEffect(() => {
    setMedia(null)
  }, [contentKey])

  function openFromTarget(target) {
    const element = target?.closest?.(MEDIA_SELECTOR)
    if (!element) return
    setMedia(getMediaFromElement(element))
  }

  function handleClick(event) {
    openFromTarget(event.target)
  }

  function handleKeyDown(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return
    if (!event.target?.matches?.(MEDIA_SELECTOR)) return
    event.preventDefault()
    openFromTarget(event.target)
  }

  return (
    <>
      <article
        key={contentKey}
        className="prose-tuaran"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <ImageViewer image={media} onClose={() => setMedia(null)} />
    </>
  )
}
