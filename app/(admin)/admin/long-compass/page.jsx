import AdminPageGate from '../../components/AdminPageGate'
import LongCompassClient from '../../../(site)/long-compass/LongCompassClient'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '长期罗盘',
  description: '加密私域 · 资产 / 复盘 / 行动框架。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default async function AdminLongCompassPage() {
  return (
    <AdminPageGate
      label="长期罗盘"
      returnTo="/admin/long-compass"
      description="站长长期资产、阶段复盘和行动框架的加密私域，仅本人可见。"
    >
      <LongCompassClient
        returnTo="/admin/long-compass"
        eyebrow="Admin · Long Compass"
        description="站长长期资产、阶段复盘和行动框架的加密私域，仅本人可见。"
      />
    </AdminPageGate>
  )
}
