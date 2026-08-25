import { redirect } from 'next/navigation'

export const runtime = 'edge'
export default function StrawberryProfilePage() {
  redirect('/admin/soft-sticker?tab=strawberry')
}
