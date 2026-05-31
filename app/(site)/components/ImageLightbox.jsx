'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

export default function ImageLightbox({ images, columns = 2 }) {
  const [openIndex, setOpenIndex] = useState(null)

  const isOpen = openIndex != null

  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpenIndex(null)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen])

  const gridColsClass = columns === 1 ? 'grid-cols-1' : 'grid-cols-2'

  return (
    <>
      <div className={`grid ${gridColsClass} gap-3`}>
        {images.map((img, idx) => (
          <button
            key={img.src}
            type="button"
            onClick={() => setOpenIndex(idx)}
            className="border border-[#eee] bg-white p-3 dark:border-gray-800 dark:bg-gray-900 text-left"
          >
            <Image
              src={img.src}
              alt={img.alt || ''}
              width={1600}
              height={900}
              className="w-full h-auto"
            />
          </button>
        ))}
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-gray-900/80 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpenIndex(null)}
        >
          <div className="h-full w-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <div className="relative w-full">
              <div className="flex justify-end mb-3">
                <button
                  type="button"
                  onClick={() => setOpenIndex(null)}
                  className="border border-[#eee] bg-white px-3 py-1 text-sm text-[#333] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100"
                >
                  关闭
                </button>
              </div>

              <div className="flex items-center justify-center">
                <Image
                  src={images[openIndex].src}
                  alt={images[openIndex].alt || ''}
                  width={2400}
                  height={1600}
                  className="max-h-[85vh] w-auto h-auto"
                  sizes="100vw"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
