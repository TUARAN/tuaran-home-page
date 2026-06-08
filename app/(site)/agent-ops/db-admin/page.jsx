import { cookies } from 'next/headers'

import { cookieNames, getSecrets, verifySession } from '../../../../lib/edgeSession'
import { isOwnerUser } from '../../../../lib/ownerAuth'
import PrivateVaultGate from '../../components/PrivateVaultGate'
import DbAdminClient from './DbAdminClient'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '数据库管理',
  description: '查看 D1 数据库当前状态、表数量和业务统计。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

async function getOwnerState() {
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

export default async function DbAdminPage() {
  const { state } = await getOwnerState()
  if (state !== 'owner') {
    return (
      <PrivateVaultGate
        state={state}
        vaultLabel="数据库管理"
        returnTo="/agent-ops/db-admin"
        description="后台管理控制台，仅站长本人可见，用来查看 D1 数据库当前状态、表数量和业务统计。"
      />
    )
  }
  return <DbAdminClient />
}
