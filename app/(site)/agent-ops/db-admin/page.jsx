import { redirect } from 'next/navigation'

export default function LegacyDbAdminPage() {
  redirect('/admin/db')
}
