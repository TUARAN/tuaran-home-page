import { createRichPageMetadata } from '../../../lib/richPageSeo'
import RichPageJsonLd from '../components/RichPageJsonLd'
import WhaleWalletsClient from './WhaleWalletsClient'

export const dynamic = 'force-static'

export const metadata = createRichPageMetadata('whale-wallets')

export default function WhaleWalletsPage() {
  return (
    <>
      <RichPageJsonLd pageId="whale-wallets" />
      <WhaleWalletsClient />
    </>
  )
}
