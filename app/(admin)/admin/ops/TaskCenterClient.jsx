'use client'

import { useSearchParams } from 'next/navigation'

import AdminSubnav from '../../components/AdminSubnav'
import { AdminPage } from '../../components/ui'
import LogsClient from '../logs/LogsClient'
import OpsConsoleClient from './OpsConsole'

const TABS = [
  { id: 'tasks', label: '任务台账', href: '/admin/ops' },
  { id: 'runs', label: '最近运行', href: '/admin/ops?tab=runs' },
  { id: 'calls', label: '模型调用', href: '/admin/ops?tab=calls' },
]

export default function TaskCenterClient() {
  const searchParams = useSearchParams()
  const requestedTab = searchParams.get('tab')
  const activeTab = TABS.some((tab) => tab.id === requestedTab) ? requestedTab : 'tasks'
  const initialCallFilters = {
    key: searchParams.get('key') || '',
    provider: searchParams.get('provider') || '',
    providerId: searchParams.get('providerId') || '',
    scope: searchParams.get('scope') || '',
    source: searchParams.get('source') || '',
  }

  return (
    <AdminPage title="任务中心" description="从任务登记到运行与调用记录，在同一处完成观测和排查。">
      <AdminSubnav label="任务中心视图" items={TABS} activeId={activeTab} />
      {activeTab === 'tasks' ? <OpsConsoleClient embedded /> : null}
      {activeTab === 'runs' ? <LogsClient key="runs" initialTab="runs" embedded /> : null}
      {activeTab === 'calls' ? (
        <LogsClient
          key={`calls:${searchParams.toString()}`}
          initialTab="calls"
          initialCallFilters={initialCallFilters}
          embedded
        />
      ) : null}
    </AdminPage>
  )
}
