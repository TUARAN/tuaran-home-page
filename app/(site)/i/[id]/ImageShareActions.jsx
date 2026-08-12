'use client'

import Link from 'next/link'
import { useState } from 'react'
import { IconCopy, IconExternalLink, IconPhotoUp } from '@tabler/icons-react'

import SharePageButton from '../../components/SharePageButton'

export default function ImageShareActions({ title, shareText, sharePath, mediaUrl, isVideo = false }) {
  const [copied, setCopied] = useState('')

  async function copyText(key, text) {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      window.setTimeout(() => setCopied(''), 1600)
    } catch {
      setCopied('failed')
      window.setTimeout(() => setCopied(''), 1600)
    }
  }

  function absoluteShareUrl() {
    if (typeof window === 'undefined') return sharePath
    if (/^https?:\/\//.test(sharePath)) return sharePath
    return `${window.location.origin}${sharePath}`
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href="/"
        className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#25221b] px-3 text-[13px] font-semibold text-white no-underline transition hover:bg-[#3a3428] dark:bg-[#e8d7b4] dark:text-[#17130d]"
      >
        <IconExternalLink size={17} />
        回到 2aran
      </Link>
      <Link
        href="/tools/image-hosting"
        className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d8d1c4] bg-white/70 px-3 text-[13px] font-semibold text-[#28241d] no-underline transition hover:bg-white dark:border-[#2b3643] dark:bg-[#111a24] dark:text-gray-100"
      >
        <IconPhotoUp size={17} />
        使用图片 / 视频床
      </Link>
      <SharePageButton
        title={title}
        text={shareText}
        url={sharePath}
        exactUrl
        size="md"
        idleLabel={`分享${isVideo ? '视频' : '图片'}`}
      />
      <button
        type="button"
        onClick={() => copyText('share', absoluteShareUrl())}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d8d1c4] bg-white/70 px-3 text-[13px] font-semibold text-[#28241d] transition hover:bg-white dark:border-[#2b3643] dark:bg-[#111a24] dark:text-gray-100"
      >
        <IconCopy size={17} />
        {copied === 'share' ? '已复制分享页' : '复制分享页'}
      </button>
      <button
        type="button"
        onClick={() => copyText('media', mediaUrl)}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d8d1c4] bg-white/70 px-3 text-[13px] font-semibold text-[#28241d] transition hover:bg-white dark:border-[#2b3643] dark:bg-[#111a24] dark:text-gray-100"
      >
        <IconCopy size={17} />
        {copied === 'media' ? '已复制直链' : `复制${isVideo ? '视频' : '图片'}直链`}
      </button>
    </div>
  )
}
