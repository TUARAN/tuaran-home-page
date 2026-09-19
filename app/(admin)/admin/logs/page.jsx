import AdminPageGate from '../../components/AdminPageGate'
import LogsClient from './LogsClient'

export const runtime = 'edge'

export const metadata = {
  title: '日志记录',
  description: '自动化最近运行与模型调用记录。',
  robots: { index: false, follow: false },
}

export default async function AdminLogsPage({ searchParams }) {
  const params = await searchParams
  const initialTab = params?.tab === 'calls' ? 'calls' : 'runs'
  const initialCallFilters = {
    key: typeof params?.key === 'string' ? params.key : '',
    provider: typeof params?.provider === 'string' ? params.provider : '',
    providerId: typeof params?.providerId === 'string' ? params.providerId : '',
    scope: typeof params?.scope === 'string' ? params.scope : '',
    source: typeof params?.source === 'string' ? params.source : '',
  }

  return (
    <AdminPageGate
      label="日志记录"
      returnTo="/admin/logs"
      description="自动化最近运行与模型调用记录，仅站长本人可见。"
    >
      <LogsClient initialTab={initialTab} initialCallFilters={initialCallFilters} />
    </AdminPageGate>
  )
}
