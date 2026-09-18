import { redirect } from 'next/navigation'

export const metadata = { title: '调研风格', robots: { index: false, follow: false } }

export default function ResearchStyleTemplatesPage() {
  redirect('/admin/articles?panel=research-style')
}
