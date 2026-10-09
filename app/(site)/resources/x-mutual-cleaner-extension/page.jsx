import { permanentRedirect } from 'next/navigation'

export const dynamic = 'force-static'

export default function XMutualCleanerResourcePage() {
  permanentRedirect('/resources/x-reply-clipboard-extension')
}
