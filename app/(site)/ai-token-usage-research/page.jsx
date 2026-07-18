import { createRichPageMetadata } from '../../../lib/richPageSeo'
import RichPageJsonLd from '../components/RichPageJsonLd'
import AiTokenUsageResearchClient from './AiTokenUsageResearchClient'

export const dynamic = 'force-static'

export const metadata = createRichPageMetadata('ai-token-usage-research')

export default function AiTokenUsageResearchPage() {
  return <><RichPageJsonLd pageId="ai-token-usage-research" /><AiTokenUsageResearchClient /></>
}
