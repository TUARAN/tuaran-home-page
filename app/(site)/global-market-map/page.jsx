import { createRichPageMetadata } from '../../../lib/richPageSeo'
import RichPageJsonLd from '../components/RichPageJsonLd'
import GlobalMarketMapClient from './GlobalMarketMapClient'

export const dynamic = 'force-static'

export const metadata = createRichPageMetadata('global-market-map')

export default function GlobalMarketMapPage() {
  return <><RichPageJsonLd pageId="global-market-map" /><GlobalMarketMapClient /></>
}
