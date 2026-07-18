import { createRichPageMetadata } from '../../../lib/richPageSeo'
import RichPageJsonLd from '../components/RichPageJsonLd'
import SunMoonMotionClient from './SunMoonMotionClient'

export const dynamic = 'force-static'

export const metadata = createRichPageMetadata('sun-moon-motion')

export default function SunMoonMotionPage() {
  return <><RichPageJsonLd pageId="sun-moon-motion" /><SunMoonMotionClient /></>
}
