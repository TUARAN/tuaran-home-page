'use client'

import { usePathname } from 'next/navigation'

import {
  getRichPageByPath,
  getRichPagePresentation,
  getRichPagePvKey,
} from '../../../lib/engineeringWorks'
import ContentPvBeacon from './ContentPvBeacon'

export default function RichPageFrame({ children }) {
  const pathname = usePathname()
  const work = getRichPageByPath(pathname)

  if (!work) return children

  const presentation = getRichPagePresentation(work)
  const [pvCategory, pvSlug] = getRichPagePvKey(work).split('/')

  return (
    <div
      className={`rich-page-frame rich-page-frame--${presentation.id}`}
      data-rich-page-presentation={presentation.id}
    >
      <ContentPvBeacon category={pvCategory} slug={pvSlug} />
      {children}
    </div>
  )
}
