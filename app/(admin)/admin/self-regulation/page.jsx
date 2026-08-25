import { redirect } from 'next/navigation'

export const runtime = 'edge'
export default function SelfRegulationPage() {
  redirect('/admin/soft-sticker?tab=self-regulation')
}
