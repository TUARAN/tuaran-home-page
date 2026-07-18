'use client'

import { usePathname } from 'next/navigation'

import { getRichPageByPath, getRichPagePresentation } from '../../../lib/engineeringWorks'

export default function RichPageFrame({ children }) {
  const pathname = usePathname()
  const work = getRichPageByPath(pathname)

  if (!work) return children

  const presentation = getRichPagePresentation(work)

  return (
    <div
      className={`rich-page-frame rich-page-frame--${presentation.id}`}
      data-rich-page-presentation={presentation.id}
    >
      {children}
    </div>
  )
}
