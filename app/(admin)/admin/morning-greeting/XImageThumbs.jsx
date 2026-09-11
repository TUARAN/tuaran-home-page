'use client'

import { useEffect, useRef } from 'react'

export const THUMB_GRID_CLASS = 'grid grid-cols-5 gap-2 sm:grid-cols-10'

export function OriginalPreviewDialog({ preview, onClose }) {
  const dialog = useRef(null)

  useEffect(() => {
    if (preview) dialog.current?.showModal()
    else dialog.current?.close()
  }, [preview])

  const original = preview?.original || preview?.path || preview?.imageUrl || ''

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      className="max-h-[90vh] w-[min(900px,92vw)] overflow-y-auto rounded-2xl bg-white p-4 text-[#34352f] backdrop:bg-black/60 dark:bg-[#10161f] dark:text-gray-100"
      aria-label="查看原图"
    >
      {preview ? (
        <>
          <div className="mb-3 flex justify-between gap-3">
            <strong>{preview.label || `${preview.date || ''} · ${preview.slot || ''}`.trim() || '原图'}</strong>
            <button type="button" onClick={onClose} className="rounded border px-3 py-1 text-sm">关闭</button>
          </div>
          {original ? <img src={original} alt={preview.label || '原图'} className="max-h-[60vh] w-full object-contain" /> : null}
          {preview.text ? <p className="whitespace-pre-wrap text-sm">{preview.text}</p> : null}
          {preview.storage || preview.objectKey ? <p className="break-all text-xs text-gray-500">{[preview.storage, preview.objectKey].filter(Boolean).join(' ')}</p> : null}
          {preview.model ? <p className="text-xs">{preview.model}{preview.sizeBytes ? ` · ${(preview.sizeBytes / 1024).toFixed(0)} KB` : ''}</p> : null}
          {preview.prompt ? <details><summary className="cursor-pointer text-xs">生成提示词</summary><p className="text-xs leading-6">{preview.prompt}</p></details> : null}
        </>
      ) : null}
    </dialog>
  )
}

export function ThumbTile({ item, onViewOriginal }) {
  return (
    <figure className="m-0 min-w-0">
      <div className="overflow-hidden rounded-lg border border-[#e2e4da] bg-[#f3f4ee] dark:border-[#293545] dark:bg-[#10161f]">
        {item.thumb ? (
          <img
            src={item.thumb}
            alt=""
            width={240}
            height={240}
            loading="lazy"
            decoding="async"
            className="aspect-square w-full object-cover"
          />
        ) : (
          <div className="flex aspect-square items-center justify-center px-1 text-center text-[10px] leading-4 text-[#96988e] dark:text-gray-500">
            {item.placeholder || '无小图'}
          </div>
        )}
      </div>
      <figcaption className="mt-1 truncate text-center text-[10px] leading-4 text-[#5f6257] dark:text-gray-400" title={item.label}>
        {item.label}
      </figcaption>
      {item.original ? (
        <button
          type="button"
          onClick={() => onViewOriginal(item)}
          className="mt-0.5 block w-full text-center text-[10px] font-medium text-sky-700 hover:underline dark:text-sky-300"
        >
          查看原图
        </button>
      ) : null}
    </figure>
  )
}
