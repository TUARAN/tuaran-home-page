import { cookies } from 'next/headers'

import PrivateVaultGate from '../../components/PrivateVaultGate'
import { cookieNames, getSecrets, verifySession } from '../../../../lib/edgeSession'
import { isOwnerUser } from '../../../../lib/ownerAuth'
import NavAdminClient from './NavAdminClient'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '菜单权限管理',
  description: '设置每个菜单项对谁可见。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

async function getOwnerStateFromSession() {
  const { sessionSecret } = getSecrets()
  if (!sessionSecret) return { state: 'anonymous', user: null }
  const cookieStore = await cookies()
  const token = cookieStore.get(cookieNames.session)?.value
  const payload = await verifySession(token, sessionSecret)
  const user = payload?.user || null
  if (!user) return { state: 'anonymous', user: null }
  if (!isOwnerUser(user)) return { state: 'not-owner', user }
  return { state: 'owner', user }
}

export default async function NavAdminPage() {
  const { state } = await getOwnerStateFromSession()
  if (state !== 'owner') {
    return (
      <PrivateVaultGate
        state={state}
        vaultLabel="菜单权限管理"
        returnTo="/agent-ops/nav-admin"
        description="后台管理控制台，仅站长本人可见，用来调整主导航与站点地图里每一项的可见用户。"
      />
    )
  }
  return <NavAdminClient />
}
