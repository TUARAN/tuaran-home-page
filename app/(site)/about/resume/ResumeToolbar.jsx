'use client'

import Link from 'next/link'

import SharePageButton from '../../components/SharePageButton'

export default function ResumeToolbar({ title, text, url }) {
  return (
    <div className="resume-chrome flex shrink-0 flex-wrap items-center justify-end gap-2">
      <Link href="/about" className="article-action-button px-3.5 py-1.5 text-sm no-underline">
        返回介绍
      </Link>
      <button
        type="button"
        onClick={() => window.print()}
        className="article-action-button px-3.5 py-1.5 text-sm"
      >
        打印 / 另存 PDF
      </button>
      <SharePageButton
        title={title}
        text={text}
        url={url}
        exactUrl
        size="md"
        idleLabel="分享"
      />
    </div>
  )
}
