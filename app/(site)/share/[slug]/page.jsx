import ShareViewer from './ShareViewer'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '密码保护分享',
  description: '密码保护的分享文档；公开链接需要密码解锁。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default async function SharePage({ params }) {
  const { slug } = await params
  return <ShareViewer slug={slug} />
}
