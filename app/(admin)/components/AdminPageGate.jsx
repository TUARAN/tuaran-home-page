import { headers } from 'next/headers'

import PrivateVaultGate from '../../(site)/components/PrivateVaultGate'
import { getOwnerPageState } from '../../../lib/adminPageAuth'
import { ADMIN_HOST, CANONICAL_HOST } from '../../../lib/adminRoutes'

async function getAdminGateLinks(returnTo) {
  const headerStore = await headers()
  const host = (headerStore.get('host') || '').split(':')[0].toLowerCase()
  const path = returnTo || '/admin'

  if (host !== ADMIN_HOST) {
    return {
      returnTo: path,
      homeHref: '/',
      loginHref: `/login?returnTo=${encodeURIComponent(path)}`,
      logoutHref: '/api/auth/logout?returnTo=/',
    }
  }

  const adminReturnTo = `https://${ADMIN_HOST}${path.startsWith('/') ? path : '/admin'}`
  const canonicalHome = `https://${CANONICAL_HOST}/`
  return {
    returnTo: adminReturnTo,
    homeHref: canonicalHome,
    loginHref: `https://${CANONICAL_HOST}/login?returnTo=${encodeURIComponent(adminReturnTo)}`,
    logoutHref: `https://${CANONICAL_HOST}/api/auth/logout?returnTo=${encodeURIComponent(canonicalHome)}`,
  }
}

export default async function AdminPageGate({ children, label, returnTo, description }) {
  const { state, localPreview } = await getOwnerPageState()
  if (state !== 'owner') {
    const gateLinks = await getAdminGateLinks(returnTo)
    return (
      <PrivateVaultGate
        state={state}
        vaultLabel={label}
        returnTo={gateLinks.returnTo}
        homeHref={gateLinks.homeHref}
        loginHref={gateLinks.loginHref}
        logoutHref={gateLinks.logoutHref}
        description={description}
      />
    )
  }
  if (!localPreview) return children
  return (
    <>
      <div className="mx-auto mt-4 w-full max-w-[1100px] px-4 md:px-6">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] leading-6 text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-100">
          本地 Admin 预览模式已启用：当前请求在开发环境内临时视为 owner。该开关只在 NODE_ENV=development 且 ADMIN_LOCAL_PREVIEW=1 时生效。
        </div>
      </div>
      {children}
    </>
  )
}
