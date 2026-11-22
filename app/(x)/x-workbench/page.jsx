import WorkbenchClient from './WorkbenchClient'

export const dynamic = 'force-static'

export const metadata = {
  metadataBase: new URL('https://x.2aran.com'),
  title: { absolute: 'X 工作台' },
  description: '绑定 X 账号，管理智能体人格与记忆，查看本月额度。',
  alternates: { canonical: '/' },
  robots: { index: false, follow: false },
}

export default function XWorkbenchPage() {
  return <WorkbenchClient />
}
