import AccountClient from './AccountClient'

export const metadata = {
  title: '个人资料',
  description: '查看 2aran.com 账号资料、燃币余额、已解锁资源，并管理登录方式与授权。',
  alternates: { canonical: '/account' },
  robots: { index: false, follow: false },
}

export default function AccountPage() {
  return <AccountClient />
}
