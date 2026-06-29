import AdminPageGate from '../../components/AdminPageGate'
import RssFeedConsole from './RssFeedConsole'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'RSS 订阅管理台',
  description: '维护资源页公开展示的 RSS 订阅墙，并查看本站 RSS 请求记录。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default async function AdminRssFeedsPage() {
  return (
    <AdminPageGate
      label="RSS 订阅管理台"
      returnTo="/admin/rss-feeds"
      description="维护 /resources/rss 公开展示的 RSS 订阅墙，并查看本站 RSS 请求记录，仅站长本人可见。"
    >
      <RssFeedConsole />
    </AdminPageGate>
  )
}
