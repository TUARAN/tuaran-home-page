import { createRichPageMetadata } from '../../../lib/richPageSeo'
import RichPageJsonLd from '../components/RichPageJsonLd'
import CancersOverviewClient from './CancersOverviewClient'

export const dynamic = 'force-static'

export const metadata = createRichPageMetadata('cancers-overview')

export default function CancersOverviewPage() {
  return <><RichPageJsonLd pageId="cancers-overview" /><CancersOverviewClient /></>
}
