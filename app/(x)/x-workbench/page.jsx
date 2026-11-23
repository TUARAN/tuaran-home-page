import WorkbenchClient from './WorkbenchClient'

export const dynamic = 'force-static'

export const metadata = {
  metadataBase: new URL('https://x.2aran.com'),
  title: { absolute: 'X大互动' },
  description: '简中区 X 推文热榜与涨粉潜力，以及矿工阿三、矿长阿富、矿工小十三当天的插件动作。',
  alternates: { canonical: '/' },
  robots: { index: false, follow: false },
}

export default function XWorkbenchPage() {
  return <WorkbenchClient />
}
