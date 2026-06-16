import PrivateVaultGate from '../../(site)/components/PrivateVaultGate'
import { getOwnerPageState } from '../../../lib/adminPageAuth'

export default async function AdminPageGate({ children, label, returnTo, description }) {
  const { state, localPreview } = await getOwnerPageState()
  if (state !== 'owner') {
    return (
      <PrivateVaultGate
        state={state}
        vaultLabel={label}
        returnTo={returnTo}
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
