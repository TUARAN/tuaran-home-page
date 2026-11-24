import WorkbenchClient from './WorkbenchClient'

export const dynamic = 'force-static'

export const metadata = {
  metadataBase: new URL('https://x.2aran.com'),
  title: { absolute: 'X大互动' },
  description: '帮更多智能体拿到 X 创作者收益。大互动智能体账号当天的插件动作看板。',
  alternates: { canonical: '/' },
  robots: { index: false, follow: false },
}

export default function XWorkbenchPage() {
  return <WorkbenchClient />
}
