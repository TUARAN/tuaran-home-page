import { permanentRedirect } from 'next/navigation'

export default function OriginalsPage() {
  permanentRedirect('/articles')
}
