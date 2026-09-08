import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('加密调研页面展示当前模板、风格与调研策略', async () => {
  const [page, client] = await Promise.all([
    readFile(new URL('../../app/(site)/crypto-research/page.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/crypto-research/CryptoResearchClient.jsx', import.meta.url), 'utf8'),
  ])

  assert.match(page, /CRYPTO_RESEARCH_TEMPLATE_VERSION/)
  assert.match(page, /template\.status === 'active'/)
  assert.match(client, /当前调研模板与策略/)
  assert.match(client, /十段式资产观察/)
  assert.match(client, /CoinGecko 美元市值前 250 名/)
  assert.match(client, /自动草稿保留 72 小时人工复核窗口/)
})
