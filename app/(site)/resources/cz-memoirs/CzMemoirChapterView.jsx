import { notFound } from 'next/navigation'

import ContentPvBeacon from '../../components/ContentPvBeacon'
import {
  CZ_MEMOIR_CHAPTER_GROUPS,
  CZ_MEMOIR_CHAPTERS,
} from '../../../../lib/czMemoirs'
import { readCzMemoirChapter } from '../../../../lib/czMemoirsContent'
import CzMemoirReader from './[chapter]/CzMemoirReader'

export default function CzMemoirChapterView({ slug, jsonLd }) {
  const content = readCzMemoirChapter(slug)
  if (!content) notFound()

  const index = CZ_MEMOIR_CHAPTERS.findIndex((chapter) => chapter.slug === content.slug)
  const previous = index > 0 ? CZ_MEMOIR_CHAPTERS[index - 1] : null
  const next = index < CZ_MEMOIR_CHAPTERS.length - 1 ? CZ_MEMOIR_CHAPTERS[index + 1] : null

  return (
    <>
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
      ) : null}
      <ContentPvBeacon category="resource" slug="cz-memoirs" />
      <CzMemoirReader
        chapter={content}
        groups={CZ_MEMOIR_CHAPTER_GROUPS}
        outline={content.outline}
        previous={previous}
        next={next}
      >
        <div dangerouslySetInnerHTML={{ __html: content.html }} />
      </CzMemoirReader>
    </>
  )
}
