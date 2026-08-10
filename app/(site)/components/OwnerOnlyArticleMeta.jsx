'use client'

import { useId } from 'react'
import { IconLock } from '@tabler/icons-react'

import { useSessionAccount } from './SessionProvider'

/**
 * 文章头部的站长专属作者信息（内部记录）：
 * 平时只显示一个紧凑小徽标（作者），悬停 / 聚焦时弹出完整记录
 * （作者、协助工具、模型 ID、版本）；普通访客不渲染。
 */
function shortAuthor(author) {
  if (!author) return ''
  const match = String(author).match(/[（(]([^）)]+)[）)]/)
  return match ? match[1] : String(author)
}

export default function OwnerOnlyArticleMeta({
  author = 'TUARAN',
  assistance = '',
  model = '',
  assistanceLabel = '',
  version = '',
}) {
  const popoverId = useId()
  const { loading, isOwner } = useSessionAccount()
  // loading 期间不渲染，避免非站长先看到再消失的闪烁
  if (loading || !isOwner) return null

  const assistanceText = assistance || assistanceLabel
  const parts = []
  if (author) parts.push(`作者：${author}`)
  if (assistanceText) parts.push(`协助：${assistanceText}`)
  if (model) parts.push(`模型：${model}`)
  if (version) parts.push(`版本：${version}`)
  if (!parts.length) return null

  return (
    <>
      <span aria-hidden="true">·</span>
      <span
        className="owner-only-pill"
        tabIndex={0}
        title="站长内部记录：作者、协助工具与模型 ID，仅本人可见"
        aria-describedby={popoverId}
      >
        <IconLock size={10} strokeWidth={2.2} aria-hidden="true" />
        <span>作者 {shortAuthor(author)}</span>
        <span id={popoverId} role="tooltip" className="owner-only-popover">
          {parts.map((part) => (
            <span key={part}>{part}</span>
          ))}
        </span>
      </span>
    </>
  )
}
