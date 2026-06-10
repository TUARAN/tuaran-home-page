import PrivateVaultGate from '../../(site)/components/PrivateVaultGate'
import { getOwnerPageState } from '../../../lib/adminPageAuth'

export default async function AdminPageGate({ children, label, returnTo, description }) {
  const { state } = await getOwnerPageState()
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
  return children
}
