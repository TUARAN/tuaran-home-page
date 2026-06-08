import ShareViewer from './ShareViewer'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '加密分享 · 2aran.com',
  description: '端到端加密文档；需要密码解锁，服务器看不到内容。',
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
