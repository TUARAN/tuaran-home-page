import { cookies } from 'next/headers'

import { cookieNames, getSecrets, verifySession } from '../../../../lib/edgeSession'
import { isOwnerUser } from '../../../../lib/ownerAuth'
import PrivateVaultGate from '../../components/PrivateVaultGate'
import OpsConsoleClient from './OpsConsoleClient'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '自动化控制台',
  description: '查看 Agent Ops 外部控制台连接状态。',
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

export default async function OpsConsolePage() {
  const { state } = await getOwnerState()
  if (state !== 'owner') {
    return (
      <PrivateVaultGate
        state={state}
        vaultLabel="自动化控制台"
        returnTo="/agent-ops/ops-console"
        description="后台管理控制台，仅站长本人可见，用来检查并打开 Agent Ops 外部控制台。"
      />
    )
  }
  return <OpsConsoleClient />
}
