export const SOFT_STICKER_UNLOCK_ERRORS = Object.freeze({
  records: 'SOFT_STICKER_RECORDS_DECRYPT_FAILED',
  recordsSchema: 'SOFT_STICKER_RECORDS_SCHEMA_INVALID',
  memoir: 'SOFT_STICKER_MEMOIR_DECRYPT_FAILED',
  compass: 'SOFT_STICKER_COMPASS_DECRYPT_FAILED',
})

const UNLOCK_ERROR_MESSAGES = Object.freeze({
  [SOFT_STICKER_UNLOCK_ERRORS.records]: '统一口令与体验记录密文不匹配。',
  [SOFT_STICKER_UNLOCK_ERRORS.recordsSchema]: '体验记录密文格式异常，暂时无法解锁。',
  [SOFT_STICKER_UNLOCK_ERRORS.memoir]: '统一口令与回忆录密文不匹配。',
  [SOFT_STICKER_UNLOCK_ERRORS.compass]: '统一口令与长期罗盘密文不匹配。',
})

export function createSoftStickerUnlockError(code, cause) {
  const error = new Error(code, cause ? { cause } : undefined)
  error.code = code
  return error
}

export function getSoftStickerUnlockErrorMessage(error) {
  const code = error?.code || error?.message
  return UNLOCK_ERROR_MESSAGES[code] || '解锁失败，请检查数据状态后重试。'
}
