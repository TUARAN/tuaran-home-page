import AdminPageGate from '../../components/AdminPageGate'
import PersonalProfileDashboard from './PersonalProfileDashboard'

export const metadata = {
  title: '个人画像 · INFP-T',
  description: '记录个人偏好、成长方向、创作价值闭环与阶段行动。',
  robots: { index: false, follow: false },
}

export default function PersonalProfilePage() {
  return (
    <AdminPageGate
      label="个人画像"
      returnTo="/admin/personal-profile"
      description="个人偏好、成长方向与创作价值路径仅站长本人可见。"
    >
      <PersonalProfileDashboard />
    </AdminPageGate>
  )
}
