import { createRichPageMetadata } from '../../../lib/richPageSeo'
import RichPageJsonLd from '../components/RichPageJsonLd'
import AdSenseContentCheckClient from './AdSenseContentCheckClient'

export const dynamic = 'force-static'

export const metadata = createRichPageMetadata('adsense-content-check')

export default function AdSenseContentCheckPage() {
  return (
    <>
      <RichPageJsonLd pageId="adsense-content-check" />
      <AdSenseContentCheckClient />
    </>
  )
}
