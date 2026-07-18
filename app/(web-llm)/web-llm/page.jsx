import { createRichPageMetadata } from '../../../lib/richPageSeo'
import RichPageJsonLd from '../../(site)/components/RichPageJsonLd'
import WebLlmPageClient from './WebLlmPageClient'

import './webllm.css'

export const metadata = createRichPageMetadata('web-llm')

export default function WebLlmPage() {
  return <><RichPageJsonLd pageId="web-llm" /><WebLlmPageClient /></>
}
