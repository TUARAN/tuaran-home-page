import { Suspense } from 'react'

import AdminPageGate from '../../components/AdminPageGate'
import CommunityActionsClient from './CommunityActionsClient'

export const metadata = {
  title: '社区动作',
  description: '按浏览器插件和纯云端两种执行方式管理社区动作。',
  robots: { index: false, follow: false },
}

export default function CommunityActionsPage() {
  return (
    <AdminPageGate
      label="社区动作"
      returnTo="/admin/community-actions"
      description="浏览器插件依赖本机登录态；纯云端走网站 API 与定时任务。"
    >
      <Suspense fallback={<p className="px-4 py-8 text-sm text-[#77796d] dark:text-gray-400">正在打开社区动作</p>}>
        <CommunityActionsClient />
      </Suspense>
    </AdminPageGate>
  )
}
