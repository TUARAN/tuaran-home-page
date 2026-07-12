import AccountClient from './AccountClient'

export const metadata = {
  title: '账号与登录方式',
  description: '管理 2aran.com 账号已绑定的登录方式。',
  robots: { index: false, follow: false },
}

export default function AccountPage() {
  return <AccountClient />
}
