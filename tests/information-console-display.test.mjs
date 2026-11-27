import assert from 'node:assert/strict'
import test from 'node:test'

import { parseVaultNotes, securitySummary } from '../lib/admin/informationVaultDisplay.js'

test('parseVaultNotes extracts common Microsoft account note fields', () => {
  const parsed = parseVaultNotes([
    '2FA 秘钥: ABCD1234（可用 https://2fa.show）',
    '辅助邮箱: user@hotmail.com',
    '邮箱密码: secret99',
    'MS 令牌: long-token',
    '提示: 登录后请把辅助邮箱换成自己的邮箱。',
  ].join('\n'))

  assert.equal(parsed.twoFa, 'ABCD1234（可用 https://2fa.show）')
  assert.equal(parsed.recoveryEmail, 'user@hotmail.com')
  assert.equal(parsed.emailPassword, 'secret99')
  assert.ok(parsed.extra.some((line) => line.startsWith('MS 令牌')))
  assert.ok(parsed.extra.some((line) => line.startsWith('提示 · ')))
})

test('securitySummary masks answers when hidden', () => {
  assert.equal(securitySummary({ friend: 'a', work: '', parents: '' }, false), '••••••')
  assert.equal(securitySummary({ friend: 'a', work: 'b', parents: '' }, true), '朋友 a · 工作 b')
})