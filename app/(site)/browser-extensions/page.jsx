import { permanentRedirect } from 'next/navigation'

export default function LegacyBrowserExtensionsPage() {
  permanentRedirect('/tools#downloads')
}
