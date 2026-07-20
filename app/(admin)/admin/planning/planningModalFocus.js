'use client'

import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled]):not([tabindex="-1"])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function focusableElements(container) {
  return [...(container?.querySelectorAll(FOCUSABLE_SELECTOR) || [])]
    .filter((element) => !element.hidden && element.getAttribute('aria-hidden') !== 'true')
}

export default function usePlanningModal({ dialogRef, initialFocusRef, backgroundRef, onClose, canClose = true }) {
  const closeRef = useRef(onClose)
  const canCloseRef = useRef(canClose)
  closeRef.current = onClose
  canCloseRef.current = canClose

  useEffect(() => {
    const dialog = dialogRef.current
    const background = backgroundRef.current
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousAriaHidden = background?.getAttribute('aria-hidden')
    const previousInert = Boolean(background?.inert)

    if (background) {
      background.inert = true
      background.setAttribute('aria-hidden', 'true')
    }
    initialFocusRef.current?.focus()

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        if (canCloseRef.current) {
          event.preventDefault()
          closeRef.current?.()
        }
        return
      }
      if (event.key !== 'Tab') return

      const focusable = focusableElements(dialog)
      if (!focusable.length) {
        event.preventDefault()
        initialFocusRef.current?.focus()
        return
      }
      const first = focusable[0]
      const last = focusable.at(-1)
      const active = document.activeElement
      if (event.shiftKey && (active === first || !dialog?.contains(active))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (active === last || !dialog?.contains(active))) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (background) {
        background.inert = previousInert
        if (previousAriaHidden == null) background.removeAttribute('aria-hidden')
        else background.setAttribute('aria-hidden', previousAriaHidden)
      }
      previouslyFocused?.focus()
    }
  }, [backgroundRef, dialogRef, initialFocusRef])
}
