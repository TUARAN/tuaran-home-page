import { createRichPageMetadata } from '../../../lib/richPageSeo'
import RichPageJsonLd from '../components/RichPageJsonLd'
import IndustryClassificationClient from './IndustryClassificationClient'

export const dynamic = 'force-static'

export const metadata = createRichPageMetadata('industry-classification')

export default function IndustryClassificationPage() {
  return <><RichPageJsonLd pageId="industry-classification" /><IndustryClassificationClient /></>
}
