import { permanentRedirect } from 'next/navigation'

export default function LegacySitesPage() {
  permanentRedirect('/works')
}
