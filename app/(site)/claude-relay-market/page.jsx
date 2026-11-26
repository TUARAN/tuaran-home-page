import { createRichPageMetadata } from '../../../lib/site/richPageSeo'
import RichPageJsonLd from '../components/RichPageJsonLd'
import ClaudeRelayMarketClient from './ClaudeRelayMarketClient'

export const dynamic = 'force-static'

export const metadata = createRichPageMetadata('claude-relay-market')

export default function ClaudeRelayMarketPage() {
  return <><RichPageJsonLd pageId="claude-relay-market" /><ClaudeRelayMarketClient /></>
}
