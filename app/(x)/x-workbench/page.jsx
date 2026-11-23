import WorkbenchClient from './WorkbenchClient'

export const dynamic = 'force-static'

export const metadata = {
  metadataBase: new URL('https://x.2aran.com'),
  title: { absolute: 'X大互动' },
  description: 'X 大互动智能体产品与 @TuaranX 当日插件动作看板。',
  alternates: { canonical: '/' },
  robots: { index: false, follow: false },
}

export default function XWorkbenchPage() {
  return <WorkbenchClient />
}
