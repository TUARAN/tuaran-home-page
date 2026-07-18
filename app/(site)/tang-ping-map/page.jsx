import { createRichPageMetadata } from '../../../lib/richPageSeo'
import RichPageJsonLd from '../components/RichPageJsonLd'
import TangPingMapClient from './TangPingMapClient'

export const dynamic = 'force-static'

export const metadata = createRichPageMetadata('tang-ping-map')

export default function TangPingMapPage() {
  return <><RichPageJsonLd pageId="tang-ping-map" /><TangPingMapClient /></>
}
