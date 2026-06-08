'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

const QUERY_KEY = 'v'
const VARIANT_EVENT = 'research:variant'
const MAX_UTTERANCE_LENGTH = 140

function dispatchVariant(id) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(VARIANT_EVENT, { detail: { id } }))
}

function stripMarkdownForSpeech(markdown) {
  if (!markdown) return ''
  return String(markdown)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/^>\s?/gm, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\|/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .replace(/\s+/g, ' ')
    .trim()
}

function splitSpeechText(text) {
  if (!text) return []
  const units = text.match(/[^。！？!?；;，,\n]+[。！？!?；;，,\n]?/g) || [text]
  const chunks = []
  let current = ''
  for (const unit of units) {
    if ((current + unit).length <= MAX_UTTERANCE_LENGTH) {
      current += unit
      continue
    }
    if (current) chunks.push(current.trim())
    if (unit.length <= MAX_UTTERANCE_LENGTH) {
      current = unit
      continue
    }
    for (let i = 0; i < unit.length; i += MAX_UTTERANCE_LENGTH) {
      const part = unit.slice(i, i + MAX_UTTERANCE_LENGTH).trim()
      if (part) chunks.push(part)
    }
    current = ''
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks
}

function pickChineseVoice(voices) {
  if (!Array.isArray(voices) || !voices.length) return null
  return (
    voices.find((voice) => /^zh(-|_)/i.test(voice.lang)) ||
    voices.find((voice) => /^yue(-|_)/i.test(voice.lang)) ||
    voices[0]
  )
}

export default function ResearchBody({ variants }) {
  const list = Array.isArray(variants) && variants.length > 0 ? variants : []
  const [activeId, setActiveId] = useState(list[0]?.id)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const active = list.find((v) => v.id === activeId) || list[0]
  const speechRef = useRef({ cancelled: false })
  const utteranceRef = useRef(null)

  const speechText = useMemo(() => {
    if (!active?.content) return ''
    return stripMarkdownForSpeech(active.content)
  }, [active?.content])

  // 挂载时：若 URL 带 ?v=xxx 且匹配某个变体，则切到那个变体；
  // 无论是否切换，都广播一次当前 active id，让头部的 PPT 按钮等订阅者同步状态。
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const fromUrl = (params.get(QUERY_KEY) || '').toLowerCase()
    const next = fromUrl && list.some((v) => v.id === fromUrl) ? fromUrl : list[0]?.id
    if (next && next !== activeId) setActiveId(next)
    if (next) dispatchVariant(next)
    // 仅在挂载时执行
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function selectVariant(id) {
    setActiveId(id)
    dispatchVariant(id)
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    // 默认变体（第一个）不写 query，保持链接干净
    if (id === list[0]?.id) {
      url.searchParams.delete(QUERY_KEY)
    } else {
      url.searchParams.set(QUERY_KEY, id)
    }
    const next = url.pathname + (url.search || '') + (url.hash || '')
    window.history.replaceState(null, '', next)
  }

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
    const synth = window.speechSynthesis
    if (!synth) return
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
  }, [active?.id])

  if (!active) return null

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-[#666] dark:text-gray-400">
        {list.length > 1 ? (
          <>
            <span className="font-mono uppercase tracking-[0.18em] text-[10px] text-[#999] dark:text-gray-500">
              version
            </span>
            <div className="inline-flex overflow-hidden rounded-full border border-[#ddd8cb] bg-white/70 dark:border-[#2d3440] dark:bg-[#121821]">
              {list.map((v) => {
                const isActive = v.id === active.id
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => selectVariant(v.id)}
                    className={[
                      'px-3 py-1 text-[12px] transition',
                      isActive
                        ? 'bg-[#b7791f] text-white dark:bg-[#e2bd75] dark:text-[#1a1a1a]'
                        : 'text-[#5f5a4d] hover:bg-[#fbf3e3] dark:text-gray-300 dark:hover:bg-[#1a2230]',
                    ].join(' ')}
                    aria-pressed={isActive}
                  >
                    {v.label}
                  </button>
                )
              })}
            </div>
          </>
        ) : null}
        <button
          type="button"
          onClick={isSpeaking ? stopSpeech : startSpeech}
          disabled={!speechSupported || !speechText}
          className={[
            'inline-flex items-center rounded-full border px-3 py-1 text-[12px] transition',
            !speechSupported || !speechText
              ? 'cursor-not-allowed border-[#ddd8cb] bg-white/70 text-[#b0a89a] dark:border-[#2d3440] dark:bg-[#121821] dark:text-gray-600'
              : isSpeaking
                ? 'border-[#e9d5b8] bg-[#fbf3e3] text-[#8a5a14] hover:border-[#d4b27d] dark:border-[#3a2f1c] dark:bg-[#2a2115] dark:text-[#e2bd75]'
                : 'border-[#cbd9ee] bg-[#eff4fc] text-[#3b5b8a] hover:border-[#9fb7d8] dark:border-[#2a3a55] dark:bg-[#152034] dark:text-[#9bb6df]',
          ].join(' ')}
          title={speechSupported ? '' : '当前浏览器不支持语音朗读'}
        >
          {isSpeaking ? '停止朗读' : '朗读本文'}
        </button>
      </div>

      <div className="flex flex-col gap-6 md:flex-row">
        {active.toc?.length > 1 ? (
          <aside className="hidden md:block md:w-52 shrink-0">
            <nav className="toc-scroll-panel">
              <div className="text-sm font-bold border-b border-[#eee] pb-2 mb-3 dark:border-gray-800 dark:text-gray-200">
                文章目录
              </div>
              <ul className="text-sm text-[#666] space-y-2 dark:text-gray-300">
                {active.toc.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="text-[#444] dark:text-gray-200 opacity-90 hover:opacity-100 underline underline-offset-4"
                    >
                      {item.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        ) : null}

        <div className="flex-1 min-w-0">
          <article
            key={active.id}
            className="prose-tuaran"
            dangerouslySetInnerHTML={{ __html: active.html }}
          />
        </div>
      </div>
    </>
  )
}
