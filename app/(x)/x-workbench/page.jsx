import WorkbenchClient from './WorkbenchClient'

export const dynamic = 'force-static'

export const metadata = {
  metadataBase: new URL('https://x.2aran.com'),
  title: { absolute: 'X大互动' },
  description: '今天的曝光与互动去了哪些话题和账号，以及矿工阿三、矿长阿富、矿工小十三当天的动作与推文表现。',
  alternates: { canonical: '/' },
  robots: { index: false, follow: false },
}

export default function XWorkbenchPage() {
  return <WorkbenchClient />
}
