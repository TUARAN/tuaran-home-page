import { createRichPageMetadata } from '../../../lib/richPageSeo'
import RichPageJsonLd from '../components/RichPageJsonLd'
import GlobalAiGovernanceClient from './GlobalAiGovernanceClient'

export const dynamic = 'force-static'

export const metadata = createRichPageMetadata('global-ai-governance')

export default function GlobalAiGovernancePage() {
  return <><RichPageJsonLd pageId="global-ai-governance" /><GlobalAiGovernanceClient /></>
}
