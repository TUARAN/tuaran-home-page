import { createRichPageMetadata } from '../../../lib/richPageSeo'
import RichPageJsonLd from '../components/RichPageJsonLd'
import AiStartupSurvivorClient from './AiStartupSurvivorClient'

export const dynamic = 'force-static'

export const metadata = createRichPageMetadata('ai-startup-survivor')

export default function AiStartupSurvivorPage() {
  return (
    <>
      <RichPageJsonLd pageId="ai-startup-survivor" />
      <AiStartupSurvivorClient />
    </>
  )
}
