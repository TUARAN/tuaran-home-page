import { permanentRedirect } from 'next/navigation'

export const dynamic = 'force-static'

export default function BigInteractionShortLinkPage() {
  permanentRedirect('/resources/big-interaction-whitepaper')
}
