'use client'

import Image from 'next/image'
import { useState } from 'react'

import ImageViewer from './ImageViewer'

export default function ImageLightbox({ images, columns = 2 }) {
  const [openIndex, setOpenIndex] = useState(null)

  const isOpen = openIndex != null

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

      <ImageViewer image={isOpen ? images[openIndex] : null} onClose={() => setOpenIndex(null)} />
    </>
  )
}
