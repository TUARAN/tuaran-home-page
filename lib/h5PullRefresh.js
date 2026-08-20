export const H5_PULL_THRESHOLD = 56

export function getPullRefreshDistance(startY, currentY, scrollTop = 0) {
  if (Number(scrollTop) > 0) return 0
  return Math.max(0, Number(currentY) - Number(startY))
}

export function shouldTriggerPullRefresh(distance, threshold = H5_PULL_THRESHOLD) {
  return Number(distance) >= Number(threshold)
}
