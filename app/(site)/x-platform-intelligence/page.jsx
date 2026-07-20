import { createRichPageMetadata } from '../../../lib/richPageSeo'
import RichPageJsonLd from '../components/RichPageJsonLd'
import XPlatformIntelligenceClient from './XPlatformIntelligenceClient'

export const dynamic = 'force-static'
export const metadata = createRichPageMetadata('x-platform-intelligence')

export default function XPlatformIntelligencePage() {
  return <><RichPageJsonLd pageId="x-platform-intelligence" /><XPlatformIntelligenceClient /></>
}
