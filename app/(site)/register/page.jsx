import RegisterClient from './RegisterClient'

export const metadata = {
  title: '邮箱注册',
  description: '使用邮箱验证码注册 2aran.com 账号。',
  alternates: { canonical: '/register' },
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default function RegisterPage() {
  return <RegisterClient />
}
