import AdminPageGate from '../../components/AdminPageGate'
import FestivalBannerConsole from './FestivalBannerConsole'

export const metadata = {
  title: '节日横幅',
  description: '管理首页节日横幅、展示时间和历史复用。',
  robots: { index: false, follow: false },
}

export default function FestivalBannersPage() {
  return (
    <AdminPageGate>
      <FestivalBannerConsole />
    </AdminPageGate>
  )
}
