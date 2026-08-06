'use client'

import { useSessionAccount } from './SessionProvider'
import OwnerOnlyMark from './OwnerOnlyMark'

/**
 * 文章头部的站长专属作者信息（内部记录）：
 * 作者、协助工具、模型 ID 等只展示给站长本人，普通访客不渲染。
 * 自身带「仅站长可见」标记，与其他站长专属元素共用同一套视觉体系。
 */
export default function OwnerOnlyArticleMeta({
  author = '涂阿燃（TUARAN）',
  assistance = '',
  model = '',
  assistanceLabel = '',
  version = '',
}) {
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
        className="owner-only-meta"
        title="站长内部记录：作者、协助工具与模型 ID，仅本人可见"
      >
        <OwnerOnlyMark />
        {parts.map((part) => (
          <span key={part} className="owner-only-meta-text">
            {part}
          </span>
        ))}
      </span>
    </>
  )
}
