import { permanentRedirect } from 'next/navigation'

export default function LegacyDesktopAppsPage() {
  permanentRedirect('/tools#desktop-apps')
}
