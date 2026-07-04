import { permanentRedirect } from 'next/navigation'

export const dynamic = 'force-static'

export default function XMutualAidCircleRedirectPage() {
  permanentRedirect('/x-mutual-aid-circle')
}
