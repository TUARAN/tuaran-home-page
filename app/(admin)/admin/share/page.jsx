import { redirect } from 'next/navigation'

export const metadata = {
  title: '私密文档与分享',
  robots: { index: false, follow: false },
}

export default function AdminSharePage() {
  redirect('/admin/private-data/documents?view=shares')
}
