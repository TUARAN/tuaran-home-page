import { Suspense } from 'react'

import AdminPageGate from '../../components/AdminPageGate'
import TaskCenterClient from './TaskCenterClient'

export const metadata = {
  title: '任务中心',
  description: '自动化任务台账、最近运行与模型调用记录。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default function AdminOpsPage() {
  return (
    <AdminPageGate
      label="任务中心"
      returnTo="/admin/ops"
      description="自动化任务、运行状态与模型调用的统一入口，仅站长本人可见。"
    >
      <Suspense fallback={<p className="px-4 py-8 text-sm text-[#77796d] dark:text-gray-400">正在打开任务中心</p>}>
        <TaskCenterClient />
      </Suspense>
    </AdminPageGate>
  )
}
