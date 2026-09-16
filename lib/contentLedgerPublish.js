const HEX_64 = /^[a-f0-9]{64}$/
const RETRYABLE_RE = /ECONNRESET|ETIMEDOUT|ENETUNREACH|timeout|429|502|503|504|nonce too low|replacement transaction|fee too low|rate limit|temporar/i

export function normalizeHex32(value, label = 'digest') {
  const hex = String(value || '').replace(/^0x/, '').toLowerCase()
  if (!HEX_64.test(hex)) throw new TypeError(`${label} must be a 32-byte hex digest`)
  return hex
}

export function contentLedgerIdempotencyKey({ chainId, merkleRoot, schemaUid }) {
  const chain = Number(chainId)
  if (!Number.isSafeInteger(chain) || chain <= 0) throw new TypeError('chainId must be a positive integer')
  const schema = String(schemaUid || '').toLowerCase()
  if (!/^0x[a-f0-9]{64}$/.test(schema)) throw new TypeError('schemaUid must be a 32-byte hex id')
  return `${chain}:${normalizeHex32(merkleRoot, 'merkleRoot')}:${schema}`
}

export function isRetryablePublishError(error) {
  const code = error?.code ? String(error.code) : ''
  const message = error instanceof Error ? error.message : String(error || '')
  if (code === 'TIMEOUT' || code === 'NETWORK_ERROR' || code === 'SERVER_ERROR' || code === 'UNKNOWN_ERROR') return true
  return RETRYABLE_RE.test(`${code} ${message}`)
}

export function publishBackoffMs(attempt, { initialMs = 250, maxMs = 8_000 } = {}) {
  const step = Math.max(1, Number(attempt) || 1)
  return Math.min(maxMs, initialMs * 2 ** (step - 1))
}

export async function withPublishRetry(task, { maxAttempts = 4, sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)) } = {}) {
  const attempts = Math.max(1, Number(maxAttempts) || 1)
  let lastError
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await task(attempt)
    } catch (error) {
      lastError = error
      if (attempt === attempts || !isRetryablePublishError(error)) throw error
      await sleep(publishBackoffMs(attempt))
    }
  }
  throw lastError
}

export function resolveIdempotentPublish(existing, proposed = {}) {
  if (!existing) return { action: 'submit', reason: 'new' }
  if (proposed.idempotencyKey && existing.idempotencyKey !== proposed.idempotencyKey) {
    throw new Error('idempotency key mismatch')
  }
  if (proposed.merkleRoot && existing.merkleRoot && existing.merkleRoot !== proposed.merkleRoot) {
    throw new Error('idempotency key already used by a different merkle root')
  }
  if (existing.status === 'confirmed' && existing.transactionHash && existing.attestationUid) {
    return { action: 'reuse', reason: 'already_confirmed', record: existing }
  }
  if (existing.status === 'submitted' && existing.transactionHash) {
    return { action: 'resume', reason: 'wait_for_existing_transaction', record: existing }
  }
  if (existing.status === 'failed' || existing.status === 'prepared' || existing.status === 'submitted') {
    return { action: 'retry', reason: existing.status, record: existing }
  }
  throw new Error(`cannot retry publish in status ${existing.status}`)
}

export function recordContentLedgerCost({
  idempotencyKey,
  chainId,
  network,
  transactionHash,
  publisherAddress,
  gasUsed,
  effectiveGasPriceWei,
  latencyMs,
  attemptCount,
  recordedAt,
} = {}) {
  const gas = BigInt(gasUsed)
  const price = BigInt(effectiveGasPriceWei)
  if (gas < 0n || price < 0n) throw new TypeError('gas used and gas price must be non-negative')
  const hash = String(transactionHash || '').toLowerCase()
  if (!/^0x[a-f0-9]{64}$/.test(hash)) throw new TypeError('transactionHash must be a 32-byte hex id')
  return {
    schema: 'https://2aran.com/schemas/content-ledger-cost/v1',
    idempotencyKey,
    chainId: Number(chainId),
    network,
    transactionHash: hash,
    publisherAddress: String(publisherAddress || '').toLowerCase(),
    gasUsed: gas.toString(),
    effectiveGasPriceWei: price.toString(),
    costWei: (gas * price).toString(),
    latencyMs: Number(latencyMs) || 0,
    attemptCount: Number(attemptCount) || 1,
    recordedAt,
  }
}

export function summarizeAnchorWindow(records = [], { network = 'base', requiredConsecutive = 4 } = {}) {
  const sorted = [...records].sort((left, right) => String(left.recordedAt || '').localeCompare(String(right.recordedAt || '')))
  const scoped = sorted.filter((record) => !network || record.network === network)
  let consecutiveConfirmed = 0
  for (let index = scoped.length - 1; index >= 0; index -= 1) {
    if (scoped[index].status === 'confirmed') consecutiveConfirmed += 1
    else break
  }
  const confirmed = scoped.filter((record) => record.status === 'confirmed')
  const failed = scoped.filter((record) => record.status === 'failed')
  const decided = confirmed.length + failed.length
  const latencies = confirmed.map((record) => Number(record.latencyMs) || 0).sort((left, right) => left - right)
  const totalCostWei = confirmed.reduce((sum, record) => sum + BigInt(record.costWei || '0'), 0n).toString()
  return {
    consecutiveConfirmed,
    failureRate: decided ? failed.length / decided : 0,
    readyForMainnetRamp: consecutiveConfirmed >= requiredConsecutive && failed.length === 0,
    sampleSize: scoped.length,
    totalCostWei,
    p50LatencyMs: latencies.length ? latencies[Math.floor((latencies.length - 1) / 2)] : 0,
  }
}

export function upsertPublishLedger(ledger, record) {
  const items = Array.isArray(ledger?.items) ? [...ledger.items] : []
  const index = items.findIndex((item) => item.idempotencyKey === record.idempotencyKey)
  if (index === -1) items.push(record)
  else items[index] = { ...items[index], ...record, attemptCount: record.attemptCount ?? (items[index].attemptCount || 0) + 1 }
  return {
    schema: 'https://2aran.com/schemas/content-ledger-publish-ledger/v1',
    updatedAt: record.updatedAt || record.recordedAt || ledger?.updatedAt,
    items,
  }
}

export function findLedgerRecord(ledger, idempotencyKey) {
  return (ledger?.items || []).find((item) => item.idempotencyKey === idempotencyKey) || null
}
