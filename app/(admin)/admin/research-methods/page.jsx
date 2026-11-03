import { Suspense } from 'react'

import AdminPageGate from '../../components/AdminPageGate'
import { LoadingState } from '../../../components/loading/LoadingPrimitives'
import ResearchMethodsConsole from './ResearchMethodsConsole'

export const metadata = {
  title: '调研方法',
  robots: { index: false, follow: false },
}

export default function ResearchMethodsPage() {
  return (
    <AdminPageGate label="调研方法" returnTo="/admin/research-methods" description="写作规范、调研风格和对象方法只对站长可见。">
      <Suspense fallback={<LoadingState label="正在打开调研方法" />}>
        <ResearchMethodsConsole />
      </Suspense>
    </AdminPageGate>
  )
}
