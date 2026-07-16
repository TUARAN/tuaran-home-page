'use client'

import { IconExternalLink, IconX } from '@tabler/icons-react'
import { useEffect } from 'react'

export default function ImageViewer({ image, onClose, title = '查看图片' }) {
  const isOpen = Boolean(image?.src || image?.svgMarkup)

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const alt = image.alt || title

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-[#111]/70 px-3 py-5 backdrop-blur-sm sm:px-6"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
    >
      <div
        className="flex max-h-[calc(100dvh-2.5rem)] w-[min(1080px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-xl border border-black/10 bg-white shadow-2xl dark:border-white/10 dark:bg-[#10161f]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[#eceee6] px-4 py-3 dark:border-[#1f2937]">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#24251f] dark:text-gray-100">{title}</p>
            {image.alt ? (
              <p className="mt-0.5 truncate text-xs text-[#6b6d64] dark:text-gray-400">{image.alt}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={image.src}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d9dbd2] bg-[#f7f8f2] text-[#3f4139] transition hover:border-[#b8bcac] hover:bg-[#eceee6] dark:border-[#303a48] dark:bg-[#17202b] dark:text-gray-100 dark:hover:border-[#4b5563] dark:hover:bg-[#202b39]"
              aria-label="在新标签打开图片"
              title="在新标签打开"
            >
              <IconExternalLink size={17} stroke={1.8} />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#15140f] text-white shadow-sm transition hover:bg-[#3a372e] focus:outline-none focus:ring-2 focus:ring-[#b7791f] focus:ring-offset-2 focus:ring-offset-white dark:bg-white dark:text-[#10161f] dark:hover:bg-gray-200 dark:focus:ring-offset-[#10161f]"
              aria-label="关闭图片预览"
              title="关闭"
            >
              <IconX size={18} stroke={2} />
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-[#f4f3ed] p-3 dark:bg-[#0b1119] sm:p-5">
          {image.svgMarkup ? (
            <div className="prose-tuaran research-media-viewer flex min-h-0 w-full items-center justify-center">
              <figure
                className="research-inline-diagram"
                aria-label={alt}
                dangerouslySetInnerHTML={{ __html: image.svgMarkup }}
              />
            </div>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={image.src}
              alt={alt}
              className="max-h-[calc(100dvh-10rem)] max-w-full rounded-md object-contain shadow-sm"
              draggable={false}
            />
          )}
        </div>

        {image.alt ? (
          <div className="border-t border-[#eceee6] px-4 py-3 text-xs leading-5 text-[#5f6158] dark:border-[#1f2937] dark:text-gray-400">
            {image.alt}
          </div>
        ) : null}
      </div>
    </div>
  )
}
