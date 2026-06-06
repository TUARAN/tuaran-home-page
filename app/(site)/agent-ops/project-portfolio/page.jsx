import { cookies } from 'next/headers'

import { cookieNames, getSecrets, verifySession } from '../../../../lib/edgeSession'
import { isPrivateVaultOwner } from '../../../../lib/privateVaultAuth'
import PrivateVaultGate from '../../components/PrivateVaultGate'
import ProjectPortfolioConsole from './ProjectPortfolioConsole'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '项目中心',
  description: '站长的项目中心。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

async function getOwnerUserFromSession() {
  const { sessionSecret } = getSecrets()
  if (!sessionSecret) return { state: 'anonymous', user: null }

  const cookieStore = await cookies()
  const token = cookieStore.get(cookieNames.session)?.value
  const payload = await verifySession(token, sessionSecret)
  const user = payload?.user || null

  if (!user) return { state: 'anonymous', user: null }
  if (!isPrivateVaultOwner(user)) return { state: 'not-owner', user }
  return { state: 'owner', user }
}

export default async function ProjectPortfolioPage() {
  const { state, user } = await getOwnerUserFromSession()

  if (state !== 'owner') {
    return (
      <PrivateVaultGate
        state={state}
        vaultLabel="项目中心"
        returnTo="/agent-ops/project-portfolio"
        description="这是和 AI 系统自动化控制台共用身份管控的项目中心，仅站长本人可见。"
      />
    )
  }

  return <ProjectPortfolioConsole user={user} />
}
