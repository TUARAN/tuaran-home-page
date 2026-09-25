import RichPageJsonLd from '../components/RichPageJsonLd'
import { createRichPageMetadata } from '../../../lib/richPageSeo'
import MingEmperorsClient from './MingEmperorsClient'

export const dynamic = 'force-static'

export const metadata = createRichPageMetadata('ming-emperors')

export default function MingEmperorsPage() {
  return (
    <>
      <RichPageJsonLd pageId="ming-emperors" />
      <MingEmperorsClient />
    </>
  )
}
