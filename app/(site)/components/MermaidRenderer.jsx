'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'

let mermaidModulePromise
let diagramSequence = 0

function loadMermaid() {
  if (!mermaidModulePromise) {
    mermaidModulePromise = import('mermaid').then((module) => module.default)
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

    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [resolvedTheme])

  return null
}
