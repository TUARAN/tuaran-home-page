import { createRichPageMetadata } from '../../../lib/richPageSeo'
import RichPageJsonLd from '../components/RichPageJsonLd'
import WorkBuddyHarnessClient from './WorkBuddyHarnessClient'

export const dynamic = 'force-static'

export const metadata = createRichPageMetadata('workbuddy-harness')

export default function WorkBuddyHarnessPage() {
  return <><RichPageJsonLd pageId="workbuddy-harness" /><WorkBuddyHarnessClient /></>
}
