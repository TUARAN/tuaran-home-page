import { createRichPageMetadata } from '../../../lib/richPageSeo'
import RichPageJsonLd from '../components/RichPageJsonLd'
import ReportClient from './ReportClient'

export const dynamic = 'force-static'

export const metadata = createRichPageMetadata('ai-agent-communications-industry-report')

export default function AiAgentCommunicationsIndustryReportPage() {
  return (
    <>
      <RichPageJsonLd pageId="ai-agent-communications-industry-report" />
      <ReportClient />
    </>
  )
}
