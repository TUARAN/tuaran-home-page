import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createSoftStickerUnlockError,
  getSoftStickerUnlockErrorMessage,
  SOFT_STICKER_UNLOCK_ERRORS,
} from '../lib/softStickerAccess.js'

test('soft sticker unlock errors identify the failing encrypted source', () => {
  assert.equal(
    getSoftStickerUnlockErrorMessage(
      createSoftStickerUnlockError(SOFT_STICKER_UNLOCK_ERRORS.records)
    ),
    '统一口令与体验记录密文不匹配。'
  )
  assert.equal(
    getSoftStickerUnlockErrorMessage(
      createSoftStickerUnlockError(SOFT_STICKER_UNLOCK_ERRORS.memoir)
    ),
    '统一口令与回忆录密文不匹配。'
  )
  assert.equal(
    getSoftStickerUnlockErrorMessage(
      createSoftStickerUnlockError(SOFT_STICKER_UNLOCK_ERRORS.compass)
    ),
    '统一口令与长期罗盘密文不匹配。'
  )
})

test('soft sticker unlock errors do not misreport unknown failures as bad passwords', () => {
  assert.equal(
    getSoftStickerUnlockErrorMessage(new Error('NETWORK_FAILED')),
    '解锁失败，请检查数据状态后重试。'
  )
})
