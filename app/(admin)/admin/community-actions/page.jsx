import { Suspense } from 'react'

import AdminPageGate from '../../components/AdminPageGate'
import CommunityActionsClient from './CommunityActionsClient'

export const metadata = {
  title: '社区动作',
  description: '统一管理 X、小红书和掘金的回执、自动发布与回复任务。',
  robots: { index: false, follow: false },
}

export default function CommunityActionsPage() {
  return (
    <AdminPageGate
      label="社区动作"
      returnTo="/admin/community-actions"
      description="主攻 X、小红书和掘金。回执、发布与回复收在同一入口。"
    >
      <Suspense fallback={<p className="px-4 py-8 text-sm text-[#77796d] dark:text-gray-400">正在打开社区动作</p>}>
        <CommunityActionsClient />
      </Suspense>
    </AdminPageGate>
  )
}
