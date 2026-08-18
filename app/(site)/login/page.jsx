import LoginClient from './LoginClient'

export const metadata = {
  title: '登录',
  description: '登录 2aran.com 账号。',
  alternates: { canonical: '/login' },
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default function LoginPage() {
  return <LoginClient />
}
