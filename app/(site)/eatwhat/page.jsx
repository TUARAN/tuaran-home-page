import { createRichPageMetadata } from '../../../lib/site/richPageSeo'
import RichPageJsonLd from '../components/RichPageJsonLd'
import EatwhatClient from './EatwhatClient'

export const metadata = createRichPageMetadata('eatwhat')

export default function EatwhatPage() {
  return <><RichPageJsonLd pageId="eatwhat" /><EatwhatClient /></>
}
