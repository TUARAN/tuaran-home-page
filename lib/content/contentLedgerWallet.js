const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/
const PUBLISHER_ROLE = 'content_attestation'
const SECRET_KEY_RE = /^(privateKey|private_key|mnemonic|secret|d)$/i
const TESTNET_KEY_ENV = 'CONTENT_LEDGER_TESTNET_PRIVATE_KEY'
const MAINNET_KEY_ENV = 'CONTENT_LEDGER_MAINNET_PRIVATE_KEY'

export const CONTENT_LEDGER_PUBLISHER_ROLE = PUBLISHER_ROLE

export function normalizeAddress(value, label = 'address') {
  const address = String(value || '')
  if (!ADDRESS_RE.test(address)) throw new TypeError(`${label} must be a 20-byte hex address`)
  return address.toLowerCase()
}

function uniqueAddresses(values, label) {
  return [...new Set((values || []).filter(Boolean).map((value) => normalizeAddress(value, label)))]
}

function walkForSecrets(value, path = '$') {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => walkForSecrets(item, `${path}[${index}]`))
  }
  if (!value || typeof value !== 'object') return []
  return Object.entries(value).flatMap(([key, child]) => {
    const nextPath = `${path}.${key}`
    if (SECRET_KEY_RE.test(key) && child) return [nextPath]
    return walkForSecrets(child, nextPath)
  })
}

/** Public records, logs and D1 rows must never contain publisher key material. */
export function assertRecordHasNoSecrets(value, label = 'record') {
  const leaked = walkForSecrets(value)
  if (leaked.length) throw new Error(`${label} contains publisher secrets at ${leaked.join(', ')}`)
}

export function parseAddressList(value) {
  if (Array.isArray(value)) return uniqueAddresses(value, 'address list')
  if (!value) return []
  return uniqueAddresses(String(value).split(/[,\s]+/), 'address list')
}

export function assertPublisherAddress({
  address,
  allowlist = [],
  forbiddenAddresses = [],
  requireAllowlist = false,
} = {}) {
  const publisher = normalizeAddress(address, 'publisher')
  const allowed = uniqueAddresses(allowlist, 'allowlist')
  const forbidden = uniqueAddresses(forbiddenAddresses, 'forbidden address')
  if (forbidden.includes(publisher)) {
    throw new Error('publisher wallet is not isolated from funds, admin, or reader-facing keys')
  }
  if (requireAllowlist && allowed.length === 0) {
    throw new Error('mainnet publisher address allowlist is required')
  }
  if (allowed.length && !allowed.includes(publisher)) {
    throw new Error(`publisher ${publisher} is not in the isolated content-attestation allowlist`)
  }
  return publisher
}

export function resolvePublisherWallet({
  network,
  env = {},
  walletRecord = null,
  confirmMainnet = false,
  allowlist = [],
  forbiddenAddresses = [],
} = {}) {
  if (!network?.name || !network.privateKeyEnv) throw new TypeError('network config is required')
  if (network.kind === 'mainnet' && !confirmMainnet) {
    throw new Error('mainnet anchoring requires --confirm-mainnet')
  }
  if (walletRecord?.role && walletRecord.role !== PUBLISHER_ROLE) {
    throw new Error(`publisher wallet role must be ${PUBLISHER_ROLE}`)
  }
  if (walletRecord?.network && walletRecord.network !== network.name) {
    throw new Error(`wallet file network ${walletRecord.network} does not match requested ${network.name}`)
  }

  const testnetKey = env[TESTNET_KEY_ENV]
  const mainnetKey = env[MAINNET_KEY_ENV]
  if (testnetKey && mainnetKey && testnetKey === mainnetKey) {
    throw new Error('testnet and mainnet publisher keys must be isolated')
  }

  const privateKey = walletRecord?.privateKey || env[network.privateKeyEnv]
  if (!privateKey) {
    throw new Error(`${network.privateKeyEnv} or --wallet-file is required; never put this key in the repository or batch JSON`)
  }
  if (network.kind === 'mainnet' && testnetKey && privateKey === testnetKey) {
    throw new Error('mainnet must not reuse the testnet publisher key')
  }
  if (network.kind === 'testnet' && mainnetKey && privateKey === mainnetKey) {
    throw new Error('testnet must not reuse the mainnet publisher key')
  }

  return {
    allowlist: parseAddressList(allowlist.length ? allowlist : env.CONTENT_LEDGER_PUBLISHER_ADDRESS),
    forbiddenAddresses: parseAddressList(
      forbiddenAddresses.length ? forbiddenAddresses : env.CONTENT_LEDGER_FORBIDDEN_ADDRESSES,
    ),
    privateKey,
    requireAllowlist: network.kind === 'mainnet',
    role: PUBLISHER_ROLE,
    source: walletRecord?.privateKey ? 'wallet-file' : network.privateKeyEnv,
  }
}

export function buildKeyDrillReceipt({
  address,
  network,
  signature,
  recoveredAt,
} = {}) {
  const publisher = normalizeAddress(address, 'publisher')
  if (!network?.name) throw new TypeError('network is required')
  if (!signature) throw new TypeError('key drill requires a signature proving the recovered key can sign')
  const receipt = {
    schema: 'https://2aran.com/schemas/content-ledger-key-drill/v1',
    address: publisher,
    network: network.name,
    chainId: network.chainId,
    role: PUBLISHER_ROLE,
    recoveredAt,
    signature,
    passed: true,
  }
  assertRecordHasNoSecrets(receipt, 'key drill receipt')
  return receipt
}
