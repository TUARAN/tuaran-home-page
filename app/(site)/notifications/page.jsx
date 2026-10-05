import { permanentRedirect } from 'next/navigation'

export const dynamic = 'force-static'

export const metadata = {
  title: '消息',
  description: '查看与你有关的回复、评论和点赞。',
  robots: { index: false, follow: false },
  alternates: {
    canonical: '/messages',
  },
}

export default function NotificationsPage() {
  permanentRedirect('/messages')
}
