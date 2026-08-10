'use client'

import { useState } from 'react'
import ArticleActionsDropdown from '../../../../components/ArticleActionsDropdown'
import { copyPlainText, copyRichText, markdownToPlainText } from '../../../../../../lib/contentClipboard'

export default function CopyMarkdownButton({ markdown, html }) {
  const [copied, setCopied] = useState('')

  function flash(format) {
    setCopied(format)
    setTimeout(() => setCopied(''), 2000)
  }

  async function handleCopy(format) {
    const plainText = markdownToPlainText(markdown)
    const result = format === 'rich'
      ? await copyRichText({ html, text: plainText })
      : await copyPlainText(format === 'markdown' ? markdown : plainText)
    if (format === 'rich' && result?.copied) {
      flash(result.format === 'rich' ? 'rich' : 'plain')
      const missingImages = (result.imageCount || 0) - (result.embeddedImages || 0)
      if (missingImages > 0) {
        window.alert?.(`正文已复制；有 ${missingImages} 张图片因跨域或体积限制无法写入剪贴板，请手动补充。`)
      }
    }
    else if (result) flash(format)
  }

  const label = copied ? '已复制' : '复制'

  return (
    <ArticleActionsDropdown label={label} closeOnSelect>
      <button
        type="button"
        role="menuitem"
        onClick={() => handleCopy('rich')}
        title="复制带标题、段落、列表和链接的富文本；可直接粘贴到 X Articles"
        className="article-action-button px-3 py-1 text-xs"
      >
        <CopyIcon />
        <span>{copied === 'rich' ? 'X 图文已复制' : '复制为 X 图文'}</span>
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={() => handleCopy('plain')}
        title="复制去除 Markdown 标记的纯文本"
        className="article-action-button px-3 py-1 text-xs"
      >
        <CopyIcon />
        <span>复制为纯文本</span>
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={() => handleCopy('markdown')}
        title="复制文章的 Markdown 源码"
        className="article-action-button px-3 py-1 text-xs"
      >
        <CopyIcon />
        <span>复制 Markdown</span>
      </button>
    </ArticleActionsDropdown>
  )
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 14 14" aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="9" height="9" rx="1.5" />
      <path d="M10.5 4V2.5A1.5 1.5 0 0 0 9 1H2.5A1.5 1.5 0 0 0 1 2.5V9a1.5 1.5 0 0 0 1.5 1.5H4" />
    </svg>
  )
}
