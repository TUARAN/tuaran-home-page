import { permanentRedirect } from 'next/navigation'

export default function PublicationsPage() {
  permanentRedirect('/resources/books')
}
