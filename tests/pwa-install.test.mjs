import assert from 'node:assert/strict'
import test from 'node:test'

import {
  A2HS_COOLDOWN_MS,
  getInstallCopy,
  getInstallSurface,
  isStandaloneDisplay,
  nextDismissUntil,
  shouldOfferInstall,
} from '../lib/pwaInstall.js'

test('install surface splits WeChat, iOS Safari, iOS Chrome and Android', () => {
  assert.equal(
    getInstallSurface('Mozilla/5.0 MicroMessenger/8.0.5 iPhone'),
    'wechat',
  )
  assert.equal(
    getInstallSurface('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1'),
    'ios-safari',
  )
  assert.equal(
    getInstallSurface('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) CriOS/126.0.0.0 Mobile/15E148 Safari/604.1'),
    'ios-browser',
  )
  assert.equal(
    getInstallSurface('Mozilla/5.0 (Linux; Android 14) Chrome/126.0.0.0 Mobile Safari/537.36'),
    'android',
  )
  assert.equal(
    getInstallSurface('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Chrome/126.0.0.0 Safari/537.36'),
    'desktop',
  )
})

test('standalone display modes never offer the add-to-home prompt', () => {
  assert.equal(isStandaloneDisplay({ standalone: true }), true)
  assert.equal(isStandaloneDisplay({ displayMode: 'standalone' }), true)
  assert.equal(shouldOfferInstall({
    displayMode: 'standalone',
    userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/126 Mobile',
    viewportWidth: 390,
  }), false)
})

test('H5 prompt only appears on mobile browsers that are not in cooldown', () => {
  const now = 1_700_000_000_000
  assert.equal(shouldOfferInstall({
    userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/126 Mobile',
    viewportWidth: 390,
    now,
  }), true)
  assert.equal(shouldOfferInstall({
    userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/126 Mobile',
    viewportWidth: 1280,
    now,
  }), false)
  assert.equal(shouldOfferInstall({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Chrome/126.0.0.0 Safari/537.36',
    viewportWidth: 390,
    now,
  }), false)
  assert.equal(shouldOfferInstall({
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1',
    viewportWidth: 390,
    dismissedUntil: now + 1000,
    now,
  }), false)
})

test('install copy tells users the next action instead of site internals', () => {
  assert.match(getInstallCopy('ios-safari').body, /添加到主屏幕/)
  assert.match(getInstallCopy('wechat').body, /在浏览器打开/)
  assert.match(getInstallCopy('ios-browser').body, /Safari/)
  assert.match(getInstallCopy('android', 'en').action, /Add/)
  assert.equal(nextDismissUntil(1000), 1000 + A2HS_COOLDOWN_MS)
})
