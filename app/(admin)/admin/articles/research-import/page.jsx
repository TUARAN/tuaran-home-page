import { Suspense } from 'react'

import { LoadingState } from '../../../../components/loading/LoadingPrimitives'
import AdminPageGate from '../../../components/AdminPageGate'
import ResearchImportConsole from './ResearchImportConsole'

export const metadata = { title: '审批调研', robots: { index: false, follow: false } }

export default function ResearchImportPage() {
  return (
    <AdminPageGate
      label="审批调研"
      returnTo="/admin/articles/research-import"
      description="核对 Git 调研正文后发布或撤回，仅站长本人可见。"
    >
      <Suspense fallback={<LoadingState label="正在打开审批调研" />}>
        <ResearchImportConsole />
      </Suspense>
    </AdminPageGate>
  )
}
