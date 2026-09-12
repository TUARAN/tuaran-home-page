import { createRichPageMetadata } from '../../../lib/richPageSeo'
import ContentPvBeacon from '../components/ContentPvBeacon'
import RichPageJsonLd from '../components/RichPageJsonLd'
import QuizClient from './QuizClient'

export const dynamic = 'force-static'

export const metadata = createRichPageMetadata('quiz')

export default function QuizPage() {
  return (
    <>
      <RichPageJsonLd pageId="quiz" />
      <ContentPvBeacon category="rich-page" slug="quiz" />
      <QuizClient />
    </>
  )
}
