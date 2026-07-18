import { createRichPageMetadata } from '../../../lib/richPageSeo'
import ContentEngagement from '../components/ContentEngagement'
import RichPageJsonLd from '../components/RichPageJsonLd'
import WisdomFrontierClient from '../resources/wisdom-frontier/WisdomFrontierClient'

export const dynamic = 'force-static'

export const metadata = createRichPageMetadata('wisdom-frontier')

export default function WisdomFrontierPage() {
  return (
    <>
      <RichPageJsonLd pageId="wisdom-frontier" />
      <WisdomFrontierClient />
      <ContentEngagement contentKey="resource:wisdom-frontier" width="standard" />
    </>
  )
}
