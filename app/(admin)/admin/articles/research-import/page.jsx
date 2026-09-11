import { redirect } from 'next/navigation'

export const metadata = { title: '审批调研', robots: { index: false, follow: false } }

export default function ResearchImportPage() {
  redirect('/admin/articles?panel=import')
}
