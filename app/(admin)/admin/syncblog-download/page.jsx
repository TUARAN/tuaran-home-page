import { redirect } from 'next/navigation'

export default function Page() {
  redirect('/admin/community-actions?tab=extension#syncblog-download')
}
