import assert from 'node:assert/strict'
import test from 'node:test'

import {
  GENERATION_TIMEOUT_MS,
  buildCryptoDraftPrompt,
  draftGenerationDecision,
  normalizeMarketCoins,
  pickHighestRankedUnresearched,
  validateCryptoDraft,
  validateMarketSnapshot,
} from '../lib/cryptoResearchCore.js'
import { cryptoAutoPublishAt, cryptoPublishFileName, cryptoPublishSlug } from '../lib/cryptoPublishCore.js'

const bitcoin = {
  id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', market_cap_rank: 1, current_price: 100000,
  market_cap: 2_000_000_000_000, circulating_supply: 20_000_000, total_supply: 20_000_000,
  max_supply: 21_000_000, last_updated: '2026-08-26T00:00:00Z',
}

test('allows enough time for web-search research generation', () => {
  assert.ok(GENERATION_TIMEOUT_MS >= 90_000)
})

test('normalizes and orders CoinGecko market rows by market-cap rank', () => {
  const coins = normalizeMarketCoins([
    { ...bitcoin, id: 'ethereum', symbol: 'eth', name: 'Ethereum', market_cap_rank: 2, market_cap: 500_000_000_000 },
    bitcoin,
    { id: '', symbol: 'bad', name: 'Bad', market_cap_rank: 3, market_cap: 1 },
  ])
  assert.deepEqual(coins.map((coin) => coin.id), ['bitcoin', 'ethereum'])
  assert.equal(coins[0].symbol, 'BTC')
})

test('selects the highest-ranked coin not researched yet', () => {
  const coins = normalizeMarketCoins([
    bitcoin,
    { ...bitcoin, id: 'ethereum', symbol: 'eth', name: 'Ethereum', market_cap_rank: 2, market_cap: 500_000_000_000 },
  ])
  assert.equal(pickHighestRankedUnresearched(coins, new Set(['bitcoin'])).id, 'ethereum')
})

test('rejects incomplete market snapshots', () => {
  assert.throws(() => validateMarketSnapshot(normalizeMarketCoins([bitcoin])), /安全范围/)
})

test('generation decision locks recent work and retries failed work', () => {
  const now = Date.now()
  assert.equal(draftGenerationDecision({ status: 'generating', attempt_count: 1, updated_at: now }, now).action, 'locked')
  assert.equal(draftGenerationDecision({ status: 'failed', attempt_count: 1, updated_at: now }, now).action, 'attempt')
})

test('prompt carries market rank, template and investment-safety constraints', () => {
  const coin = normalizeMarketCoins([bitcoin])[0]
  const prompt = buildCryptoDraftPrompt({ coin, style: { id: 'default-research', label: '默认分析风格' }, now: new Date('2026-08-26T00:00:00Z') })
  const text = prompt.map((item) => item.content).join('\n')
  assert.match(text, /市值排名：#1/)
  assert.match(text, /research_template: crypto-asset-research/)
  assert.match(text, /不得给出买卖/)
})

test('validates complete crypto draft and rejects mismatched coin id', () => {
  const sections = [
    '一、先给结论', '二、起源、背景与发展时间线', '三、技术机制与网络结构', '四、用途、生态与价值来源',
    '五、代币经济与供给结构', '六、市场位置与历史表现', '七、治理、安全与关键依赖', '八、监管与合规环境',
    '九、催化因素、主要风险与外部研判', '十、信息来源与未能验证',
  ]
  const content = `---\ntitle: Bitcoin\ncategory: topics\ncrypto_type: asset\ncoin_id: "bitcoin"\nsymbol: "BTC"\nmarket_cap_rank: 1\nreview_ready: false\nad_eligible: false\n---\n\n${sections.map((section) => `## ${section}\n${'有效内容。'.repeat(12)}`).join('\n\n')}`
  assert.equal(validateCryptoDraft(content, { id: 'bitcoin', name: 'Bitcoin' }), true)
  assert.throws(() => validateCryptoDraft(content, { id: 'ethereum' }), /不一致/)
})

test('publishing uses stable crypto slug and three-day review window', () => {
  const file = cryptoPublishFileName({ draft_date: '2026-08-26', coin_id: 'wrapped-bitcoin' })
  assert.equal(file, '2026-08-26-crypto-wrapped-bitcoin.md')
  assert.equal(cryptoPublishSlug(file), 'crypto-wrapped-bitcoin')
  assert.equal(cryptoAutoPublishAt({ updated_at: 1000 }), 1000 + 3 * 24 * 60 * 60 * 1000)
})
