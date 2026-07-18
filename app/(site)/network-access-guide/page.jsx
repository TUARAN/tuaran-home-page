import { createRichPageMetadata } from '../../../lib/richPageSeo'
import RichPageJsonLd from '../components/RichPageJsonLd'
import NetworkAccessGuideClient from './NetworkAccessGuideClient'

export const dynamic = 'force-static'

export const metadata = createRichPageMetadata('network-access-guide')

export default function NetworkAccessGuidePage() {
  return <><RichPageJsonLd pageId="network-access-guide" /><NetworkAccessGuideClient /></>
}
