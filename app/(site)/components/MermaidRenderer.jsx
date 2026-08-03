'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'

let mermaidModulePromise
let diagramSequence = 0
let fallbackFullscreenDiagram = null
let fallbackBodyOverflow = ''
const MERMAID_SCRIPT_SRC = 'https://cdn.jsdelivr.net/npm/mermaid@11.16.0/dist/mermaid.min.js'
const MIN_ZOOM = 0.5
const MAX_ZOOM = 3
const ZOOM_STEP = 0.25

function loadMermaid() {
  if (!mermaidModulePromise) {
    mermaidModulePromise = new Promise((resolve, reject) => {
      if (window.mermaid) {
        resolve(window.mermaid)
        return
      }

      const existingScript = document.querySelector(`script[src="${MERMAID_SCRIPT_SRC}"]`)
      const script = existingScript || document.createElement('script')
      const handleLoad = () => {
        if (window.mermaid) resolve(window.mermaid)
        else reject(new Error('Mermaid loaded without exposing window.mermaid'))
      }
      const handleError = () => reject(new Error('Failed to load Mermaid'))

      script.addEventListener('load', handleLoad, { once: true })
      script.addEventListener('error', handleError, { once: true })
      if (!existingScript) {
        script.src = MERMAID_SCRIPT_SRC
        script.async = true
        script.dataset.mermaidRuntime = 'true'
        document.head.appendChild(script)
      }
    }).catch((error) => {
      mermaidModulePromise = null
      throw error
    })
  }
  return mermaidModulePromise
}

function findDiagrams(root) {
  const diagrams = []
  if (root instanceof Element && root.matches('[data-mermaid-diagram]')) diagrams.push(root)
  if (root instanceof Document || root instanceof Element) {
    diagrams.push(...root.querySelectorAll('[data-mermaid-diagram]'))
  }
  return diagrams
}

function clampZoom(value) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value))
}

function createControl(action, symbol, label, title = label) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'mermaid-diagram__control'
  button.dataset.mermaidAction = action
  button.textContent = symbol
  button.setAttribute('aria-label', label)
  button.title = title
  return button
}

function updateZoom(diagram, value) {
  const zoom = clampZoom(Number(value) || 1)
  const stage = diagram.querySelector('[data-mermaid-stage]')
  const viewport = diagram.querySelector('[data-mermaid-viewport]')
  const label = diagram.querySelector('[data-mermaid-zoom-label]')
  if (!stage) return

  const previousScrollWidth = viewport?.scrollWidth || 0
  const centerRatio = viewport && previousScrollWidth > 0
    ? (viewport.scrollLeft + viewport.clientWidth / 2) / previousScrollWidth
    : 0.5

  diagram.dataset.mermaidZoom = String(zoom)
  stage.style.width = `${zoom * 100}%`
  if (label) label.textContent = `${Math.round(zoom * 100)}%`

  const zoomOut = diagram.querySelector('[data-mermaid-action="zoom-out"]')
  const zoomIn = diagram.querySelector('[data-mermaid-action="zoom-in"]')
  if (zoomOut) zoomOut.disabled = zoom <= MIN_ZOOM
  if (zoomIn) zoomIn.disabled = zoom >= MAX_ZOOM

  if (viewport) {
    requestAnimationFrame(() => {
      viewport.scrollLeft = Math.max(0, centerRatio * viewport.scrollWidth - viewport.clientWidth / 2)
    })
  }
}

function syncFullscreenControls() {
  for (const diagram of document.querySelectorAll('[data-mermaid-diagram]')) {
    const active = document.fullscreenElement === diagram || diagram.dataset.mermaidFullscreen === 'true'
    const button = diagram.querySelector('[data-mermaid-action="fullscreen"]')
    if (!button) continue
    button.textContent = active ? '⛶' : '⛶'
    button.setAttribute('aria-label', active ? '退出全屏' : '全屏查看')
    button.title = active ? '退出全屏（Esc）' : '全屏查看'
    button.setAttribute('aria-pressed', String(active))
  }
}

function closeFallbackFullscreen() {
  if (!fallbackFullscreenDiagram) return
  fallbackFullscreenDiagram.removeAttribute('data-mermaid-fullscreen')
  fallbackFullscreenDiagram = null
  document.body.style.overflow = fallbackBodyOverflow
  fallbackBodyOverflow = ''
  syncFullscreenControls()
}

async function toggleFullscreen(diagram) {
  if (document.fullscreenElement === diagram) {
    await document.exitFullscreen?.()
    return
  }
  if (diagram.dataset.mermaidFullscreen === 'true') {
    closeFallbackFullscreen()
    return
  }

  if (diagram.requestFullscreen) {
    await diagram.requestFullscreen()
    return
  }

  closeFallbackFullscreen()
  fallbackFullscreenDiagram = diagram
  fallbackBodyOverflow = document.body.style.overflow
  diagram.dataset.mermaidFullscreen = 'true'
  document.body.style.overflow = 'hidden'
  syncFullscreenControls()
}

function enhanceDiagram(diagram) {
  const svg = diagram.querySelector(':scope > svg')
  if (!svg) return

  const toolbar = document.createElement('div')
  toolbar.className = 'mermaid-diagram__toolbar not-prose'
  toolbar.setAttribute('role', 'toolbar')
  toolbar.setAttribute('aria-label', '图表显示控制')

  const zoomOut = createControl('zoom-out', '−', '缩小图表')
  const zoomLabel = document.createElement('output')
  zoomLabel.className = 'mermaid-diagram__zoom-label'
  zoomLabel.dataset.mermaidZoomLabel = 'true'
  zoomLabel.setAttribute('aria-live', 'polite')
  const zoomIn = createControl('zoom-in', '+', '放大图表')
  const reset = createControl('reset', '↺', '重置缩放', '恢复为 100%')
  const fullscreen = createControl('fullscreen', '⛶', '全屏查看')
  toolbar.append(zoomOut, zoomLabel, zoomIn, reset, fullscreen)

  const viewport = document.createElement('div')
  viewport.className = 'mermaid-diagram__viewport not-prose'
  viewport.dataset.mermaidViewport = 'true'
  viewport.tabIndex = 0
  viewport.setAttribute('aria-label', 'Mermaid 图表，可使用工具栏或按住 Ctrl/Command 滚动缩放')

  const stage = document.createElement('div')
  stage.className = 'mermaid-diagram__stage'
  stage.dataset.mermaidStage = 'true'
  stage.appendChild(svg)
  viewport.appendChild(stage)
  diagram.replaceChildren(toolbar, viewport)

  updateZoom(diagram, Number(diagram.dataset.mermaidZoom) || 1)
  syncFullscreenControls()
}

export default function MermaidRenderer() {
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    const theme = resolvedTheme === 'dark' ? 'dark' : 'default'
    let cancelled = false

    async function renderDiagrams(root) {
      const diagrams = findDiagrams(root)
      if (diagrams.length === 0) return

      const mermaid = await loadMermaid()
      if (cancelled) return

      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        suppressErrorRendering: true,
        theme,
        flowchart: { htmlLabels: false },
      })

      for (const diagram of diagrams) {
        if (!diagram.dataset.mermaidSource) {
          diagram.dataset.mermaidSource = diagram.textContent || ''
        }
        if (diagram.dataset.mermaidTheme === theme && diagram.dataset.mermaidStatus === 'rendered') {
          continue
        }

        const source = diagram.dataset.mermaidSource
        const requestId = `${theme}-${++diagramSequence}`
        diagram.dataset.mermaidRequest = requestId
        diagram.dataset.mermaidStatus = 'rendering'
        diagram.setAttribute('aria-busy', 'true')

        try {
          const { svg, bindFunctions } = await mermaid.render(`mermaid-diagram-${diagramSequence}`, source)
          if (cancelled || diagram.dataset.mermaidRequest !== requestId) continue
          diagram.innerHTML = svg
          bindFunctions?.(diagram)
          enhanceDiagram(diagram)
          diagram.dataset.mermaidTheme = theme
          diagram.dataset.mermaidStatus = 'rendered'
          diagram.removeAttribute('data-mermaid-error')
        } catch (error) {
          if (cancelled || diagram.dataset.mermaidRequest !== requestId) continue
          diagram.textContent = source
          diagram.dataset.mermaidStatus = 'error'
          diagram.setAttribute('data-mermaid-error', 'true')
          console.error('Mermaid diagram render failed', error)
        } finally {
          if (diagram.dataset.mermaidRequest === requestId) diagram.removeAttribute('aria-busy')
        }
      }
    }

    renderDiagrams(document)

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof Element) renderDiagrams(node)
        }
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })

    const handleClick = (event) => {
      const control = event.target?.closest?.('[data-mermaid-action]')
      const diagram = control?.closest?.('[data-mermaid-diagram]')
      if (!control || !diagram) return

      const zoom = Number(diagram.dataset.mermaidZoom) || 1
      if (control.dataset.mermaidAction === 'zoom-out') updateZoom(diagram, zoom - ZOOM_STEP)
      if (control.dataset.mermaidAction === 'zoom-in') updateZoom(diagram, zoom + ZOOM_STEP)
      if (control.dataset.mermaidAction === 'reset') updateZoom(diagram, 1)
      if (control.dataset.mermaidAction === 'fullscreen') {
        toggleFullscreen(diagram).catch((error) => console.error('Mermaid fullscreen failed', error))
      }
    }

    const handleWheel = (event) => {
      if (!event.ctrlKey && !event.metaKey) return
      const viewport = event.target?.closest?.('[data-mermaid-viewport]')
      const diagram = viewport?.closest?.('[data-mermaid-diagram]')
      if (!diagram) return
      event.preventDefault()
      const zoom = Number(diagram.dataset.mermaidZoom) || 1
      updateZoom(diagram, zoom + (event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP))
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && fallbackFullscreenDiagram) closeFallbackFullscreen()
    }

    document.addEventListener('click', handleClick)
    document.addEventListener('wheel', handleWheel, { passive: false })
    document.addEventListener('fullscreenchange', syncFullscreenControls)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      cancelled = true
      observer.disconnect()
      document.removeEventListener('click', handleClick)
      document.removeEventListener('wheel', handleWheel)
      document.removeEventListener('fullscreenchange', syncFullscreenControls)
      window.removeEventListener('keydown', handleKeyDown)
      closeFallbackFullscreen()
    }
  }, [resolvedTheme])

  return null
}
