/** 未领取的游客试用可以计入「够不够解锁」，但查询本身不发币。 */
export function guestTrialCredit(status) {
  if (!status?.seedAvailable) return 0
  const value = Number(status.guestSeed || 0)
  return Number.isFinite(value) && value > 0 ? Math.trunc(value) : 0
}

export function balanceWithGuestTrial(status) {
  const balance = Number(status?.balance || 0)
  const current = Number.isFinite(balance) ? balance : 0
  return current + guestTrialCredit(status)
}
