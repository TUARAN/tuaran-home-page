import RichPageJsonLd from '../components/RichPageJsonLd'
import { createRichPageMetadata } from '../../../lib/richPageSeo'
import ZhuangyuanClient from './ZhuangyuanClient'

export const dynamic = 'force-static'

export const metadata = createRichPageMetadata('zhuangyuan')

export default function ZhuangyuanPage() {
  return (
    <>
      <RichPageJsonLd pageId="zhuangyuan" />
      <ZhuangyuanClient />
    </>
  )
}
