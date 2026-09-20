import WorkBuddyHardwareAccessClient from './WorkBuddyHardwareAccessClient'

export const dynamic = 'force-static'

const PAGE_URL = 'https://2aran.com/tools/workbuddy-acp-bridge'
const PREVIEW_URL = 'https://2aran.com/images/tools/workbuddy-acp-bridge/desktop-sms-bridge-v2.png'

export const metadata = {
  title: 'WorkBuddy 硬件接入助手｜Open API 与本地助理联调',
  description: '一页看懂 WorkBuddy 硬件 Open API：OAuth 授权、问云端、查云端、问本地、查本地，以及 macOS / Windows 内部测试流程。',
  keywords: ['WorkBuddy', '硬件接入', 'Open API', '本地助理', '云端任务', 'ACP', 'OAuth'],
  alternates: { canonical: '/tools/workbuddy-acp-bridge' },
  openGraph: {
    title: 'WorkBuddy 硬件接入助手',
    description: '授权、四项核心能力、桌面客户端和真实联调结论的互动专题。',
    url: PAGE_URL,
    type: 'website',
    images: [{ url: PREVIEW_URL, width: 2360, height: 1640, alt: 'WorkBuddy 硬件接入助手桌面界面' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WorkBuddy 硬件接入助手',
    description: '问云端、查云端、问本地、查本地，一页看懂 WorkBuddy 硬件 Open API 联调。',
    images: [PREVIEW_URL],
  },
}

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'WorkBuddy 硬件接入助手',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'macOS, Windows',
  url: PAGE_URL,
  description: '用于 WorkBuddy 硬件 Open API、云端任务和 PC 本地助理的企业内部联调客户端。',
  author: { '@type': 'Person', name: 'TUARAN', url: 'https://2aran.com' },
}

export default function WorkBuddyHardwareAccessPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <WorkBuddyHardwareAccessClient />
    </>
  )
}
