import { createRichPageMetadata } from '../../../lib/richPageSeo'
import RichPageJsonLd from '../components/RichPageJsonLd'
import PlatformFrameworkPairsClient from './PlatformFrameworkPairsClient'

export const dynamic = 'force-static'

export const metadata = createRichPageMetadata('platform-framework-pairs')

export default function PlatformFrameworkPairsPage() {
  return <><RichPageJsonLd pageId="platform-framework-pairs" /><PlatformFrameworkPairsClient /></>
}
