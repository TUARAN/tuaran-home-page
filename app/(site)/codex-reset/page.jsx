import { createRichPageMetadata } from '../../../lib/richPageSeo'
import RichPageJsonLd from '../components/RichPageJsonLd'
import CodexResetClient from './CodexResetClient'

export const dynamic = 'force-static'

export const metadata = createRichPageMetadata('codex-reset')

export default function CodexResetPage() {
  return (
    <>
      <RichPageJsonLd pageId="codex-reset" />
      <CodexResetClient />
    </>
  )
}
