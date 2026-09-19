'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { pickChineseVoice, splitSpeechText, stripMarkdownForSpeech } from '../../../lib/speechText'

export default function ReadAloudButton({ markdown = '', portal = false }) {
  const [slot, setSlot] = useState(null)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const speechRef = useRef({ cancelled: false })
  const utteranceRef = useRef(null)
  const speechText = useMemo(() => stripMarkdownForSpeech(markdown), [markdown])

  useEffect(() => {
    if (!portal || typeof document === 'undefined') return
    setSlot(document.querySelector('[data-article-read-aloud-slot]'))
  }, [portal])

  function stopSpeech() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    speechRef.current.cancelled = true
    window.speechSynthesis.cancel()
    utteranceRef.current = null
    setIsSpeaking(false)
  }

  function startSpeech() {
    if (!speechSupported || !speechText || typeof window === 'undefined') return
    const synth = window.speechSynthesis
    const chunks = splitSpeechText(speechText)
    if (!chunks.length) return

    stopSpeech()
    speechRef.current.cancelled = false
    setIsSpeaking(true)

    const speakChunk = (index) => {
      if (speechRef.current.cancelled) return
      if (index >= chunks.length) {
        setIsSpeaking(false)
        utteranceRef.current = null
        return
      }
      const utterance = new SpeechSynthesisUtterance(chunks[index])
      const voice = pickChineseVoice(synth.getVoices())
      if (voice) {
        utterance.voice = voice
        utterance.lang = voice.lang || 'zh-CN'
      } else {
        utterance.lang = 'zh-CN'
      }
      utterance.rate = 1
      utterance.pitch = 1
      utterance.onend = () => speakChunk(index + 1)
      utterance.onerror = () => {
        setIsSpeaking(false)
        utteranceRef.current = null
      }
      utteranceRef.current = utterance
      synth.speak(utterance)
    }

    speakChunk(0)
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!window.speechSynthesis) return
    setSpeechSupported(true)
  }, [])

  useEffect(() => {
    return () => {
      stopSpeech()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    stopSpeech()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markdown])

  if (!markdown) return null
  if (portal && !slot) return null

  const label = isSpeaking ? '停止' : '朗读'
  const button = (
    <button
      type="button"
      onClick={isSpeaking ? stopSpeech : startSpeech}
      disabled={!speechSupported || !speechText}
      aria-pressed={isSpeaking}
      aria-live="polite"
      title={speechSupported ? (isSpeaking ? '停止朗读' : '朗读正文') : '当前浏览器不支持语音朗读'}
      className="article-action-button px-3 py-1 text-xs disabled:opacity-60"
    >
      {isSpeaking ? <StopIcon /> : <SpeakerIcon />}
      <span>{label}</span>
    </button>
  )

  return portal ? createPortal(button, slot) : button
}

function SpeakerIcon() {
  return (
    <svg viewBox="0 0 14 14" aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 5.6h2.1L8 3.4v7.2L5.1 8.4H3A1.4 1.4 0 0 1 1.6 7V7A1.4 1.4 0 0 1 3 5.6Z" />
      <path d="M10 5.3a2.2 2.2 0 0 1 0 3.4" />
      <path d="M11.4 4a3.8 3.8 0 0 1 0 6" />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg viewBox="0 0 14 14" aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
    </svg>
  )
}
