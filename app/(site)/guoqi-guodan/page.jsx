import { createRichPageMetadata } from '../../../lib/richPageSeo'
import RichPageJsonLd from '../components/RichPageJsonLd'
import GuoqiGuodanClient from './GuoqiGuodanClient'

export const dynamic = 'force-static'

export const metadata = createRichPageMetadata('guoqi-guodan')

export default function GuoqiGuodanPage() {
  return (
    <>
      <RichPageJsonLd pageId="guoqi-guodan" />
      <GuoqiGuodanClient />
    </>
  )
}
