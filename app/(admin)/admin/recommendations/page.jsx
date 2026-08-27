import AdminPageGate from '../../components/AdminPageGate'
import RecommendationConsole from './RecommendationConsole'

export const metadata = {
  title: '推荐管理',
  description: '管理首页推荐来源、轮换规则、批次大小与置顶内容。',
  robots: { index: false, follow: false },
}

export default function RecommendationAdminPage() {
  return (
    <AdminPageGate
      label="推荐管理"
      returnTo="/admin/recommendations"
      description="管理首页推荐规则和人工置顶内容，仅站长本人可见。"
    >
      <RecommendationConsole />
    </AdminPageGate>
  )
}
