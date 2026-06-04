import LongCompassClient from './LongCompassClient'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '长期罗盘',
  description: '私人记录入口',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default function LongCompassPage() {
  return <LongCompassClient />
}
