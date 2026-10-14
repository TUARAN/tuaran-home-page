import LoginClient from './LoginClient'
import { getIntegrationEnv } from '../../../lib/site/integrationKeys'
import { isSupabaseEmailAuthEnabled } from '../../../lib/supabase/emailAuth'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

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
  return <LoginClient supabaseEmailEnabled={isSupabaseEmailAuthEnabled(getIntegrationEnv())} />
}
