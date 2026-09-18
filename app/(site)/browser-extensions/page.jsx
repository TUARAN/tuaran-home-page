import { permanentRedirect } from 'next/navigation'

export default function LegacyBrowserExtensionsPage() {
  permanentRedirect('/downloads#extensions')
}
